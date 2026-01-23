import { mysqlTable, mysqlSchema, AnyMySqlColumn, primaryKey, int, varchar, mysqlEnum, timestamp, json, index, date, text, unique, tinyint, boolean } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const adminStaff = mysqlTable("admin_staff", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	branch: mysqlEnum(['lamlukka','salaya']).notNull(),
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
	branches: json(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "admin_staff_id"}),
]);

export const commissionTiers = mysqlTable("commission_tiers", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	minCount: int().notNull(),
	maxCount: int(),
	amountPerPerson: int().notNull(),
	branch: mysqlEnum(['lamlukka','salaya']),
	sortOrder: int().default(0).notNull(),
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "commission_tiers_id"}),
]);

export const contacts = mysqlTable("contacts", {
	id: int().autoincrement().notNull(),
	patientName: varchar({ length: 200 }).notNull(),
	channel: mysqlEnum(['facebook','facebook_ads','line','tiktok','instagram']).notNull(),
	phoneNumber: varchar({ length: 20 }),
	appointmentStatus: mysqlEnum(['appointed','not_appointed']).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	appointmentDate: date({ mode: 'string' }),
	appointmentBranch: mysqlEnum(['lamlukka','salaya']),
	receivingBranch: mysqlEnum(['lamlukka','salaya']).notNull(),
	adminStaffId: int().notNull(),
	hasInteraction: tinyint().default(1).notNull(),
	notes: text(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	contactDate: date({ mode: 'string' }).notNull(),
	createdBy: int(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
	customerType: mysqlEnum(['new','existing']).default('new').notNull(),
	procedureId: int(),
},
(table) => [
	index("idx_contacts_adminStaffId").on(table.adminStaffId),
	index("idx_contacts_appointmentStatus").on(table.appointmentStatus),
	index("idx_contacts_contactDate").on(table.contactDate),
	index("idx_contacts_date_admin").on(table.contactDate, table.adminStaffId),
	index("idx_contacts_receivingBranch").on(table.receivingBranch),
	primaryKey({ columns: [table.id], name: "contacts_id"}),
]);

export const procedures = mysqlTable("procedures", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 200 }).notNull(),
	description: text(),
	sortOrder: int().default(0).notNull(),
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "procedures_id"}),
]);

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	openId: varchar({ length: 64 }).notNull(),
	name: text(),
	email: varchar({ length: 320 }),
	loginMethod: varchar({ length: 64 }),
	role: mysqlEnum(['admin','manager','staff']).default('staff').notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
	lastSignedIn: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	linkedAdminStaffId: int(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "users_id"}),
	unique("users_openId_unique").on(table.openId),
]);

// Type exports for inserts
export type InsertUser = typeof users.$inferInsert;
export type InsertContact = typeof contacts.$inferInsert;
export type InsertAdminStaff = typeof adminStaff.$inferInsert;
export type InsertCommissionTier = typeof commissionTiers.$inferInsert;
export type InsertProcedure = typeof procedures.$inferInsert;
