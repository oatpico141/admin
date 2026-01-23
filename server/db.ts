import { eq, and, like, sql, desc, asc, SQL } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, contacts, adminStaff, InsertContact, InsertAdminStaff, commissionTiers, InsertCommissionTier, procedures, InsertProcedure } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER FUNCTIONS ============
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ USER MANAGEMENT FUNCTIONS ============
export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: "admin" | "manager" | "staff", linkedAdminStaffId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set({ 
    role, 
    linkedAdminStaffId: linkedAdminStaffId ?? null 
  }).where(eq(users.id, userId));
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ ADMIN STAFF FUNCTIONS ============
export async function getAllAdminStaff() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(adminStaff).where(eq(adminStaff.isActive, true)).orderBy(asc(adminStaff.name));
}

export async function getAdminStaffById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(adminStaff).where(eq(adminStaff.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createAdminStaff(data: InsertAdminStaff) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(adminStaff).values(data);
  return result[0].insertId;
}

export async function updateAdminStaff(id: number, data: Partial<InsertAdminStaff>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(adminStaff).set(data).where(eq(adminStaff.id, id));
}

export async function deleteAdminStaff(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(adminStaff).set({ isActive: false }).where(eq(adminStaff.id, id));
}

// ============ CONTACT FUNCTIONS ============
export interface ContactFilters {
  startDate?: string;
  endDate?: string;
  branch?: "lamlukka" | "salaya";
  adminStaffId?: number;
  channel?: "facebook" | "facebook_ads" | "line" | "tiktok" | "instagram";
  appointmentStatus?: "appointed" | "not_appointed";
  customerType?: "new" | "existing";
  searchName?: string;
  // Pagination
  page?: number;
  limit?: number;
}

export interface PaginatedContacts {
  data: Awaited<ReturnType<typeof getContactsQuery>>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function getContactsQuery(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, conditions: SQL[]) {
  return conditions.length > 0
    ? db.select().from(contacts).where(and(...conditions)).orderBy(desc(contacts.contactDate), desc(contacts.createdAt))
    : db.select().from(contacts).orderBy(desc(contacts.contactDate), desc(contacts.createdAt));
}

export async function getContacts(filters: ContactFilters = {}): Promise<PaginatedContacts> {
  const db = await getDb();
  if (!db) return { data: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } };

  const conditions: SQL[] = [];

  if (filters.startDate) {
    conditions.push(sql`${contacts.contactDate} >= ${filters.startDate}`);
  }
  if (filters.endDate) {
    conditions.push(sql`${contacts.contactDate} <= ${filters.endDate}`);
  }
  if (filters.branch) {
    conditions.push(eq(contacts.receivingBranch, filters.branch));
  }
  if (filters.adminStaffId) {
    conditions.push(eq(contacts.adminStaffId, filters.adminStaffId));
  }
  if (filters.channel) {
    conditions.push(eq(contacts.channel, filters.channel));
  }
  if (filters.appointmentStatus) {
    conditions.push(eq(contacts.appointmentStatus, filters.appointmentStatus));
  }
  if (filters.customerType) {
    conditions.push(eq(contacts.customerType, filters.customerType));
  }
  if (filters.searchName) {
    conditions.push(like(contacts.patientName, `%${filters.searchName}%`));
  }

  // Pagination settings
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const offset = (page - 1) * limit;

  // Count total records
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(contacts)
    .where(whereClause);
  const total = Number(countResult[0]?.count || 0);

  // Get paginated data
  const data = await db
    .select()
    .from(contacts)
    .where(whereClause)
    .orderBy(desc(contacts.contactDate), desc(contacts.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getContactById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createContact(data: InsertContact) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(contacts).values(data);
  return result[0].insertId;
}

export async function updateContact(id: number, data: Partial<InsertContact>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(contacts).set(data).where(eq(contacts.id, id));
}

export async function deleteContact(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(contacts).where(eq(contacts.id, id));
}

export async function bulkCreateContacts(dataList: InsertContact[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (dataList.length === 0) return 0;
  
  await db.insert(contacts).values(dataList);
  return dataList.length;
}

// ============ STATISTICS FUNCTIONS ============
export interface StatsFilters {
  startDate?: string;
  endDate?: string;
  branch?: "lamlukka" | "salaya";
  adminStaffId?: number;
}

export async function getContactStats(filters: StatsFilters = {}) {
  const db = await getDb();
  if (!db) return null;
  
  const conditions: SQL[] = [];
  
  if (filters.startDate) {
    conditions.push(sql`${contacts.contactDate} >= ${filters.startDate}`);
  }
  if (filters.endDate) {
    conditions.push(sql`${contacts.contactDate} <= ${filters.endDate}`);
  }
  if (filters.branch) {
    conditions.push(eq(contacts.receivingBranch, filters.branch));
  }
  if (filters.adminStaffId) {
    conditions.push(eq(contacts.adminStaffId, filters.adminStaffId));
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  // Total contacts
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(contacts)
    .where(whereClause);
  
  // By channel
  const byChannelResult = await db
    .select({
      channel: contacts.channel,
      count: sql<number>`count(*)`
    })
    .from(contacts)
    .where(whereClause)
    .groupBy(contacts.channel);
  
  // By appointment status (นับทั้งหมด)
  const byStatusResult = await db
    .select({
      status: contacts.appointmentStatus,
      count: sql<number>`count(*)`
    })
    .from(contacts)
    .where(whereClause)
    .groupBy(contacts.appointmentStatus);

  // นับ "ปิดได้" เฉพาะลูกค้าใหม่ที่นัดได้เท่านั้น
  const newCustomerAppointedResult = await db
    .select({
      count: sql<number>`count(*)`
    })
    .from(contacts)
    .where(whereClause ? and(whereClause, eq(contacts.customerType, 'new'), eq(contacts.appointmentStatus, 'appointed')) : and(eq(contacts.customerType, 'new'), eq(contacts.appointmentStatus, 'appointed')));

  // นับลูกค้าใหม่ทั้งหมด
  const newCustomerTotalResult = await db
    .select({
      count: sql<number>`count(*)`
    })
    .from(contacts)
    .where(whereClause ? and(whereClause, eq(contacts.customerType, 'new')) : eq(contacts.customerType, 'new'));
  
  // By branch
  const byBranchResult = await db
    .select({
      branch: contacts.receivingBranch,
      count: sql<number>`count(*)`
    })
    .from(contacts)
    .where(whereClause)
    .groupBy(contacts.receivingBranch);
  
  // By customer type
  const byCustomerTypeResult = await db
    .select({
      customerType: contacts.customerType,
      count: sql<number>`count(*)`,
      appointed: sql<number>`SUM(CASE WHEN ${contacts.appointmentStatus} = 'appointed' THEN 1 ELSE 0 END)`,
      notAppointed: sql<number>`SUM(CASE WHEN ${contacts.appointmentStatus} = 'not_appointed' THEN 1 ELSE 0 END)`
    })
    .from(contacts)
    .where(whereClause)
    .groupBy(contacts.customerType);
  
  // By admin staff - นับ "ปิดได้" เฉพาะลูกค้าใหม่ที่นัดได้เท่านั้น
  const byAdminResult = await db
    .select({
      adminStaffId: contacts.adminStaffId,
      count: sql<number>`count(*)`,
      // ลูกค้าใหม่ที่นัดได้ = "ปิดได้"
      appointed: sql<number>`SUM(CASE WHEN ${contacts.appointmentStatus} = 'appointed' AND ${contacts.customerType} = 'new' THEN 1 ELSE 0 END)`,
      // ลูกค้าใหม่ที่นัดไม่ได้
      notAppointed: sql<number>`SUM(CASE WHEN ${contacts.appointmentStatus} = 'not_appointed' AND ${contacts.customerType} = 'new' THEN 1 ELSE 0 END)`,
      // ลูกค้าใหม่ทั้งหมด
      newCustomers: sql<number>`SUM(CASE WHEN ${contacts.customerType} = 'new' THEN 1 ELSE 0 END)`
    })
    .from(contacts)
    .where(whereClause)
    .groupBy(contacts.adminStaffId);
  
  // Daily stats for chart - นับ "ปิดได้" เฉพาะลูกค้าใหม่ที่นัดได้เท่านั้น
  const dailyResult = await db
    .select({
      date: contacts.contactDate,
      count: sql<number>`count(*)`,
      // ลูกค้าใหม่ที่นัดได้ = "ปิดได้"
      appointed: sql<number>`SUM(CASE WHEN ${contacts.appointmentStatus} = 'appointed' AND ${contacts.customerType} = 'new' THEN 1 ELSE 0 END)`,
      // ลูกค้าใหม่ที่นัดไม่ได้
      notAppointed: sql<number>`SUM(CASE WHEN ${contacts.appointmentStatus} = 'not_appointed' AND ${contacts.customerType} = 'new' THEN 1 ELSE 0 END)`,
      // ลูกค้าใหม่ทั้งหมด
      newCustomers: sql<number>`SUM(CASE WHEN ${contacts.customerType} = 'new' THEN 1 ELSE 0 END)`
    })
    .from(contacts)
    .where(whereClause)
    .groupBy(contacts.contactDate)
    .orderBy(asc(contacts.contactDate));
  
  const total = Number(totalResult[0]?.count || 0);
  const appointed = byStatusResult.find(s => s.status === 'appointed');
  const notAppointed = byStatusResult.find(s => s.status === 'not_appointed');
  const appointedCount = Number(appointed?.count || 0);
  const notAppointedCount = Number(notAppointed?.count || 0);

  // "ปิดได้" = ลูกค้าใหม่ที่นัดได้เท่านั้น
  const newCustomerAppointed = Number(newCustomerAppointedResult[0]?.count || 0);
  const newCustomerTotal = Number(newCustomerTotalResult[0]?.count || 0);

  return {
    total,
    // จำนวน "นัดได้" ทั้งหมด (รวมลูกค้าเก่า) - สำหรับ reference
    appointedAll: appointedCount,
    notAppointedAll: notAppointedCount,
    // จำนวน "ปิดได้" = ลูกค้าใหม่ที่นัดได้เท่านั้น (ใช้สำหรับคำนวณคอมมิชชั่น)
    appointed: newCustomerAppointed,
    notAppointed: newCustomerTotal - newCustomerAppointed,
    newCustomerTotal,
    // อัตรา "ปิดได้" = ลูกค้าใหม่ที่นัดได้ / ลูกค้าใหม่ทั้งหมด
    appointedRate: newCustomerTotal > 0 ? Math.round((newCustomerAppointed / newCustomerTotal) * 100) : 0,
    byChannel: byChannelResult.map(c => ({
      channel: c.channel,
      count: Number(c.count)
    })),
    byBranch: byBranchResult.map(b => ({
      branch: b.branch,
      count: Number(b.count)
    })),
    byAdmin: byAdminResult.map(a => ({
      adminStaffId: a.adminStaffId,
      count: Number(a.count),
      // "ปิดได้" = ลูกค้าใหม่ที่นัดได้เท่านั้น
      appointed: Number(a.appointed || 0),
      notAppointed: Number(a.notAppointed || 0),
      newCustomers: Number(a.newCustomers || 0)
    })),
    daily: dailyResult.map(d => ({
      date: d.date,
      count: Number(d.count),
      // "ปิดได้" = ลูกค้าใหม่ที่นัดได้เท่านั้น
      appointed: Number(d.appointed || 0),
      notAppointed: Number(d.notAppointed || 0),
      newCustomers: Number(d.newCustomers || 0)
    })),
    byCustomerType: byCustomerTypeResult.map(c => ({
      customerType: c.customerType,
      count: Number(c.count),
      appointed: Number(c.appointed || 0),
      notAppointed: Number(c.notAppointed || 0)
    }))
  };
}

export async function getAdminPerformance(filters: StatsFilters = {}) {
  const db = await getDb();
  if (!db) return [];

  const conditions: SQL[] = [];

  if (filters.startDate) {
    conditions.push(sql`${contacts.contactDate} >= ${filters.startDate}`);
  }
  if (filters.endDate) {
    conditions.push(sql`${contacts.contactDate} <= ${filters.endDate}`);
  }
  if (filters.branch) {
    conditions.push(eq(contacts.receivingBranch, filters.branch));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // นับ "ปิดได้" เฉพาะลูกค้าใหม่ที่นัดได้เท่านั้น (customerType = 'new' AND appointmentStatus = 'appointed')
  const result = await db
    .select({
      adminStaffId: contacts.adminStaffId,
      total: sql<number>`count(*)`,
      // นับเฉพาะลูกค้าใหม่ที่นัดได้ = "ปิดได้"
      appointed: sql<number>`SUM(CASE WHEN ${contacts.appointmentStatus} = 'appointed' AND ${contacts.customerType} = 'new' THEN 1 ELSE 0 END)`,
      // นับลูกค้าใหม่ที่นัดไม่ได้
      notAppointed: sql<number>`SUM(CASE WHEN ${contacts.appointmentStatus} = 'not_appointed' AND ${contacts.customerType} = 'new' THEN 1 ELSE 0 END)`,
      // นับลูกค้าใหม่ทั้งหมด
      newCustomers: sql<number>`SUM(CASE WHEN ${contacts.customerType} = 'new' THEN 1 ELSE 0 END)`,
      // นับลูกค้าเก่าทั้งหมด
      existingCustomers: sql<number>`SUM(CASE WHEN ${contacts.customerType} = 'existing' THEN 1 ELSE 0 END)`,
      facebook: sql<number>`SUM(CASE WHEN ${contacts.channel} = 'facebook' THEN 1 ELSE 0 END)`,
      facebook_ads: sql<number>`SUM(CASE WHEN ${contacts.channel} = 'facebook_ads' THEN 1 ELSE 0 END)`,
      line: sql<number>`SUM(CASE WHEN ${contacts.channel} = 'line' THEN 1 ELSE 0 END)`,
      tiktok: sql<number>`SUM(CASE WHEN ${contacts.channel} = 'tiktok' THEN 1 ELSE 0 END)`,
      instagram: sql<number>`SUM(CASE WHEN ${contacts.channel} = 'instagram' THEN 1 ELSE 0 END)`
    })
    .from(contacts)
    .where(whereClause)
    .groupBy(contacts.adminStaffId);

  return result.map(r => {
    const newCustomerCount = Number(r.newCustomers || 0);
    const appointedCount = Number(r.appointed || 0);
    return {
      adminStaffId: r.adminStaffId,
      total: Number(r.total),
      // "ปิดได้" = ลูกค้าใหม่ที่นัดได้เท่านั้น
      appointed: appointedCount,
      notAppointed: Number(r.notAppointed || 0),
      newCustomers: newCustomerCount,
      existingCustomers: Number(r.existingCustomers || 0),
      // อัตราปิดได้ = ลูกค้าใหม่ที่นัดได้ / ลูกค้าใหม่ทั้งหมด
      appointedRate: newCustomerCount > 0 ? Math.round((appointedCount / newCustomerCount) * 100) : 0,
      byChannel: {
        facebook: Number(r.facebook || 0),
        facebook_ads: Number(r.facebook_ads || 0),
        line: Number(r.line || 0),
        tiktok: Number(r.tiktok || 0),
        instagram: Number(r.instagram || 0)
      }
    };
  });
}

// ============ COMMISSION TIER FUNCTIONS ============

export async function getCommissionTiers(branch?: "lamlukka" | "salaya") {
  const db = await getDb();
  if (!db) return [];
  
  const conditions: SQL[] = [eq(commissionTiers.isActive, true)];
  
  // Get tiers for specific branch or global (null branch)
  if (branch) {
    conditions.push(sql`(${commissionTiers.branch} = ${branch} OR ${commissionTiers.branch} IS NULL)`);
  }
  
  const result = await db
    .select()
    .from(commissionTiers)
    .where(and(...conditions))
    .orderBy(asc(commissionTiers.sortOrder), asc(commissionTiers.minCount));
  
  return result;
}

export async function getAllCommissionTiers() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select()
    .from(commissionTiers)
    .orderBy(asc(commissionTiers.sortOrder), asc(commissionTiers.minCount));
  
  return result;
}

export async function createCommissionTier(tier: InsertCommissionTier) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(commissionTiers).values(tier);
  return result;
}

export async function updateCommissionTier(id: number, tier: Partial<InsertCommissionTier>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(commissionTiers).set(tier).where(eq(commissionTiers.id, id));
}

export async function deleteCommissionTier(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(commissionTiers).where(eq(commissionTiers.id, id));
}

/**
 * คำนวณคอมมิชชั่นตามจำนวนการปิดการขาย (นัดได้)
 * ใช้ระบบขั้นบันได - ถ้าปิดได้ถึงจำนวนที่กำหนด จะได้อัตราใหม่ทั้งหมด
 */
export function calculateCommission(appointedCount: number, tiers: { minCount: number; maxCount: number | null; amountPerPerson: number }[]): {
  amount: number;
  tierName: string;
  rate: number;
} {
  if (appointedCount <= 0 || tiers.length === 0) {
    return { amount: 0, tierName: "-", rate: 0 };
  }
  
  // Sort tiers by minCount descending to find the highest applicable tier
  const sortedTiers = [...tiers].sort((a, b) => b.minCount - a.minCount);
  
  // Find the applicable tier (highest minCount that appointedCount meets)
  for (const tier of sortedTiers) {
    if (appointedCount >= tier.minCount) {
      // Check if within maxCount (if specified)
      if (tier.maxCount === null || appointedCount <= tier.maxCount) {
        return {
          amount: appointedCount * tier.amountPerPerson,
          tierName: `${tier.minCount}${tier.maxCount ? `-${tier.maxCount}` : '+'} คน`,
          rate: tier.amountPerPerson
        };
      }
    }
  }
  
  // If no tier matches, use the first tier (lowest)
  const lowestTier = tiers.sort((a, b) => a.minCount - b.minCount)[0];
  return {
    amount: appointedCount * lowestTier.amountPerPerson,
    tierName: `${lowestTier.minCount}${lowestTier.maxCount ? `-${lowestTier.maxCount}` : '+'} คน`,
    rate: lowestTier.amountPerPerson
  };
}

/**
 * คำนวณคอมมิชชั่นสำหรับแอดมินทุกคนในช่วงเวลาที่กำหนด
 */
export async function calculateAdminCommissions(filters: StatsFilters = {}) {
  const db = await getDb();
  if (!db) return [];
  
  // Get admin performance data
  const adminPerformance = await getAdminPerformance(filters);
  
  // Get all active tiers
  const tiers = await getCommissionTiers();
  
  // Get admin staff info
  const adminStaffList = await getAllAdminStaff();
  const adminMap = new Map(adminStaffList.map(a => [a.id, a]));
  
  // Calculate commission for each admin
  return adminPerformance.map(perf => {
    const admin = adminMap.get(perf.adminStaffId);
    
    // Filter tiers for this admin's branch
    const applicableTiers = tiers.filter(t => 
      t.branch === null || t.branch === admin?.branch
    );
    
    const commission = calculateCommission(perf.appointed, applicableTiers);
    
    return {
      adminStaffId: perf.adminStaffId,
      adminName: admin?.name || `แอดมิน #${perf.adminStaffId}`,
      branch: admin?.branch,
      total: perf.total,
      appointed: perf.appointed,
      notAppointed: perf.notAppointed,
      appointedRate: perf.appointedRate,
      commission: commission.amount,
      commissionRate: commission.rate,
      commissionTier: commission.tierName
    };
  });
}

// ============ PROCEDURES FUNCTIONS (หัตถการ) ============

export async function getAllProcedures() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(procedures).where(eq(procedures.isActive, true)).orderBy(asc(procedures.sortOrder), asc(procedures.name));
}

export async function getProcedureById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(procedures).where(eq(procedures.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProcedure(data: InsertProcedure) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(procedures).values(data);
  return result[0].insertId;
}

export async function updateProcedure(id: number, data: Partial<InsertProcedure>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(procedures).set(data).where(eq(procedures.id, id));
}

export async function deleteProcedure(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(procedures).set({ isActive: false }).where(eq(procedures.id, id));
}
