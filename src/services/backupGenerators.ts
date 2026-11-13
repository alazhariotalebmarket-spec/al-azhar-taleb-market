import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { Member, ORG_NAME, OrganizationData, Transaction } from '../types';

export interface GeneratedBackupBundle {
  timestampSlug: string;
  formattedDateTime: string;
  membersPdf: { name: string; mimeType: string; blob: Blob };
  membersExcel: { name: string; mimeType: string; blob: Blob };
  financePdf: { name: string; mimeType: string; blob: Blob };
  financeExcel: { name: string; mimeType: string; blob: Blob };
  fullJson: { name: string; mimeType: string; blob: Blob };
}

export function formatDateTimeBn(date: Date): string {
  return new Intl.DateTimeFormat('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
}

export function formatTimestampSlug(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}`;
}

function formatTaka(amount: number): string {
  return `৳ ${amount.toLocaleString('en-US')}`;
}

interface TableColumn {
  header: string;
  width: number;
  align?: 'left' | 'right';
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  align: 'left' | 'right' = 'left'
): void {
  let output = text || '-';
  while (ctx.measureText(output).width > maxWidth && output.length > 3) {
    output = output.slice(0, -1);
  }
  if (output !== (text || '-') && output.length > 3) {
    output = output.slice(0, -2) + '…';
  }
  ctx.textAlign = align;
  ctx.fillText(output, align === 'right' ? x + maxWidth : x, y);
  ctx.textAlign = 'left';
}

function renderReportToPdfBlob(options: {
  title: string;
  subtitle: string;
  generatedAt: string;
  summaryItems: { label: string; value: string; accent?: string }[];
  columns: TableColumn[];
  rows: string[][];
}): Blob {
  // A4 at ~150 DPI for crisp Unicode Bengali rendering
  const pageWidth = 1240;
  const pageHeight = 1754;
  const marginX = 64;
  const contentWidth = pageWidth - marginX * 2;
  const rowHeight = 52;
  const headerHeight = 50;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const totalRows = options.rows.length;
  const firstPageStartY = 390;
  const nextPageStartY = 170;
  const footerReservedY = pageHeight - 90;

  const firstPageMaxRows = Math.max(1, Math.floor((footerReservedY - firstPageStartY - headerHeight) / rowHeight));
  const nextPageMaxRows = Math.max(1, Math.floor((footerReservedY - nextPageStartY - headerHeight) / rowHeight));

  const chunks: string[][][] = [];
  if (totalRows === 0) {
    chunks.push([]);
  } else {
    chunks.push(options.rows.slice(0, firstPageMaxRows));
    let offset = firstPageMaxRows;
    while (offset < totalRows) {
      chunks.push(options.rows.slice(offset, offset + nextPageMaxRows));
      offset += nextPageMaxRows;
    }
  }

  const totalPages = chunks.length;

  chunks.forEach((pageRows, pageIndex) => {
    const canvas = document.createElement('canvas');
    canvas.width = pageWidth;
    canvas.height = pageHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // White A4 background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pageWidth, pageHeight);

    // Top emerald institutional bar
    ctx.fillStyle = '#065f46';
    ctx.fillRect(0, 0, pageWidth, 16);

    if (pageIndex === 0) {
      // Header band
      ctx.fillStyle = '#065f46';
      ctx.font = '700 38px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
      ctx.fillText(ORG_NAME, marginX, 90);

      ctx.fillStyle = '#0f172a';
      ctx.font = '600 26px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
      ctx.fillText(options.title, marginX, 138);

      ctx.fillStyle = '#475569';
      ctx.font = '400 19px "Noto Sans Bengali", sans-serif';
      ctx.fillText(`${options.subtitle}  ·  তৈরির সময়: ${options.generatedAt}`, marginX, 174);

      // Hairline divider
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(marginX, 200);
      ctx.lineTo(pageWidth - marginX, 200);
      ctx.stroke();

      // Summary grid
      const summaryCount = options.summaryItems.length;
      if (summaryCount > 0) {
        const boxGap = 20;
        const boxW = (contentWidth - boxGap * (summaryCount - 1)) / summaryCount;
        options.summaryItems.forEach((item, idx) => {
          const bx = marginX + idx * (boxW + boxGap);
          const by = 224;
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1.5;
          ctx.fillRect(bx, by, boxW, 118);
          ctx.strokeRect(bx, by, boxW, 118);

          ctx.fillStyle = '#475569';
          ctx.font = '500 18px "Noto Sans Bengali", sans-serif';
          ctx.fillText(item.label, bx + 20, by + 42);

          ctx.fillStyle = item.accent || '#0f172a';
          ctx.font = '700 28px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
          ctx.fillText(item.value, bx + 20, by + 90);
        });
      }
    } else {
      ctx.fillStyle = '#065f46';
      ctx.font = '700 24px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
      ctx.fillText(`${ORG_NAME} — ${options.title}`, marginX, 82);

      ctx.fillStyle = '#64748b';
      ctx.font = '400 17px "Noto Sans Bengali", sans-serif';
      ctx.fillText(`পৃষ্ঠা ${pageIndex + 1} / ${totalPages}`, marginX, 115);

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(marginX, 134);
      ctx.lineTo(pageWidth - marginX, 134);
      ctx.stroke();
    }

    const tableY = pageIndex === 0 ? firstPageStartY : nextPageStartY;

    // Table header
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(marginX, tableY, contentWidth, headerHeight);

    ctx.fillStyle = '#ffffff';
    ctx.font = '600 18px "Noto Sans Bengali", sans-serif';
    let colX = marginX + 14;
    options.columns.forEach((col) => {
      drawWrappedText(ctx, col.header, colX, tableY + 32, col.width - 20, col.align || 'left');
      colX += col.width;
    });

    // Table rows
    if (pageRows.length === 0) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(marginX, tableY + headerHeight, contentWidth, 80);
      ctx.strokeStyle = '#e2e8f0';
      ctx.strokeRect(marginX, tableY + headerHeight, contentWidth, 80);
      ctx.fillStyle = '#64748b';
      ctx.font = '400 19px "Noto Sans Bengali", sans-serif';
      ctx.fillText('কোনো তথ্য পাওয়া যায়নি।', marginX + 20, tableY + headerHeight + 48);
    } else {
      pageRows.forEach((row, rIdx) => {
        const ry = tableY + headerHeight + rIdx * rowHeight;
        ctx.fillStyle = rIdx % 2 === 0 ? '#ffffff' : '#f8fafc';
        ctx.fillRect(marginX, ry, contentWidth, rowHeight);

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(marginX, ry + rowHeight);
        ctx.lineTo(marginX + contentWidth, ry + rowHeight);
        ctx.stroke();

        ctx.fillStyle = '#1e293b';
        ctx.font = '400 18px "Noto Sans Bengali", sans-serif';

        let cellX = marginX + 14;
        options.columns.forEach((col, cIdx) => {
          drawWrappedText(ctx, row[cIdx] ?? '-', cellX, ry + 33, col.width - 20, col.align || 'left');
          cellX += col.width;
        });
      });

      // Outer border for table
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(marginX, tableY, contentWidth, headerHeight + pageRows.length * rowHeight);
    }

    // Footer
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(marginX, pageHeight - 72);
    ctx.lineTo(pageWidth - marginX, pageHeight - 72);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '400 16px "Noto Sans Bengali", sans-serif';
    ctx.fillText(`${ORG_NAME} · Google Drive অটো ব্যাকআপ রিপোর্ট`, marginX, pageHeight - 40);
    ctx.textAlign = 'right';
    ctx.fillText(`পৃষ্ঠা ${pageIndex + 1} / ${totalPages}`, pageWidth - marginX, pageHeight - 40);
    ctx.textAlign = 'left';

    const imgData = canvas.toDataURL('image/jpeg', 0.94);
    if (pageIndex > 0) {
      doc.addPage();
    }
    doc.addImage(imgData, 'JPEG', 0, 0, 210, 297);
  });

  return doc.output('blob');
}

function generateMembersExcelBlob(members: Member[], generatedAt: string): Blob {
  const wb = XLSX.utils.book_new();
  const rows = members.map((m, idx) => ({
    'ক্রমিক': idx + 1,
    'সদস্য আইডি': m.memberCode,
    'নাম': m.name,
    'পিতার নাম': m.fatherName || '-',
    'পদবি': m.designation,
    'ব্লাড গ্রুপ': m.bloodGroup || '-',
    'মোবাইল': m.phone,
    'ঠিকানা': m.address,
    'মাসিক এয়ানত (৳)': m.monthlyFee,
    'যোগদানের তারিখ': m.joinDate,
    'অবস্থা': m.status,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 8 },
    { wch: 14 },
    { wch: 28 },
    { wch: 24 },
    { wch: 18 },
    { wch: 12 },
    { wch: 16 },
    { wch: 26 },
    { wch: 16 },
    { wch: 15 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'সদস্য তালিকা');

  const metaSheet = XLSX.utils.json_to_sheet([
    { 'তথ্য': 'সংগঠনের নাম', 'বিবরণ': ORG_NAME },
    { 'তথ্য': 'মোট সদস্য', 'বিবরণ': members.length },
    { 'তথ্য': 'সক্রিয় সদস্য', 'বিবরণ': members.filter((m) => m.status === 'সক্রিয়').length },
    { 'তথ্য': 'মোট মাসিক চাঁদা প্রত্যাশিত (৳)', 'বিবরণ': members.reduce((s, m) => s + m.monthlyFee, 0) },
    { 'তথ্য': 'ব্যাকআপ তৈরির সময়', 'বিবরণ': generatedAt },
  ]);
  metaSheet['!cols'] = [{ wch: 28 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, metaSheet, 'সারসংক্ষেপ');

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

function generateFinanceExcelBlob(transactions: Transaction[], generatedAt: string): Blob {
  const wb = XLSX.utils.book_new();
  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

  const totalIncome = sorted
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = sorted
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const rows = sorted.map((t, idx) => ({
    'ক্রমিক': idx + 1,
    'তারিখ': t.date,
    'রসিদ/ভাউচার নং': t.receiptNo,
    'ধরন': t.type === 'income' ? 'আয়' : 'ব্যয়',
    'খাত': t.category,
    'বিবরণ': t.description,
    'আয় (৳)': t.type === 'income' ? t.amount : 0,
    'ব্যয় (৳)': t.type === 'expense' ? t.amount : 0,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 8 },
    { wch: 14 },
    { wch: 16 },
    { wch: 10 },
    { wch: 24 },
    { wch: 38 },
    { wch: 14 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'আয়-ব্যয় হিসাব');

  const summarySheet = XLSX.utils.json_to_sheet([
    { 'বিবরণ': 'সংগঠনের নাম', 'মান': ORG_NAME },
    { 'বিবরণ': 'মোট আয় (৳)', 'মান': totalIncome },
    { 'বিবরণ': 'মোট ব্যয় (৳)', 'মান': totalExpense },
    { 'বিবরণ': 'বর্তমান স্থিতি (৳)', 'মান': totalIncome - totalExpense },
    { 'বিবরণ': 'মোট লেনদেন সংখ্যা', 'মান': sorted.length },
    { 'বিবরণ': 'তৈরির সময়', 'মান': generatedAt },
  ]);
  summarySheet['!cols'] = [{ wch: 28 }, { wch: 36 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'আর্থিক সারসংক্ষেপ');

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function generateBackupBundle(data: OrganizationData): GeneratedBackupBundle {
  const now = new Date();
  const timestampSlug = formatTimestampSlug(now);
  const formattedDateTime = formatDateTimeBn(now);

  const activeMembers = data.members.filter((m) => m.status === 'সক্রিয়').length;
  const totalMonthlyFee = data.members.reduce((sum, m) => sum + m.monthlyFee, 0);

  const membersPdfBlob = renderReportToPdfBlob({
    title: 'সদস্যদের পূর্ণাঙ্গ তালিকা (Members List)',
    subtitle: `মোট সদস্য: ${data.members.length} জন`,
    generatedAt: formattedDateTime,
    summaryItems: [
      { label: 'মোট সদস্য সংখ্যা', value: `${data.members.length} জন`, accent: '#0f172a' },
      { label: 'সক্রিয় সদস্য', value: `${activeMembers} জন`, accent: '#047857' },
      { label: 'মাসিক এয়ানত প্রত্যাশিত', value: formatTaka(totalMonthlyFee), accent: '#0f172a' },
    ],
    columns: [
      { header: 'আইডি', width: 125 },
      { header: 'নাম', width: 235 },
      { header: 'পিতার নাম', width: 215 },
      { header: 'পদবি ও রক্ত', width: 195 },
      { header: 'মোবাইল', width: 165 },
      { header: 'এয়ানত', width: 177, align: 'right' },
    ],
    rows: data.members.map((m) => [
      m.memberCode,
      m.name,
      m.fatherName || '-',
      `${m.designation}${m.bloodGroup ? ` (${m.bloodGroup})` : ''}`,
      m.phone,
      formatTaka(m.monthlyFee),
    ]),
  });

  const membersExcelBlob = generateMembersExcelBlob(data.members, formattedDateTime);

  const sortedTx = [...data.transactions].sort((a, b) => b.date.localeCompare(a.date));
  const totalIncome = sortedTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = sortedTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const financePdfBlob = renderReportToPdfBlob({
    title: 'আয়-ব্যয়ের পূর্ণাঙ্গ হিসাব (Income & Expense)',
    subtitle: `মোট লেনদেন: ${sortedTx.length} টি`,
    generatedAt: formattedDateTime,
    summaryItems: [
      { label: 'মোট আয়', value: formatTaka(totalIncome), accent: '#047857' },
      { label: 'মোট ব্যয়', value: formatTaka(totalExpense), accent: '#b91c1c' },
      { label: 'বর্তমান স্থিতি', value: formatTaka(netBalance), accent: '#0f172a' },
    ],
    columns: [
      { header: 'তারিখ', width: 145 },
      { header: 'রসিদ নং', width: 165 },
      { header: 'ধরন', width: 100 },
      { header: 'খাত ও বিবরণ', width: 500 },
      { header: 'পরিমাণ', width: 202, align: 'right' },
    ],
    rows: sortedTx.map((t) => [
      t.date,
      t.receiptNo,
      t.type === 'income' ? 'আয়' : 'ব্যয়',
      `${t.category} — ${t.description}`,
      `${t.type === 'income' ? '+' : '-'} ${formatTaka(t.amount)}`,
    ]),
  });

  const financeExcelBlob = generateFinanceExcelBlob(data.transactions, formattedDateTime);

  const jsonPayload = {
    organization: ORG_NAME,
    exportedAt: now.toISOString(),
    exportedAtFormatted: formattedDateTime,
    summary: {
      totalMembers: data.members.length,
      totalAdvisors: data.advisors.length,
      totalTransactions: data.transactions.length,
      totalNotices: data.notices.length,
      totalIncome,
      totalExpense,
      netBalance,
    },
    members: data.members,
    advisors: data.advisors,
    transactions: data.transactions,
    notices: data.notices,
    backupSettings: data.backupSettings,
  };

  const fullJsonBlob = new Blob([JSON.stringify(jsonPayload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });

  return {
    timestampSlug,
    formattedDateTime,
    membersPdf: {
      name: `${ORG_NAME} - Members List (${timestampSlug}).pdf`,
      mimeType: 'application/pdf',
      blob: membersPdfBlob,
    },
    membersExcel: {
      name: `${ORG_NAME} - Members List (${timestampSlug}).xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      blob: membersExcelBlob,
    },
    financePdf: {
      name: `${ORG_NAME} - Income Expense (${timestampSlug}).pdf`,
      mimeType: 'application/pdf',
      blob: financePdfBlob,
    },
    financeExcel: {
      name: `${ORG_NAME} - Income Expense (${timestampSlug}).xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      blob: financeExcelBlob,
    },
    fullJson: {
      name: `${ORG_NAME} - Full Backup (${timestampSlug}).json`,
      mimeType: 'application/json',
      blob: fullJsonBlob,
    },
  };
}
