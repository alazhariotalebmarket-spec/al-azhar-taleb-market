export const ORG_CONTACT = {
  addressLine1: 'তুষখালী, তালেব মার্কেট, ছোটবিঘাই',
  addressLine2: 'পটুয়াখালী সদর, পটুয়াখালী',
  phoneDisplay: '+8801810893388',
  phoneTelHref: 'tel:+8801810893388',
  bkashNumber: '01810893388',
  bkashDeepLink: 'bkash://send-money',
  bkashFallbackUrl: 'https://bka.sh/',
  email: 'Al.azhar.io.taleb.market@gmail.com',
  gmailComposeUrl:
    'https://mail.google.com/mail/?view=cm&fs=1&to=Al.azhar.io.taleb.market@gmail.com',
} as const;

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback to execCommand below
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export function triggerBkashSendMoney(
  deepLinkAnchor: HTMLAnchorElement | null,
  fallbackAnchor: HTMLAnchorElement | null
): () => void {
  let appOpened = false;
  const handleVisibilityOrBlur = () => {
    if (document.visibilityState === 'hidden' || !document.hasFocus()) {
      appOpened = true;
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityOrBlur);
  window.addEventListener('blur', handleVisibilityOrBlur);

  deepLinkAnchor?.click();

  const timerId = window.setTimeout(() => {
    document.removeEventListener('visibilitychange', handleVisibilityOrBlur);
    window.removeEventListener('blur', handleVisibilityOrBlur);

    if (!appOpened && document.visibilityState === 'visible') {
      fallbackAnchor?.click();
    }
  }, 1200);

  return () => {
    window.clearTimeout(timerId);
    document.removeEventListener('visibilitychange', handleVisibilityOrBlur);
    window.removeEventListener('blur', handleVisibilityOrBlur);
  };
}
