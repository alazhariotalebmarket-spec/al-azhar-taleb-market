import React, { useState } from 'react';
import {
  CheckCircle2,
  CloudUpload,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  HardDrive,
  Info,
  RefreshCw,
  Unplug,
} from 'lucide-react';
import {
  AutoBackupSettings,
  BackupFrequency,
  BackupRecord,
  DRIVE_BACKUP_FOLDER_NAME,
  OrganizationData,
} from '../types';
import { generateBackupBundle } from '../services/backupGenerators';
import { ConfirmDialog } from './ConfirmDialog';

interface GoogleDriveBackupPanelProps {
  data: OrganizationData;
  isConnected: boolean;
  connectedEmail: string | null;
  isConnecting: boolean;
  isBackingUp: boolean;
  lastBackupResult: BackupRecord | null;
  driveError: { message: string; isApiDisabled?: boolean; needsReconnect?: boolean } | null;
  onConnectDrive: () => void;
  onReconnectDrive: () => void;
  onDisconnectDrive: () => void;
  onManualBackup: () => void;
  onUpdateSettings: (next: AutoBackupSettings) => void;
}

const FREQUENCY_OPTIONS: { value: BackupFrequency; label: string; desc: string }[] = [
  { value: 'daily', label: 'Daily (দৈনিক)', desc: 'প্রতি ২৪ ঘণ্টা পরপর স্বয়ংক্রিয় ব্যাকআপ' },
  { value: 'weekly', label: 'Weekly (সাপ্তাহিক)', desc: 'প্রতি ৭ দিন পরপর স্বয়ংক্রিয় ব্যাকআপ' },
  { value: 'monthly', label: 'Monthly (মাসিক)', desc: 'প্রতি ৩০ দিন পরপর স্বয়ংক্রিয় ব্যাকআপ' },
];

