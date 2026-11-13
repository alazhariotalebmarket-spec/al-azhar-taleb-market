import { BloodGroup, Member, ORG_NAME, OrganizationData } from '../types';

const STORAGE_KEY = 'al_azhar_islami_sangstha_data_v1';

export const DEFAULT_ORGANIZATION_DATA: OrganizationData = {
  organization: ORG_NAME,
  members: [
    {
      id: 'm-1',
      memberCode: 'AAIS-001',
      name: 'মাওলানা আব্দুল্লাহ আল মামুন',
      fatherName: 'মরহুম হাজী আব্দুর রহমান',
      designation: 'কার্যকরী সদস্য',
      phone: '01711234567',
      address: 'মিরপুর-১০, ঢাকা',
      bloodGroup: 'O+',
      monthlyFee: 1000,
      joinDate: '2023-01-15',
      status: 'সক্রিয়',
      eyanotPayments: {
        '2026': { 0: 1000, 1: 1000, 2: 1000, 3: 1000, 4: 1000, 5: 1000, 6: 1000, 7: 1000, 8: 1000, 9: 1000, 10: 1000 },
      },
    },
    {
      id: 'm-2',
      memberCode: 'AAIS-002',
      name: 'মুহাম্মদ রফিকুল ইসলাম',
      fatherName: 'মোঃ সিরাজুল ইসলাম',
      designation: 'কার্যকরী সদস্য',
      phone: '01812345678',
      address: 'উত্তরা সেক্টর-৭, ঢাকা',
      bloodGroup: 'A+',
      monthlyFee: 1000,
      joinDate: '2023-01-20',
      status: 'সক্রিয়',
      eyanotPayments: {
        '2026': { 0: 1000, 1: 1000, 2: 1000, 3: 1000, 4: 1000, 5: 1000, 6: 1000, 7: 1000, 8: 1000, 9: 1000, 10: 1000 },
      },
    },
    {
      id: 'm-3',
      memberCode: 'AAIS-003',
      name: 'হাফেজ সাইফুল্লাহ বিন করিম',
      fatherName: 'মাওলানা আব্দুল করিম',
      designation: 'উপদেষ্টা',
      phone: '01913456789',
      address: 'ধানমন্ডি, ঢাকা',
      bloodGroup: 'B+',
      monthlyFee: 800,
      joinDate: '2023-02-05',
      status: 'সক্রিয়',
      eyanotPayments: {
        '2026': { 0: 800, 1: 800, 2: 800, 3: 800, 4: 800, 5: 800, 6: 800, 7: 800, 8: 800, 9: 800, 10: 800 },
      },
    },
    {
      id: 'm-4',
      memberCode: 'AAIS-004',
      name: 'মোঃ তানভীর আহমেদ',
      fatherName: 'মোঃ নুরুল হক',
      designation: 'সাধারণ সদস্য',
      phone: '01614567890',
      address: 'বাড্ডা, ঢাকা',
      bloodGroup: 'AB+',
      monthlyFee: 500,
      joinDate: '2023-04-12',
      status: 'সক্রিয়',
      eyanotPayments: {
        '2026': { 0: 500, 1: 500, 2: 500, 3: 500, 4: 500, 5: 500, 6: 500, 7: 500, 8: 500, 9: 500 },
      },
    },
    {
      id: 'm-5',
      memberCode: 'AAIS-005',
      name: 'মোঃ জাহিদুল হাসান',
      fatherName: 'মোঃ মতিউর রহমান',
      designation: 'সাধারণ সদস্য',
      phone: '01715678901',
      address: 'মোহাম্মদপুর, ঢাকা',
      bloodGroup: 'O-',
      monthlyFee: 500,
      joinDate: '2026-09-10',
      status: 'সক্রিয়',
      eyanotPayments: {
        '2026': { 8: 500, 9: 500 },
      },
    },
    {
      id: 'm-6',
      memberCode: 'AAIS-006',
      name: 'ডা. কামরুল হাসান',
      fatherName: 'আলহাজ্ব ফজলুল হক',
      designation: 'কার্যকরী সদস্য',
      phone: '01516789012',
      address: 'বনানী, ঢাকা',
      bloodGroup: 'A-',
      monthlyFee: 1500,
      joinDate: '2026-10-18',
      status: 'সক্রিয়',
      eyanotPayments: {
        '2026': { 9: 1500, 10: 1500 },
      },
    },
  ],
  advisors: [
    {
      id: 'a-1',
      name: 'শায়খ অধ্যাপক ড. মুহাম্মদ নূরুল আমিন',
      title: 'প্রধান উপদেষ্টা',
      institution: 'ইসলামিক স্টাডিজ বিভাগ, ঢাকা বিশ্ববিদ্যালয়',
      phone: '01711900101',
      joinDate: '2023-01-01',
      note: 'সংগঠনের দাওয়াহ ও শিক্ষা কার্যক্রম তত্ত্বাবধান',
    },
    {
      id: 'a-2',
      name: 'আলহাজ্ব শামসুল হক চৌধুরী',
      title: 'সিনিয়র উপদেষ্টা',
      institution: 'সমাজসেবা ও ত্রাণ তহবিল ট্রাস্ট',
      phone: '01819800202',
      joinDate: '2023-01-10',
      note: 'আর্থিক স্বচ্ছতা ও মানবিক সহায়তা পরামর্শদাতা',
    },
    {
      id: 'a-3',
      name: 'মুফতি জাকারিয়া হোসাইন',
      title: 'শরিয়াহ উপদেষ্টা',
      institution: 'মারকাযুল ফিকহ আল-ইসলামী',
      phone: '01911700303',
      joinDate: '2023-03-01',
      note: 'যাকাত ও সাদাকাহ তহবিল ব্যবস্থাপনা দিকনির্দেশনা',
    },
  ],
  transactions: [
    {
      id: 'eyanot-m-1-2026-10',
      date: '2026-11-01',
      type: 'income',
      category: 'মাসিক এয়ানত',
      description: 'মাওলানা আব্দুল্লাহ আল মামুন — নভেম্বর 2026 এর মাসিক এয়ানত',
      amount: 1000,
      receiptNo: 'EYN-202611-001',
    },
    {
      id: 'eyanot-m-2-2026-10',
      date: '2026-11-01',
      type: 'income',
      category: 'মাসিক এয়ানত',
      description: 'মুহাম্মদ রফিকুল ইসলাম — নভেম্বর 2026 এর মাসিক এয়ানত',
      amount: 1000,
      receiptNo: 'EYN-202611-002',
    },
    {
      id: 'eyanot-m-3-2026-10',
      date: '2026-11-01',
      type: 'income',
      category: 'মাসিক এয়ানত',
      description: 'হাফেজ সাইফুল্লাহ বিন করিম — নভেম্বর 2026 এর মাসিক এয়ানত',
      amount: 800,
      receiptNo: 'EYN-202611-003',
    },
    {
      id: 'eyanot-m-6-2026-10',
      date: '2026-11-02',
      type: 'income',
      category: 'মাসিক এয়ানত',
      description: 'ডা. কামরুল হাসান — নভেম্বর 2026 এর মাসিক এয়ানত',
      amount: 1500,
      receiptNo: 'EYN-202611-006',
    },
    {
      id: 't-2',
      date: '2026-11-03',
      type: 'income',
      category: 'সাদাকাহ ও অনুদান',
      description: 'শীতবস্ত্র ও এতিম সহায়তা তহবিলে শুভানুধ্যায়ী অনুদান',
      amount: 45000,
      receiptNo: 'REC-2611-02',
    },
    {
      id: 't-3',
      date: '2026-11-05',
      type: 'expense',
      category: 'এতিম ও শিক্ষা বৃত্তি',
      description: 'মাদরাসা ও স্কুলগামী ১৫ জন শিক্ষার্থীর মাসিক বৃত্তি প্রদান',
      amount: 22500,
      receiptNo: 'VCH-2611-01',
    },
    {
      id: 't-4',
      date: '2026-11-08',
      type: 'expense',
      category: 'মানবিক সহায়তা',
      description: 'অসহায় পরিবারের মাঝে খাদ্য সামগ্রী বিতরণ কর্মসূচি',
      amount: 18000,
      receiptNo: 'VCH-2611-02',
    },
    {
      id: 't-5',
      date: '2026-11-10',
      type: 'income',
      category: 'যাকাত তহবিল',
      description: 'বিশেষ যাকাত তহবিল সংগ্রহ (১ম কিস্তি)',
      amount: 60000,
      receiptNo: 'REC-2611-03',
    },
    {
      id: 't-6',
      date: '2026-11-11',
      type: 'expense',
      category: 'অফিস ও দাওয়াহ কার্যক্রম',
      description: 'ইসলামিক সেমিনার, বই মুদ্রণ ও অফিস ব্যবস্থাপনা ব্যয়',
      amount: 9500,
      receiptNo: 'VCH-2611-03',
    },
  ],
  notices: [
    {
      id: 'n-1',
      title: 'শীতবস্ত্র বিতরণ ও এতিম সহায়তা কর্মসূচি ২০২৬',
      date: '2026-11-10',
      category: 'জরুরি বিজ্ঞপ্তি',
      content:
        'আগামী ২৫ নভেম্বর ২০২৬ তারিখে আল আজহার ইসলামী সংস্থার উদ্যোগে দুস্থ ও অসহায় পরিবারের মাঝে শীতবস্ত্র এবং এতিম শিক্ষার্থীদের মাঝে শিক্ষা উপকরণ বিতরণ করা হবে। সকল সদস্যকে যথাসময়ে উপস্থিত থাকার অনুরোধ করা হলো।',
      important: true,
    },
    {
      id: 'n-2',
      title: 'মাসিক সাধারণ সভা ও আর্থিক প্রতিবেদন পর্যালোচনা',
      date: '2026-11-05',
      category: 'কার্যনির্বাহী সভা',
      content:
        'নভেম্বর মাসের সাধারণ সভা আগামী শুক্রবার বাদ আসর সংস্থার প্রধান কার্যালয়ে অনুষ্ঠিত হবে। সভায় চলতি মাসের আয়-ব্যয় বিবরণী উপস্থাপন করা হবে।',
      important: false,
    },
    {
      id: 'n-3',
      title: 'নভেম্বর মাসের নিয়মিত মাসিক এয়ানত পরিশোধ সংক্রান্ত',
      date: '2026-11-01',
      category: 'আর্থিক বিজ্ঞপ্তি',
      content:
        'সম্মানিত সকল সদস্যকে চলতি মাসের নির্ধারিত এয়ানত আগামী ১৫ তারিখের মধ্যে কোষাধ্যক্ষের নিকট জমা দেওয়ার জন্য বিনীত অনুরোধ জানানো হচ্ছে।',
      important: false,
    },
  ],
  backupSettings: {
    autoOnMutation: true,
    scheduledEnabled: true,
    frequency: 'daily',
    lastScheduledBackupAt: null,
  },
  backupHistory: [],
};

