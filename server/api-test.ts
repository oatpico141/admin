/**
 * API Test Script - ทดสอบ Authorization และ Pagination
 * รันด้วย: npx tsx server/api-test.ts
 */
import 'dotenv/config';
import { drizzle } from "drizzle-orm/mysql2";
import { eq, sql, and, desc } from "drizzle-orm";
import { users, adminStaff, contacts } from "../drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

// สี console
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m"
};

function log(type: 'pass' | 'fail' | 'info' | 'title', message: string) {
  const icons = {
    pass: `${colors.green}✅ PASS${colors.reset}`,
    fail: `${colors.red}❌ FAIL${colors.reset}`,
    info: `${colors.cyan}ℹ️  INFO${colors.reset}`,
    title: `${colors.bold}${colors.yellow}📋${colors.reset}`
  };
  console.log(`${icons[type]} ${message}`);
}

// ============ MOCK FUNCTIONS (จำลอง tRPC context) ============

interface MockUser {
  id: number;
  openId: string;
  name: string | null;
  role: "admin" | "manager" | "staff";
  linkedAdminStaffId: number | null;
}

async function getContactById(id: number) {
  const result = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

async function getContacts(filters: any = {}) {
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const offset = (page - 1) * limit;

  let whereConditions = [];
  if (filters.adminStaffId) {
    whereConditions.push(eq(contacts.adminStaffId, filters.adminStaffId));
  }

  const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(contacts)
    .where(whereClause);
  const total = Number(countResult[0]?.count || 0);

  const data = await db
    .select()
    .from(contacts)
    .where(whereClause)
    .orderBy(desc(contacts.contactDate))
    .limit(limit)
    .offset(offset);

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
}

// ============ AUTHORIZATION TESTS ============

async function testAuthorization() {
  console.log("\n" + "=".repeat(60));
  log('title', `${colors.bold}ทดสอบ Authorization System${colors.reset}`);
  console.log("=".repeat(60) + "\n");

  // ดึงข้อมูลทดสอบ
  const allUsers = await db.select().from(users);
  const allStaff = await db.select().from(adminStaff);
  const allContacts = await db.select().from(contacts).limit(10);

  const adminUser = allUsers.find(u => u.role === "admin")!;
  const managerUser = allUsers.find(u => u.role === "manager")!;
  const staffUser = allUsers.find(u => u.role === "staff" && u.linkedAdminStaffId)!;

  console.log("👤 Users ที่ใช้ทดสอบ:");
  console.log(`   Admin: ${adminUser.name} (ID: ${adminUser.id})`);
  console.log(`   Manager: ${managerUser.name} (ID: ${managerUser.id})`);
  console.log(`   Staff: ${staffUser.name} (ID: ${staffUser.id}, linkedAdminStaffId: ${staffUser.linkedAdminStaffId})`);
  console.log("");

  // หา contact ที่เป็นของ staff user
  const staffOwnContact = allContacts.find(c => c.adminStaffId === staffUser.linkedAdminStaffId);
  // หา contact ที่ไม่ใช่ของ staff user
  const otherContact = allContacts.find(c => c.adminStaffId !== staffUser.linkedAdminStaffId);

  if (!staffOwnContact || !otherContact) {
    log('fail', "ไม่พบข้อมูล contact สำหรับทดสอบ");
    return;
  }

  console.log("📝 Contacts ที่ใช้ทดสอบ:");
  console.log(`   Staff's own contact: ID ${staffOwnContact.id} (adminStaffId: ${staffOwnContact.adminStaffId})`);
  console.log(`   Other contact: ID ${otherContact.id} (adminStaffId: ${otherContact.adminStaffId})`);
  console.log("");

  // ============ Test 1: getById - Staff เข้าถึงข้อมูลตัวเอง ============
  console.log("─".repeat(50));
  log('info', "Test 1: Staff เรียก getById สำหรับข้อมูลตัวเอง");

  const test1Result = await testGetById(staffUser, staffOwnContact.id);
  if (test1Result.allowed) {
    log('pass', `Staff สามารถดูข้อมูล contact ID ${staffOwnContact.id} ได้ (เป็นของตัวเอง)`);
  } else {
    log('fail', `Staff ควรดูข้อมูล contact ID ${staffOwnContact.id} ได้`);
  }

  // ============ Test 2: getById - Staff เข้าถึงข้อมูลคนอื่น ============
  console.log("─".repeat(50));
  log('info', "Test 2: Staff เรียก getById สำหรับข้อมูลคนอื่น");

  const test2Result = await testGetById(staffUser, otherContact.id);
  if (!test2Result.allowed) {
    log('pass', `Staff ไม่สามารถดูข้อมูล contact ID ${otherContact.id} ได้ (ไม่ใช่ของตัวเอง)`);
  } else {
    log('fail', `Staff ไม่ควรดูข้อมูล contact ID ${otherContact.id} ได้ - Authorization bypass!`);
  }

  // ============ Test 3: getById - Admin เข้าถึงข้อมูลทุกคน ============
  console.log("─".repeat(50));
  log('info', "Test 3: Admin เรียก getById สำหรับข้อมูลใดๆ");

  const test3Result = await testGetById(adminUser, otherContact.id);
  if (test3Result.allowed) {
    log('pass', `Admin สามารถดูข้อมูล contact ID ${otherContact.id} ได้`);
  } else {
    log('fail', `Admin ควรดูข้อมูลทุกอย่างได้`);
  }

  // ============ Test 4: update - Staff แก้ไขข้อมูลตัวเอง ============
  console.log("─".repeat(50));
  log('info', "Test 4: Staff เรียก update สำหรับข้อมูลตัวเอง");

  const test4Result = await testUpdate(staffUser, staffOwnContact.id);
  if (test4Result.allowed) {
    log('pass', `Staff สามารถแก้ไขข้อมูล contact ID ${staffOwnContact.id} ได้ (เป็นของตัวเอง)`);
  } else {
    log('fail', `Staff ควรแก้ไขข้อมูล contact ID ${staffOwnContact.id} ได้`);
  }

  // ============ Test 5: update - Staff แก้ไขข้อมูลคนอื่น ============
  console.log("─".repeat(50));
  log('info', "Test 5: Staff เรียก update สำหรับข้อมูลคนอื่น");

  const test5Result = await testUpdate(staffUser, otherContact.id);
  if (!test5Result.allowed) {
    log('pass', `Staff ไม่สามารถแก้ไขข้อมูล contact ID ${otherContact.id} ได้ (ไม่ใช่ของตัวเอง)`);
  } else {
    log('fail', `Staff ไม่ควรแก้ไขข้อมูล contact ID ${otherContact.id} ได้ - Authorization bypass!`);
  }

  // ============ Test 6: delete - Staff ลบข้อมูลคนอื่น ============
  console.log("─".repeat(50));
  log('info', "Test 6: Staff เรียก delete สำหรับข้อมูลคนอื่น");

  const test6Result = await testDelete(staffUser, otherContact.id);
  if (!test6Result.allowed) {
    log('pass', `Staff ไม่สามารถลบข้อมูล contact ID ${otherContact.id} ได้ (ไม่ใช่ของตัวเอง)`);
  } else {
    log('fail', `Staff ไม่ควรลบข้อมูล contact ID ${otherContact.id} ได้ - Authorization bypass!`);
  }

  // ============ Test 7: Manager เข้าถึงข้อมูลทุกคน ============
  console.log("─".repeat(50));
  log('info', "Test 7: Manager เรียก getById สำหรับข้อมูลใดๆ");

  const test7Result = await testGetById(managerUser, otherContact.id);
  if (test7Result.allowed) {
    log('pass', `Manager สามารถดูข้อมูล contact ID ${otherContact.id} ได้`);
  } else {
    log('fail', `Manager ควรดูข้อมูลทุกอย่างได้`);
  }
}

// จำลองการตรวจสอบ Authorization ตาม routers.ts
async function testGetById(user: MockUser, contactId: number): Promise<{ allowed: boolean; reason?: string }> {
  const contact = await getContactById(contactId);
  if (!contact) {
    return { allowed: false, reason: "ไม่พบข้อมูล" };
  }

  // Staff ดูได้เฉพาะข้อมูลของตัวเอง
  if (user.role === 'staff' && user.linkedAdminStaffId) {
    if (contact.adminStaffId !== user.linkedAdminStaffId) {
      return { allowed: false, reason: "ไม่มีสิทธิ์เข้าถึงข้อมูลนี้" };
    }
  }

  return { allowed: true };
}

async function testUpdate(user: MockUser, contactId: number): Promise<{ allowed: boolean; reason?: string }> {
  const contact = await getContactById(contactId);
  if (!contact) {
    return { allowed: false, reason: "ไม่พบข้อมูล" };
  }

  // Staff แก้ไขได้เฉพาะข้อมูลของตัวเอง
  if (user.role === 'staff' && user.linkedAdminStaffId) {
    if (contact.adminStaffId !== user.linkedAdminStaffId) {
      return { allowed: false, reason: "ไม่มีสิทธิ์แก้ไขข้อมูลนี้" };
    }
  }

  return { allowed: true };
}

async function testDelete(user: MockUser, contactId: number): Promise<{ allowed: boolean; reason?: string }> {
  const contact = await getContactById(contactId);
  if (!contact) {
    return { allowed: false, reason: "ไม่พบข้อมูล" };
  }

  // Staff ลบได้เฉพาะข้อมูลของตัวเอง
  if (user.role === 'staff' && user.linkedAdminStaffId) {
    if (contact.adminStaffId !== user.linkedAdminStaffId) {
      return { allowed: false, reason: "ไม่มีสิทธิ์ลบข้อมูลนี้" };
    }
  }

  return { allowed: true };
}

// ============ PAGINATION TESTS ============

async function testPagination() {
  console.log("\n" + "=".repeat(60));
  log('title', `${colors.bold}ทดสอบ Pagination System${colors.reset}`);
  console.log("=".repeat(60) + "\n");

  // ============ Test 1: ทดสอบ pagination พื้นฐาน ============
  console.log("─".repeat(50));
  log('info', "Test 1: Pagination พื้นฐาน (page 1, limit 10)");

  const result1 = await getContacts({ page: 1, limit: 10 });
  if (result1.data.length <= 10 && result1.pagination.page === 1) {
    log('pass', `ได้ ${result1.data.length} records จากทั้งหมด ${result1.pagination.total}`);
    log('pass', `Pagination info: page=${result1.pagination.page}, totalPages=${result1.pagination.totalPages}`);
  } else {
    log('fail', "Pagination ไม่ทำงานถูกต้อง");
  }

  // ============ Test 2: ทดสอบ page 2 ============
  console.log("─".repeat(50));
  log('info', "Test 2: Page 2 (page 2, limit 10)");

  const result2 = await getContacts({ page: 2, limit: 10 });
  if (result2.pagination.page === 2) {
    log('pass', `Page 2: ได้ ${result2.data.length} records`);
    // ตรวจสอบว่า data ไม่ซ้ำกัน
    if (result1.data[0]?.id !== result2.data[0]?.id) {
      log('pass', "Data ไม่ซ้ำกันระหว่าง page 1 และ page 2");
    } else {
      log('fail', "Data ซ้ำกัน - offset ไม่ทำงาน");
    }
  } else {
    log('fail', "Pagination page 2 ไม่ทำงาน");
  }

  // ============ Test 3: ทดสอบ filter by adminStaffId ============
  console.log("─".repeat(50));
  log('info', "Test 3: Filter by adminStaffId พร้อม Pagination");

  const staffList = await db.select().from(adminStaff).limit(1);
  if (staffList.length > 0) {
    const staffId = staffList[0].id;
    const result3 = await getContacts({ adminStaffId: staffId, page: 1, limit: 5 });

    // ตรวจสอบว่าทุก record เป็นของ staff คนนี้
    const allCorrect = result3.data.every(c => c.adminStaffId === staffId);
    if (allCorrect) {
      log('pass', `Filter by adminStaffId=${staffId}: ได้ ${result3.data.length} records (total: ${result3.pagination.total})`);
    } else {
      log('fail', "Filter by adminStaffId ไม่ทำงาน");
    }
  }

  // ============ Test 4: ทดสอบ totalPages calculation ============
  console.log("─".repeat(50));
  log('info', "Test 4: TotalPages calculation");

  const result4 = await getContacts({ page: 1, limit: 20 });
  const expectedTotalPages = Math.ceil(result4.pagination.total / 20);
  if (result4.pagination.totalPages === expectedTotalPages) {
    log('pass', `TotalPages คำนวณถูกต้อง: ${result4.pagination.totalPages} pages for ${result4.pagination.total} records`);
  } else {
    log('fail', `TotalPages ไม่ถูก: expected ${expectedTotalPages}, got ${result4.pagination.totalPages}`);
  }

  // ============ Test 5: ทดสอบ empty result ============
  console.log("─".repeat(50));
  log('info', "Test 5: Empty result (adminStaffId ที่ไม่มีอยู่)");

  const result5 = await getContacts({ adminStaffId: 99999, page: 1, limit: 10 });
  if (result5.data.length === 0 && result5.pagination.total === 0) {
    log('pass', "Empty result ทำงานถูกต้อง: data=[], total=0");
  } else {
    log('fail', "Empty result ไม่ถูกต้อง");
  }
}

// ============ DATABASE INDEX TESTS ============

async function testIndexes() {
  console.log("\n" + "=".repeat(60));
  log('title', `${colors.bold}ทดสอบ Database Indexes${colors.reset}`);
  console.log("=".repeat(60) + "\n");

  const indexResult = await db.execute(sql`SHOW INDEX FROM contacts`);
  const indexes = indexResult[0] as any[];

  const expectedIndexes = [
    'idx_contacts_contactDate',
    'idx_contacts_adminStaffId',
    'idx_contacts_receivingBranch',
    'idx_contacts_appointmentStatus',
    'idx_contacts_date_admin'
  ];

  console.log("📊 Indexes ที่พบในตาราง contacts:");
  const foundIndexes = new Set(indexes.map((i: any) => i.Key_name));

  for (const idx of expectedIndexes) {
    if (foundIndexes.has(idx)) {
      log('pass', `Index "${idx}" มีอยู่`);
    } else {
      log('fail', `Index "${idx}" ไม่พบ`);
    }
  }
}

// ============ MAIN ============

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log(`${colors.bold}${colors.cyan}🧪 API TEST SUITE - Admin Contact Tracker${colors.reset}`);
  console.log("=".repeat(60));

  try {
    await testAuthorization();
    await testPagination();
    await testIndexes();

    console.log("\n" + "=".repeat(60));
    log('title', `${colors.bold}${colors.green}✨ การทดสอบเสร็จสมบูรณ์!${colors.reset}`);
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error("\n❌ เกิดข้อผิดพลาด:", error);
  }

  process.exit(0);
}

main();
