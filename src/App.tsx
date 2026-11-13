import { useCallback, useEffect, useRef, useState } from 'react';
import { AdminLoginPage } from './components/AdminLoginPage';
import { AdminPanel, AdminTab } from './components/AdminPanel';
import { UserPortal } from './components/UserPortal';
import { loadOrganizationData, saveOrganizationData } from './data/initialData';
import {
  clearCachedToken,
  getAccessToken,
  googleSignIn,
  initAuth,
  logoutGoogleDrive,
  reconnectGoogleDrive,
} from './services/googleAuth';
import { DriveApiError, performFullDriveBackup } from './services/googleDriveBackup';
import {
  AutoBackupSettings,
  BackupFrequency,
  BackupRecord,
  BackupTrigger,
  OrganizationData,
  UserRole,
} from './types';

type AppView = 'user' | 'login' | 'admin';

const FREQUENCY_MS: Record<BackupFrequency, number> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
};

const ADMIN_ONLY_MESSAGE = 'শুধুমাত্র অ্যাডমিন এডিট করতে পারবেন';

export default function App() {
  const [view, setView] = useState<AppView>('user');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminInitialTab, setAdminInitialTab] = useState<AdminTab>('overview');
  const [permissionMessage, setPermissionMessage] = useState<string | null>(null);
  const [data, setData] = useState<OrganizationData>(() => loadOrganizationData());

  const role: UserRole = isAdminLoggedIn ? 'admin' : 'user';

  const [driveConnected, setDriveConnected] = useState(false);
  const [driveEmail, setDriveEmail] = useState<string | null>(null);
  const [isConnectingDrive, setIsConnectingDrive] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackupResult, setLastBackupResult] = useState<BackupRecord | null>(
    () => loadOrganizationData().backupHistory[0] || null
  );
  const [driveError, setDriveError] = useState<{
    message: string;
    isApiDisabled?: boolean;
    needsReconnect?: boolean;
  } | null>(null);
  const [driveToast, setDriveToast] = useState<{
    message: string;
    dateTime?: string;
    folderLink?: string;
    isError?: boolean;
    canReconnect?: boolean;
  } | null>(null);

  const backupInFlightRef = useRef(false);
  const scheduledCheckedRef = useRef(false);
  const lastFailedTriggerRef = useRef<BackupTrigger | null>(null);

  // Persist organization data changes
  useEffect(() => {
    saveOrganizationData(data);
  }, [data]);

  // Guard direct #admin hash navigation when user is not logged in as Admin
  useEffect(() => {
    const checkHashAccess = () => {
      if (window.location.hash === '#admin' && role !== 'admin') {
        setPermissionMessage(ADMIN_ONLY_MESSAGE);
        setView('user');
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    };
    checkHashAccess();
    window.addEventListener('hashchange', checkHashAccess);
    return () => window.removeEventListener('hashchange', checkHashAccess);
  }, [role]);

  // Listen to Firebase Auth state (access token remains strictly in memory)
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setDriveConnected(true);
        setDriveEmail(user.email || user.displayName || null);
      },
      () => {
        setDriveConnected(false);
        setDriveEmail(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const requireAdminPermission = useCallback((): boolean => {
    if (role !== 'admin') {
      setPermissionMessage(ADMIN_ONLY_MESSAGE);
      setView('user');
      return false;
    }
    return true;
  }, [role]);

  const runDriveBackup = useCallback(
    async (
      targetData: OrganizationData,
      trigger: BackupTrigger,
      overrideToken?: string,
      overrideEmail?: string | null
    ) => {
      if (role !== 'admin') {
        setPermissionMessage(ADMIN_ONLY_MESSAGE);
        return;
      }
      const token = overrideToken || getAccessToken();
      if (!token) {
        setDriveConnected(false);
        return;
      }
      if (backupInFlightRef.current) return;

      backupInFlightRef.current = true;
      setIsBackingUp(true);
      setDriveError(null);

      try {
        const record = await performFullDriveBackup(
          token,
          targetData,
          trigger,
          overrideEmail ?? driveEmail ?? undefined
        );

        setLastBackupResult(record);
        setData((prev) => ({
          ...prev,
          backupSettings:
            trigger === 'scheduled'
              ? { ...prev.backupSettings, lastScheduledBackupAt: record.timestamp }
              : prev.backupSettings,
          backupHistory: [record, ...prev.backupHistory].slice(0, 25),
        }));

        setDriveToast({
          message: 'ব্যাকআপ সফলভাবে Google Drive এ আপলোড হয়েছে',
          dateTime: record.formattedDateTime,
          folderLink: record.folderLink,
          isError: false,
        });
        lastFailedTriggerRef.current = null;
      } catch (err) {
        lastFailedTriggerRef.current = trigger;
        if (err instanceof DriveApiError) {
          const needsReconnect =
            err.code === 'AUTH_EXPIRED' || err.code === 'INSUFFICIENT_SCOPES';
          if (err.code === 'AUTH_EXPIRED') {
            clearCachedToken();
            setDriveConnected(false);
          }
          setDriveError({
            message: err.message,
            isApiDisabled: err.code === 'API_DISABLED',
            needsReconnect,
          });
          setDriveToast({
            message: err.message,
            isError: true,
            canReconnect: needsReconnect,
          });
        } else {
          const message =
            err instanceof Error
              ? err.message
              : 'Google Drive-এ ব্যাকআপ আপলোড ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
          setDriveError({ message, needsReconnect: true });
          setDriveToast({
            message,
            isError: true,
            canReconnect: true,
          });
        }
      } finally {
        setIsBackingUp(false);
        backupInFlightRef.current = false;
      }
    },
    [driveEmail, role]
  );

  // Scheduled Daily / Weekly / Monthly check when Admin Panel is active & Drive is connected
  useEffect(() => {
    if (role !== 'admin' || view !== 'admin' || !driveConnected) return;
    if (!data.backupSettings.scheduledEnabled) return;
    if (scheduledCheckedRef.current) return;

    const lastIso = data.backupSettings.lastScheduledBackupAt;
    const interval = FREQUENCY_MS[data.backupSettings.frequency];
    const isDue = !lastIso || Date.now() - new Date(lastIso).getTime() >= interval;

    if (isDue) {
      scheduledCheckedRef.current = true;
      void runDriveBackup(data, 'scheduled');
    }
  }, [role, view, driveConnected, data, runDriveBackup]);

  const handleConnectDrive = async () => {
    if (!requireAdminPermission()) return;
    setIsConnectingDrive(true);
    setDriveError(null);
    try {
      const { user, accessToken } = await googleSignIn();
      const email = user.email || user.displayName || null;
      setDriveConnected(true);
      setDriveEmail(email);
      setDriveToast({
        message: `Google Drive সফলভাবে সংযুক্ত হয়েছে (${email || 'Gmail'})`,
        isError: false,
      });

      if (data.backupSettings.scheduledEnabled) {
        const lastIso = data.backupSettings.lastScheduledBackupAt;
        const interval = FREQUENCY_MS[data.backupSettings.frequency];
        const isDue = !lastIso || Date.now() - new Date(lastIso).getTime() >= interval;
        if (isDue) {
          scheduledCheckedRef.current = true;
          await runDriveBackup(data, 'scheduled', accessToken, email);
        }
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Google Drive সংযোগ বাতিল হয়েছে অথবা সম্পন্ন করা যায়নি।';
      setDriveError({ message });
      setDriveToast({
        message,
        isError: true,
      });
    } finally {
      setIsConnectingDrive(false);
    }
  };

  const handleReconnectDrive = async () => {
    if (!requireAdminPermission()) return;
    setIsConnectingDrive(true);
    setDriveError(null);
    setDriveToast(null);
    try {
      const { user, accessToken } = await reconnectGoogleDrive();
      const email = user.email || user.displayName || null;
      setDriveConnected(true);
      setDriveEmail(email);

      const retryTrigger = lastFailedTriggerRef.current || 'manual';
      await runDriveBackup(data, retryTrigger, accessToken, email);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Google Drive পুনরায় সংযোগ করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।';
      setDriveError({ message, needsReconnect: true });
      setDriveToast({
        message,
        isError: true,
        canReconnect: true,
      });
    } finally {
      setIsConnectingDrive(false);
    }
  };

  const handleDisconnectDrive = async () => {
    if (!requireAdminPermission()) return;
    await logoutGoogleDrive();
    setDriveConnected(false);
    setDriveEmail(null);
    setDriveToast({
      message: 'Google Drive সংযোগ বিচ্ছিন্ন করা হয়েছে।',
      isError: false,
    });
  };

  const handleManualBackup = async () => {
    if (!requireAdminPermission()) return;
    if (!driveConnected || !getAccessToken()) {
      setDriveToast({
        message: 'প্রথমে "Google Drive Connect" বাটনে ক্লিক করে Gmail অ্যাকাউন্ট সংযুক্ত করুন।',
        isError: true,
      });
      return;
    }
    await runDriveBackup(data, 'manual');
  };

  const handleMutateData = (
    updater: (prev: OrganizationData) => OrganizationData,
    actionDescription: string
  ) => {
    if (!requireAdminPermission()) return;

    const nextData = updater(data);
    setData(nextData);

    if (nextData.backupSettings.autoOnMutation) {
      const token = getAccessToken();
      if (driveConnected && token) {
        void runDriveBackup(nextData, 'auto-save');
      } else {
        setDriveToast({
          message: `${actionDescription} সংরক্ষিত হয়েছে। অটো Drive ব্যাকআপের জন্য "Google Drive Connect" করুন।`,
          isError: true,
        });
      }
    }
  };

  const handleUpdateBackupSettings = (nextSettings: AutoBackupSettings) => {
    if (!requireAdminPermission()) return;
    setData((prev) => ({
      ...prev,
      backupSettings: nextSettings,
    }));
  };

  const handleUpdateLogo = (nextLogoUrl: string | undefined) => {
    if (!requireAdminPermission()) return;
    setData((prev) => ({
      ...prev,
      logoUrl: nextLogoUrl,
    }));
  };

  if (view === 'login') {
    return (
      <AdminLoginPage
        logoUrl={data.logoUrl}
        onSuccess={() => {
          setIsAdminLoggedIn(true);
          setPermissionMessage(null);
          setAdminInitialTab('overview');
          setView('admin');
        }}
        onBack={() => setView('user')}
      />
    );
  }

  if (view === 'admin' && role === 'admin') {
    return (
      <AdminPanel
        data={data}
        initialTab={adminInitialTab}
        isDriveConnected={driveConnected}
        driveEmail={driveEmail}
        isConnectingDrive={isConnectingDrive}
        isBackingUp={isBackingUp}
        lastBackupResult={lastBackupResult}
        driveToast={driveToast}
        driveError={driveError}
        onDismissToast={() => setDriveToast(null)}
        onConnectDrive={handleConnectDrive}
        onReconnectDrive={handleReconnectDrive}
        onDisconnectDrive={handleDisconnectDrive}
        onManualBackup={handleManualBackup}
        onUpdateBackupSettings={handleUpdateBackupSettings}
        onUpdateLogo={handleUpdateLogo}
        onMutateData={handleMutateData}
        onViewPublicPortal={() => setView('user')}
        onAdminLogout={() => {
          setIsAdminLoggedIn(false);
          setView('user');
        }}
      />
    );
  }

  return (
    <UserPortal
      data={data}
      role={role}
      permissionMessage={permissionMessage}
      onDismissPermissionMessage={() => setPermissionMessage(null)}
      onOpenAdmin={() => {
        if (role === 'admin') {
          setAdminInitialTab('overview');
          setView('admin');
        } else {
          setView('login');
        }
      }}
      onAdminQuickEdit={(tab) => {
        if (!requireAdminPermission()) return;
        setAdminInitialTab(tab);
        setView('admin');
      }}
    />
  );
}
