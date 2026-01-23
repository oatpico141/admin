import * as XLSX from 'xlsx';
import { getContacts, getAllAdminStaff, bulkCreateContacts, getContactStats } from './db';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

const CHANNEL_MAP: Record<string, "facebook" | "line" | "instagram" | "tiktok"> = {
  'facebook': 'facebook',
  'fb': 'facebook',
  'เฟสบุ๊ค': 'facebook',
  'เฟซบุ๊ก': 'facebook',
  'line': 'line',
  'ไลน์': 'line',
  'instagram': 'instagram',
  'ig': 'instagram',
  'อินสตาแกรม': 'instagram',
  'tiktok': 'tiktok',
  'ติ๊กต๊อก': 'tiktok'
};

const BRANCH_MAP: Record<string, "lamlukka" | "salaya"> = {
  'ลำลูกกา': 'lamlukka',
  'lamlukka': 'lamlukka',
  'ศาลายา': 'salaya',
  'salaya': 'salaya'
};

const STATUS_MAP: Record<string, "appointed" | "not_appointed"> = {
  'นัดได้': 'appointed',
  'ได้': 'appointed',
  'appointed': 'appointed',
  'yes': 'appointed',
  'นัดไม่ได้': 'not_appointed',
  'ไม่ได้': 'not_appointed',
  'not_appointed': 'not_appointed',
  'no': 'not_appointed'
};

const CUSTOMER_TYPE_MAP: Record<string, "new" | "existing"> = {
  'ใหม่': 'new',
  'ลูกค้าใหม่': 'new',
  'new': 'new',
  'เก่า': 'existing',
  'ลูกค้าเก่า': 'existing',
  'existing': 'existing',
  'old': 'existing'
};

const CHANNEL_NAMES: Record<string, string> = {
  facebook: "Facebook",
  line: "Line",
  instagram: "Instagram",
  tiktok: "TikTok"
};

const BRANCH_NAMES: Record<string, string> = {
  lamlukka: "ลำลูกกา",
  salaya: "ศาลายา"
};

