import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  CalendarCheck,
  CheckCircle2,
  CloudUpload,
  ExternalLink,
  HardDrive,
  LayoutDashboard,
  LogOut,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  Upload,
  UserCheck,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import {
  Advisor,
  AutoBackupSettings,
  BENGALI_MONTHS,
  BLOOD_GROUPS,
  BackupRecord,
  BloodGroup,
  DEFAULT_LOGO_URL,
  MEMBER_DESIGNATIONS,
  Member,
  Notice,
  ORG_NAME,
  OrganizationData,
  Transaction,
  TransactionType,
} from '../types';
import { AdminSettingsPanel } from './AdminSettingsPanel';
import { ConfirmDialog } from './ConfirmDialog';
import { DonateSection } from './DonateSection';
import { DonutChart } from './DonutChart';
import { GoogleDriveBackupPanel } from './GoogleDriveBackupPanel';
import { MemberProfileModal } from './MemberProfileModal';
import { OrgLogo } from './OrgLogo';

function resizeMemberPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('ছবিটি পড়া যায়নি।'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('ছবি ফরম্যাট সঠিক নয়।'));
      img.onload = () => {
        const size = 240;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export type AdminTab =
  | 'overview'
  | 'members'
  | 'advisors'
  | 'finance'
  | 'notices'
  | 'backup'
  | 'settings';

interface AdminPanelProps {
  data: OrganizationData;
  initialTab?: AdminTab;
  isDriveConnected: boolean;
  driveEmail: string | null;
  isConnectingDrive: boolean;
  isBackingUp: boolean;
  lastBackupResult: BackupRecord | null;
  driveToast: {
    message: string;
    dateTime?: string;
    folderLink?: string;
    isError?: boolean;
    canReconnect?: boolean;
  } | null;
  driveError: { message: string; isApiDisabled?: boolean; needsReconnect?: boolean } | null;
  onDismissToast: () => void;
  onConnectDrive: () => void;
  onReconnectDrive: () => void;
  onDisconnectDrive: () => void;
  onManualBackup: () => void;
  onUpdateBackupSettings: (next: AutoBackupSettings) => void;
  onUpdateLogo: (nextLogoUrl: string | undefined) => void;
  onMutateData: (updater: (prev: OrganizationData) => OrganizationData, actionDescription: string) => void;
  onViewPublicPortal: () => void;
  onAdminLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  data,
  initialTab = 'overview',
  isDriveConnected,
  driveEmail,
  isConnectingDrive,
  isBackingUp,
  lastBackupResult,
  driveToast,
  driveError,
  onDismissToast,
  onConnectDrive,
  onReconnectDrive,
  onDisconnectDrive,
  onManualBackup,
  onUpdateBackupSettings,
  onUpdateLogo,
  onMutateData,
  onViewPublicPortal,
  onAdminLogout,
}) => {
  const activeLogoSrc = data.logoUrl || DEFAULT_LOGO_URL;
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState<'all' | BloodGroup>('all');
  const [txFilter, setTxFilter] = useState<'all' | 'income' | 'expense'>('all');

  // Member Profile & Monthly Eyanot Modal State
  const [profileMemberId, setProfileMemberId] = useState<string | null>(null);
  const profileMember = useMemo(
    () => data.members.find((m) => m.id === profileMemberId) || null,
    [data.members, profileMemberId]
  );

  // Member Modal State
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [memberFeeInput, setMemberFeeInput] = useState('500');
  const [memberFormError, setMemberFormError] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState<Omit<Member, 'id'>>({
    memberCode: '',
    name: '',
    fatherName: '',
    designation: 'সাধারণ সদস্য',
    phone: '',
    address: '',
    bloodGroup: '',
    photoUrl: undefined,
    monthlyFee: 500,
    joinDate: new Date().toISOString().slice(0, 10),
    status: 'সক্রিয়',
    eyanotPayments: {},
  });

  // Advisor Modal State
  const [advisorModalOpen, setAdvisorModalOpen] = useState(false);
  const [editingAdvisor, setEditingAdvisor] = useState<Advisor | null>(null);
  const [advisorForm, setAdvisorForm] = useState<Omit<Advisor, 'id'>>({
    name: '',
    title: 'উপদেষ্টা',
    institution: '',
    phone: '',
    joinDate: new Date().toISOString().slice(0, 10),
    note: '',
  });

  // Transaction Modal State
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [txForm, setTxForm] = useState<Omit<Transaction, 'id'>>({
    date: new Date().toISOString().slice(0, 10),
    type: 'income',
    category: '',
    description: '',
    amount: 0,
    receiptNo: '',
  });

  // Notice Modal State
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [noticeForm, setNoticeForm] = useState<Omit<Notice, 'id'>>({
    title: '',
    date: new Date().toISOString().slice(0, 10),
    category: 'সাধারণ বিজ্ঞপ্তি',
    content: '',
    important: false,
  });

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<{
    kind: 'member' | 'advisor' | 'transaction' | 'notice';
    id: string;
    label: string;
  } | null>(null);

  const stats = useMemo(() => {
    const now = new Date();
    const currentYear = String(now.getFullYear());
    const currentMonth = now.getMonth();
    const currentMonthName = BENGALI_MONTHS[currentMonth];

    const activeList = data.members.filter((m) => m.status === 'সক্রিয়');
    const activeMembers = activeList.length;
    const newMembers = data.members.filter((m) => m.joinDate.startsWith(currentYear)).length;

    const expectedThisMonth = activeList.reduce((sum, m) => sum + (m.monthlyFee || 0), 0);
    const collectedThisMonth = activeList.reduce(
      (sum, m) => sum + (m.eyanotPayments?.[currentYear]?.[currentMonth] || 0),
      0
    );
    const dueThisMonth = Math.max(0, expectedThisMonth - collectedThisMonth);

    const totalIncome = data.transactions
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const totalExpense = data.transactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    return {
      activeMembers,
      newMembers,
      totalMembers: data.members.length,
      totalAdvisors: data.advisors.length,
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      currentMonthName,
      currentYear,
      expectedThisMonth,
      collectedThisMonth,
      dueThisMonth,
    };
  }, [data]);

  // Filtered views
  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return data.members.filter((m) => {
      if (bloodGroupFilter !== 'all' && m.bloodGroup !== bloodGroupFilter) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        (m.fatherName || '').toLowerCase().includes(q) ||
        m.memberCode.toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q) ||
        (m.bloodGroup || '').toLowerCase().includes(q) ||
        m.designation.toLowerCase().includes(q) ||
        m.address.toLowerCase().includes(q)
      );
    });
  }, [data.members, searchQuery, bloodGroupFilter]);

  const filteredAdvisors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return data.advisors;
    return data.advisors.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        a.institution.toLowerCase().includes(q)
    );
  }, [data.advisors, searchQuery]);

  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...data.transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((t) => (txFilter === 'all' ? true : t.type === txFilter))
      .filter((t) => {
        if (!q) return true;
        return (
          t.category.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.receiptNo.toLowerCase().includes(q)
        );
      });
  }, [data.transactions, txFilter, searchQuery]);

  // Member Handlers
  const openAddMember = () => {
    setEditingMember(null);
    setMemberFormError(null);
    setMemberFeeInput('500');
    setMemberForm({
      memberCode: `AAIS-${String(data.members.length + 1).padStart(3, '0')}`,
      name: '',
      fatherName: '',
      designation: 'সাধারণ সদস্য',
      phone: '',
      address: '',
      bloodGroup: '',
      photoUrl: undefined,
      monthlyFee: 500,
      joinDate: new Date().toISOString().slice(0, 10),
      status: 'সক্রিয়',
      eyanotPayments: {},
    });
    setMemberModalOpen(true);
  };

  const openEditMember = (member: Member) => {
    setEditingMember(member);
    setMemberFormError(null);
    setMemberFeeInput(String(member.monthlyFee));
    setMemberForm({
      memberCode: member.memberCode,
      name: member.name,
      fatherName: member.fatherName || '',
      designation: member.designation,
      phone: member.phone,
      address: member.address,
      bloodGroup: member.bloodGroup || '',
      photoUrl: member.photoUrl,
      monthlyFee: member.monthlyFee,
      joinDate: member.joinDate,
      status: member.status,
      eyanotPayments: member.eyanotPayments || {},
    });
    setMemberModalOpen(true);
  };

  const handleMemberPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setMemberFormError('সদস্যের ছবির জন্য শুধুমাত্র JPG অথবা PNG ফাইল নির্বাচন করুন।');
      return;
    }
    try {
      const dataUrl = await resizeMemberPhoto(file);
      setMemberForm((prev) => ({ ...prev, photoUrl: dataUrl }));
      setMemberFormError(null);
    } catch (err) {
      setMemberFormError(err instanceof Error ? err.message : 'ছবি আপলোড করা যায়নি।');
    }
  };

  const saveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.name.trim() || !memberForm.fatherName.trim()) {
      setMemberFormError('সদস্যের নাম এবং পিতার নাম অবশ্যই দিতে হবে।');
      return;
    }

    const parsedFee = Number(memberFeeInput.trim());
    if (Number.isNaN(parsedFee) || parsedFee < 50) {
      setMemberFormError('সর্বনিম্ন এয়ানত ৫০ টাকা');
      return;
    }

    const payload: Omit<Member, 'id'> = {
      ...memberForm,
      name: memberForm.name.trim(),
      fatherName: memberForm.fatherName.trim(),
      address: memberForm.address.trim(),
      phone: memberForm.phone.trim(),
      monthlyFee: Math.round(parsedFee),
    };

    if (editingMember) {
      onMutateData(
        (prev) => ({
          ...prev,
          members: prev.members.map((m) =>
            m.id === editingMember.id ? { ...payload, id: editingMember.id } : m
          ),
        }),
        'সদস্য তথ্য হালনাগাদ'
      );
    } else {
      const newMember: Member = {
        ...payload,
        id: `m-${Date.now()}`,
      };
      onMutateData(
        (prev) => ({
          ...prev,
          members: [newMember, ...prev.members],
        }),
        'নতুন সদস্য যোগ'
      );
    }
    setMemberModalOpen(false);
  };

  const handleToggleEyanotMonth = (memberId: string, year: string, monthIndex: number) => {
    const targetMember = data.members.find((m) => m.id === memberId);
    if (!targetMember) return;

    const currentYearMap = targetMember.eyanotPayments?.[year] || {};
    const alreadyPaid = (currentYearMap[monthIndex] || 0) > 0;
    const txId = `eyanot-${memberId}-${year}-${monthIndex}`;
    const monthName = BENGALI_MONTHS[monthIndex];

    onMutateData((prev) => {
      const nextMembers = prev.members.map((m) => {
        if (m.id !== memberId) return m;
        const yearPayments = { ...(m.eyanotPayments?.[year] || {}) };
        if (alreadyPaid) {
          delete yearPayments[monthIndex];
        } else {
          yearPayments[monthIndex] = m.monthlyFee;
        }
        return {
          ...m,
          eyanotPayments: {
            ...(m.eyanotPayments || {}),
            [year]: yearPayments,
          },
        };
      });

      let nextTransactions = prev.transactions.filter((t) => t.id !== txId);
      if (!alreadyPaid) {
        const monthPad = String(monthIndex + 1).padStart(2, '0');
        const newTx: Transaction = {
          id: txId,
          date: new Date().toISOString().slice(0, 10),
          type: 'income',
          category: 'মাসিক এয়ানত',
          description: `${targetMember.name} — ${monthName} ${year} এর মাসিক এয়ানত`,
          amount: targetMember.monthlyFee,
          receiptNo: `EYN-${year}${monthPad}-${targetMember.memberCode}`,
        };
        nextTransactions = [newTx, ...nextTransactions];
      }

      return {
        ...prev,
        members: nextMembers,
        transactions: nextTransactions,
      };
    }, `${targetMember.name} — ${monthName} এয়ানত ${alreadyPaid ? 'বাতিল' : 'জমা'}`);
  };

  // Advisor Handlers
  const openAddAdvisor = () => {
    setEditingAdvisor(null);
    setAdvisorForm({
      name: '',
      title: 'উপদেষ্টা',
      institution: '',
      phone: '',
      joinDate: new Date().toISOString().slice(0, 10),
      note: '',
    });
    setAdvisorModalOpen(true);
  };

  const openEditAdvisor = (advisor: Advisor) => {
    setEditingAdvisor(advisor);
    setAdvisorForm({
      name: advisor.name,
      title: advisor.title,
      institution: advisor.institution,
      phone: advisor.phone,
      joinDate: advisor.joinDate,
      note: advisor.note || '',
    });
    setAdvisorModalOpen(true);
  };

  const saveAdvisor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advisorForm.name.trim()) return;
    if (editingAdvisor) {
      onMutateData(
        (prev) => ({
          ...prev,
          advisors: prev.advisors.map((a) =>
            a.id === editingAdvisor.id ? { ...advisorForm, id: editingAdvisor.id } : a
          ),
        }),
        'উপদেষ্টা তথ্য হালনাগাদ'
      );
    } else {
      const newAdvisor: Advisor = {
        ...advisorForm,
        id: `a-${Date.now()}`,
      };
      onMutateData(
        (prev) => ({
          ...prev,
          advisors: [newAdvisor, ...prev.advisors],
        }),
        'নতুন উপদেষ্টা যোগ'
      );
    }
    setAdvisorModalOpen(false);
  };

  // Transaction Handlers
  const openAddTx = (defaultType: TransactionType = 'income') => {
    setEditingTx(null);
    setTxForm({
      date: new Date().toISOString().slice(0, 10),
      type: defaultType,
      category: defaultType === 'income' ? 'সদস্য চাঁদা' : 'মানবিক সহায়তা',
      description: '',
      amount: 0,
      receiptNo: `${defaultType === 'income' ? 'REC' : 'VCH'}-${Date.now().toString().slice(-6)}`,
    });
    setTxModalOpen(true);
  };

  const openEditTx = (tx: Transaction) => {
    setEditingTx(tx);
    setTxForm({
      date: tx.date,
      type: tx.type,
      category: tx.category,
      description: tx.description,
      amount: tx.amount,
      receiptNo: tx.receiptNo,
    });
    setTxModalOpen(true);
  };

  const saveTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.category.trim() || txForm.amount <= 0) return;
    if (editingTx) {
      onMutateData(
        (prev) => ({
          ...prev,
          transactions: prev.transactions.map((t) =>
            t.id === editingTx.id ? { ...txForm, id: editingTx.id } : t
          ),
        }),
        txForm.type === 'income' ? 'আয় তথ্য হালনাগাদ' : 'ব্যয় তথ্য হালনাগাদ'
      );
    } else {
      const newTx: Transaction = {
        ...txForm,
        id: `t-${Date.now()}`,
      };
      onMutateData(
        (prev) => ({
          ...prev,
          transactions: [newTx, ...prev.transactions],
        }),
        txForm.type === 'income' ? 'নতুন আয় যোগ' : 'নতুন ব্যয় যোগ'
      );
    }
    setTxModalOpen(false);
  };

  // Notice Handlers
  const openAddNotice = () => {
    setEditingNotice(null);
    setNoticeForm({
      title: '',
      date: new Date().toISOString().slice(0, 10),
      category: 'সাধারণ বিজ্ঞপ্তি',
      content: '',
      important: false,
    });
    setNoticeModalOpen(true);
  };

  const openEditNotice = (notice: Notice) => {
    setEditingNotice(notice);
    setNoticeForm({
      title: notice.title,
      date: notice.date,
      category: notice.category,
      content: notice.content,
      important: Boolean(notice.important),
    });
    setNoticeModalOpen(true);
  };

  const saveNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeForm.title.trim() || !noticeForm.content.trim()) return;
    if (editingNotice) {
      onMutateData(
        (prev) => ({
          ...prev,
          notices: prev.notices.map((n) =>
            n.id === editingNotice.id ? { ...noticeForm, id: editingNotice.id } : n
          ),
        }),
        'নোটিশ হালনাগাদ'
      );
    } else {
      const newNotice: Notice = {
        ...noticeForm,
        id: `n-${Date.now()}`,
      };
      onMutateData(
        (prev) => ({
          ...prev,
          notices: [newNotice, ...prev.notices],
        }),
        'নতুন নোটিশ প্রকাশ'
      );
    }
    setNoticeModalOpen(false);
  };

  const executeDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === 'member') {
      onMutateData(
        (prev) => ({
          ...prev,
          members: prev.members.filter((m) => m.id !== deleteTarget.id),
        }),
        'সদস্য মুছে ফেলা'
      );
    } else if (deleteTarget.kind === 'advisor') {
      onMutateData(
        (prev) => ({
          ...prev,
          advisors: prev.advisors.filter((a) => a.id !== deleteTarget.id),
        }),
        'উপদেষ্টা মুছে ফেলা'
      );
    } else if (deleteTarget.kind === 'notice') {
      onMutateData(
        (prev) => ({
          ...prev,
          notices: prev.notices.filter((n) => n.id !== deleteTarget.id),
        }),
        'নোটিশ মুছে ফেলা'
      );
    } else {
      onMutateData(
        (prev) => ({
          ...prev,
          transactions: prev.transactions.filter((t) => t.id !== deleteTarget.id),
        }),
        'লেনদেন মুছে ফেলা'
      );
    }
    setDeleteTarget(null);
  };

  const sidebarItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'ড্যাশবোর্ড', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'members', label: 'সদস্য পরিচালনা', icon: <Users className="h-4 w-4" /> },
    { id: 'advisors', label: 'উপদেষ্টা পরিষদ', icon: <UserCheck className="h-4 w-4" /> },
    { id: 'finance', label: 'আয় ও ব্যয়', icon: <Wallet className="h-4 w-4" /> },
    { id: 'notices', label: 'নোটিশ বোর্ড', icon: <Bell className="h-4 w-4" /> },
    { id: 'backup', label: 'Google Drive Auto Backup', icon: <HardDrive className="h-4 w-4" /> },
    { id: 'settings', label: 'সেটিংস', icon: <Settings className="h-4 w-4" /> },
  ];

  const currentTabTitle = sidebarItems.find((i) => i.id === activeTab)?.label || 'ড্যাশবোর্ড';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row">
      {/* Sidebar (260px) */}
      <aside className="w-full lg:w-64 lg:shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
            <OrgLogo src={activeLogoSrc} alt={ORG_NAME} variant="compact" />
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold text-slate-900">{ORG_NAME}</p>
              <p className="text-xs text-slate-500">অ্যাডমিন প্যানেল</p>
            </div>
          </div>

          <nav className="flex lg:flex-col gap-1 overflow-x-auto p-3">
            {sidebarItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setSearchQuery('');
                  }}
                  className={`flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-emerald-50 text-emerald-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className={active ? 'text-emerald-700' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="hidden lg:block border-t border-slate-200 p-4 space-y-2">
          <button
            type="button"
            onClick={onViewPublicPortal}
            className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            পাবলিক পোর্টাল দেখুন
          </button>
          <button
            type="button"
            onClick={onAdminLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            অ্যাডমিন লগআউট
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Contextual Top Bar */}
        <header className="border-b border-slate-200 bg-white px-6 py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-sm text-slate-500">
              <span>অ্যাডমিন প্যানেল</span>
              <span className="mx-2 text-slate-300">/</span>
              <span className="font-semibold text-slate-900">{currentTabTitle}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Drive Quick Connect / Manual Backup right in Admin header */}
              {!isDriveConnected ? (
                <button
                  type="button"
                  onClick={onConnectDrive}
                  disabled={isConnectingDrive}
                  className="gsi-material-button"
                  style={{ height: '36px', fontSize: '13px' }}
                >
                  <div className="gsi-material-button-content-wrapper">
                    <div className="gsi-material-button-icon" style={{ height: '16px', width: '16px', minWidth: '16px' }}>
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                      </svg>
                    </div>
                    <span className="gsi-material-button-contents">
                      {isConnectingDrive ? 'সংযোগ হচ্ছে...' : 'Google Drive Connect'}
                    </span>
                  </div>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onReconnectDrive}
                    disabled={isConnectingDrive || isBackingUp}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap shrink-0"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isConnectingDrive ? 'animate-spin' : ''}`} />
                    Drive পুনরায় কানেক্ট করুন
                  </button>
                  <button
                    type="button"
                    onClick={onManualBackup}
                    disabled={isBackingUp}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-900 disabled:opacity-60 whitespace-nowrap shrink-0"
                  >
                    {isBackingUp ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CloudUpload className="h-3.5 w-3.5" />
                    )}
                    {isBackingUp ? 'আপলোড হচ্ছে...' : 'এখনই ব্যাকআপ নিন'}
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={onViewPublicPortal}
                className="lg:hidden inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                পোর্টাল
              </button>
            </div>
          </div>
        </header>

        {/* Live Toast / Status Notification for Auto & Manual Drive Backups */}
        {(driveToast || isBackingUp) && (
          <div className="px-6 pt-5">
            {isBackingUp ? (
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                <RefreshCw className="h-4 w-4 animate-spin text-emerald-700 shrink-0" />
                <span>
                  সদস্য (PDF + Excel), আয়-ব্যয় (PDF + Excel) এবং JSON ফাইল Google Drive ফোল্ডারে আপলোড হচ্ছে...
                </span>
              </div>
            ) : (
              driveToast && (
                <div
                  className={`flex flex-col gap-2 rounded-xl border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between ${
                    driveToast.isError
                      ? 'border-amber-200 bg-amber-50 text-amber-950'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-950'
                  }`}
                >
                  <div className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        driveToast.isError ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    />
                    <div>
                      <p className="font-semibold">{driveToast.message}</p>
                      {driveToast.dateTime && (
                        <p className="mt-0.5 text-xs opacity-90">
                          তারিখ ও সময়: {driveToast.dateTime}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {driveToast.canReconnect && (
                      <button
                        type="button"
                        onClick={onReconnectDrive}
                        disabled={isConnectingDrive || isBackingUp}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-900 disabled:opacity-60 whitespace-nowrap"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${isConnectingDrive ? 'animate-spin' : ''}`} />
                        Drive পুনরায় কানেক্ট করুন
                      </button>
                    )}
                    {driveToast.folderLink && (
                      <a
                        href={driveToast.folderLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-50 whitespace-nowrap"
                      >
                        Drive লিংক খুলুন
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={onDismissToast}
                      className="rounded p-1 text-slate-500 hover:bg-black/5"
                      aria-label="বন্ধ করুন"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* Active Tab Content */}
        <main className="flex-1 p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3.5">
                <OrgLogo src={activeLogoSrc} alt={ORG_NAME} variant="standard" />
                <div>
                  <h1 className="font-display text-2xl font-bold text-slate-900">
                    {ORG_NAME} — অ্যাডমিন ড্যাশবোর্ড
                  </h1>
                  <p className="mt-1 text-sm text-slate-600">
                    সদস্য, উপদেষ্টা ও আয়-ব্যয়ের যেকোনো পরিবর্তনের সাথে সাথে Google Drive অটো ব্যাকআপ সক্রিয় থাকে।
                  </p>
                </div>
              </div>

              {/* Top Round Donut Chart in Admin Dashboard (auto-updates on Income/Expense edits) */}
              <DonutChart
                title="আর্থিক সারসংক্ষেপ (গোল গ্রাফ)"
                subtitle="আয়-ব্যয় যোগ বা সম্পাদনা করলে গ্রাফ স্বয়ংক্রিয়ভাবে আপডেট হয়"
                centerLabel="বর্তমান তহবিল"
                centerValue={`৳ ${stats.netBalance.toLocaleString('en-US')}`}
                segments={[
                  {
                    key: 'income',
                    label: 'মোট আয়',
                    value: stats.totalIncome,
                    formattedValue: `৳ ${stats.totalIncome.toLocaleString('en-US')}`,
                    color: '#16a34a',
                  },
                  {
                    key: 'expense',
                    label: 'মোট ব্যয়',
                    value: stats.totalExpense,
                    formattedValue: `৳ ${stats.totalExpense.toLocaleString('en-US')}`,
                    color: '#dc2626',
                  },
                  {
                    key: 'balance',
                    label: 'বর্তমান তহবিল',
                    value: Math.max(0, stats.netBalance),
                    formattedValue: `৳ ${stats.netBalance.toLocaleString('en-US')}`,
                    color: '#2563eb',
                  },
                ]}
              />

              {/* Donate Card directly below the Donut Chart */}
              <DonateSection />

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-medium text-slate-500">মোট সদস্য</p>
                  <p className="mt-2 font-mono-num text-2xl font-bold text-slate-900">
                    {stats.totalMembers} জন
                  </p>
                  <p className="mt-1 text-xs text-slate-500">সক্রিয়: {stats.activeMembers} জন</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-medium text-slate-500">উপদেষ্টা পরিষদ</p>
                  <p className="mt-2 font-mono-num text-2xl font-bold text-slate-900">
                    {stats.totalAdvisors} জন
                  </p>
                  <p className="mt-1 text-xs text-slate-500">সম্মানিত উপদেষ্টামণ্ডলী</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-medium text-slate-500">মোট আয়</p>
                  <p className="mt-2 font-mono-num text-2xl font-bold text-emerald-700">
                    ৳ {stats.totalIncome.toLocaleString('en-US')}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">সর্বমোট জমা</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-medium text-slate-500">বর্তমান তহবিল স্থিতি</p>
                  <p className="mt-2 font-mono-num text-2xl font-bold text-slate-900">
                    ৳ {stats.netBalance.toLocaleString('en-US')}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    মোট ব্যয় ৳ {stats.totalExpense.toLocaleString('en-US')}
                  </p>
                </div>
              </div>

              {/* Current Month Eyanot Summary Strip */}
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div>
                    <h2 className="font-display text-base font-bold text-slate-900">
                      মাসিক এয়ানত আদায় ({stats.currentMonthName} {stats.currentYear})
                    </h2>
                    <p className="text-xs text-slate-500">সক্রিয় সদস্যদের চলতি মাসের এয়ানত হিসাব</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('members')}
                    className="text-xs font-semibold text-emerald-800 hover:underline"
                  >
                    সদস্য এয়ানত পরিচালনা করুন →
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs font-medium text-slate-500">এই মাসে পাওয়ার কথা</p>
                    <p className="mt-1.5 font-mono-num text-xl font-bold text-slate-900">
                      ৳ {stats.expectedThisMonth.toLocaleString('en-US')}
                    </p>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4">
                    <p className="text-xs font-medium text-emerald-900">আদায় হইছে</p>
                    <p className="mt-1.5 font-mono-num text-xl font-bold text-emerald-700">
                      ৳ {stats.collectedThisMonth.toLocaleString('en-US')}
                    </p>
                  </div>
                  <div className="rounded-lg border border-red-200 bg-red-50/70 p-4">
                    <p className="text-xs font-medium text-red-900">বাকি আছে</p>
                    <p className="mt-1.5 font-mono-num text-xl font-bold text-red-700">
                      ৳ {stats.dueThisMonth.toLocaleString('en-US')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Embedded Drive Status & Quick Control */}
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-display text-lg font-bold text-slate-900">
                      Google Drive Auto Backup অবস্থা
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {isDriveConnected
                        ? `সংযুক্ত Gmail: ${driveEmail} · অটো ব্যাকআপ ${
                            data.backupSettings.autoOnMutation ? 'চালু আছে' : 'বন্ধ আছে'
                          }`
                        : 'স্বয়ংক্রিয় ব্যাকআপ চালু করতে Google Drive Connect করুন।'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('backup')}
                      className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                    >
                      ব্যাকআপ সেটিংস ও ইতিহাস
                    </button>
                    {isDriveConnected ? (
                      <button
                        type="button"
                        onClick={onManualBackup}
                        disabled={isBackingUp}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-50 whitespace-nowrap"
                      >
                        <CloudUpload className="h-3.5 w-3.5" />
                        এখনই ব্যাকআপ নিন
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={onConnectDrive}
                        disabled={isConnectingDrive}
                        className="rounded-lg bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900 whitespace-nowrap"
                      >
                        Google Drive Connect
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <OrgLogo src={activeLogoSrc} alt={ORG_NAME} variant="standard" />
                  <div>
                    <h2 className="font-display text-2xl font-bold text-slate-900">সদস্য পরিচালনা</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      যেকোনো সদস্য যোগ, সম্পাদনা বা মুছে ফেললে স্বয়ংক্রিয়ভাবে Google Drive ব্যাকআপ আপডেট হবে।
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openAddMember}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 whitespace-nowrap self-start"
                >
                  <Plus className="h-4 w-4" />
                  নতুন সদস্য যোগ করুন
                </button>
              </div>

              {/* Small Round Donut Chart on Admin Members Page */}
              <DonutChart
                size="sm"
                title="সদস্য ও উপদেষ্টা পরিসংখ্যান"
                subtitle="মোট সদস্য, নতুন সদস্য ও উপদেষ্টা পরিষদের অনুপাত"
                centerLabel="মোট সদস্য"
                centerValue={`${stats.totalMembers} জন`}
                segments={[
                  {
                    key: 'total-members',
                    label: 'মোট সদস্য',
                    value: stats.totalMembers,
                    formattedValue: `${stats.totalMembers} জন`,
                    color: '#16a34a',
                  },
                  {
                    key: 'new-members',
                    label: 'নতুন সদস্য',
                    value: stats.newMembers,
                    formattedValue: `${stats.newMembers} জন`,
                    color: '#2563eb',
                  },
                  {
                    key: 'advisors',
                    label: 'উপদেষ্টা',
                    value: stats.totalAdvisors,
                    formattedValue: `${stats.totalAdvisors} জন`,
                    color: '#d97706',
                  },
                ]}
              />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="নাম, মোবাইল বা ব্লাড গ্রুপ খুঁজুন..."
                    className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-700"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label htmlFor="admin-blood-filter" className="text-xs font-medium text-slate-600 whitespace-nowrap">
                    ব্লাড গ্রুপ:
                  </label>
                  <select
                    id="admin-blood-filter"
                    value={bloodGroupFilter}
                    onChange={(e) => setBloodGroupFilter(e.target.value as 'all' | BloodGroup)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-700"
                  >
                    <option value="all">সকল ব্লাড গ্রুপ</option>
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                        <th className="px-5 py-3">সদস্য ও পিতার নাম</th>
                        <th className="px-5 py-3">সদস্য পদ ও রক্ত</th>
                        <th className="px-5 py-3">মোবাইল</th>
                        <th className="px-5 py-3 text-right">মাসিক এয়ানত</th>
                        <th className="px-5 py-3 text-right">কার্যক্রম</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-slate-50/80">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <OrgLogo
                                src={member.photoUrl || activeLogoSrc}
                                alt={member.name}
                                variant="compact"
                                isPhoto={Boolean(member.photoUrl)}
                              />
                              <div>
                                <div className="font-semibold text-slate-900">{member.name}</div>
                                <div className="text-xs text-slate-500">
                                  পিতা: {member.fatherName || 'উল্লেখ নেই'} · {member.address}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <div className="text-slate-800 font-medium">{member.designation}</div>
                            <div className="text-xs text-slate-500 font-mono-num">
                              {member.memberCode}
                              {member.bloodGroup ? ` · রক্ত: ${member.bloodGroup}` : ''}
                            </div>
                          </td>
                          <td className="px-5 py-3 font-mono-num text-xs text-slate-700 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span>{member.phone}</span>
                              {member.phone && (
                                <a
                                  href={`tel:${member.phone}`}
                                  className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100"
                                  title="কল করুন"
                                >
                                  <Phone className="h-3 w-3" />
                                  কল
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-right font-mono-num font-semibold text-slate-900 whitespace-nowrap">
                            ৳ {member.monthlyFee.toLocaleString('en-US')}
                            <div
                              className={`text-[11px] font-medium ${
                                member.status === 'সক্রিয়' ? 'text-emerald-700' : 'text-slate-400'
                              }`}
                            >
                              {member.status}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setProfileMemberId(member.id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
                                title="প্রোফাইল ও ১২ মাসের এয়ানত"
                              >
                                <CalendarCheck className="h-3.5 w-3.5" />
                                এয়ানত
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditMember(member)}
                                className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                title="সম্পাদনা করুন"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget({
                                    kind: 'member',
                                    id: member.id,
                                    label: member.name,
                                  })
                                }
                                className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                                title="মুছে ফেলুন"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredMembers.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                            কোনো সদস্য পাওয়া যায়নি।
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advisors' && (
            <div className="space-y-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-2xl font-bold text-slate-900">উপদেষ্টা পরিষদ</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    উপদেষ্টাদের তথ্য যোগ, সম্পাদনা বা মুছে ফেললে স্বয়ংক্রিয় Google Drive ব্যাকআপ সম্পন্ন হবে।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openAddAdvisor}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 whitespace-nowrap self-start"
                >
                  <Plus className="h-4 w-4" />
                  নতুন উপদেষ্টা যোগ করুন
                </button>
              </div>

              <div className="relative max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="উপদেষ্টার নাম বা প্রতিষ্ঠান খুঁজুন..."
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-700"
                />
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                        <th className="px-5 py-3">নাম</th>
                        <th className="px-5 py-3">পদবি / ভূমিকা</th>
                        <th className="px-5 py-3">প্রতিষ্ঠান</th>
                        <th className="px-5 py-3">মোবাইল</th>
                        <th className="px-5 py-3 text-right">কার্যক্রম</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAdvisors.map((advisor) => (
                        <tr key={advisor.id} className="hover:bg-slate-50/80">
                          <td className="px-5 py-3">
                            <div className="font-medium text-slate-900">{advisor.name}</div>
                            {advisor.note && (
                              <div className="text-xs text-slate-500">{advisor.note}</div>
                            )}
                          </td>
                          <td className="px-5 py-3 font-medium text-emerald-800">{advisor.title}</td>
                          <td className="px-5 py-3 text-slate-600">{advisor.institution}</td>
                          <td className="px-5 py-3 font-mono-num text-xs text-slate-600 whitespace-nowrap">
                            {advisor.phone}
                          </td>
                          <td className="px-5 py-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openEditAdvisor(advisor)}
                                className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                title="সম্পাদনা করুন"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget({
                                    kind: 'advisor',
                                    id: advisor.id,
                                    label: advisor.name,
                                  })
                                }
                                className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                                title="মুছে ফেলুন"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="space-y-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-2xl font-bold text-slate-900">আয় ও ব্যয় পরিচালনা</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    আয় বা ব্যয় যোগ, সম্পাদনা বা মুছে ফেললে স্বয়ংক্রিয়ভাবে Google Drive এ ব্যাকআপ আপলোড হবে।
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openAddTx('income')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-900 whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4" />
                    আয় যোগ করুন
                  </button>
                  <button
                    type="button"
                    onClick={() => openAddTx('expense')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4" />
                    ব্যয় যোগ করুন
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="খাত, বিবরণ বা রসিদ নং খুঁজুন..."
                    className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-700"
                  />
                </div>

                <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 self-start">
                  {(
                    [
                      { id: 'all', label: 'সকল' },
                      { id: 'income', label: 'আয়' },
                      { id: 'expense', label: 'ব্যয়' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setTxFilter(tab.id)}
                      className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                        txFilter === tab.id
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                        <th className="px-5 py-3">তারিখ</th>
                        <th className="px-5 py-3">রসিদ নং</th>
                        <th className="px-5 py-3">ধরন</th>
                        <th className="px-5 py-3">খাত ও বিবরণ</th>
                        <th className="px-5 py-3 text-right">পরিমাণ (৳)</th>
                        <th className="px-5 py-3 text-right">কার্যক্রম</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/80">
                          <td className="px-5 py-3 font-mono-num text-xs text-slate-600 whitespace-nowrap">
                            {tx.date}
                          </td>
                          <td className="px-5 py-3 font-mono-num text-xs font-medium text-slate-700 whitespace-nowrap">
                            {tx.receiptNo}
                          </td>
                          <td
                            className={`px-5 py-3 text-xs font-semibold whitespace-nowrap ${
                              tx.type === 'income' ? 'text-emerald-700' : 'text-red-700'
                            }`}
                          >
                            {tx.type === 'income' ? 'আয়' : 'ব্যয়'}
                          </td>
                          <td className="px-5 py-3">
                            <div className="font-medium text-slate-900">{tx.category}</div>
                            <div className="text-xs text-slate-500">{tx.description}</div>
                          </td>
                          <td
                            className={`px-5 py-3 text-right font-mono-num font-semibold whitespace-nowrap ${
                              tx.type === 'income' ? 'text-emerald-700' : 'text-red-700'
                            }`}
                          >
                            {tx.type === 'income' ? '+' : '-'} ৳ {tx.amount.toLocaleString('en-US')}
                          </td>
                          <td className="px-5 py-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openEditTx(tx)}
                                className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                title="সম্পাদনা করুন"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget({
                                    kind: 'transaction',
                                    id: tx.id,
                                    label: `${tx.category} (৳ ${tx.amount.toLocaleString('en-US')})`,
                                  })
                                }
                                className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                                title="মুছে ফেলুন"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notices' && (
            <div className="space-y-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-2xl font-bold text-slate-900">নোটিশ বোর্ড পরিচালনা</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    নতুন নোটিশ প্রকাশ, সম্পাদনা বা মুছে ফেলুন (সাধারণ ইউজার শুধু দেখতে পারবেন)।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openAddNotice}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 whitespace-nowrap self-start"
                >
                  <Plus className="h-4 w-4" />
                  নতুন নোটিশ যোগ করুন
                </button>
              </div>

              <div className="space-y-3">
                {[...data.notices]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((notice) => (
                    <div
                      key={notice.id}
                      className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span
                            className={
                              notice.important
                                ? 'font-semibold text-red-700'
                                : 'font-medium text-emerald-800'
                            }
                          >
                            {notice.category}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="font-mono-num">{notice.date}</span>
                        </div>
                        <h3 className="font-display text-base font-bold text-slate-900">
                          {notice.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-slate-600">{notice.content}</p>
                      </div>

                      <div className="inline-flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditNotice(notice)}
                          className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          title="সম্পাদনা করুন"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteTarget({
                              kind: 'notice',
                              id: notice.id,
                              label: notice.title,
                            })
                          }
                          className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <GoogleDriveBackupPanel
              data={data}
              isConnected={isDriveConnected}
              connectedEmail={driveEmail}
              isConnecting={isConnectingDrive}
              isBackingUp={isBackingUp}
              lastBackupResult={lastBackupResult}
              driveError={driveError}
              onConnectDrive={onConnectDrive}
              onReconnectDrive={onReconnectDrive}
              onDisconnectDrive={onDisconnectDrive}
              onManualBackup={onManualBackup}
              onUpdateSettings={onUpdateBackupSettings}
            />
          )}

          {activeTab === 'settings' && (
            <AdminSettingsPanel logoUrl={data.logoUrl} onUpdateLogo={onUpdateLogo} />
          )}
        </main>

      {/* Notice Form Modal */}
      {noticeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-display text-lg font-bold text-slate-900">
                {editingNotice ? 'নোটিশ সম্পাদনা' : 'নতুন নোটিশ যোগ করুন'}
              </h3>
              <button
                type="button"
                onClick={() => setNoticeModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={saveNotice} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700">নোটিশের শিরোনাম</label>
                <input
                  type="text"
                  required
                  value={noticeForm.title}
                  onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">বিভাগ / ধরন</label>
                  <input
                    type="text"
                    required
                    value={noticeForm.category}
                    onChange={(e) => setNoticeForm({ ...noticeForm, category: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">তারিখ</label>
                  <input
                    type="date"
                    required
                    value={noticeForm.date}
                    onChange={(e) => setNoticeForm({ ...noticeForm, date: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">বিস্তারিত বিবরণ</label>
                <textarea
                  rows={4}
                  required
                  value={noticeForm.content}
                  onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(noticeForm.important)}
                  onChange={(e) => setNoticeForm({ ...noticeForm, important: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-700"
                />
                <span>জরুরি বিজ্ঞপ্তি হিসেবে চিহ্নিত করুন</span>
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNoticeModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-800 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
                >
                  প্রকাশ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>

      {/* Member Form Modal */}
      {memberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-display text-lg font-bold text-slate-900">
                {editingMember ? 'সদস্যের তথ্য সম্পাদনা' : 'নতুন সদস্য যোগ করুন'}
              </h3>
              <button
                type="button"
                onClick={() => setMemberModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={saveMember} className="mt-4 space-y-4">
              {/* Optional Photo Upload + ID & Status */}
              <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                <OrgLogo
                  src={memberForm.photoUrl || activeLogoSrc}
                  alt="সদস্যের ছবি"
                  variant="standard"
                  isPhoto={Boolean(memberForm.photoUrl)}
                />
                <div className="flex-1 min-w-[180px]">
                  <p className="text-xs font-medium text-slate-700">সদস্যের ছবি (যদি থাকে)</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                      <Upload className="h-3.5 w-3.5" />
                      ছবি নির্বাচন (JPG/PNG)
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={handleMemberPhotoChange}
                        className="sr-only"
                      />
                    </label>
                    {memberForm.photoUrl && (
                      <button
                        type="button"
                        onClick={() => setMemberForm({ ...memberForm, photoUrl: undefined })}
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        ছবি মুছুন
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    সদস্যের নাম <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={memberForm.name}
                    onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                    placeholder="সদস্যের পূর্ণ নাম"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    পিতার নাম <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={memberForm.fatherName}
                    onChange={(e) => setMemberForm({ ...memberForm, fatherName: e.target.value })}
                    placeholder="পিতার নাম লিখুন"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">ঠিকানা / গ্রাম</label>
                  <input
                    type="text"
                    value={memberForm.address}
                    onChange={(e) => setMemberForm({ ...memberForm, address: e.target.value })}
                    placeholder="গ্রাম / মহল্লা / এলাকা"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">মোবাইল নাম্বার</label>
                  <input
                    type="tel"
                    value={memberForm.phone}
                    onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                    placeholder="01XXXXXXXXX"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-num outline-none focus:border-emerald-700"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">ব্লাড গ্রুপ</label>
                  <select
                    value={memberForm.bloodGroup}
                    onChange={(e) =>
                      setMemberForm({ ...memberForm, bloodGroup: e.target.value as BloodGroup | '' })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-700"
                  >
                    <option value="">নির্বাচন করুন</option>
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">সদস্য পদ</label>
                  <select
                    value={memberForm.designation}
                    onChange={(e) => setMemberForm({ ...memberForm, designation: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-700"
                  >
                    {MEMBER_DESIGNATIONS.map((roleLabel) => (
                      <option key={roleLabel} value={roleLabel}>
                        {roleLabel}
                      </option>
                    ))}
                    {!MEMBER_DESIGNATIONS.includes(
                      memberForm.designation as (typeof MEMBER_DESIGNATIONS)[number]
                    ) &&
                      memberForm.designation && (
                        <option value={memberForm.designation}>{memberForm.designation}</option>
                      )}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    মাসিক এয়ানতের পরিমাণ (৳) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={memberFeeInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setMemberFeeInput(val);
                      if (val && Number(val) >= 50) {
                        setMemberFormError(null);
                      }
                    }}
                    placeholder="সর্বনিম্ন ৫০ টাকা (যেমন: ১০০, ৫০০, ৫০০০, ৫০০০০)"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-num outline-none focus:border-emerald-700"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    সর্বনিম্ন ৫০ টাকা থেকে যেকোনো পরিমাণ টাইপ করুন
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">যোগদানের তারিখ</label>
                  <input
                    type="date"
                    required
                    value={memberForm.joinDate}
                    onChange={(e) => setMemberForm({ ...memberForm, joinDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">সদস্য আইডি</label>
                  <input
                    type="text"
                    required
                    value={memberForm.memberCode}
                    onChange={(e) => setMemberForm({ ...memberForm, memberCode: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono-num outline-none focus:border-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">অবস্থা</label>
                  <select
                    value={memberForm.status}
                    onChange={(e) =>
                      setMemberForm({
                        ...memberForm,
                        status: e.target.value as 'সক্রিয়' | 'নিষ্ক্রিয়',
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-700"
                  >
                    <option value="সক্রিয়">সক্রিয়</option>
                    <option value="নিষ্ক্রিয়">নিষ্ক্রিয়</option>
                  </select>
                </div>
              </div>

              {memberFormError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">
                  {memberFormError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMemberModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-800 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Advisor Form Modal */}
      {advisorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-display text-lg font-bold text-slate-900">
                {editingAdvisor ? 'উপদেষ্টার তথ্য সম্পাদনা' : 'নতুন উপদেষ্টা যোগ করুন'}
              </h3>
              <button
                type="button"
                onClick={() => setAdvisorModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={saveAdvisor} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700">উপদেষ্টার নাম</label>
                <input
                  type="text"
                  required
                  value={advisorForm.name}
                  onChange={(e) => setAdvisorForm({ ...advisorForm, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">পদবি / ভূমিকা</label>
                  <input
                    type="text"
                    required
                    value={advisorForm.title}
                    onChange={(e) => setAdvisorForm({ ...advisorForm, title: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">মোবাইল</label>
                  <input
                    type="text"
                    required
                    value={advisorForm.phone}
                    onChange={(e) => setAdvisorForm({ ...advisorForm, phone: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">কর্মক্ষেত্র / প্রতিষ্ঠান</label>
                <input
                  type="text"
                  required
                  value={advisorForm.institution}
                  onChange={(e) => setAdvisorForm({ ...advisorForm, institution: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">সংক্ষিপ্ত বিবরণ (ঐচ্ছিক)</label>
                <textarea
                  rows={2}
                  value={advisorForm.note || ''}
                  onChange={(e) => setAdvisorForm({ ...advisorForm, note: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAdvisorModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-800 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Income / Expense Form Modal */}
      {txModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-display text-lg font-bold text-slate-900">
                {editingTx ? 'আয়-ব্যয় তথ্য সম্পাদনা' : 'নতুন আয় বা ব্যয় যোগ করুন'}
              </h3>
              <button
                type="button"
                onClick={() => setTxModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={saveTx} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">লেনদেনের ধরন</label>
                  <select
                    value={txForm.type}
                    onChange={(e) =>
                      setTxForm({ ...txForm, type: e.target.value as TransactionType })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                  >
                    <option value="income">আয় (Income)</option>
                    <option value="expense">ব্যয় (Expense)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">তারিখ</label>
                  <input
                    type="date"
                    required
                    value={txForm.date}
                    onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">খাত</label>
                  <input
                    type="text"
                    required
                    value={txForm.category}
                    onChange={(e) => setTxForm({ ...txForm, category: e.target.value })}
                    placeholder="যেমন: সদস্য চাঁদা / শিক্ষা বৃত্তি"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">রসিদ / ভাউচার নং</label>
                  <input
                    type="text"
                    required
                    value={txForm.receiptNo}
                    onChange={(e) => setTxForm({ ...txForm, receiptNo: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">টাকার পরিমাণ (৳)</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={txForm.amount || ''}
                  onChange={(e) => setTxForm({ ...txForm, amount: Number(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">বিস্তারিত বিবরণ</label>
                <textarea
                  rows={2}
                  required
                  value={txForm.description}
                  onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTxModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-800 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Deletes */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="তথ্য মুছে ফেলার নিশ্চিতকরণ"
        description={`আপনি কি নিশ্চিতভাবে "${deleteTarget?.label || ''}" মুছে ফেলতে চান? এই তথ্যটি মুছে ফেলার পর স্বয়ংক্রিয় Google Drive ব্যাকআপ আপডেট হবে।`}
        confirmLabel="হ্যাঁ, মুছে ফেলুন"
        onConfirm={executeDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Member Profile & 12-Month Eyanot Checklist Modal (Admin Editable) */}
      <MemberProfileModal
        member={profileMember}
        isAdmin={true}
        orgLogoUrl={data.logoUrl}
        onClose={() => setProfileMemberId(null)}
        onToggleMonth={handleToggleEyanotMonth}
      />
    </div>
  );
};
