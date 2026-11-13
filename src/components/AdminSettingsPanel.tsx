import React, { useRef, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  ImagePlus,
  KeyRound,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { ADMIN_EMAIL, changeAdminPassword } from '../services/adminAuth';
import { DEFAULT_LOGO_URL, ORG_NAME } from '../types';
import { OrgLogo } from './OrgLogo';

interface AdminSettingsPanelProps {
  logoUrl?: string;
  onUpdateLogo: (nextLogoUrl: string | undefined) => void;
}

function prepareHdLogoDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('ছবি পড়া যায়নি।'));
    reader.onload = () => {
      const originalDataUrl = String(reader.result);
      const img = new Image();
      img.onerror = () => reject(new Error('বৈধ JPG বা PNG ছবি নির্বাচন করুন।'));
      img.onload = () => {
        const maxDimension = 600;
        const longestSide = Math.max(img.width, img.height);
        // Never upscale smaller logos; keep crisp original resolution if already <= 600px and reasonably sized
        if (longestSide <= maxDimension && file.size <= 450 * 1024) {
          resolve(originalDataUrl);
          return;
        }
        const scale = Math.min(maxDimension / img.width, maxDimension / img.height, 1);
        const targetWidth = Math.max(1, Math.round(img.width * scale));
        const targetHeight = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(originalDataUrl);
          return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.clearRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        const outputMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        resolve(canvas.toDataURL(outputMime, 0.95));
      };
      img.src = originalDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export const AdminSettingsPanel: React.FC<AdminSettingsPanelProps> = ({
  logoUrl,
  onUpdateLogo,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [logoStatus, setLogoStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);

  const activeLogoSrc = logoUrl || DEFAULT_LOGO_URL;

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setLogoStatus({
        ok: false,
        message: 'শুধুমাত্র JPG অথবা PNG ফরম্যাটের লোগো ছবি আপলোড করা যাবে।',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setLogoStatus({
        ok: false,
        message: 'ছবির আকার ৫ মেগাবাইটের কম হতে হবে।',
      });
      return;
    }

    setIsUploadingLogo(true);
    try {
      const processedDataUrl = await prepareHdLogoDataUrl(file);
      onUpdateLogo(processedDataUrl);
      setLogoStatus({
        ok: true,
        message: 'নতুন লোগো সফলভাবে আপলোড হয়েছে এবং পুরনো লোগো মুছে ফেলা হয়েছে।',
      });
    } catch (err) {
      setLogoStatus({
        ok: false,
        message: err instanceof Error ? err.message : 'লোগো আপলোড করতে সমস্যা হয়েছে।',
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleResetLogo = () => {
    onUpdateLogo(undefined);
    setLogoStatus({
      ok: true,
      message: 'ডিফল্ট লোগো পুনরায় সেট করা হয়েছে।',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = changeAdminPassword(oldPassword, newPassword, confirmPassword);
    setStatus(result);
    if (result.ok) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900">সেটিংস (Settings)</h2>
        <p className="mt-1 text-sm text-slate-600">
          {ORG_NAME} অ্যাডমিন অ্যাকাউন্ট, লোগো ও নিরাপত্তা সেটিংস পরিচালনা করুন।
        </p>
      </div>

      {/* Change Organization Logo Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
          <ImagePlus className="h-5 w-5 text-emerald-800" />
          <div>
            <h3 className="text-base font-semibold text-slate-900">লোগো পরিবর্তন করুন</h3>
            <p className="text-xs text-slate-500">
              নতুন JPG বা PNG লোগো আপলোড করলে তা গোল (Round) আকারে ড্যাশবোর্ড, হোম পেজ ও সদস্য কার্ডে দেখাবে এবং পুরনো লোগো অটো মুছে যাবে।
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <OrgLogo src={activeLogoSrc} alt={ORG_NAME} variant="standard" />
            <div className="text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-900">বর্তমান গোল লোগো</p>
              <p>{logoUrl ? 'কাস্টম আপলোডকৃত লোগো সক্রিয়' : 'ডিফল্ট সংস্থার লোগো সক্রিয়'}</p>
              <p className="text-slate-500">সমর্থিত ফরম্যাট: JPG, PNG (সর্বোচ্চ ৫ MB)</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:ml-auto">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,.jpg,.jpeg,.png"
              onChange={handleLogoFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingLogo}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-900 disabled:opacity-60 whitespace-nowrap"
            >
              <ImagePlus className="h-4 w-4" />
              {isUploadingLogo ? 'আপলোড হচ্ছে...' : 'নতুন লোগো আপলোড করুন'}
            </button>

            {logoUrl && (
              <button
                type="button"
                onClick={handleResetLogo}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                ডিফল্ট লোগো
              </button>
            )}
          </div>
        </div>

        {logoStatus && (
          <div
            className={`mt-4 flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm ${
              logoStatus.ok
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {logoStatus.ok && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />}
            <span className="font-medium">{logoStatus.message}</span>
          </div>
        )}
      </div>

      {/* Admin Account Info */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-emerald-800">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">অ্যাডমিন অ্যাকাউন্ট তথ্য</h3>
            <p className="mt-1 text-sm text-slate-600">
              নির্ধারিত অ্যাডমিন ইমেইল:{' '}
              <span className="font-mono-num font-semibold text-slate-900">{ADMIN_EMAIL}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <KeyRound className="h-5 w-5 text-emerald-800" />
            <h3 className="text-base font-semibold text-slate-900">পাসওয়ার্ড পরিবর্তন করুন</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowPasswords((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            {showPasswords ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showPasswords ? 'লুকান' : 'পাসওয়ার্ড দেখুন'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 max-w-md">
          <div>
            <label htmlFor="old-password" className="block text-sm font-medium text-slate-700">
              পুরানো পাসওয়ার্ড (Old Password)
            </label>
            <input
              id="old-password"
              type={showPasswords ? 'text' : 'password'}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="বর্তমান পাসওয়ার্ড লিখুন"
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
              autoComplete="current-password"
            />
          </div>

          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-slate-700">
              নতুন পাসওয়ার্ড (New Password)
            </label>
            <input
              id="new-password"
              type={showPasswords ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="কমপক্ষে ৬ অক্ষরের নতুন পাসওয়ার্ড"
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700">
              নতুন পাসওয়ার্ড নিশ্চিত করুন (Confirm New Password)
            </label>
            <input
              id="confirm-password"
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="নতুন পাসওয়ার্ড আবার লিখুন"
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
              autoComplete="new-password"
            />
          </div>

          {status && (
            <div
              className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm ${
                status.ok
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {status.ok && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />}
              <span className="font-medium">{status.message}</span>
            </div>
          )}

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-900 whitespace-nowrap"
          >
            <KeyRound className="h-4 w-4" />
            পাসওয়ার্ড পরিবর্তন করুন
          </button>
        </form>
      </div>
    </div>
  );
};
