var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminStaff: () => adminStaff,
  commissionTiers: () => commissionTiers,
  contacts: () => contacts,
  procedures: () => procedures,
  users: () => users
});
import { mysqlTable, primaryKey, int, varchar, mysqlEnum, timestamp, json, index, date, text, unique, tinyint } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
var adminStaff, commissionTiers, contacts, procedures, users;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    adminStaff = mysqlTable(
      "admin_staff",
      {
        id: int().autoincrement().notNull(),
        name: varchar({ length: 100 }).notNull(),
        branch: mysqlEnum(["lamlukka", "salaya"]).notNull(),
        isActive: tinyint().default(1).notNull(),
        createdAt: timestamp({ mode: "string" }).default(sql`(now())`).notNull(),
        updatedAt: timestamp({ mode: "string" }).default(sql`(now())`).onUpdateNow().notNull(),
        branches: json()
      },
      (table) => [
        primaryKey({ columns: [table.id], name: "admin_staff_id" })
      ]
    );
    commissionTiers = mysqlTable(
      "commission_tiers",
      {
        id: int().autoincrement().notNull(),
        name: varchar({ length: 100 }).notNull(),
        minCount: int().notNull(),
        maxCount: int(),
        amountPerPerson: int().notNull(),
        branch: mysqlEnum(["lamlukka", "salaya"]),
        sortOrder: int().default(0).notNull(),
        isActive: tinyint().default(1).notNull(),
        createdAt: timestamp({ mode: "string" }).default(sql`(now())`).notNull(),
        updatedAt: timestamp({ mode: "string" }).default(sql`(now())`).onUpdateNow().notNull()
      },
      (table) => [
        primaryKey({ columns: [table.id], name: "commission_tiers_id" })
      ]
    );
    contacts = mysqlTable(
      "contacts",
      {
        id: int().autoincrement().notNull(),
        patientName: varchar({ length: 200 }).notNull(),
        channel: mysqlEnum(["facebook", "facebook_ads", "line", "tiktok", "instagram"]).notNull(),
        phoneNumber: varchar({ length: 20 }),
        appointmentStatus: mysqlEnum(["appointed", "not_appointed"]).notNull(),
        // you can use { mode: 'date' }, if you want to have Date as type for this column
        appointmentDate: date({ mode: "string" }),
        appointmentBranch: mysqlEnum(["lamlukka", "salaya"]),
        receivingBranch: mysqlEnum(["lamlukka", "salaya"]).notNull(),
        adminStaffId: int().notNull(),
        hasInteraction: tinyint().default(1).notNull(),
        notes: text(),
        // you can use { mode: 'date' }, if you want to have Date as type for this column
        contactDate: date({ mode: "string" }).notNull(),
        createdBy: int(),
        createdAt: timestamp({ mode: "string" }).default(sql`(now())`).notNull(),
        updatedAt: timestamp({ mode: "string" }).default(sql`(now())`).onUpdateNow().notNull(),
        customerType: mysqlEnum(["new", "existing"]).default("new").notNull(),
        procedureId: int()
      },
      (table) => [
        index("idx_contacts_adminStaffId").on(table.adminStaffId),
        index("idx_contacts_appointmentStatus").on(table.appointmentStatus),
        index("idx_contacts_contactDate").on(table.contactDate),
        index("idx_contacts_date_admin").on(table.contactDate, table.adminStaffId),
        index("idx_contacts_receivingBranch").on(table.receivingBranch),
        primaryKey({ columns: [table.id], name: "contacts_id" })
      ]
    );
    procedures = mysqlTable(
      "procedures",
      {
        id: int().autoincrement().notNull(),
        name: varchar({ length: 200 }).notNull(),
        description: text(),
        sortOrder: int().default(0).notNull(),
        isActive: tinyint().default(1).notNull(),
        createdAt: timestamp({ mode: "string" }).default(sql`(now())`).notNull(),
        updatedAt: timestamp({ mode: "string" }).default(sql`(now())`).onUpdateNow().notNull()
      },
      (table) => [
        primaryKey({ columns: [table.id], name: "procedures_id" })
      ]
    );
    users = mysqlTable(
      "users",
      {
        id: int().autoincrement().notNull(),
        openId: varchar({ length: 64 }).notNull(),
        name: text(),
        email: varchar({ length: 320 }),
        loginMethod: varchar({ length: 64 }),
        role: mysqlEnum(["admin", "manager", "staff"]).default("staff").notNull(),
        createdAt: timestamp({ mode: "string" }).default(sql`(now())`).notNull(),
        updatedAt: timestamp({ mode: "string" }).default(sql`(now())`).onUpdateNow().notNull(),
        lastSignedIn: timestamp({ mode: "string" }).default(sql`(now())`).notNull(),
        linkedAdminStaffId: int()
      },
      (table) => [
        primaryKey({ columns: [table.id], name: "users_id" }),
        unique("users_openId_unique").on(table.openId)
      ]
    );
  }
});

// server/_core/env.ts
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      appId: process.env.VITE_APP_ID ?? "",
      cookieSecret: process.env.JWT_SECRET ?? "",
      databaseUrl: process.env.DATABASE_URL ?? "",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
    };
  }
});

