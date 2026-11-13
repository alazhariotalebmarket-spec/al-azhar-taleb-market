import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.appdata',
];

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

function createDriveProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  SCOPES.forEach((scope) => provider.addScope(scope));
  provider.setCustomParameters({
    prompt: 'consent select_account',
  });
  return provider;
}

let isSigningIn = false;
// Access token is cached strictly in memory (never localStorage or sessionStorage).
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: (user: User | null) => void
) => {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        onAuthSuccess?.(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        onAuthFailure?.(user);
      }
    } else {
      cachedAccessToken = null;
      onAuthFailure?.(null);
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const provider = createDriveProvider();
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Google Drive অ্যাক্সেস টোকেন পাওয়া যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Drive sign-in error:', error);
    if (error?.code === 'auth/popup-closed-by-user') {
      throw new Error('Google লগইন উইন্ডো বন্ধ করা হয়েছে। সংযোগ সম্পন্ন করতে পুনরায় চেষ্টা করুন।');
    }
    if (error?.code === 'auth/popup-blocked') {
      throw new Error('ব্রাউজার পপ-আপ ব্লক করেছে। অনুগ্রহ করে পপ-আপ অনুমতি দিয়ে আবার চেষ্টা করুন।');
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const reconnectGoogleDrive = async (): Promise<{ user: User; accessToken: string }> => {
  isSigningIn = true;
  try {
    cachedAccessToken = null;
    await auth.signOut();
    const provider = createDriveProvider();
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Google Drive থেকে নতুন অ্যাক্সেস টোকেন পাওয়া যায়নি। অনুগ্রহ করে সব অনুমতি প্রদান করুন।');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Drive reconnect error:', error);
    if (error?.code === 'auth/popup-closed-by-user') {
      throw new Error('পুনরায় সংযোগের উইন্ডো বন্ধ করা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    }
    if (error?.code === 'auth/popup-blocked') {
      throw new Error('ব্রাউজার পপ-আপ ব্লক করেছে। অনুগ্রহ করে পপ-আপ অনুমতি দিয়ে আবার চেষ্টা করুন।');
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const clearCachedToken = (): void => {
  cachedAccessToken = null;
};

export const logoutGoogleDrive = async (): Promise<void> => {
  await auth.signOut();
  cachedAccessToken = null;
};
