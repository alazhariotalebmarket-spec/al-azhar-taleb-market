import React, { useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Droplets, MapPin, Phone, User, X, XCircle } from 'lucide-react';
import { BENGALI_MONTHS, DEFAULT_LOGO_URL, Member } from '../types';
import { OrgLogo } from './OrgLogo';

interface MemberProfileModalProps {
  member: Member | null;
  isAdmin: boolean;
  orgLogoUrl?: string;
  onClose: () => void;
  onToggleMonth?: (memberId: string, year: string, monthIndex: number) => void;
}

export const MemberProfileModal: React.FC<MemberProfileModalProps> = ({
  member,
  isAdmin,
  orgLogoUrl,
  onClose,
  onToggleMonth,
}) => {
  const currentYear = String(new Date().getFullYear());
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);

  const yearOptions = useMemo(() => {
    const base = new Set<string>([
      String(Number(currentYear) - 1),
      currentYear,
      String(Number(currentYear) + 1),
    ]);
    if (member?.eyanotPayments) {
      Object.keys(member.eyanotPayments).forEach((y) => base.add(y));
    }
    return Array.from(base).sort((a, b) => Number(b) - Number(a));
  }, [currentYear, member]);

  const yearStats = useMemo(() => {
    if (!member) {
      return { paidTotal: 0, dueTotal: 0, paidCount: 0, monthMap: {} as Record<number, number> };
    }
    const monthMap = member.eyanotPayments?.[selectedYear] || {};
    let paidTotal = 0;
    let paidCount = 0;
    for (let i = 0; i < 12; i += 1) {
      const amt = monthMap[i] || 0;
      if (amt > 0) {
        paidTotal += amt;
        paidCount += 1;
      }
    }
    const annualExpected = member.monthlyFee * 12;
    const dueTotal = Math.max(0, annualExpected - paidTotal);
    return { paidTotal, dueTotal, paidCount, monthMap };
  }, [member, selectedYear]);

  if (!member) return null;

  const avatarSrc = member.photoUrl || orgLogoUrl || DEFAULT_LOGO_URL;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-xs">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <OrgLogo
              src={avatarSrc}
              alt={member.name}
              variant="standard"
              isPhoto={Boolean(member.photoUrl)}
            />
            <div className="min-w-0">
              <h3 className="truncate font-display text-lg font-bold text-slate-900">
                {member.name}
              </h3>
              <p className="text-xs text-slate-600">
                {member.designation}
                <span className="mx-1.5 text-slate-300">·</span>
                <span className="font-mono-num">{member.memberCode}</span>
                <span className="mx-1.5 text-slate-300">·</span>
                <span className={member.status === 'সক্রিয়' ? 'font-semibold text-emerald-700' : 'text-slate-500'}>
                  {member.status}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 shrink-0"
            aria-label="বন্ধ করুন"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* Personal Details */}
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2 text-sm">
            <div className="flex items-start gap-2.5">
              <User className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800" />
              <div>
                <p className="text-xs text-slate-500">পিতার নাম</p>
                <p className="font-medium text-slate-900">{member.fatherName || 'উল্লেখ নেই'}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Droplets className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <div>
                <p className="text-xs text-slate-500">ব্লাড গ্রুপ</p>
                <p className="font-mono-num font-semibold text-slate-900">
                  {member.bloodGroup || 'উল্লেখ নেই'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800" />
              <div>
                <p className="text-xs text-slate-500">ঠিকানা / গ্রাম</p>
                <p className="font-medium text-slate-900">{member.address || 'উল্লেখ নেই'}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800" />
              <div>
                <p className="text-xs text-slate-500">যোগদানের তারিখ</p>
                <p className="font-mono-num font-medium text-slate-900">{member.joinDate}</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 sm:col-span-2 border-t border-slate-200/80 pt-3 mt-1">
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-emerald-800" />
                <div>
                  <p className="text-xs text-slate-500">মোবাইল নাম্বার</p>
                  <p className="font-mono-num font-semibold text-slate-900">{member.phone || 'নেই'}</p>
                </div>
              </div>
              {member.phone && (
                <a
                  href={`tel:${member.phone}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900 whitespace-nowrap"
                >
                  <Phone className="h-3.5 w-3.5" />
                  কল করুন
                </a>
              )}
            </div>
          </div>

          {/* Monthly Eyanot 3 Stat Cards */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h4 className="font-display text-base font-bold text-slate-900">
                মাসিক এয়ানত হিসাব ({selectedYear})
              </h4>
              <div className="flex items-center gap-2">
                <label htmlFor="eyanot-year-select" className="text-xs font-medium text-slate-600">
                  বছর:
                </label>
                <select
                  id="eyanot-year-select"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-700 font-mono-num"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium text-slate-500">তার মাসিক এয়ানত</p>
                <p className="mt-1.5 font-mono-num text-xl font-bold text-slate-900">
                  ৳ {member.monthlyFee.toLocaleString('en-US')}
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                <p className="text-xs font-medium text-emerald-900">এই বছর মোট দিছে</p>
                <p className="mt-1.5 font-mono-num text-xl font-bold text-emerald-700">
                  ৳ {yearStats.paidTotal.toLocaleString('en-US')}
                </p>
                <p className="mt-0.5 text-[11px] text-emerald-800 font-mono-num">
                  {yearStats.paidCount} / 12 মাস পরিশোধিত
                </p>
              </div>

              <div className="rounded-xl border border-red-200 bg-red-50/70 p-4">
                <p className="text-xs font-medium text-red-900">এই বছর বাকি</p>
                <p className="mt-1.5 font-mono-num text-xl font-bold text-red-700">
                  ৳ {yearStats.dueTotal.toLocaleString('en-US')}
                </p>
                <p className="mt-0.5 text-[11px] text-red-800 font-mono-num">
                  {12 - yearStats.paidCount} মাস বাকি
                </p>
              </div>
            </div>
          </div>

          {/* 12 Months List (জানুয়ারি - ডিসেম্বর) */}
          <div>
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-700">
                ১২ মাসের এয়ানত তালিকা (জানুয়ারি – ডিসেম্বর)
              </p>
              <p className="text-[11px] text-slate-500">
                {isAdmin
                  ? 'মাসে ক্লিক করে টিক দিন — টিক দিলে এয়ানতের টাকা মোট আয়ে যোগ হবে'
                  : 'শুধুমাত্র দেখার জন্য (শুধু অ্যাডমিন এয়ানত টিক দিতে পারবেন)'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
              {BENGALI_MONTHS.map((monthName, monthIndex) => {
                const paidAmt = yearStats.monthMap[monthIndex] || 0;
                const isPaid = paidAmt > 0;

                if (isAdmin && onToggleMonth) {
                  return (
                    <button
                      key={monthName}
                      type="button"
                      onClick={() => onToggleMonth(member.id, selectedYear, monthIndex)}
                      className={`flex flex-col items-start justify-between rounded-xl border p-3 text-left transition-colors ${
                        isPaid
                          ? 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100/80'
                          : 'border-red-200 bg-red-50/60 hover:bg-red-100/70'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900">{monthName}</span>
                        {isPaid ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                        )}
                      </div>
                      <p
                        className={`mt-1.5 text-[11px] font-semibold font-mono-num ${
                          isPaid ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {isPaid ? `✅ ৳ ${paidAmt.toLocaleString('en-US')}` : '❌ বাকি'}
                      </p>
                    </button>
                  );
                }

                return (
                  <div
                    key={monthName}
                    className={`flex flex-col items-start justify-between rounded-xl border p-3 ${
                      isPaid
                        ? 'border-emerald-200 bg-emerald-50/80'
                        : 'border-red-200 bg-red-50/50'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-900">{monthName}</span>
                      {isPaid ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                      )}
                    </div>
                    <p
                      className={`mt-1.5 text-[11px] font-semibold font-mono-num ${
                        isPaid ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      {isPaid ? `✅ ৳ ${paidAmt.toLocaleString('en-US')}` : '❌ বাকি'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
