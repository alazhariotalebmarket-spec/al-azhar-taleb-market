import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy, ExternalLink, HeartHandshake, Send } from 'lucide-react';
import {
  ORG_CONTACT,
  copyTextToClipboard,
  triggerBkashSendMoney,
} from '../services/contactConfig';

export const DonateSection: React.FC = () => {
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const [showFallbackLink, setShowFallbackLink] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  const deepLinkRef = useRef<HTMLAnchorElement | null>(null);
  const fallbackLinkRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
    };
  }, []);

  const handleCopyOnly = async () => {
    await copyTextToClipboard(ORG_CONTACT.bkashNumber);
    setCopiedMessage(`নাম্বার কপি হয়েছে: ${ORG_CONTACT.bkashNumber}`);
    setShowFallbackLink(false);
  };

  const handleSendViaBkash = async () => {
    await copyTextToClipboard(ORG_CONTACT.bkashNumber);
    setCopiedMessage(`নাম্বার কপি হয়েছে: ${ORG_CONTACT.bkashNumber}`);
    setShowFallbackLink(true);
    cleanupRef.current?.();
    cleanupRef.current = triggerBkashSendMoney(deepLinkRef.current, fallbackLinkRef.current);
  };

  return (
    <section
      aria-label="দান করুন"
      className="rounded-2xl border-2 border-pink-200 bg-gradient-to-br from-pink-50 via-rose-50/60 to-white p-6 sm:p-7 shadow-xs"
    >
      {/* Hidden anchor helpers (avoids window.open while supporting deep-link + fallback) */}
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

      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-pink-900">
            <HeartHandshake className="h-5 w-5 text-[#E2136E] shrink-0" />
            <h2 className="font-display text-lg font-bold tracking-tight sm:text-xl">
              দান করুন - আল্লাহর রাস্তায় দান করুন
            </h2>
          </div>

          <p className="text-xs font-semibold text-pink-800">বিকাশ (পার্সোনাল)</p>

          {/* Number with Pink bKash Icon */}
          <button
            type="button"
            onClick={handleSendViaBkash}
            className="group inline-flex items-center gap-3 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-left transition-colors hover:border-[#E2136E] hover:bg-pink-50/40"
            title="বিকাশ অ্যাপ খুলতে ও নাম্বার কপি করতে ক্লিক করুন"
          >
            {/* Pink bKash Emblem Icon */}
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E2136E] text-white shrink-0 shadow-xs"
              aria-hidden="true"
            >
              <svg viewBox="0 0 36 36" className="h-6 w-6 fill-current" role="img">
                <path d="M17.4 6.2 26.8 14l-5.7 2.2-3.7-10Zm9.9 8.7L21 17.3l7.3 5.5 2-4.7-3-3.2Zm-7 3.1-9.8 3.9 5.5 7.9 4.3-11.8Zm-9.9 3.1 6-8.9-9.1-1.9 3.1 10.8Zm7.2-14.2 3.1 8.5-7.4 2.9 4.3-11.4Z" />
              </svg>
            </span>

            <span className="font-mono-num text-2xl font-bold tracking-wider text-[#E2136E] sm:text-3xl">
              {ORG_CONTACT.bkashNumber}
            </span>
          </button>

          <p className="text-xs text-pink-900/80">
            বিকাশে Send Money করার সময় কপি করা নাম্বারটি পেস্ট করুন।
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 sm:flex-row md:flex-col lg:flex-row shrink-0">
          <button
            type="button"
            onClick={handleSendViaBkash}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E2136E] px-5 py-3 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#c50f5e] whitespace-nowrap"
          >
            <Send className="h-4 w-4" />
            বিকাশে পাঠান
          </button>

          <button
            type="button"
            onClick={handleCopyOnly}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-pink-300 bg-white px-5 py-3 text-sm font-semibold text-pink-900 transition-colors hover:bg-pink-100/60 whitespace-nowrap"
          >
            <Copy className="h-4 w-4 text-[#E2136E]" />
            নাম্বার কপি করুন
          </button>
        </div>
      </div>

      {/* Copy confirmation & optional bka.sh fallback link */}
      {(copiedMessage || showFallbackLink) && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-pink-200 bg-white/90 px-4 py-2.5 text-xs">
          {copiedMessage && (
            <div className="flex items-center gap-2 font-semibold text-emerald-800">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="font-mono-num">{copiedMessage}</span>
            </div>
          )}
          {showFallbackLink && (
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

      {/* Footer note */}
      <p className="mt-4 border-t border-pink-200/80 pt-3 text-center text-xs font-medium text-pink-900 sm:text-left">
        দান পাঠিয়ে আমাদের জানান, জাযাকাল্লাহ খাইরান
      </p>
    </section>
  );
};
