import React, { useEffect, useRef, useState } from 'react';
import { Check, ExternalLink, Mail, MapPin, Phone, Send } from 'lucide-react';
import {
  ORG_CONTACT,
  copyTextToClipboard,
  triggerBkashSendMoney,
} from '../services/contactConfig';

export const ContactSection: React.FC = () => {
  const [bkashCopiedMsg, setBkashCopiedMsg] = useState<string | null>(null);
  const [showBkashFallback, setShowBkashFallback] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  const deepLinkRef = useRef<HTMLAnchorElement | null>(null);
  const fallbackLinkRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
    };
  }, []);

  const handleBkashAction = async () => {
    await copyTextToClipboard(ORG_CONTACT.bkashNumber);
    setBkashCopiedMsg(`নাম্বার কপি হয়েছে: ${ORG_CONTACT.bkashNumber}`);
    setShowBkashFallback(true);
    cleanupRef.current?.();
    cleanupRef.current = triggerBkashSendMoney(deepLinkRef.current, fallbackLinkRef.current);
  };

  return (
    <section
      aria-label="যোগাযোগের ঠিকানা"
      className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs"
    >
      {/* Hidden anchor helpers for bKash app + web fallback */}
      <a ref={deepLinkRef} href={ORG_CONTACT.bkashDeepLink} className="hidden" aria-hidden="true">
        bKash App
      </a>
      <a
        ref={fallbackLinkRef}
        href={ORG_CONTACT.bkashFallbackUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="hidden"
        aria-hidden="true"
      >
        bKash Web
      </a>

      <div className="border-b border-slate-100 pb-4">
        <h2 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">
          যোগাযোগের ঠিকানা
        </h2>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          যেকোনো প্রয়োজনে, দান সংক্রান্ত তথ্য জানাতে বা আমাদের সাথে সরাসরি যোগাযোগ করতে নিচের মাধ্যমগুলো ব্যবহার করুন
        </p>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {/* 1. Address Card */}
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 text-emerald-900">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                <MapPin className="h-4 w-4" />
              </span>
              <h3 className="font-display text-sm font-bold text-slate-900">ঠিকানা</h3>
            </div>
            <p className="mt-3.5 text-sm font-medium leading-relaxed text-slate-800">
              {ORG_CONTACT.addressLine1}
              <br />
              {ORG_CONTACT.addressLine2}
            </p>
          </div>
          <p className="mt-4 text-xs text-slate-500">পটুয়াখালী জেলা কার্যালয়</p>
        </div>

        {/* 2. Phone / bKash (Personal) Card */}
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 text-emerald-900">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                <Phone className="h-4 w-4" />
              </span>
              <h3 className="font-display text-sm font-bold text-slate-900">
                ফোন / বিকাশ (পার্সোনাল)
              </h3>
            </div>

            <a
              href={ORG_CONTACT.phoneTelHref}
              className="mt-3.5 inline-block font-mono-num text-lg font-bold tracking-wide text-slate-900 hover:text-emerald-800 transition-colors"
            >
              {ORG_CONTACT.phoneDisplay}
            </a>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <a
              href={ORG_CONTACT.phoneTelHref}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-900 whitespace-nowrap"
            >
              <Phone className="h-3.5 w-3.5" />
              কল করুন
            </a>
            <button
              type="button"
              onClick={handleBkashAction}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#E2136E] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#c50f5e] whitespace-nowrap"
            >
              <Send className="h-3.5 w-3.5" />
              বিকাশে পাঠান
            </button>
          </div>
        </div>

        {/* 3. Email Card (Opens Gmail directly) */}
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-5 flex flex-col justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 text-emerald-900">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                <Mail className="h-4 w-4" />
              </span>
              <h3 className="font-display text-sm font-bold text-slate-900">ইমেইল</h3>
            </div>

            <a
              href={ORG_CONTACT.gmailComposeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3.5 block break-all font-mono-num text-sm font-semibold text-slate-800 hover:text-emerald-800 hover:underline transition-colors"
            >
              {ORG_CONTACT.email}
            </a>
          </div>

          <div className="mt-4">
            <a
              href={ORG_CONTACT.gmailComposeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100 whitespace-nowrap"
            >
              <Mail className="h-3.5 w-3.5 text-emerald-800" />
              ইমেইল করুন
            </a>
          </div>
        </div>
      </div>

      {/* Auto-copy + bKash feedback strip when [বিকাশে পাঠান] is clicked */}
      {(bkashCopiedMsg || showBkashFallback) && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-pink-200 bg-pink-50 px-4 py-2.5 text-xs">
          {bkashCopiedMsg && (
            <div className="flex items-center gap-2 font-semibold text-emerald-800">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="font-mono-num">{bkashCopiedMsg}</span>
            </div>
          )}
          {showBkashFallback && (
            <a
              href={ORG_CONTACT.bkashFallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-[#E2136E] hover:underline whitespace-nowrap"
            >
              বিকাশ অ্যাপ না থাকলে এখানে যান (bka.sh)
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      )}
    </section>
  );
};
