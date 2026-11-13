export const ADMIN_EMAIL = 'admin@alazhar.org';
const DEFAULT_ADMIN_PASSWORD = 'Ferdaush@1998';
const PASSWORD_STORAGE_KEY = 'al_azhar_admin_password_v2';

export function getAdminPassword(): string {
  try {
    const stored = localStorage.getItem(PASSWORD_STORAGE_KEY);
    if (stored && stored.length > 0) {
      return stored;
    }
  } catch {
    // Fallback to default if storage is unavailable
  }
  return DEFAULT_ADMIN_PASSWORD;
}

export function verifyAdminLogin(email: string, password: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail !== ADMIN_EMAIL) {
    return false;
  }
  return password === getAdminPassword();
}

export function changeAdminPassword(
  oldPassword: string,
  newPassword: string,
  confirmPassword: string
): { ok: boolean; message: string } {
  const currentPassword = getAdminPassword();

  if (!oldPassword) {
    return { ok: false, message: 'অনুগ্রহ করে পুরানো পাসওয়ার্ড লিখুন।' };
  }

  if (oldPassword !== currentPassword) {
    return { ok: false, message: 'পুরানো পাসওয়ার্ড সঠিক নয়।' };
  }

  if (!newPassword || newPassword.length < 6) {
    return {
      ok: false,
      message: 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।',
    };
  }

  if (newPassword !== confirmPassword) {
    return {
      ok: false,
      message: 'নতুন পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মেলেনি।',
    };
  }

  if (newPassword === currentPassword) {
    return {
      ok: false,
      message: 'নতুন পাসওয়ার্ড অবশ্যই পুরানো পাসওয়ার্ড থেকে ভিন্ন হতে হবে।',
    };
  }

  try {
    localStorage.setItem(PASSWORD_STORAGE_KEY, newPassword);
  } catch {
    return {
      ok: false,
      message: 'পাসওয়ার্ড সংরক্ষণ করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।',
    };
  }

  return { ok: true, message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে' };
}