export const GoogleDriveBackupPanel: React.FC<GoogleDriveBackupPanelProps> = ({
  data,
  isConnected,
  connectedEmail,
  isConnecting,
  isBackingUp,
  lastBackupResult,
  driveError,
  onConnectDrive,
  onReconnectDrive,
  onDisconnectDrive,
  onManualBackup,
  onUpdateSettings,
}) => {
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const { backupSettings, backupHistory } = data;

  const handleDownloadLocalBundle = () => {
    const bundle = generateBackupBundle(data);
    const files = [
      bundle.membersPdf,
      bundle.membersExcel,
      bundle.financePdf,
      bundle.financeExcel,
      bundle.fullJson,
    ];
    files.forEach((f, idx) => {
      setTimeout(() => {
        const url = URL.createObjectURL(f.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = f.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }, idx * 180);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">
            Google Drive Auto Backup
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            ফোল্ডার: <span className="font-semibold text-slate-900">{DRIVE_BACKUP_FOLDER_NAME}</span> ·
            সদস্য তালিকা (PDF + Excel), আয়-ব্যয় (PDF + Excel) এবং সম্পূর্ণ ডেটা (JSON)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadLocalBundle}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <Download className="h-4 w-4" />
            অফলাইন কপি ডাউনলোড
          </button>

          <button
            type="button"
            onClick={onManualBackup}
            disabled={!isConnected || isBackingUp}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            {isBackingUp ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <CloudUpload className="h-4 w-4" />
            )}
            {isBackingUp ? 'ব্যাকআপ আপলোড হচ্ছে...' : 'এখনই ব্যাকআপ নিন'}
          </button>
        </div>
      </div>

      {/* Drive Error / Insufficient Scope / Enable API Notice */}
      {driveError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
              <div className="space-y-2 text-sm">
                <p className="font-semibold">{driveError.message}</p>
                {driveError.isApiDisabled && (
                  <p className="text-red-800">
                    Google Cloud Console-এ{' '}
                    <a
                      href="https://console.cloud.google.com/apis/library/drive.googleapis.com"
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold underline hover:text-red-950"
                    >
                      Google Drive API v3 চালু করুন
                    </a>{' '}
                    এবং তারপর পুনরায় কানেক্ট করে চেষ্টা করুন।
                  </p>
                )}
              </div>
            </div>

            {driveError.needsReconnect && (
              <button
                type="button"
                onClick={onReconnectDrive}
                disabled={isConnecting || isBackingUp}
                className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-800 disabled:opacity-60 whitespace-nowrap shrink-0 self-start"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
                {isConnecting ? 'পুনরায় সংযোগ হচ্ছে...' : 'Drive পুনরায় কানেক্ট করুন'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Latest Successful Backup Banner */}
      {lastBackupResult && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
              <div>
                <h3 className="text-base font-bold text-emerald-950">
                  ব্যাকআপ সফলভাবে Google Drive এ আপলোড হয়েছে
                </h3>
                <p className="mt-1 text-sm text-emerald-900">
                  তারিখ ও সময়:{' '}
                  <span className="font-semibold">{lastBackupResult.formattedDateTime}</span>
                  <span className="mx-2 text-emerald-400">·</span>
                  ধরন: {lastBackupResult.triggerLabel}
                </p>
              </div>
            </div>

            <a
              href={lastBackupResult.folderLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 transition-colors hover:bg-emerald-50 whitespace-nowrap shrink-0"
            >
              <FolderOpen className="h-4 w-4 text-emerald-700" />
              Google Drive ফোল্ডার খুলুন
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="mt-4 grid gap-2 border-t border-emerald-200/80 pt-4 sm:grid-cols-2 lg:grid-cols-3">
            {lastBackupResult.files.map((file) => (
              <a
                key={file.id}
                href={file.webViewLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs text-slate-700 transition-colors hover:border-emerald-400 hover:text-emerald-900"
              >
                <span className="flex items-center gap-2 truncate">
                  {file.kind.includes('xlsx') ? (
                    <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-700" />
                  ) : (
                    <FileText className="h-4 w-4 shrink-0 text-slate-600" />
                  )}
                  <span className="truncate">{file.name}</span>
                </span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Connection + Settings Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Card 1: Google Drive Connect */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                <HardDrive className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Google Drive অ্যাকাউন্ট সংযোগ
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  অ্যাডমিনের Gmail দিয়ে লগইন করে Google Drive API v3 অ্যাক্সেস অনুমোদন করুন।
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-5">
            {isConnected ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-medium text-emerald-700">সংযুক্ত অবস্থা · সক্রিয়</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900">
                    {connectedEmail || 'Google অ্যাকাউন্ট সংযুক্ত'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={onReconnectDrive}
                    disabled={isConnecting || isBackingUp}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-900 transition-colors hover:bg-emerald-100 disabled:opacity-50 whitespace-nowrap shrink-0"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
                    {isConnecting ? 'পুনরায় কানেক্ট হচ্ছে...' : 'Drive পুনরায় কানেক্ট করুন'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDisconnect(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 whitespace-nowrap shrink-0"
                  >
                    <Unplug className="h-3.5 w-3.5" />
                    সংযোগ বিচ্ছিন্ন
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">
                  ব্যাকআপ সংরক্ষণের জন্য Gmail দিয়ে Google Drive সংযুক্ত করুন।
                </p>
                <button
                  type="button"
                  onClick={onConnectDrive}
                  disabled={isConnecting}
                  className="gsi-material-button shrink-0"
                >
                  <div className="gsi-material-button-content-wrapper">
                    <div className="gsi-material-button-icon">
                      <svg
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 48 48"
                        style={{ display: 'block' }}
                      >
                        <path
                          fill="#EA4335"
                          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                        />
                        <path
                          fill="#4285F4"
                          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                        />
                        <path
                          fill="#34A853"
                          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                        />
                      </svg>
                    </div>
                    <span className="gsi-material-button-contents">
                      {isConnecting ? 'সংযোগ হচ্ছে...' : 'Google Drive Connect'}
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Auto Backup Settings */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-base font-semibold text-slate-900">Auto Backup Settings</h3>
          <p className="mt-1 text-sm text-slate-600">
            ডেটা পরিবর্তন ও নির্ধারিত সময়সূচী অনুযায়ী স্বয়ংক্রিয় ব্যাকআপ নিয়ন্ত্রণ করুন।
          </p>

          <div className="mt-5 space-y-5 border-t border-slate-100 pt-5">
            {/* Toggle 1: Auto on every Add/Edit/Delete */}
            <label className="flex cursor-pointer items-start justify-between gap-4">
              <div>
                <span className="block text-sm font-medium text-slate-900">
                  ডেটা পরিবর্তনে তাৎক্ষণিক অটো ব্যাকআপ
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  সদস্য, উপদেষ্টা, আয় বা ব্যয় যোগ/সম্পাদনা/মুছে ফেলার সাথে সাথে Drive-এ আপলোড হবে
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={backupSettings.autoOnMutation}
                onClick={() =>
                  onUpdateSettings({
                    ...backupSettings,
                    autoOnMutation: !backupSettings.autoOnMutation,
                  })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${
                  backupSettings.autoOnMutation ? 'bg-emerald-700' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform ${
                    backupSettings.autoOnMutation ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </label>

            {/* Toggle 2: Scheduled Daily / Weekly / Monthly */}
            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="block text-sm font-medium text-slate-900">
                    সময়সূচী অনুযায়ী অটো ব্যাকআপ (Daily / Weekly / Monthly)
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    নির্বাচিত সময় পরপর অ্যাডমিন প্যানেল চালু হলে স্বয়ংক্রিয় ব্যাকআপ সম্পন্ন হবে
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={backupSettings.scheduledEnabled}
                  onClick={() =>
                    onUpdateSettings({
                      ...backupSettings,
                      scheduledEnabled: !backupSettings.scheduledEnabled,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${
                    backupSettings.scheduledEnabled ? 'bg-emerald-700' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform ${
                      backupSettings.scheduledEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {FREQUENCY_OPTIONS.map((opt) => {
                  const active = backupSettings.frequency === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={!backupSettings.scheduledEnabled}
                      onClick={() =>
                        onUpdateSettings({
                          ...backupSettings,
                          frequency: opt.value,
                        })
                      }
                      className={`rounded-lg border px-3 py-2 text-left transition-colors disabled:opacity-50 ${
                        active
                          ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs font-semibold whitespace-nowrap">{opt.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Included Files Specification + History Table */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">ব্যাকআপ ইতিহাস (Backup History)</h3>
            <p className="text-xs text-slate-500">
              প্রতিটি ব্যাকআপে ৫টি ফাইল থাকে: Members (PDF + Excel), Income-Expense (PDF + Excel) এবং Full JSON
            </p>
          </div>
          <span className="font-mono-num text-xs font-medium text-slate-600">
            মোট ব্যাকআপ: {backupHistory.length} বার
          </span>
        </div>

        {backupHistory.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            এখনো কোনো Google Drive ব্যাকআপ সম্পন্ন হয়নি। উপরে থাকা{' '}
            <span className="font-semibold text-slate-800">Google Drive Connect</span> বাটনে ক্লিক করে সংযোগ করুন এবং{' '}
            <span className="font-semibold text-slate-800">এখনই ব্যাকআপ নিন</span>।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="px-6 py-3">তারিখ ও সময়</th>
                  <th className="px-6 py-3">ধরন</th>
                  <th className="px-6 py-3">সংযুক্ত অ্যাকাউন্ট</th>
                  <th className="px-6 py-3 text-right">তথ্য সারাংশ</th>
                  <th className="px-6 py-3 text-right">Google Drive লিংক</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {backupHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-3.5 font-medium text-slate-900 whitespace-nowrap">
                      {item.formattedDateTime}
                    </td>
                    <td className="px-6 py-3.5 text-slate-700 whitespace-nowrap">
                      {item.triggerLabel}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 whitespace-nowrap">
                      {item.accountEmail || '-'}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono-num text-xs text-slate-600 whitespace-nowrap">
                      সদস্য {item.totalMembers} · উপদেষ্টা {item.totalAdvisors} · লেনদেন {item.totalTransactions}
                    </td>
                    <td className="px-6 py-3.5 text-right whitespace-nowrap">
                      <a
                        href={item.folderLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 hover:underline"
                      >
                        ফোল্ডার দেখুন
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDisconnect}
        title="Google Drive সংযোগ বিচ্ছিন্ন করবেন?"
        description="সংযোগ বিচ্ছিন্ন করলে স্বয়ংক্রিয় Google Drive ব্যাকআপ সাময়িকভাবে বন্ধ থাকবে। আপনি যেকোনো সময় আবার Google Drive Connect করতে পারবেন।"
        confirmLabel="সংযোগ বিচ্ছিন্ন করুন"
        onConfirm={() => {
          setConfirmDisconnect(false);
          onDisconnectDrive();
        }}
        onCancel={() => setConfirmDisconnect(false)}
      />
    </div>
  );
};