function parseThaiDate(dateStr: string): string | null {
  if (!dateStr) return null;
  
  // Try to parse various date formats
  try {
    // If it's already a Date object from Excel
    if (dateStr && typeof dateStr === 'object' && 'getTime' in dateStr) {
      return format(dateStr as Date, 'yyyy-MM-dd');
    }
    
    // Handle Thai Buddhist year (e.g., 1/2/2569)
    const thaiDateMatch = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (thaiDateMatch) {
      let [, day, month, year] = thaiDateMatch;
      let yearNum = parseInt(year);
      // Convert Buddhist year to Gregorian if > 2500
      if (yearNum > 2500) {
        yearNum -= 543;
      }
      return `${yearNum}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Try standard date parsing
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return format(date, 'yyyy-MM-dd');
    }
    
    return null;
  } catch {
    return null;
  }
}

function excelDateToJSDate(excelDate: number): Date {
  // Excel dates are number of days since 1900-01-01
  // But Excel incorrectly treats 1900 as a leap year, so we need to adjust
  const date = new Date((excelDate - 25569) * 86400 * 1000);
  return date;
}

export async function importExcelData(
  base64Data: string, 
  fileName: string, 
  userId: number
): Promise<{ success: number; failed: number; errors: string[] }> {
  const errors: string[] = [];
  let successCount = 0;
  let failedCount = 0;

  try {
    // Decode base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Read workbook
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    
    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    
    if (rows.length < 2) {
      return { success: 0, failed: 0, errors: ['ไฟล์ไม่มีข้อมูล'] };
    }

    // Get admin staff list for matching
    const adminStaffList = await getAllAdminStaff();
    const adminMap = new Map(adminStaffList.map(a => [a.name.toLowerCase(), a.id]));

    // Find header row
    const headers = rows[0].map((h: any) => String(h || '').toLowerCase().trim());
    
    // Map column indices
    const colMap: Record<string, number> = {};
    const columnMappings: Record<string, string[]> = {
      patientName: ['ชื่อคนไข้ทัก', 'ชื่อคนไข้', 'ชื่อ', 'patient', 'name'],
      channel: ['ช่องทางการทัก', 'ช่องทาง', 'channel'],
      phoneNumber: ['เบอร์โทร', 'เบอร์', 'โทร', 'phone', 'tel'],
      appointmentStatus: ['การนัดหมาย', 'นัดหมาย', 'สถานะ', 'status', 'appointment'],
      appointmentDate: ['วันที่นัดได้', 'วันที่นัด', 'วันนัด', 'appointment date'],
      appointmentBranch: ['สาขาที่นัด', 'สาขานัด'],
      receivingBranch: ['สาขาที่รับเรื่อง', 'สาขา', 'branch'],
      adminName: ['ชื่อแอดมิน', 'แอดมิน', 'admin'],
      customerType: ['ประเภทลูกค้า', 'ประเภท', 'ลูกค้า', 'customer type', 'type'],
      contactDate: ['วันที่ติดต่อ', 'วันที่', 'date']
    };

    for (const [key, aliases] of Object.entries(columnMappings)) {
      for (const alias of aliases) {
        const idx = headers.findIndex((h: string) => h.includes(alias.toLowerCase()));
        if (idx !== -1) {
          colMap[key] = idx;
          break;
        }
      }
    }

    // Validate required columns
    const requiredCols = ['patientName', 'channel', 'appointmentStatus', 'receivingBranch', 'adminName', 'contactDate'];
    const missingCols = requiredCols.filter(col => colMap[col] === undefined);
    if (missingCols.length > 0) {
      return { 
        success: 0, 
        failed: 0, 
        errors: [`ไม่พบคอลัมน์ที่จำเป็น: ${missingCols.join(', ')}`] 
      };
    }

    // Process data rows
    const contactsToInsert: any[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      try {
        const patientName = String(row[colMap.patientName] || '').trim();
        if (!patientName) {
          errors.push(`แถว ${i + 1}: ไม่มีชื่อคนไข้`);
          failedCount++;
          continue;
        }

        const channelRaw = String(row[colMap.channel] || '').toLowerCase().trim();
        const channel = CHANNEL_MAP[channelRaw];
        if (!channel) {
          errors.push(`แถว ${i + 1}: ช่องทาง "${row[colMap.channel]}" ไม่ถูกต้อง`);
          failedCount++;
          continue;
        }

        const statusRaw = String(row[colMap.appointmentStatus] || '').toLowerCase().trim();
        const appointmentStatus = STATUS_MAP[statusRaw];
        if (!appointmentStatus) {
          errors.push(`แถว ${i + 1}: สถานะ "${row[colMap.appointmentStatus]}" ไม่ถูกต้อง`);
          failedCount++;
          continue;
        }

        const branchRaw = String(row[colMap.receivingBranch] || '').toLowerCase().trim();
        const receivingBranch = BRANCH_MAP[branchRaw];
        if (!receivingBranch) {
          errors.push(`แถว ${i + 1}: สาขา "${row[colMap.receivingBranch]}" ไม่ถูกต้อง`);
          failedCount++;
          continue;
        }

        const adminNameRaw = String(row[colMap.adminName] || '').toLowerCase().trim();
        const adminStaffId = adminMap.get(adminNameRaw);
        if (!adminStaffId) {
          errors.push(`แถว ${i + 1}: ไม่พบแอดมิน "${row[colMap.adminName]}" ในระบบ`);
          failedCount++;
          continue;
        }

        let contactDateRaw = row[colMap.contactDate];
        let contactDate: string | null;
        if (typeof contactDateRaw === 'number') {
          contactDate = format(excelDateToJSDate(contactDateRaw), 'yyyy-MM-dd');
        } else {
          contactDate = parseThaiDate(String(contactDateRaw || ''));
        }
        if (!contactDate) {
          errors.push(`แถว ${i + 1}: วันที่ติดต่อ "${row[colMap.contactDate]}" ไม่ถูกต้อง`);
          failedCount++;
          continue;
        }

        // Optional fields
        const phoneNumber = colMap.phoneNumber !== undefined ? String(row[colMap.phoneNumber] || '').trim() || null : null;
        
        let appointmentDate: string | null = null;
        if (appointmentStatus === 'appointed' && colMap.appointmentDate !== undefined) {
          const apptDateRaw = row[colMap.appointmentDate];
          if (typeof apptDateRaw === 'number') {
            appointmentDate = format(excelDateToJSDate(apptDateRaw), 'yyyy-MM-dd');
          } else {
            appointmentDate = parseThaiDate(String(apptDateRaw || ''));
          }
        }

        let appointmentBranch: "lamlukka" | "salaya" | null = null;
        if (appointmentStatus === 'appointed' && colMap.appointmentBranch !== undefined) {
          const apptBranchRaw = String(row[colMap.appointmentBranch] || '').toLowerCase().trim();
          appointmentBranch = BRANCH_MAP[apptBranchRaw] || null;
        }

        // Parse customer type (default to 'new' if not specified)
        let customerType: "new" | "existing" = 'new';
        if (colMap.customerType !== undefined) {
          const customerTypeRaw = String(row[colMap.customerType] || '').toLowerCase().trim();
          customerType = CUSTOMER_TYPE_MAP[customerTypeRaw] || 'new';
        }

        contactsToInsert.push({
          patientName,
          channel,
          phoneNumber,
          appointmentStatus,
          appointmentDate,
          appointmentBranch,
          receivingBranch,
          adminStaffId,
          hasInteraction: true,
          customerType,
          notes: null,
          contactDate,
          createdBy: userId
        });

        successCount++;
      } catch (err) {
        errors.push(`แถว ${i + 1}: เกิดข้อผิดพลาด - ${err}`);
        failedCount++;
      }
    }

    // Bulk insert
    if (contactsToInsert.length > 0) {
      await bulkCreateContacts(contactsToInsert);
    }

    return { success: successCount, failed: failedCount, errors };
  } catch (err) {
    return { 
      success: 0, 
      failed: 0, 
      errors: [`เกิดข้อผิดพลาดในการอ่านไฟล์: ${err}`] 
    };
  }
}

export async function exportToExcel(filters: {
  startDate?: string;
  endDate?: string;
  branch?: "lamlukka" | "salaya";
  adminStaffId?: number;
  channel?: "facebook" | "line" | "instagram" | "tiktok";
  appointmentStatus?: "appointed" | "not_appointed";
  includeStats?: boolean;
}): Promise<{ data: string; fileName: string }> {
  // Get all contacts (no pagination for export - get all matching records)
  const result = await getContacts({
    startDate: filters.startDate,
    endDate: filters.endDate,
    branch: filters.branch,
    adminStaffId: filters.adminStaffId,
    channel: filters.channel,
    appointmentStatus: filters.appointmentStatus,
    limit: 10000 // Export all records (max 10000)
  });
  const contacts = result.data;

  // Get admin staff for name lookup
  const adminStaffList = await getAllAdminStaff();
  const adminMap = new Map(adminStaffList.map(a => [a.id, a.name]));

  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Create contacts sheet
  const contactsData = contacts.map(c => ({
    'วันที่ติดต่อ': c.contactDate,
    'ชื่อคนไข้ทัก': c.patientName,
    'ประเภทลูกค้า': c.customerType === 'new' ? 'ลูกค้าใหม่' : 'ลูกค้าเก่า',
    'ช่องทางการทัก': CHANNEL_NAMES[c.channel] || c.channel,
    'เบอร์โทร': c.phoneNumber || '-',
    'การนัดหมาย': c.appointmentStatus === 'appointed' ? 'นัดได้' : 'นัดไม่ได้',
    'วันที่นัดได้': c.appointmentDate || '-',
    'สาขาที่นัด': c.appointmentBranch ? BRANCH_NAMES[c.appointmentBranch] : '-',
    'สาขาที่รับเรื่อง': BRANCH_NAMES[c.receivingBranch] || c.receivingBranch,
    'ชื่อแอดมิน': adminMap.get(c.adminStaffId) || '-',
    'หมายเหตุ': c.notes || '-'
  }));

  const contactsSheet = XLSX.utils.json_to_sheet(contactsData);
  XLSX.utils.book_append_sheet(workbook, contactsSheet, 'รายการติดต่อ');

  // Add stats sheet if requested
  if (filters.includeStats) {
    const stats = await getContactStats({
      startDate: filters.startDate,
      endDate: filters.endDate,
      branch: filters.branch,
      adminStaffId: filters.adminStaffId
    });

    if (stats) {
      const statsData = [
        ['สรุปสถิติ', ''],
        ['', ''],
        ['จำนวนติดต่อทั้งหมด', stats.total],
        ['นัดได้', stats.appointed],
        ['นัดไม่ได้', stats.notAppointed],
        ['อัตราการนัดสำเร็จ', `${stats.appointedRate}%`],
        ['', ''],
        ['แยกตามช่องทาง', ''],
        ...stats.byChannel.map(c => [CHANNEL_NAMES[c.channel] || c.channel, c.count]),
        ['', ''],
        ['แยกตามสาขา', ''],
        ...stats.byBranch.map(b => [BRANCH_NAMES[b.branch] || b.branch, b.count])
      ];

      const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
      XLSX.utils.book_append_sheet(workbook, statsSheet, 'สรุปสถิติ');
    }
  }

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  // Convert to base64
  const base64 = Buffer.from(buffer).toString('base64');
  
  // Generate filename
  const dateStr = filters.startDate && filters.endDate 
    ? `${filters.startDate.replace(/-/g, '')}-${filters.endDate.replace(/-/g, '')}`
    : format(new Date(), 'yyyyMMdd');
  const fileName = `รายงานการติดต่อ_${dateStr}.xlsx`;

  return { data: base64, fileName };
}