export function loadOrganizationData(): OrganizationData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ORGANIZATION_DATA;
    const parsed = JSON.parse(raw) as Partial<OrganizationData>;
    const normalizedMembers: Member[] = Array.isArray(parsed.members)
      ? parsed.members.map((m) => ({
          ...m,
          fatherName: m.fatherName || '',
          bloodGroup: (m.bloodGroup as BloodGroup | '') || '',
          eyanotPayments: m.eyanotPayments || {},
        }))
      : DEFAULT_ORGANIZATION_DATA.members;

    return {
      organization: ORG_NAME,
      logoUrl:
        typeof parsed.logoUrl === 'string' && parsed.logoUrl.startsWith('data:image/')
          ? parsed.logoUrl
          : undefined,
      members: normalizedMembers,
      advisors: Array.isArray(parsed.advisors) ? parsed.advisors : DEFAULT_ORGANIZATION_DATA.advisors,
      transactions: Array.isArray(parsed.transactions)
        ? parsed.transactions
        : DEFAULT_ORGANIZATION_DATA.transactions,
      notices: Array.isArray(parsed.notices) ? parsed.notices : DEFAULT_ORGANIZATION_DATA.notices,
      backupSettings: parsed.backupSettings
        ? { ...DEFAULT_ORGANIZATION_DATA.backupSettings, ...parsed.backupSettings }
        : DEFAULT_ORGANIZATION_DATA.backupSettings,
      backupHistory: Array.isArray(parsed.backupHistory) ? parsed.backupHistory : [],
    };
  } catch {
    return DEFAULT_ORGANIZATION_DATA;
  }
}

export function saveOrganizationData(data: OrganizationData): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...data,
        organization: ORG_NAME,
      })
    );
  } catch (err) {
    console.error('Failed to persist organization data:', err);
  }
}
