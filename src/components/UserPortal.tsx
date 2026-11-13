import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Bell,
  BookOpen,
  Building2,
  HandHeart,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Search,
  Users,
  X,
} from 'lucide-react';
import {
  DEFAULT_LOGO_URL,
  HOME_BANNER_URL,
  BENGALI_MONTHS,
  BLOOD_GROUPS,
  BloodGroup,
  ORG_NAME,
  ORG_TAGLINE,
  OrganizationData,
  UserRole,
} from '../types';
import { ContactSection } from './ContactSection';
import { DonateSection } from './DonateSection';
import { DonutChart } from './DonutChart';
import { MemberProfileModal } from './MemberProfileModal';
import { OrgLogo } from './OrgLogo';
import { ORG_CONTACT } from '../services/contactConfig';

type UserSection = 'home' | 'members' | 'advisors' | 'finance' | 'notices' | 'contact' | 'about';

interface UserPortalProps {
  data: OrganizationData;
  role: UserRole;
  permissionMessage: string | null;
  onDismissPermissionMessage: () => void;
  onOpenAdmin: () => void;
  onAdminQuickEdit?: (tab: 'members' | 'advisors' | 'finance' | 'notices') => void;
}

export const UserPortal: React.FC<UserPortalProps> = ({
  data,
  role,
  permissionMessage,
  onDismissPermissionMessage,
  onOpenAdmin,
  onAdminQuickEdit,
}) => {
  const [section, setSection] = useState<UserSection>('home');
  const [memberSearch, setMemberSearch] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState<'all' | BloodGroup>('all');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [financeFilter, setFinanceFilter] = useState<'all' | 'income' | 'expense'>('all');

  const isAdmin = role === 'admin';
  const activeLogoSrc = data.logoUrl || DEFAULT_LOGO_URL;

  const selectedMember = useMemo(
    () => data.members.find((m) => m.id === selectedMemberId) || null,
    [data.members, selectedMemberId]
  );

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

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    return data.members.filter((m) => {
      if (bloodGroupFilter !== 'all' && m.bloodGroup !== bloodGroupFilter) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        (m.fatherName || '').toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q) ||
        (m.bloodGroup || '').toLowerCase().includes(q) ||
        m.memberCode.toLowerCase().includes(q) ||
        m.designation.toLowerCase().includes(q) ||
        m.address.toLowerCase().includes(q)
      );
    });
  }, [data.members, memberSearch, bloodGroupFilter]);

  const filteredTransactions = useMemo(() => {
    const sorted = [...data.transactions].sort((a, b) => b.date.localeCompare(a.date));
    if (financeFilter === 'all') return sorted;
    return sorted.filter((t) => t.type === financeFilter);
  }, [data.transactions, financeFilter]);

  const sortedNotices = useMemo(() => {
    return [...data.notices].sort((a, b) => b.date.localeCompare(a.date));
  }, [data.notices]);

  const navItems: { id: UserSection; label: string }[] = [
    { id: 'home', label: 'হোম' },
    { id: 'members', label: 'সদস্যবৃন্দ' },
    { id: 'advisors', label: 'উপদেষ্টা' },
    { id: 'finance', label: 'আয়-ব্যয়' },
    { id: 'notices', label: 'নোটিশ' },
    { id: 'contact', label: 'যোগাযোগ' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-6 py-3.5">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => setSection('home')}
            className="flex items-center gap-3 text-left whitespace-nowrap shrink-0"
          >
            <OrgLogo src={activeLogoSrc} alt={ORG_NAME} variant="compact" />
            <span className="font-display text-lg font-bold tracking-tight text-slate-900">
              {ORG_NAME}
            </span>
          </button>

          {/* Zone 2: 5 concise single-line text nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`whitespace-nowrap shrink-0 pb-0.5 transition-colors ${
                  section === item.id
                    ? 'border-b-2 border-emerald-800 font-semibold text-emerald-900'
                    : 'hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: 1 primary CTA (Only "অ্যাডমিন লগইন" when logged out) */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-900 whitespace-nowrap shrink-0"
            >
              <Lock className="h-3.5 w-3.5" />
              {isAdmin ? 'অ্যাডমিন প্যানেল' : 'অ্যাডমিন লগইন'}
            </button>
          </div>
        </div>

        {/* Mobile navigation row */}
        <div className="flex md:hidden items-center gap-4 overflow-x-auto border-t border-slate-100 px-6 py-2.5 text-xs font-medium text-slate-600">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`whitespace-nowrap shrink-0 ${
                section === item.id ? 'font-semibold text-emerald-800' : 'hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {/* Permission Guard Message (only shown if non-admin tries to trigger an edit/admin action) */}
      {permissionMessage && (
        <div className="mx-auto w-full max-w-6xl px-6 pt-5">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-700" />
              <span className="font-semibold">{permissionMessage}</span>
            </div>
            <button
              type="button"
              onClick={onDismissPermissionMessage}
              className="rounded p-1 text-amber-700 hover:bg-amber-100"
              aria-label="বন্ধ করুন"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <main className="flex-1">
        {section === 'home' && (
          <div>
            {/* Home Page Banner */}
            <section className="mx-auto max-w-6xl px-6 pt-8">
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-emerald-950">
                <img
                  src={HOME_BANNER_URL}
                  alt={ORG_NAME}
                  referrerPolicy="no-referrer"
                  className="h-[360px] w-full object-cover sm:h-[420px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/55 to-slate-950/20" />
                <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
                  <div className="flex items-center gap-4">
                    <OrgLogo
                      src={activeLogoSrc}
                      alt={ORG_NAME}
                      variant="standard"
                      className="border-2 border-white/60 shadow-sm"
                    />
                    <div>
                      <p className="text-xs font-medium tracking-wide text-emerald-200">
                        {ORG_TAGLINE}
                      </p>
                      <h1 className="mt-1 max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-5xl text-balance">
                        {ORG_NAME}
                      </h1>
                    </div>
                  </div>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-200 sm:text-base">
                    মানবকল্যাণ, দ্বীনি শিক্ষা প্রসার, এতিম সহায়তা ও স্বচ্ছ সামাজিক সেবায় নিবেদিত একটি অরাজনৈতিক ও অলাভজনক ইসলামী কল্যাণমূলক সংগঠন।
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSection('finance')}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 whitespace-nowrap"
                    >
                      আর্থিক স্বচ্ছতা দেখুন
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSection('about')}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-xs transition-colors hover:bg-white/20 whitespace-nowrap"
                    >
                      আমাদের সম্পর্কে
                    </button>
                  </div>
                </div>
              </div>

              {/* Dashboard Top Round Donut Chart + 4-Column KPI Strip */}
              <div className="mt-6">
                <DonutChart
                  title="আর্থিক সারসংক্ষেপ (গোল গ্রাফ)"
                  subtitle={`${ORG_NAME} · মোট আয়, মোট ব্যয় ও বর্তমান তহবিল`}
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
              </div>

              {/* Donate Card directly below the Donut Chart */}
              <div className="mt-6">
                <DonateSection />
              </div>

              {/* Contact Card directly below Graph & Donate section */}
              <div className="mt-6">
                <ContactSection />
              </div>

              {/* Full-width 4-Column Dashboard KPI Strip (View Only for Users) */}
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-medium text-slate-500">মোট সদস্য</p>
                  <p className="mt-2 font-mono-num text-2xl font-bold text-slate-900">
                    {stats.totalMembers} জন
                  </p>
                  <p className="mt-1 text-xs text-slate-500">সক্রিয় সদস্য {stats.activeMembers} জন</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-medium text-slate-500">মোট আয়</p>
                  <p className="mt-2 font-mono-num text-2xl font-bold text-emerald-700">
                    ৳ {stats.totalIncome.toLocaleString('en-US')}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">চাঁদা, যাকাত ও সাদাকাহ তহবিল</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-medium text-slate-500">মোট ব্যয়</p>
                  <p className="mt-2 font-mono-num text-2xl font-bold text-red-700">
                    ৳ {stats.totalExpense.toLocaleString('en-US')}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">বৃত্তি, ত্রাণ ও সেবামূলক ব্যয়</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-medium text-slate-500">বর্তমান তহবিল</p>
                  <p className="mt-2 font-mono-num text-2xl font-bold text-slate-900">
                    ৳ {stats.netBalance.toLocaleString('en-US')}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">উপদেষ্টা পরিষদ {stats.totalAdvisors} জন</p>
                </div>
              </div>

              {/* Current Month Eyanot Summary Strip (View Only) */}
              <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div>
                    <h2 className="font-display text-base font-bold text-slate-900">
                      চলতি মাসের এয়ানত হিসাব ({stats.currentMonthName} {stats.currentYear})
                    </h2>
                    <p className="text-xs text-slate-500">
                      সদস্যদের নির্ধারিত মাসিক এয়ানত আদায় ও বকেয়ার সারসংক্ষেপ
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSection('members')}
                    className="text-xs font-semibold text-emerald-800 hover:underline"
                  >
                    সদস্য তালিকা ও এয়ানত দেখুন →
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
            </section>

            {/* Latest Notices Preview */}
            {sortedNotices.length > 0 && (
              <section className="mx-auto max-w-6xl px-6 pt-12">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-slate-900">সাম্প্রতিক নোটিশ</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {ORG_NAME}-এর সর্বশেষ বিজ্ঞপ্তি ও কর্মসূচি
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSection('notices')}
                    className="text-sm font-semibold text-emerald-800 hover:underline self-start sm:self-auto"
                  >
                    সব নোটিশ দেখুন →
                  </button>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {sortedNotices.slice(0, 3).map((notice) => (
                    <div key={notice.id} className="rounded-xl border border-slate-200 bg-white p-5">
                      <p className="text-xs text-slate-500">
                        <span className={notice.important ? 'font-semibold text-red-700' : 'text-emerald-800 font-medium'}>
                          {notice.category}
                        </span>
                        <span className="mx-1.5 text-slate-300">·</span>
                        <span className="font-mono-num">{notice.date}</span>
                      </p>
                      <h3 className="mt-2 font-display text-base font-bold text-slate-900">
                        {notice.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">
                        {notice.content}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Core Pillars */}
            <section className="mx-auto max-w-6xl px-6 py-12">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="font-display text-2xl font-bold text-slate-900">
                    আমাদের প্রধান সেবামূলক কার্যক্রম
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {ORG_NAME}-এর নিয়মিত কল্যাণ ও শিক্ষামূলক উদ্যোগসমূহ
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSection('about')}
                  className="text-sm font-semibold text-emerald-800 hover:underline self-start sm:self-auto"
                >
                  বিস্তারিত জানুন →
                </button>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-6">
                  <BookOpen className="h-6 w-6 text-emerald-800" />
                  <h3 className="mt-4 font-display text-lg font-semibold text-slate-900">
                    ০১. এতিম ও শিক্ষার্থী বৃত্তি
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    সুবিধাবঞ্চিত ও এতিম শিক্ষার্থীদের মাসিক শিক্ষা বৃত্তি, পাঠ্যবই এবং প্রয়োজনীয় শিক্ষা উপকরণ সরবরাহ করা হয়।
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6">
                  <HandHeart className="h-6 w-6 text-emerald-800" />
                  <h3 className="mt-4 font-display text-lg font-semibold text-slate-900">
                    ০২. মানবিক ও জরুরি ত্রাণ সহায়তা
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    অসহায় পরিবারগুলোর মাঝে খাদ্য সামগ্রী, শীতবস্ত্র বিতরণ, চিকিৎসা সহায়তা এবং দুর্যোগকালীন জরুরি ত্রাণ পরিচালনা।
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6">
                  <Users className="h-6 w-6 text-emerald-800" />
                  <h3 className="mt-4 font-display text-lg font-semibold text-slate-900">
                    ০৩. দাওয়াহ ও নৈতিক সমাজ গঠন
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    নিয়মিত ইসলামি আলোচনা সভা, যুব প্রশিক্ষণ ও কুরআন-সুন্নাহভিত্তিক নৈতিক মূল্যবোধ জাগ্রত করার কর্মসূচি।
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {section === 'members' && (
          <section className="mx-auto max-w-6xl px-6 py-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="font-display text-2xl font-bold text-slate-900">সদস্যবৃন্দের তালিকা</h1>
                <p className="mt-1 text-sm text-slate-600">
                  {ORG_NAME} · মোট সদস্য {data.members.length} জন
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="নাম, মোবাইল বা ব্লাড গ্রুপ খুঁজুন..."
                    className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-700"
                  />
                </div>

                <select
                  aria-label="ব্লাড গ্রুপ ফিল্টার"
                  value={bloodGroupFilter}
                  onChange={(e) => setBloodGroupFilter(e.target.value as 'all' | BloodGroup)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-700"
                >
                  <option value="all">সকল ব্লাড গ্রুপ</option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      ব্লাড গ্রুপ: {bg}
                    </option>
                  ))}
                </select>

                {isAdmin && onAdminQuickEdit && (
                  <button
                    type="button"
                    onClick={() => onAdminQuickEdit('members')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-900 whitespace-nowrap"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    সদস্য সম্পাদনা
                  </button>
                )}
              </div>
            </div>

            {/* Small Round Donut Chart on Members Page */}
            <div className="mt-6">
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
            </div>

            {/* Member Cards Grid with Round Photo/Logo, Father Name, Blood Group, Call & Profile View */}
            {filteredMembers.length > 0 && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredMembers.map((member) => (
                  <div
                    key={`card-${member.id}`}
                    className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <OrgLogo
                            src={member.photoUrl || activeLogoSrc}
                            alt={member.name}
                            variant="standard"
                            isPhoto={Boolean(member.photoUrl)}
                          />
                          <div className="min-w-0">
                            <h3 className="truncate font-display text-base font-bold text-slate-900">
                              {member.name}
                            </h3>
                            <p className="truncate text-xs text-slate-600">
                              পিতা: {member.fatherName || 'উল্লেখ নেই'}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {member.designation}
                              {member.bloodGroup ? ` · রক্ত: ${member.bloodGroup}` : ''}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1 text-xs text-slate-600">
                        <p className="truncate">{member.address}</p>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono-num">
                            মাসিক এয়ানত: <strong className="text-slate-900">৳ {member.monthlyFee.toLocaleString('en-US')}</strong>
                          </span>
                          <span
                            className={`font-semibold shrink-0 ${
                              member.status === 'সক্রিয়' ? 'text-emerald-700' : 'text-slate-500'
                            }`}
                          >
                            {member.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                      {member.phone ? (
                        <a
                          href={`tel:${member.phone}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 whitespace-nowrap"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          {member.phone}
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">মোবাইল নেই</span>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedMemberId(member.id)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                      >
                        প্রোফাইল ও এয়ানত
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                      <th className="px-6 py-3.5">সদস্য ও পিতার নাম</th>
                      <th className="px-6 py-3.5">সদস্য পদ</th>
                      <th className="px-6 py-3.5">ব্লাড গ্রুপ</th>
                      <th className="px-6 py-3.5">মোবাইল</th>
                      <th className="px-6 py-3.5 text-right">মাসিক এয়ানত</th>
                      <th className="px-6 py-3.5 text-right">বিস্তারিত</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50/70">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <OrgLogo
                              src={member.photoUrl || activeLogoSrc}
                              alt={member.name}
                              variant="compact"
                              isPhoto={Boolean(member.photoUrl)}
                            />
                            <div>
                              <div className="font-medium text-slate-900">{member.name}</div>
                              <div className="text-xs text-slate-500">
                                পিতা: {member.fatherName || 'উল্লেখ নেই'} · {member.address}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-slate-700">{member.designation}</td>
                        <td className="px-6 py-3.5 font-mono-num font-semibold text-red-700 whitespace-nowrap">
                          {member.bloodGroup || '—'}
                        </td>
                        <td className="px-6 py-3.5 font-mono-num text-xs text-slate-700 whitespace-nowrap">
                          {member.phone ? (
                            <a
                              href={`tel:${member.phone}`}
                              className="inline-flex items-center gap-1 text-emerald-800 hover:underline"
                            >
                              <Phone className="h-3 w-3" />
                              {member.phone}
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-right font-mono-num font-semibold text-slate-900 whitespace-nowrap">
                          ৳ {member.monthlyFee.toLocaleString('en-US')}
                        </td>
                        <td className="px-6 py-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedMemberId(member.id)}
                            className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            প্রোফাইল দেখুন
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredMembers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                          কোনো সদস্য পাওয়া যায়নি।
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {section === 'advisors' && (
          <section className="mx-auto max-w-6xl px-6 py-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="font-display text-2xl font-bold text-slate-900">উপদেষ্টা পরিষদ</h1>
                <p className="mt-1 text-sm text-slate-600">
                  {ORG_NAME}-এর দিকনির্দেশনাকারী সম্মানিত উপদেষ্টামণ্ডলী
                </p>
              </div>
              {isAdmin && onAdminQuickEdit && (
                <button
                  type="button"
                  onClick={() => onAdminQuickEdit('advisors')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-900 whitespace-nowrap self-start"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  উপদেষ্টা সম্পাদনা
                </button>
              )}
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {data.advisors.map((advisor) => (
                <div key={advisor.id} className="rounded-xl border border-slate-200 bg-white p-6">
                  <p className="text-xs font-semibold text-emerald-800">{advisor.title}</p>
                  <h2 className="mt-2 font-display text-lg font-bold text-slate-900">
                    {advisor.name}
                  </h2>
                  <p className="mt-1.5 flex items-start gap-2 text-sm text-slate-600">
                    <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <span>{advisor.institution}</span>
                  </p>
                  {advisor.note && (
                    <p className="mt-3 border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-500">
                      {advisor.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {section === 'finance' && (
          <section className="mx-auto max-w-6xl px-6 py-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="font-display text-2xl font-bold text-slate-900">
                  আয় ও ব্যয়ের স্বচ্ছ হিসাব
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  {ORG_NAME} · মোট আয় ৳ {stats.totalIncome.toLocaleString('en-US')} · মোট ব্যয় ৳{' '}
                  {stats.totalExpense.toLocaleString('en-US')} · তহবিল স্থিতি ৳{' '}
                  {stats.netBalance.toLocaleString('en-US')}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
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
                      onClick={() => setFinanceFilter(tab.id)}
                      className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                        financeFilter === tab.id
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                {isAdmin && onAdminQuickEdit && (
                  <button
                    type="button"
                    onClick={() => onAdminQuickEdit('finance')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-900 whitespace-nowrap"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    আয়-ব্যয় সম্পাদনা
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                      <th className="px-6 py-3.5">তারিখ</th>
                      <th className="px-6 py-3.5">রসিদ নং</th>
                      <th className="px-6 py-3.5">ধরন</th>
                      <th className="px-6 py-3.5">খাত ও বিবরণ</th>
                      <th className="px-6 py-3.5 text-right">পরিমাণ (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/70">
                        <td className="px-6 py-3.5 font-mono-num text-xs text-slate-600 whitespace-nowrap">
                          {tx.date}
                        </td>
                        <td className="px-6 py-3.5 font-mono-num text-xs font-medium text-slate-700 whitespace-nowrap">
                          {tx.receiptNo}
                        </td>
                        <td
                          className={`px-6 py-3.5 text-xs font-semibold whitespace-nowrap ${
                            tx.type === 'income' ? 'text-emerald-700' : 'text-red-700'
                          }`}
                        >
                          {tx.type === 'income' ? 'আয়' : 'ব্যয়'}
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="font-medium text-slate-900">{tx.category}</div>
                          <div className="text-xs text-slate-500">{tx.description}</div>
                        </td>
                        <td
                          className={`px-6 py-3.5 text-right font-mono-num font-semibold whitespace-nowrap ${
                            tx.type === 'income' ? 'text-emerald-700' : 'text-red-700'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : '-'} ৳ {tx.amount.toLocaleString('en-US')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {section === 'notices' && (
          <section className="mx-auto max-w-5xl px-6 py-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="font-display text-2xl font-bold text-slate-900">নোটিশ বোর্ড</h1>
                <p className="mt-1 text-sm text-slate-600">
                  {ORG_NAME}-এর সকল প্রাতিষ্ঠানিক ঘোষণা ও বিজ্ঞপ্তি
                </p>
              </div>
              {isAdmin && onAdminQuickEdit && (
                <button
                  type="button"
                  onClick={() => onAdminQuickEdit('notices')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-900 whitespace-nowrap self-start"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  নোটিশ সম্পাদনা
                </button>
              )}
            </div>

            <div className="mt-6 space-y-4">
              {sortedNotices.map((notice) => (
                <article
                  key={notice.id}
                  className="rounded-xl border border-slate-200 bg-white p-6"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <Bell
                      className={`h-3.5 w-3.5 ${
                        notice.important ? 'text-red-700' : 'text-emerald-700'
                      }`}
                    />
                    <span
                      className={
                        notice.important ? 'font-semibold text-red-700' : 'font-medium text-emerald-800'
                      }
                    >
                      {notice.category}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="font-mono-num">{notice.date}</span>
                  </div>
                  <h2 className="mt-2 font-display text-lg font-bold text-slate-900">
                    {notice.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{notice.content}</p>
                </article>
              ))}
              {sortedNotices.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
                  কোনো নোটিশ প্রকাশিত হয়নি।
                </div>
              )}
            </div>
          </section>
        )}

        {section === 'contact' && (
          <section className="mx-auto max-w-5xl px-6 py-10 space-y-6">
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-900">যোগাযোগ</h1>
              <p className="mt-1 text-sm text-slate-600">
                {ORG_NAME}-এর কার্যালয়ের ঠিকানা, ফোন, বিকাশ ও ইমেইল তথ্য
              </p>
            </div>
            <ContactSection />
            <DonateSection />
          </section>
        )}

        {section === 'about' && (
          <section className="mx-auto max-w-5xl px-6 py-12 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <OrgLogo src={activeLogoSrc} alt={ORG_NAME} variant="standard" />
                <div>
                  <p className="text-xs font-semibold text-emerald-800">{ORG_TAGLINE}</p>
                  <h1 className="mt-1 font-display text-3xl font-bold text-slate-900">
                    {ORG_NAME} সম্পর্কে
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    ২০২৩ সালে প্রতিষ্ঠিত {ORG_NAME} একটি সমাজকল্যাণমূলক, অরাজনৈতিক ও স্বচ্ছ মানবিক সংগঠন।
                  </p>
                </div>
              </div>

              <div className="mt-8 border-t border-slate-200 pt-8">
                <h2 className="font-display text-lg font-bold text-slate-900">আমাদের লক্ষ্য ও উদ্দেশ্য</h2>
                <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-slate-600">
                  <li>• অসহায়, এতিম ও সুবিধাবঞ্চিত শিক্ষার্থীদের নিয়মিত বৃত্তি ও শিক্ষা সহায়তা প্রদান।</li>
                  <li>• দরিদ্র পরিবারের জন্য স্বনির্ভরতা প্রকল্প, খাদ্য ও চিকিৎসা সহায়তা পরিচালনা।</li>
                  <li>• বিশুদ্ধ ইসলামি জ্ঞান, নৈতিকতা ও সামাজিক ভ্রাতৃত্ববোধের প্রসার ঘটানো।</li>
                  <li>• সংস্থার প্রতিটি আয়-ব্যয়ের শতভাগ স্বচ্ছতা ও জবাবদিহিতা নিশ্চিত করা।</li>
                </ul>
              </div>
            </div>

            <ContactSection />
          </section>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
          <div className="grid gap-6 md:grid-cols-2 md:items-start">
            <div className="flex items-center gap-3">
              <OrgLogo src={activeLogoSrc} alt={ORG_NAME} variant="compact" />
              <div>
                <p className="font-display text-sm font-bold text-slate-900">{ORG_NAME}</p>
                <p className="text-xs text-slate-500">{ORG_TAGLINE}</p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 md:text-right">
              <p className="flex items-start gap-2 md:justify-end">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-800" />
                <span>
                  {ORG_CONTACT.addressLine1}, {ORG_CONTACT.addressLine2}
                </span>
              </p>
              <p className="flex items-center gap-2 md:justify-end">
                <Phone className="h-3.5 w-3.5 shrink-0 text-emerald-800" />
                <a
                  href={ORG_CONTACT.phoneTelHref}
                  className="font-mono-num font-semibold text-slate-800 hover:text-emerald-800 hover:underline"
                >
                  {ORG_CONTACT.phoneDisplay}
                </a>
                <span className="text-slate-400">· বিকাশ (পার্সোনাল)</span>
              </p>
              <p className="flex items-center gap-2 md:justify-end">
                <Mail className="h-3.5 w-3.5 shrink-0 text-emerald-800" />
                <a
                  href={ORG_CONTACT.gmailComposeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono-num text-slate-700 hover:text-emerald-800 hover:underline"
                >
                  {ORG_CONTACT.email}
                </a>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5 text-xs text-slate-500">
            <div className="flex flex-wrap items-center gap-5">
              <button type="button" onClick={() => setSection('home')} className="hover:text-slate-900">
                হোম
              </button>
              <button type="button" onClick={() => setSection('members')} className="hover:text-slate-900">
                সদস্যবৃন্দ
              </button>
              <button type="button" onClick={() => setSection('advisors')} className="hover:text-slate-900">
                উপদেষ্টা
              </button>
              <button type="button" onClick={() => setSection('finance')} className="hover:text-slate-900">
                আয়-ব্যয়
              </button>
              <button type="button" onClick={() => setSection('notices')} className="hover:text-slate-900">
                নোটিশ
              </button>
              <button type="button" onClick={() => setSection('contact')} className="hover:text-slate-900">
                যোগাযোগ
              </button>
              <button type="button" onClick={() => setSection('about')} className="hover:text-slate-900">
                আমাদের সম্পর্কে
              </button>
            </div>
            <span>© {new Date().getFullYear()} {ORG_NAME}</span>
          </div>
        </div>
      </footer>

      {/* Read-Only Member Profile & 12-Month Eyanot View */}
      <MemberProfileModal
        member={selectedMember}
        isAdmin={false}
        orgLogoUrl={data.logoUrl}
        onClose={() => setSelectedMemberId(null)}
      />
    </div>
  );
};
