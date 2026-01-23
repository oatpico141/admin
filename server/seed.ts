import 'dotenv/config';
import { drizzle } from "drizzle-orm/mysql2";
import { sql, eq } from "drizzle-orm";
import { users, adminStaff, contacts, commissionTiers } from "../drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function seed() {
  console.log("🌱 เริ่มต้น Seeding ข้อมูลทดสอบ...\n");

  // 1. สร้าง Users
  console.log("📝 สร้าง Users...");
  const usersData = [
    { openId: "admin-001", name: "Admin Owner", email: "admin@clinic.com", role: "admin" as const },
    { openId: "manager-001", name: "หัวหน้าลำลูกกา", email: "manager.ll@clinic.com", role: "manager" as const },
    { openId: "manager-002", name: "หัวหน้าศาลายา", email: "manager.sl@clinic.com", role: "manager" as const },
    { openId: "staff-001", name: "สมชาย ใจดี", email: "somchai@clinic.com", role: "staff" as const },
    { openId: "staff-002", name: "สมหญิง รักงาน", email: "somying@clinic.com", role: "staff" as const },
    { openId: "staff-003", name: "มานะ ตั้งใจ", email: "mana@clinic.com", role: "staff" as const },
  ];

  for (const user of usersData) {
    await db.insert(users).values(user).onDuplicateKeyUpdate({ set: { name: user.name } });
  }
  console.log(`✅ สร้าง ${usersData.length} users\n`);

  // 2. สร้าง Admin Staff
  console.log("📝 สร้าง Admin Staff...");
  const adminStaffData = [
    { name: "สมชาย ใจดี", branch: "lamlukka" as const },
    { name: "สมหญิง รักงาน", branch: "lamlukka" as const },
    { name: "มานะ ตั้งใจ", branch: "salaya" as const },
    { name: "วิชัย เก่งกาจ", branch: "salaya" as const },
    { name: "รัตนา สดใส", branch: "lamlukka" as const },
  ];

  const insertedStaff = [];
  for (const staff of adminStaffData) {
    const result = await db.insert(adminStaff).values(staff);
    insertedStaff.push({ id: result[0].insertId, ...staff });
  }
  console.log(`✅ สร้าง ${adminStaffData.length} admin staff\n`);

  // อัพเดท linkedAdminStaffId ให้ staff users
  console.log("📝 อัพเดท linkedAdminStaffId ให้ staff users...");
  await db.update(users).set({ linkedAdminStaffId: insertedStaff[0].id }).where(eq(users.openId, "staff-001"));
  await db.update(users).set({ linkedAdminStaffId: insertedStaff[1].id }).where(eq(users.openId, "staff-002"));
  await db.update(users).set({ linkedAdminStaffId: insertedStaff[2].id }).where(eq(users.openId, "staff-003"));
  console.log("✅ อัพเดท linkedAdminStaffId เสร็จสิ้น\n");

  // 3. สร้าง Commission Tiers
  console.log("📝 สร้าง Commission Tiers...");
  const commissionData = [
    { name: "ขั้นที่ 1", minCount: 1, maxCount: 10, amountPerPerson: 50, sortOrder: 1 },
    { name: "ขั้นที่ 2", minCount: 11, maxCount: 20, amountPerPerson: 75, sortOrder: 2 },
    { name: "ขั้นที่ 3", minCount: 21, maxCount: 30, amountPerPerson: 100, sortOrder: 3 },
    { name: "ขั้นที่ 4", minCount: 31, maxCount: null, amountPerPerson: 150, sortOrder: 4 },
  ];

  for (const tier of commissionData) {
    await db.insert(commissionTiers).values(tier);
  }
  console.log(`✅ สร้าง ${commissionData.length} commission tiers\n`);

  // 4. สร้าง Contacts (ข้อมูลติดต่อลูกค้า)
  console.log("📝 สร้าง Contacts...");
  const channels = ["facebook", "line", "instagram", "tiktok"] as const;
  const statuses = ["appointed", "not_appointed"] as const;
  const customerTypes = ["new", "existing"] as const;
  const branches = ["lamlukka", "salaya"] as const;

  const patientNames = [
    "นายสมศักดิ์ เจริญสุข", "นางสาวพิมพ์ใจ รักสวย", "นายวิชัย มีทรัพย์",
    "นางสมศรี สุขใจ", "นายประยุทธ์ แก้วดี", "นางสาวสุดา ใจงาม",
    "นายสมหมาย รักษ์ดี", "นางวิไล เพียรทำ", "นายธนา มั่นคง",
    "นางสาวรัชนี สดใส", "นายพงษ์ศักดิ์ เก่งมาก", "นางอรุณี วิเศษ",
    "นายสุชาติ ก้าวหน้า", "นางสาวนภา รุ่งเรือง", "นายเกียรติศักดิ์ ดีเลิศ",
    "นางปราณี อารีย์", "นายสมพร ยิ้มแย้ม", "นางสาวสุภาพร อ่อนโยน",
    "นายณรงค์ ยุติธรรม", "นางสมจิต รักงาน"
  ];

  const contactsToCreate = [];
  const today = new Date();

  // สร้างข้อมูลย้อนหลัง 60 วัน
  for (let dayOffset = 0; dayOffset < 60; dayOffset++) {
    const contactDate = new Date(today);
    contactDate.setDate(today.getDate() - dayOffset);
    const dateStr = contactDate.toISOString().split('T')[0];

    // สุ่มจำนวน contact ต่อวัน (3-10 รายการ)
    const contactsPerDay = Math.floor(Math.random() * 8) + 3;

    for (let i = 0; i < contactsPerDay; i++) {
      const staffIndex = Math.floor(Math.random() * insertedStaff.length);
      const staff = insertedStaff[staffIndex];
      const channel = channels[Math.floor(Math.random() * channels.length)];
      const status = Math.random() > 0.3 ? "appointed" : "not_appointed"; // 70% นัดได้
      const customerType = Math.random() > 0.4 ? "new" : "existing"; // 60% ลูกค้าใหม่

      const contact: any = {
        patientName: patientNames[Math.floor(Math.random() * patientNames.length)],
        channel,
        phoneNumber: `08${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
        appointmentStatus: status,
        receivingBranch: staff.branch,
        adminStaffId: staff.id,
        hasInteraction: true,
        customerType,
        contactDate: dateStr,
        createdBy: 1
      };

      if (status === "appointed") {
        // วันที่นัด = วันติดต่อ + 1-14 วัน
        const appointmentDate = new Date(contactDate);
        appointmentDate.setDate(contactDate.getDate() + Math.floor(Math.random() * 14) + 1);
        contact.appointmentDate = appointmentDate.toISOString().split('T')[0];
        contact.appointmentBranch = staff.branch;
      }

      contactsToCreate.push(contact);
    }
  }

  // Batch insert contacts
  const batchSize = 50;
  for (let i = 0; i < contactsToCreate.length; i += batchSize) {
    const batch = contactsToCreate.slice(i, i + batchSize);
    await db.insert(contacts).values(batch);
  }
  console.log(`✅ สร้าง ${contactsToCreate.length} contacts\n`);

  console.log("🎉 Seeding เสร็จสมบูรณ์!");
  console.log("\n📊 สรุป:");
  console.log(`   - Users: ${usersData.length}`);
  console.log(`   - Admin Staff: ${adminStaffData.length}`);
  console.log(`   - Commission Tiers: ${commissionData.length}`);
  console.log(`   - Contacts: ${contactsToCreate.length}`);

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding ล้มเหลว:", err);
  process.exit(1);
});
