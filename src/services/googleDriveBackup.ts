import {
  BackupRecord,
  BackupTrigger,
  DRIVE_BACKUP_FOLDER_NAME,
  OrganizationData,
  UploadedDriveFile,
} from '../types';
import { generateBackupBundle } from './backupGenerators';
import { clearCachedToken } from './googleAuth';

const DRIVE_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_ENDPOINT = 'https://www.googleapis.com/upload/drive/v3/files';

export type DriveErrorCode =
  | 'AUTH_EXPIRED'
  | 'INSUFFICIENT_SCOPES'
  | 'API_DISABLED'
  | 'DRIVE_ERROR';

export class DriveApiError extends Error {
  code: DriveErrorCode;

  constructor(message: string, code: DriveErrorCode) {
    super(message);
    this.name = 'DriveApiError';
    this.code = code;
  }
}

async function parseDriveError(res: Response): Promise<DriveApiError> {
  let detail = '';
  let reason = '';
  try {
    const json = await res.json();
    detail = json?.error?.message || '';
    reason = json?.error?.errors?.[0]?.reason || '';
    const detailReason = json?.error?.details?.[0]?.reason || '';
    const combined = `${detail} ${reason} ${detailReason}`.toLowerCase();

    if (res.status === 401) {
      clearCachedToken();
      return new DriveApiError(
        'Google Drive সেশনের মেয়াদ শেষ হয়েছে। অনুগ্রহ করে "Drive পুনরায় কানেক্ট করুন" বাটনে ক্লিক করে আবার অনুমতি দিন।',
        'AUTH_EXPIRED'
      );
    }

    if (res.status === 403) {
      if (
        reason === 'accessNotConfigured' ||
        combined.includes('has not been used in project') ||
        combined.includes('is disabled')
      ) {
        return new DriveApiError(
          'আপনার Google Cloud প্রজেক্টে Google Drive API v3 চালু নেই। অনুগ্রহ করে Google Cloud Console থেকে Google Drive API Enable করুন।',
          'API_DISABLED'
        );
      }

      if (
        reason === 'insufficientPermissions' ||
        combined.includes('insufficient') ||
        combined.includes('scope') ||
        combined.includes('permission')
      ) {
        return new DriveApiError(
          'Google Drive-এ আপলোড করার প্রয়োজনীয় অনুমতি (Scope) পাওয়া যায়নি (ত্রুটি ৪০৩)। অনুগ্রহ করে "Drive পুনরায় কানেক্ট করুন" বাটনে ক্লিক করে সকল অনুমতি প্রদান করুন।',
          'INSUFFICIENT_SCOPES'
        );
      }

      return new DriveApiError(
        'Google Drive-এ অ্যাক্সেস অনুমতি পাওয়া যায়নি (ত্রুটি ৪০৩)। অনুগ্রহ করে "Drive পুনরায় কানেক্ট করুন" বাটনে ক্লিক করে পুনরায় চেষ্টা করুন।',
        'INSUFFICIENT_SCOPES'
      );
    }

    if (res.status === 404) {
      return new DriveApiError(
        'Google Drive-এ নির্ধারিত ফোল্ডার বা ফাইল খুঁজে পাওয়া যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।',
        'DRIVE_ERROR'
      );
    }

    if (res.status === 429) {
      return new DriveApiError(
        'Google Drive-এ অতিরিক্ত অনুরোধ পাঠানো হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
        'DRIVE_ERROR'
      );
    }
  } catch {
    detail = res.statusText;
  }

  if (res.status === 401) {
    clearCachedToken();
    return new DriveApiError(
      'Google Drive সেশনের মেয়াদ শেষ হয়েছে। অনুগ্রহ করে "Drive পুনরায় কানেক্ট করুন" বাটনে ক্লিক করুন।',
      'AUTH_EXPIRED'
    );
  }

  if (res.status === 403) {
    return new DriveApiError(
      'Google Drive-এ আপলোড করার অনুমতি নেই (ত্রুটি ৪০৩)। অনুগ্রহ করে "Drive পুনরায় কানেক্ট করুন" বাটনে ক্লিক করে পুনরায় অনুমতি দিন।',
      'INSUFFICIENT_SCOPES'
    );
  }

  return new DriveApiError(
    `Google Drive ব্যাকআপ আপলোড ব্যর্থ হয়েছে (ত্রুটি ${res.status})${detail ? `: ${detail}` : '। অনুগ্রহ করে পুনরায় চেষ্টা করুন।'}`,
    'DRIVE_ERROR'
  );
}

