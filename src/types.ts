import defaultLogoAsset from './assets/images/org_emblem_logo_1794550157950.jpg';
import homeBannerAsset from './assets/images/home_hero_banner_1794550158772.jpg';

export const ORG_NAME = 'আল আজহার ইসলামী সংস্থা';
export const ORG_TAGLINE = 'শিক্ষা, সেবা ও সামাজিক কল্যাণে নিবেদিত';
export const DRIVE_BACKUP_FOLDER_NAME = 'আল আজহার ইসলামী সংস্থা - Backup';
export const DEFAULT_LOGO_URL = defaultLogoAsset;
export const HOME_BANNER_URL = homeBannerAsset;

export type UserRole = 'admin' | 'user';

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export const MEMBER_DESIGNATIONS = [
  'সাধারণ সদস্য',
  'উপদেষ্টা',
  'কার্যকরী সদস্য',
] as const;
export type MemberDesignation = (typeof MEMBER_DESIGNATIONS)[number];

export const BENGALI_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
] as const;

export interface Member {
  id: string;
  memberCode: string;
  name: string;
  fatherName: string;
  designation: string;
  phone: string;
  address: string;
  bloodGroup: BloodGroup | '';
  photoUrl?: string;
  monthlyFee: number;
  joinDate: string;
  status: 'সক্রিয়' | 'নিষ্ক্রিয়';
  // Year -> Month Index (0..11) -> Amount paid
  eyanotPayments?: Record<string, Record<number, number>>;
}

export interface Advisor {
  id: string;
  name: string;
  title: string;
  institution: string;
  phone: string;
  joinDate: string;
  note?: string;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  category: string;
  description: string;
  amount: number;
  receiptNo: string;
}

export interface Notice {
  id: string;
  title: string;
  date: string;
  category: string;
  content: string;
  important?: boolean;
}

export type BackupFrequency = 'daily' | 'weekly' | 'monthly';

export interface AutoBackupSettings {
  autoOnMutation: boolean;
  scheduledEnabled: boolean;
  frequency: BackupFrequency;
  lastScheduledBackupAt: string | null;
}

export interface UploadedDriveFile {
  id: string;
  name: string;
  kind: 'members-pdf' | 'members-xlsx' | 'finance-pdf' | 'finance-xlsx' | 'full-json';
  webViewLink: string;
}

export type BackupTrigger = 'auto-save' | 'scheduled' | 'manual';

export interface BackupRecord {
  id: string;
  timestamp: string;
  formattedDateTime: string;
  trigger: BackupTrigger;
  triggerLabel: string;
  folderId: string;
  folderLink: string;
  files: UploadedDriveFile[];
  totalMembers: number;
  totalAdvisors: number;
  totalTransactions: number;
  accountEmail?: string;
}

export interface OrganizationData {
  organization: string;
  logoUrl?: string;
  members: Member[];
  advisors: Advisor[];
  transactions: Transaction[];
  notices: Notice[];
  backupSettings: AutoBackupSettings;
  backupHistory: BackupRecord[];
}