// server/db.ts
import { eq, and, like, sql as sql2, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
async function getDb() {
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
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}
async function updateUserRole(userId, role, linkedAdminStaffId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({
    role,
    linkedAdminStaffId: linkedAdminStaffId ?? null
  }).where(eq(users.id, userId));
}
async function getUserById(userId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getAllAdminStaff() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(adminStaff).where(eq(adminStaff.isActive, true)).orderBy(asc(adminStaff.name));
}
async function getAdminStaffById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(adminStaff).where(eq(adminStaff.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createAdminStaff(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(adminStaff).values(data);
  return result[0].insertId;
}
async function updateAdminStaff(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(adminStaff).set(data).where(eq(adminStaff.id, id));
}
async function deleteAdminStaff(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(adminStaff).set({ isActive: false }).where(eq(adminStaff.id, id));
}
async function getContacts(filters = {}) {
  const db = await getDb();
  if (!db) return { data: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } };
  const conditions = [];
  if (filters.startDate) {
    conditions.push(sql2`${contacts.contactDate} >= ${filters.startDate}`);
  }
  if (filters.endDate) {
    conditions.push(sql2`${contacts.contactDate} <= ${filters.endDate}`);
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
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const offset = (page - 1) * limit;
  const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
  const countResult = await db.select({ count: sql2`count(*)` }).from(contacts).where(whereClause);
  const total = Number(countResult[0]?.count || 0);
  const data = await db.select().from(contacts).where(whereClause).orderBy(desc(contacts.contactDate), desc(contacts.createdAt)).limit(limit).offset(offset);
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
async function getContactById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createContact(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contacts).values(data);
  return result[0].insertId;
}
async function updateContact(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contacts).set(data).where(eq(contacts.id, id));
}
async function deleteContact(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(contacts).where(eq(contacts.id, id));
}
async function bulkCreateContacts(dataList) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (dataList.length === 0) return 0;
  await db.insert(contacts).values(dataList);
  return dataList.length;
}
async function getContactStats(filters = {}) {
  const db = await getDb();
  if (!db) return null;
  const conditions = [];
  if (filters.startDate) {
    conditions.push(sql2`${contacts.contactDate} >= ${filters.startDate}`);
  }
  if (filters.endDate) {
    conditions.push(sql2`${contacts.contactDate} <= ${filters.endDate}`);
  }
  if (filters.branch) {
    conditions.push(eq(contacts.receivingBranch, filters.branch));
  }
  if (filters.adminStaffId) {
    conditions.push(eq(contacts.adminStaffId, filters.adminStaffId));
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
  const totalResult = await db.select({ count: sql2`count(*)` }).from(contacts).where(whereClause);
  const byChannelResult = await db.select({
    channel: contacts.channel,
    count: sql2`count(*)`
  }).from(contacts).where(whereClause).groupBy(contacts.channel);
  const byStatusResult = await db.select({
    status: contacts.appointmentStatus,
    count: sql2`count(*)`
  }).from(contacts).where(whereClause).groupBy(contacts.appointmentStatus);
  const newCustomerAppointedResult = await db.select({
    count: sql2`count(*)`
  }).from(contacts).where(whereClause ? and(whereClause, eq(contacts.customerType, "new"), eq(contacts.appointmentStatus, "appointed")) : and(eq(contacts.customerType, "new"), eq(contacts.appointmentStatus, "appointed")));
  const newCustomerTotalResult = await db.select({
    count: sql2`count(*)`
  }).from(contacts).where(whereClause ? and(whereClause, eq(contacts.customerType, "new")) : eq(contacts.customerType, "new"));
  const byBranchResult = await db.select({
    branch: contacts.receivingBranch,
    count: sql2`count(*)`
  }).from(contacts).where(whereClause).groupBy(contacts.receivingBranch);
  const byCustomerTypeResult = await db.select({
    customerType: contacts.customerType,
    count: sql2`count(*)`,
    appointed: sql2`SUM(CASE WHEN ${contacts.appointmentStatus} = 'appointed' THEN 1 ELSE 0 END)`,
    notAppointed: sql2`SUM(CASE WHEN ${contacts.appointmentStatus} = 'not_appointed' THEN 1 ELSE 0 END)`
  }).from(contacts).where(whereClause).groupBy(contacts.customerType);
  const byAdminResult = await db.select({
    adminStaffId: contacts.adminStaffId,
    count: sql2`count(*)`,
    // ลูกค้าใหม่ที่นัดได้ = "ปิดได้"
    appointed: sql2`SUM(CASE WHEN ${contacts.appointmentStatus} = 'appointed' AND ${contacts.customerType} = 'new' THEN 1 ELSE 0 END)`,
    // ลูกค้าใหม่ที่นัดไม่ได้
    notAppointed: sql2`SUM(CASE WHEN ${contacts.appointmentStatus} = 'not_appointed' AND ${contacts.customerType} = 'new' THEN 1 ELSE 0 END)`,
    // ลูกค้าใหม่ทั้งหมด
    newCustomers: sql2`SUM(CASE WHEN ${contacts.customerType} = 'new' THEN 1 ELSE 0 END)`
  }).from(contacts).where(whereClause).groupBy(contacts.adminStaffId);
  const dailyResult = await db.select({
    date: contacts.contactDate,
    count: sql2`count(*)`,
    // ลูกค้าใหม่ที่นัดได้ = "ปิดได้"
    appointed: sql2`SUM(CASE WHEN ${contacts.appointmentStatus} = 'appointed' AND ${contacts.customerType} = 'new' THEN 1 ELSE 0 END)`,
    // ลูกค้าใหม่ที่นัดไม่ได้
    notAppointed: sql2`SUM(CASE WHEN ${contacts.appointmentStatus} = 'not_appointed' AND ${contacts.customerType} = 'new' THEN 1 ELSE 0 END)`,
    // ลูกค้าใหม่ทั้งหมด
    newCustomers: sql2`SUM(CASE WHEN ${contacts.customerType} = 'new' THEN 1 ELSE 0 END)`
  }).from(contacts).where(whereClause).groupBy(contacts.contactDate).orderBy(asc(contacts.contactDate));
  const total = Number(totalResult[0]?.count || 0);
  const appointed = byStatusResult.find((s) => s.status === "appointed");
  const notAppointed = byStatusResult.find((s) => s.status === "not_appointed");
  const appointedCount = Number(appointed?.count || 0);
  const notAppointedCount = Number(notAppointed?.count || 0);
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
    appointedRate: newCustomerTotal > 0 ? Math.round(newCustomerAppointed / newCustomerTotal * 100) : 0,
    byChannel: byChannelResult.map((c) => ({
      channel: c.channel,
      count: Number(c.count)
    })),
    byBranch: byBranchResult.map((b) => ({
      branch: b.branch,
      count: Number(b.count)
    })),
    byAdmin: byAdminResult.map((a) => ({
      adminStaffId: a.adminStaffId,
      count: Number(a.count),
      // "ปิดได้" = ลูกค้าใหม่ที่นัดได้เท่านั้น
      appointed: Number(a.appointed || 0),
      notAppointed: Number(a.notAppointed || 0),
      newCustomers: Number(a.newCustomers || 0)
    })),
    daily: dailyResult.map((d) => ({
      date: d.date,
      count: Number(d.count),
      // "ปิดได้" = ลูกค้าใหม่ที่นัดได้เท่านั้น
      appointed: Number(d.appointed || 0),
      notAppointed: Number(d.notAppointed || 0),
      newCustomers: Number(d.newCustomers || 0)
    })),
    byCustomerType: byCustomerTypeResult.map((c) => ({
      customerType: c.customerType,
      count: Number(c.count),
      appointed: Number(c.appointed || 0),
      notAppointed: Number(c.notAppointed || 0)
    }))
  };
}
async function getAdminPerformance(filters = {}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters.startDate) {
    conditions.push(sql2`${contacts.contactDate} >= ${filters.startDate}`);
  }
  if (filters.endDate) {
    conditions.push(sql2`${contacts.contactDate} <= ${filters.endDate}`);
  }
  if (filters.branch) {
    conditions.push(eq(contacts.receivingBranch, filters.branch));
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
  const result = await db.select({
    adminStaffId: contacts.adminStaffId,
    total: sql2`count(*)`,
    // นับเฉพาะลูกค้าใหม่ที่นัดได้ = "ปิดได้"
    appointed: sql2`SUM(CASE WHEN ${contacts.appointmentStatus} = 'appointed' AND ${contacts.customerType} = 'new' THEN 1 ELSE 0 END)`,
    // นับลูกค้าใหม่ที่นัดไม่ได้
    notAppointed: sql2`SUM(CASE WHEN ${contacts.appointmentStatus} = 'not_appointed' AND ${contacts.customerType} = 'new' THEN 1 ELSE 0 END)`,
    // นับลูกค้าใหม่ทั้งหมด
    newCustomers: sql2`SUM(CASE WHEN ${contacts.customerType} = 'new' THEN 1 ELSE 0 END)`,
    // นับลูกค้าเก่าทั้งหมด
    existingCustomers: sql2`SUM(CASE WHEN ${contacts.customerType} = 'existing' THEN 1 ELSE 0 END)`,
    facebook: sql2`SUM(CASE WHEN ${contacts.channel} = 'facebook' THEN 1 ELSE 0 END)`,
    facebook_ads: sql2`SUM(CASE WHEN ${contacts.channel} = 'facebook_ads' THEN 1 ELSE 0 END)`,
    line: sql2`SUM(CASE WHEN ${contacts.channel} = 'line' THEN 1 ELSE 0 END)`,
    tiktok: sql2`SUM(CASE WHEN ${contacts.channel} = 'tiktok' THEN 1 ELSE 0 END)`,
    instagram: sql2`SUM(CASE WHEN ${contacts.channel} = 'instagram' THEN 1 ELSE 0 END)`
  }).from(contacts).where(whereClause).groupBy(contacts.adminStaffId);
  return result.map((r) => {
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
      appointedRate: newCustomerCount > 0 ? Math.round(appointedCount / newCustomerCount * 100) : 0,
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
async function getCommissionTiers(branch) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(commissionTiers.isActive, true)];
  if (branch) {
    conditions.push(sql2`(${commissionTiers.branch} = ${branch} OR ${commissionTiers.branch} IS NULL)`);
  }
  const result = await db.select().from(commissionTiers).where(and(...conditions)).orderBy(asc(commissionTiers.sortOrder), asc(commissionTiers.minCount));
  return result;
}
async function getAllCommissionTiers() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(commissionTiers).orderBy(asc(commissionTiers.sortOrder), asc(commissionTiers.minCount));
  return result;
}
async function createCommissionTier(tier) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(commissionTiers).values(tier);
  return result;
}
async function updateCommissionTier(id, tier) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(commissionTiers).set(tier).where(eq(commissionTiers.id, id));
}
async function deleteCommissionTier(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(commissionTiers).where(eq(commissionTiers.id, id));
}
function calculateCommission(appointedCount, tiers) {
  if (appointedCount <= 0 || tiers.length === 0) {
    return { amount: 0, tierName: "-", rate: 0 };
  }
  const sortedTiers = [...tiers].sort((a, b) => b.minCount - a.minCount);
  for (const tier of sortedTiers) {
    if (appointedCount >= tier.minCount) {
      if (tier.maxCount === null || appointedCount <= tier.maxCount) {
        return {
          amount: appointedCount * tier.amountPerPerson,
          tierName: `${tier.minCount}${tier.maxCount ? `-${tier.maxCount}` : "+"} \u0E04\u0E19`,
          rate: tier.amountPerPerson
        };
      }
    }
  }
  const lowestTier = tiers.sort((a, b) => a.minCount - b.minCount)[0];
  return {
    amount: appointedCount * lowestTier.amountPerPerson,
    tierName: `${lowestTier.minCount}${lowestTier.maxCount ? `-${lowestTier.maxCount}` : "+"} \u0E04\u0E19`,
    rate: lowestTier.amountPerPerson
  };
}
async function calculateAdminCommissions(filters = {}) {
  const db = await getDb();
  if (!db) return [];
  const adminPerformance = await getAdminPerformance(filters);
  const tiers = await getCommissionTiers();
  const adminStaffList = await getAllAdminStaff();
  const adminMap = new Map(adminStaffList.map((a) => [a.id, a]));
  return adminPerformance.map((perf) => {
    const admin = adminMap.get(perf.adminStaffId);
    const applicableTiers = tiers.filter(
      (t2) => t2.branch === null || t2.branch === admin?.branch
    );
    const commission = calculateCommission(perf.appointed, applicableTiers);
    return {
      adminStaffId: perf.adminStaffId,
      adminName: admin?.name || `\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19 #${perf.adminStaffId}`,
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
async function getAllProcedures() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(procedures).where(eq(procedures.isActive, true)).orderBy(asc(procedures.sortOrder), asc(procedures.name));
}
async function getProcedureById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(procedures).where(eq(procedures.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createProcedure(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(procedures).values(data);
  return result[0].insertId;
}
async function updateProcedure(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(procedures).set(data).where(eq(procedures.id, id));
}
async function deleteProcedure(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(procedures).set({ isActive: false }).where(eq(procedures.id, id));
}
var _db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_env();
    _db = null;
  }
});

// server/excel.ts
var excel_exports = {};
__export(excel_exports, {
  exportToExcel: () => exportToExcel,
  importExcelData: () => importExcelData
});
import * as XLSX from "xlsx";
import { format } from "date-fns";
function parseThaiDate(dateStr) {
  if (!dateStr) return null;
  try {
    if (dateStr && typeof dateStr === "object" && "getTime" in dateStr) {
      return format(dateStr, "yyyy-MM-dd");
    }
    const thaiDateMatch = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (thaiDateMatch) {
      let [, day, month, year] = thaiDateMatch;
      let yearNum = parseInt(year);
      if (yearNum > 2500) {
        yearNum -= 543;
      }
      return `${yearNum}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    const date2 = new Date(dateStr);
    if (!isNaN(date2.getTime())) {
      return format(date2, "yyyy-MM-dd");
    }
    return null;
  } catch {
    return null;
  }
}
function excelDateToJSDate(excelDate) {
  const date2 = new Date((excelDate - 25569) * 86400 * 1e3);
  return date2;
}
async function importExcelData(base64Data, fileName, userId) {
  const errors = [];
  let successCount = 0;
  let failedCount = 0;
  try {
    const buffer = Buffer.from(base64Data, "base64");
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (rows.length < 2) {
      return { success: 0, failed: 0, errors: ["\u0E44\u0E1F\u0E25\u0E4C\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25"] };
    }
    const adminStaffList = await getAllAdminStaff();
    const adminMap = new Map(adminStaffList.map((a) => [a.name.toLowerCase(), a.id]));
    const headers = rows[0].map((h) => String(h || "").toLowerCase().trim());
    const colMap = {};
    const columnMappings = {
      patientName: ["\u0E0A\u0E37\u0E48\u0E2D\u0E04\u0E19\u0E44\u0E02\u0E49\u0E17\u0E31\u0E01", "\u0E0A\u0E37\u0E48\u0E2D\u0E04\u0E19\u0E44\u0E02\u0E49", "\u0E0A\u0E37\u0E48\u0E2D", "patient", "name"],
      channel: ["\u0E0A\u0E48\u0E2D\u0E07\u0E17\u0E32\u0E07\u0E01\u0E32\u0E23\u0E17\u0E31\u0E01", "\u0E0A\u0E48\u0E2D\u0E07\u0E17\u0E32\u0E07", "channel"],
      phoneNumber: ["\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23", "\u0E40\u0E1A\u0E2D\u0E23\u0E4C", "\u0E42\u0E17\u0E23", "phone", "tel"],
      appointmentStatus: ["\u0E01\u0E32\u0E23\u0E19\u0E31\u0E14\u0E2B\u0E21\u0E32\u0E22", "\u0E19\u0E31\u0E14\u0E2B\u0E21\u0E32\u0E22", "\u0E2A\u0E16\u0E32\u0E19\u0E30", "status", "appointment"],
      appointmentDate: ["\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E19\u0E31\u0E14\u0E44\u0E14\u0E49", "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E19\u0E31\u0E14", "\u0E27\u0E31\u0E19\u0E19\u0E31\u0E14", "appointment date"],
      appointmentBranch: ["\u0E2A\u0E32\u0E02\u0E32\u0E17\u0E35\u0E48\u0E19\u0E31\u0E14", "\u0E2A\u0E32\u0E02\u0E32\u0E19\u0E31\u0E14"],
      receivingBranch: ["\u0E2A\u0E32\u0E02\u0E32\u0E17\u0E35\u0E48\u0E23\u0E31\u0E1A\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07", "\u0E2A\u0E32\u0E02\u0E32", "branch"],
      adminName: ["\u0E0A\u0E37\u0E48\u0E2D\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19", "\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19", "admin"],
      customerType: ["\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32", "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17", "\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32", "customer type", "type"],
      contactDate: ["\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D", "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48", "date"]
    };
    for (const [key, aliases] of Object.entries(columnMappings)) {
      for (const alias of aliases) {
        const idx = headers.findIndex((h) => h.includes(alias.toLowerCase()));
        if (idx !== -1) {
          colMap[key] = idx;
          break;
        }
      }
    }
    const requiredCols = ["patientName", "channel", "appointmentStatus", "receivingBranch", "adminName", "contactDate"];
    const missingCols = requiredCols.filter((col) => colMap[col] === void 0);
    if (missingCols.length > 0) {
      return {
        success: 0,
        failed: 0,
        errors: [`\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C\u0E17\u0E35\u0E48\u0E08\u0E33\u0E40\u0E1B\u0E47\u0E19: ${missingCols.join(", ")}`]
      };
    }
    const contactsToInsert = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      try {
        const patientName = String(row[colMap.patientName] || "").trim();
        if (!patientName) {
          errors.push(`\u0E41\u0E16\u0E27 ${i + 1}: \u0E44\u0E21\u0E48\u0E21\u0E35\u0E0A\u0E37\u0E48\u0E2D\u0E04\u0E19\u0E44\u0E02\u0E49`);
          failedCount++;
          continue;
        }
        const channelRaw = String(row[colMap.channel] || "").toLowerCase().trim();
        const channel = CHANNEL_MAP[channelRaw];
        if (!channel) {
          errors.push(`\u0E41\u0E16\u0E27 ${i + 1}: \u0E0A\u0E48\u0E2D\u0E07\u0E17\u0E32\u0E07 "${row[colMap.channel]}" \u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07`);
          failedCount++;
          continue;
        }
        const statusRaw = String(row[colMap.appointmentStatus] || "").toLowerCase().trim();
        const appointmentStatus = STATUS_MAP[statusRaw];
        if (!appointmentStatus) {
          errors.push(`\u0E41\u0E16\u0E27 ${i + 1}: \u0E2A\u0E16\u0E32\u0E19\u0E30 "${row[colMap.appointmentStatus]}" \u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07`);
          failedCount++;
          continue;
        }
        const branchRaw = String(row[colMap.receivingBranch] || "").toLowerCase().trim();
        const receivingBranch = BRANCH_MAP[branchRaw];
        if (!receivingBranch) {
          errors.push(`\u0E41\u0E16\u0E27 ${i + 1}: \u0E2A\u0E32\u0E02\u0E32 "${row[colMap.receivingBranch]}" \u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07`);
          failedCount++;
          continue;
        }
        const adminNameRaw = String(row[colMap.adminName] || "").toLowerCase().trim();
        const adminStaffId = adminMap.get(adminNameRaw);
        if (!adminStaffId) {
          errors.push(`\u0E41\u0E16\u0E27 ${i + 1}: \u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19 "${row[colMap.adminName]}" \u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A`);
          failedCount++;
          continue;
        }
        let contactDateRaw = row[colMap.contactDate];
        let contactDate;
        if (typeof contactDateRaw === "number") {
          contactDate = format(excelDateToJSDate(contactDateRaw), "yyyy-MM-dd");
        } else {
          contactDate = parseThaiDate(String(contactDateRaw || ""));
        }
        if (!contactDate) {
          errors.push(`\u0E41\u0E16\u0E27 ${i + 1}: \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D "${row[colMap.contactDate]}" \u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07`);
          failedCount++;
          continue;
        }
        const phoneNumber = colMap.phoneNumber !== void 0 ? String(row[colMap.phoneNumber] || "").trim() || null : null;
        let appointmentDate = null;
        if (appointmentStatus === "appointed" && colMap.appointmentDate !== void 0) {
          const apptDateRaw = row[colMap.appointmentDate];
          if (typeof apptDateRaw === "number") {
            appointmentDate = format(excelDateToJSDate(apptDateRaw), "yyyy-MM-dd");
          } else {
            appointmentDate = parseThaiDate(String(apptDateRaw || ""));
          }
        }
        let appointmentBranch = null;
        if (appointmentStatus === "appointed" && colMap.appointmentBranch !== void 0) {
          const apptBranchRaw = String(row[colMap.appointmentBranch] || "").toLowerCase().trim();
          appointmentBranch = BRANCH_MAP[apptBranchRaw] || null;
        }
        let customerType = "new";
        if (colMap.customerType !== void 0) {
          const customerTypeRaw = String(row[colMap.customerType] || "").toLowerCase().trim();
          customerType = CUSTOMER_TYPE_MAP[customerTypeRaw] || "new";
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
        errors.push(`\u0E41\u0E16\u0E27 ${i + 1}: \u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14 - ${err}`);
        failedCount++;
      }
    }
    if (contactsToInsert.length > 0) {
      await bulkCreateContacts(contactsToInsert);
    }
    return { success: successCount, failed: failedCount, errors };
  } catch (err) {
    return {
      success: 0,
      failed: 0,
      errors: [`\u0E40\u0E01\u0E34\u0E14\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E2D\u0E48\u0E32\u0E19\u0E44\u0E1F\u0E25\u0E4C: ${err}`]
    };
  }
}
async function exportToExcel(filters) {
  const result = await getContacts({
    startDate: filters.startDate,
    endDate: filters.endDate,
    branch: filters.branch,
    adminStaffId: filters.adminStaffId,
    channel: filters.channel,
    appointmentStatus: filters.appointmentStatus,
    limit: 1e4
    // Export all records (max 10000)
  });
  const contacts2 = result.data;
  const adminStaffList = await getAllAdminStaff();
  const adminMap = new Map(adminStaffList.map((a) => [a.id, a.name]));
  const workbook = XLSX.utils.book_new();
  const contactsData = contacts2.map((c) => ({
    "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D": c.contactDate,
    "\u0E0A\u0E37\u0E48\u0E2D\u0E04\u0E19\u0E44\u0E02\u0E49\u0E17\u0E31\u0E01": c.patientName,
    "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32": c.customerType === "new" ? "\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E43\u0E2B\u0E21\u0E48" : "\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E40\u0E01\u0E48\u0E32",
    "\u0E0A\u0E48\u0E2D\u0E07\u0E17\u0E32\u0E07\u0E01\u0E32\u0E23\u0E17\u0E31\u0E01": CHANNEL_NAMES[c.channel] || c.channel,
    "\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23": c.phoneNumber || "-",
    "\u0E01\u0E32\u0E23\u0E19\u0E31\u0E14\u0E2B\u0E21\u0E32\u0E22": c.appointmentStatus === "appointed" ? "\u0E19\u0E31\u0E14\u0E44\u0E14\u0E49" : "\u0E19\u0E31\u0E14\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49",
    "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E19\u0E31\u0E14\u0E44\u0E14\u0E49": c.appointmentDate || "-",
    "\u0E2A\u0E32\u0E02\u0E32\u0E17\u0E35\u0E48\u0E19\u0E31\u0E14": c.appointmentBranch ? BRANCH_NAMES[c.appointmentBranch] : "-",
    "\u0E2A\u0E32\u0E02\u0E32\u0E17\u0E35\u0E48\u0E23\u0E31\u0E1A\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07": BRANCH_NAMES[c.receivingBranch] || c.receivingBranch,
    "\u0E0A\u0E37\u0E48\u0E2D\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19": adminMap.get(c.adminStaffId) || "-",
    "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38": c.notes || "-"
  }));
  const contactsSheet = XLSX.utils.json_to_sheet(contactsData);
  XLSX.utils.book_append_sheet(workbook, contactsSheet, "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D");
  if (filters.includeStats) {
    const stats = await getContactStats({
      startDate: filters.startDate,
      endDate: filters.endDate,
      branch: filters.branch,
      adminStaffId: filters.adminStaffId
    });
    if (stats) {
      const statsData = [
        ["\u0E2A\u0E23\u0E38\u0E1B\u0E2A\u0E16\u0E34\u0E15\u0E34", ""],
        ["", ""],
        ["\u0E08\u0E33\u0E19\u0E27\u0E19\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14", stats.total],
        ["\u0E19\u0E31\u0E14\u0E44\u0E14\u0E49", stats.appointed],
        ["\u0E19\u0E31\u0E14\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49", stats.notAppointed],
        ["\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E01\u0E32\u0E23\u0E19\u0E31\u0E14\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08", `${stats.appointedRate}%`],
        ["", ""],
        ["\u0E41\u0E22\u0E01\u0E15\u0E32\u0E21\u0E0A\u0E48\u0E2D\u0E07\u0E17\u0E32\u0E07", ""],
        ...stats.byChannel.map((c) => [CHANNEL_NAMES[c.channel] || c.channel, c.count]),
        ["", ""],
        ["\u0E41\u0E22\u0E01\u0E15\u0E32\u0E21\u0E2A\u0E32\u0E02\u0E32", ""],
        ...stats.byBranch.map((b) => [BRANCH_NAMES[b.branch] || b.branch, b.count])
      ];
      const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
      XLSX.utils.book_append_sheet(workbook, statsSheet, "\u0E2A\u0E23\u0E38\u0E1B\u0E2A\u0E16\u0E34\u0E15\u0E34");
    }
  }
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  const base64 = Buffer.from(buffer).toString("base64");
  const dateStr = filters.startDate && filters.endDate ? `${filters.startDate.replace(/-/g, "")}-${filters.endDate.replace(/-/g, "")}` : format(/* @__PURE__ */ new Date(), "yyyyMMdd");
  const fileName = `\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E01\u0E32\u0E23\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D_${dateStr}.xlsx`;
  return { data: base64, fileName };
}
var CHANNEL_MAP, BRANCH_MAP, STATUS_MAP, CUSTOMER_TYPE_MAP, CHANNEL_NAMES, BRANCH_NAMES;
var init_excel = __esm({
  "server/excel.ts"() {
    "use strict";
    init_db();
    CHANNEL_MAP = {
      "facebook": "facebook",
      "fb": "facebook",
      "\u0E40\u0E1F\u0E2A\u0E1A\u0E38\u0E4A\u0E04": "facebook",
      "\u0E40\u0E1F\u0E0B\u0E1A\u0E38\u0E4A\u0E01": "facebook",
      "line": "line",
      "\u0E44\u0E25\u0E19\u0E4C": "line",
      "instagram": "instagram",
      "ig": "instagram",
      "\u0E2D\u0E34\u0E19\u0E2A\u0E15\u0E32\u0E41\u0E01\u0E23\u0E21": "instagram",
      "tiktok": "tiktok",
      "\u0E15\u0E34\u0E4A\u0E01\u0E15\u0E4A\u0E2D\u0E01": "tiktok"
    };
    BRANCH_MAP = {
      "\u0E25\u0E33\u0E25\u0E39\u0E01\u0E01\u0E32": "lamlukka",
      "lamlukka": "lamlukka",
      "\u0E28\u0E32\u0E25\u0E32\u0E22\u0E32": "salaya",
      "salaya": "salaya"
    };
    STATUS_MAP = {
      "\u0E19\u0E31\u0E14\u0E44\u0E14\u0E49": "appointed",
      "\u0E44\u0E14\u0E49": "appointed",
      "appointed": "appointed",
      "yes": "appointed",
      "\u0E19\u0E31\u0E14\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49": "not_appointed",
      "\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49": "not_appointed",
      "not_appointed": "not_appointed",
      "no": "not_appointed"
    };
    CUSTOMER_TYPE_MAP = {
      "\u0E43\u0E2B\u0E21\u0E48": "new",
      "\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E43\u0E2B\u0E21\u0E48": "new",
      "new": "new",
      "\u0E40\u0E01\u0E48\u0E32": "existing",
      "\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E40\u0E01\u0E48\u0E32": "existing",
      "existing": "existing",
      "old": "existing"
    };
    CHANNEL_NAMES = {
      facebook: "Facebook",
      line: "Line",
      instagram: "Instagram",
      tiktok: "TikTok"
    };
    BRANCH_NAMES = {
      lamlukka: "\u0E25\u0E33\u0E25\u0E39\u0E01\u0E01\u0E32",
      salaya: "\u0E28\u0E32\u0E25\u0E32\u0E22\u0E32"
    };
  }
});

// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/oauth.ts
init_db();

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
init_db();
init_env();
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
init_env();
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
init_db();
import { z as z2 } from "zod";
import { TRPCError as TRPCError3 } from "@trpc/server";
var branchEnum = z2.enum(["lamlukka", "salaya"]);
var channelEnum = z2.enum(["facebook", "facebook_ads", "line", "tiktok", "instagram"]);
var appointmentStatusEnum = z2.enum(["appointed", "not_appointed"]);
var customerTypeEnum = z2.enum(["new", "existing"]);
var adminStaffInput = z2.object({
  name: z2.string().min(1, "\u0E0A\u0E37\u0E48\u0E2D\u0E15\u0E49\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E27\u0E48\u0E32\u0E07"),
  branch: branchEnum,
  branches: z2.array(branchEnum).optional(),
  isActive: z2.boolean().optional()
});
var contactInput = z2.object({
  patientName: z2.string().min(1, "\u0E0A\u0E37\u0E48\u0E2D\u0E04\u0E19\u0E44\u0E02\u0E49\u0E15\u0E49\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E27\u0E48\u0E32\u0E07"),
  channel: channelEnum,
  phoneNumber: z2.string().optional().nullable(),
  appointmentStatus: appointmentStatusEnum,
  appointmentDate: z2.string().optional().nullable(),
  appointmentBranch: branchEnum.optional().nullable(),
  receivingBranch: branchEnum,
  adminStaffId: z2.number(),
  hasInteraction: z2.boolean().optional(),
  customerType: customerTypeEnum.optional(),
  procedureId: z2.number().optional().nullable(),
  notes: z2.string().optional().nullable(),
  contactDate: z2.string()
});
var contactFilters = z2.object({
  startDate: z2.string().optional(),
  endDate: z2.string().optional(),
  branch: branchEnum.optional(),
  adminStaffId: z2.number().optional(),
  channel: channelEnum.optional(),
  appointmentStatus: appointmentStatusEnum.optional(),
  customerType: customerTypeEnum.optional(),
  searchName: z2.string().optional(),
  // Pagination
  page: z2.number().min(1).optional().default(1),
  limit: z2.number().min(1).max(100).optional().default(50)
});
var statsFilters = z2.object({
  startDate: z2.string().optional(),
  endDate: z2.string().optional(),
  branch: branchEnum.optional(),
  adminStaffId: z2.number().optional()
});
var roleEnum = z2.enum(["admin", "manager", "staff"]);
var adminProcedure2 = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError3({ code: "FORBIDDEN", message: "\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19 Admin \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19" });
  }
  return next({ ctx });
});
var managerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "manager") {
    throw new TRPCError3({ code: "FORBIDDEN", message: "\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E2B\u0E31\u0E27\u0E2B\u0E19\u0E49\u0E32\u0E02\u0E36\u0E49\u0E19\u0E44\u0E1B" });
  }
  return next({ ctx });
});
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  // Admin Staff Management
  adminStaff: router({
    list: protectedProcedure.query(async () => {
      return getAllAdminStaff();
    }),
    getById: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      return getAdminStaffById(input.id);
    }),
    create: adminProcedure2.input(adminStaffInput).mutation(async ({ input }) => {
      const id = await createAdminStaff(input);
      return { id, success: true };
    }),
    update: adminProcedure2.input(z2.object({
      id: z2.number(),
      data: adminStaffInput.partial()
    })).mutation(async ({ input }) => {
      await updateAdminStaff(input.id, input.data);
      return { success: true };
    }),
    delete: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteAdminStaff(input.id);
      return { success: true };
    })
  }),
  // Contact Management
  contacts: router({
    list: protectedProcedure.input(contactFilters.optional()).query(async ({ input, ctx }) => {
      const filters = input || {};
      if (ctx.user.role === "staff" && ctx.user.linkedAdminStaffId) {
        filters.adminStaffId = ctx.user.linkedAdminStaffId;
      }
      return getContacts(filters);
    }),
    getById: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ input, ctx }) => {
      const contact = await getContactById(input.id);
      if (!contact) {
        throw new TRPCError3({ code: "NOT_FOUND", message: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E01\u0E32\u0E23\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D" });
      }
      if (ctx.user.role === "staff" && ctx.user.linkedAdminStaffId) {
        if (contact.adminStaffId !== ctx.user.linkedAdminStaffId) {
          throw new TRPCError3({ code: "FORBIDDEN", message: "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E40\u0E02\u0E49\u0E32\u0E16\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E19\u0E35\u0E49" });
        }
      }
      return contact;
    }),
    create: protectedProcedure.input(contactInput).mutation(async ({ input, ctx }) => {
      const id = await createContact({
        ...input,
        createdBy: ctx.user.id
      });
      return { id, success: true };
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      data: contactInput.partial()
    })).mutation(async ({ input, ctx }) => {
      const contact = await getContactById(input.id);
      if (!contact) {
        throw new TRPCError3({ code: "NOT_FOUND", message: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E01\u0E32\u0E23\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D" });
      }
      if (ctx.user.role === "staff" && ctx.user.linkedAdminStaffId) {
        if (contact.adminStaffId !== ctx.user.linkedAdminStaffId) {
          throw new TRPCError3({ code: "FORBIDDEN", message: "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E41\u0E01\u0E49\u0E44\u0E02\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E19\u0E35\u0E49" });
        }
      }
      await updateContact(input.id, input.data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input, ctx }) => {
      const contact = await getContactById(input.id);
      if (!contact) {
        throw new TRPCError3({ code: "NOT_FOUND", message: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E01\u0E32\u0E23\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D" });
      }
      if (ctx.user.role === "staff" && ctx.user.linkedAdminStaffId) {
        if (contact.adminStaffId !== ctx.user.linkedAdminStaffId) {
          throw new TRPCError3({ code: "FORBIDDEN", message: "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E25\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E19\u0E35\u0E49" });
        }
      }
      await deleteContact(input.id);
      return { success: true };
    }),
    bulkCreate: protectedProcedure.input(z2.object({
      contacts: z2.array(contactInput)
    })).mutation(async ({ input, ctx }) => {
      const contactsWithCreator = input.contacts.map((c) => ({
        ...c,
        createdBy: ctx.user.id
      }));
      const count = await bulkCreateContacts(contactsWithCreator);
      return { count, success: true };
    }),
    import: protectedProcedure.input(z2.object({
      fileData: z2.string(),
      fileName: z2.string()
    })).mutation(async ({ input, ctx }) => {
      const { importExcelData: importExcelData2 } = await Promise.resolve().then(() => (init_excel(), excel_exports));
      return importExcelData2(input.fileData, input.fileName, ctx.user.id);
    }),
    export: protectedProcedure.input(z2.object({
      startDate: z2.string().optional(),
      endDate: z2.string().optional(),
      branch: branchEnum.optional(),
      adminStaffId: z2.number().optional(),
      channel: channelEnum.optional(),
      appointmentStatus: appointmentStatusEnum.optional(),
      includeStats: z2.boolean().optional()
    })).mutation(async ({ input }) => {
      const { exportToExcel: exportToExcel2 } = await Promise.resolve().then(() => (init_excel(), excel_exports));
      return exportToExcel2(input);
    })
  }),
  // Statistics & Reports
  stats: router({
    overview: protectedProcedure.input(statsFilters.optional()).query(async ({ input, ctx }) => {
      const filters = input || {};
      if (ctx.user.role === "staff" && ctx.user.linkedAdminStaffId) {
        filters.adminStaffId = ctx.user.linkedAdminStaffId;
      }
      return getContactStats(filters);
    }),
    adminPerformance: managerProcedure.input(statsFilters.optional()).query(async ({ input }) => {
      return getAdminPerformance(input || {});
    }),
    adminCommissions: managerProcedure.input(statsFilters.optional()).query(async ({ input }) => {
      return calculateAdminCommissions(input || {});
    })
  }),
  // Commission Settings
  commission: router({
    list: protectedProcedure.query(async () => {
      return getAllCommissionTiers();
    }),
    getByBranch: protectedProcedure.input(z2.object({ branch: branchEnum.optional() })).query(async ({ input }) => {
      return getCommissionTiers(input.branch);
    }),
    create: managerProcedure.input(z2.object({
      name: z2.string().min(1, "\u0E0A\u0E37\u0E48\u0E2D\u0E02\u0E31\u0E49\u0E19\u0E15\u0E49\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E27\u0E48\u0E32\u0E07"),
      minCount: z2.number().min(1, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E02\u0E31\u0E49\u0E19\u0E15\u0E48\u0E33\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32 0"),
      maxCount: z2.number().nullable().optional(),
      amountPerPerson: z2.number().min(0, "\u0E04\u0E48\u0E32\u0E04\u0E2D\u0E21\u0E15\u0E49\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E15\u0E34\u0E14\u0E25\u0E1A"),
      branch: branchEnum.nullable().optional(),
      sortOrder: z2.number().optional(),
      isActive: z2.boolean().optional()
    })).mutation(async ({ input }) => {
      await createCommissionTier({
        name: input.name,
        minCount: input.minCount,
        maxCount: input.maxCount ?? null,
        amountPerPerson: input.amountPerPerson,
        branch: input.branch ?? null,
        sortOrder: input.sortOrder ?? 0,
        isActive: input.isActive ?? true
      });
      return { success: true };
    }),
    update: managerProcedure.input(z2.object({
      id: z2.number(),
      name: z2.string().optional(),
      minCount: z2.number().optional(),
      maxCount: z2.number().nullable().optional(),
      amountPerPerson: z2.number().optional(),
      branch: branchEnum.nullable().optional(),
      sortOrder: z2.number().optional(),
      isActive: z2.boolean().optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateCommissionTier(id, data);
      return { success: true };
    }),
    delete: managerProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteCommissionTier(input.id);
      return { success: true };
    })
  }),
  // User Management (admin only)
  users: router({
    list: adminProcedure2.query(async () => {
      return getAllUsers();
    }),
    updateRole: adminProcedure2.input(z2.object({
      userId: z2.number(),
      role: roleEnum,
      linkedAdminStaffId: z2.number().nullable().optional()
    })).mutation(async ({ input }) => {
      await updateUserRole(input.userId, input.role, input.linkedAdminStaffId);
      return { success: true };
    }),
    getById: adminProcedure2.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      return getUserById(input.id);
    })
  }),
  // Procedures Management (หัตถการ)
  procedures: router({
    list: protectedProcedure.query(async () => {
      return getAllProcedures();
    }),
    getById: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      const procedure = await getProcedureById(input.id);
      if (!procedure) {
        throw new TRPCError3({ code: "NOT_FOUND", message: "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2B\u0E31\u0E15\u0E16\u0E01\u0E32\u0E23" });
      }
      return procedure;
    }),
    create: managerProcedure.input(z2.object({
      name: z2.string().min(1, "\u0E0A\u0E37\u0E48\u0E2D\u0E2B\u0E31\u0E15\u0E16\u0E01\u0E32\u0E23\u0E15\u0E49\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E27\u0E48\u0E32\u0E07"),
      description: z2.string().optional().nullable(),
      sortOrder: z2.number().optional(),
      isActive: z2.boolean().optional()
    })).mutation(async ({ input }) => {
      const id = await createProcedure({
        name: input.name,
        description: input.description ?? null,
        sortOrder: input.sortOrder ?? 0,
        isActive: input.isActive ?? true
      });
      return { id, success: true };
    }),
    update: managerProcedure.input(z2.object({
      id: z2.number(),
      name: z2.string().optional(),
      description: z2.string().optional().nullable(),
      sortOrder: z2.number().optional(),
      isActive: z2.boolean().optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateProcedure(id, data);
      return { success: true };
    }),
    delete: managerProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteProcedure(input.id);
      return { success: true };
    })
  })
});

// server/_core/context.ts
init_db();
async function createContext(opts) {
  let user = null;
  if (process.env.NODE_ENV === "development") {
    const devUserOpenId = opts.req.headers["x-dev-user"];
    if (devUserOpenId) {
      user = await getUserByOpenId(devUserOpenId) ?? null;
      if (user) {
        console.log(`[DEV] Authenticated as: ${user.name} (${user.role})`);
        return { req: opts.req, res: opts.res, user };
      }
    }
  }
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs2 from "fs";
import { nanoid } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var PROJECT_ROOT = import.meta.dirname;
var LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
var MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
var TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}
function trimLogFile(logPath, maxSize) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }
    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines = [];
    let keptBytes = 0;
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}
`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
  }
}
function writeToLogFile(source, entries) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });
  fs.appendFileSync(logPath, `${lines.join("\n")}
`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}
function vitePluginManusDebugCollector() {
  return {
    name: "manus-debug-collector",
    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true
            },
            injectTo: "head"
          }
        ]
      };
    },
    configureServer(server) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }
        const handlePayload = (payload) => {
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };
        const reqBody = req.body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    }
  };
}
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app);
  if (process.env.NODE_ENV === "development") {
    app.get("/dev/login/:role", async (req, res) => {
      const role = req.params.role;
      const userMap = {
        admin: "admin-001",
        manager: "manager-001",
        staff: "staff-001"
      };
      const openId = userMap[role];
      if (!openId) {
        return res.status(400).json({ error: "Invalid role. Use: admin, manager, staff" });
      }
      res.cookie("dev_user", openId, { httpOnly: false, maxAge: 24 * 60 * 60 * 1e3 });
      res.json({
        success: true,
        message: `Logged in as ${role}`,
        openId,
        instructions: "Add header 'x-dev-user: " + openId + "' to API requests, or use the cookie"
      });
    });
    app.get("/dev/users", async (req, res) => {
      const { drizzle: drizzle2 } = await import("drizzle-orm/mysql2");
      const { users: users2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const db = drizzle2(process.env.DATABASE_URL);
      const allUsers = await db.select().from(users2);
      res.json(allUsers);
    });
    console.log("[DEV] Dev routes enabled: /dev/login/:role, /dev/users");
  }
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