export async function findOrCreateBackupFolder(accessToken: string): Promise<{
  id: string;
  name: string;
  webViewLink: string;
}> {
  const escapedName = DRIVE_BACKUP_FOLDER_NAME.replace(/'/g, "\\'");
  const query = `name='${escapedName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const searchUrl = `${DRIVE_FILES_ENDPOINT}?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)&spaces=drive`;

  let searchRes: Response;
  try {
    searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    throw new DriveApiError(
      'ইন্টারনেট সংযোগ বা Google Drive সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। অনুগ্রহ করে নেটওয়ার্ক যাচাই করে আবার চেষ্টা করুন।',
      'DRIVE_ERROR'
    );
  }

  if (!searchRes.ok) {
    throw await parseDriveError(searchRes);
  }

  const searchJson = (await searchRes.json()) as {
    files?: { id: string; name: string; webViewLink?: string }[];
  };

  if (searchJson.files && searchJson.files.length > 0) {
    const existing = searchJson.files[0];
    return {
      id: existing.id,
      name: existing.name,
      webViewLink: existing.webViewLink || `https://drive.google.com/drive/folders/${existing.id}`,
    };
  }

  let createRes: Response;
  try {
    createRes = await fetch(`${DRIVE_FILES_ENDPOINT}?fields=id,name,webViewLink`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: DRIVE_BACKUP_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });
  } catch {
    throw new DriveApiError(
      'Google Drive ফোল্ডার তৈরি করার সময় নেটওয়ার্ক ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
      'DRIVE_ERROR'
    );
  }

  if (!createRes.ok) {
    throw await parseDriveError(createRes);
  }

  const created = (await createRes.json()) as {
    id: string;
    name: string;
    webViewLink?: string;
  };

  return {
    id: created.id,
    name: created.name,
    webViewLink: created.webViewLink || `https://drive.google.com/drive/folders/${created.id}`,
  };
}

async function uploadMultipartFile(
  accessToken: string,
  folderId: string,
  fileName: string,
  mimeType: string,
  blob: Blob
): Promise<{ id: string; name: string; webViewLink: string }> {
  const boundary = `al_azhar_backup_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const metadataPart = JSON.stringify({
    name: fileName,
    parents: [folderId],
  });

  const body = new Blob(
    [
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
      metadataPart,
      `\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
      blob,
      `\r\n--${boundary}--`,
    ],
    { type: `multipart/related; boundary=${boundary}` }
  );

  let res: Response;
  try {
    res = await fetch(`${DRIVE_UPLOAD_ENDPOINT}?uploadType=multipart&fields=id,name,webViewLink`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    });
  } catch {
    throw new DriveApiError(
      `ফাইল "${fileName}" আপলোডের সময় নেটওয়ার্ক সংযোগ বিচ্ছিন্ন হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।`,
      'DRIVE_ERROR'
    );
  }

  if (!res.ok) {
    throw await parseDriveError(res);
  }

  const data = (await res.json()) as { id: string; name: string; webViewLink?: string };
  return {
    id: data.id,
    name: data.name,
    webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
  };
}

const TRIGGER_LABELS: Record<BackupTrigger, string> = {
  'auto-save': 'স্বয়ংক্রিয় ব্যাকআপ (ডেটা পরিবর্তন)',
  scheduled: 'নির্ধারিত অটো ব্যাকআপ',
  manual: 'ম্যানুয়াল ব্যাকআপ',
};

export async function performFullDriveBackup(
  accessToken: string,
  data: OrganizationData,
  trigger: BackupTrigger,
  accountEmail?: string
): Promise<BackupRecord> {
  const folder = await findOrCreateBackupFolder(accessToken);
  const bundle = generateBackupBundle(data);

  const uploadSpecs: {
    kind: UploadedDriveFile['kind'];
    file: { name: string; mimeType: string; blob: Blob };
  }[] = [
    { kind: 'members-pdf', file: bundle.membersPdf },
    { kind: 'members-xlsx', file: bundle.membersExcel },
    { kind: 'finance-pdf', file: bundle.financePdf },
    { kind: 'finance-xlsx', file: bundle.financeExcel },
    { kind: 'full-json', file: bundle.fullJson },
  ];

  const uploadedFiles: UploadedDriveFile[] = [];
  for (const spec of uploadSpecs) {
    const uploaded = await uploadMultipartFile(
      accessToken,
      folder.id,
      spec.file.name,
      spec.file.mimeType,
      spec.file.blob
    );
    uploadedFiles.push({
      id: uploaded.id,
      name: uploaded.name,
      kind: spec.kind,
      webViewLink: uploaded.webViewLink,
    });
  }

  return {
    id: `bkp-${Date.now()}`,
    timestamp: new Date().toISOString(),
    formattedDateTime: bundle.formattedDateTime,
    trigger,
    triggerLabel: TRIGGER_LABELS[trigger],
    folderId: folder.id,
    folderLink: folder.webViewLink,
    files: uploadedFiles,
    totalMembers: data.members.length,
    totalAdvisors: data.advisors.length,
    totalTransactions: data.transactions.length,
    accountEmail,
  };
}
