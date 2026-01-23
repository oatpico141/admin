import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getAllAdminStaff,
  getAdminStaffById,
  createAdminStaff,
  updateAdminStaff,
  deleteAdminStaff,
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  bulkCreateContacts,
  getContactStats,
  getAdminPerformance,
  getAllCommissionTiers,
  getCommissionTiers,
  createCommissionTier,
  updateCommissionTier,
  deleteCommissionTier,
  calculateAdminCommissions,
  getAllUsers,
  updateUserRole,
  getUserById,
  getAllProcedures,
  getProcedureById,
  createProcedure,
  updateProcedure,
  deleteProcedure
} from "./db";
import { TRPCError } from "@trpc/server";

// Zod schemas for validation
const branchEnum = z.enum(["lamlukka", "salaya"]);
const channelEnum = z.enum(["facebook", "facebook_ads", "line", "tiktok", "instagram"]);
const appointmentStatusEnum = z.enum(["appointed", "not_appointed"]);
const customerTypeEnum = z.enum(["new", "existing"]);

const adminStaffInput = z.object({
  name: z.string().min(1, "ชื่อต้องไม่ว่าง"),
  branch: branchEnum,
  branches: z.array(branchEnum).optional(),
  isActive: z.boolean().optional()
});

const contactInput = z.object({
  patientName: z.string().min(1, "ชื่อคนไข้ต้องไม่ว่าง"),
  channel: channelEnum,
  phoneNumber: z.string().optional().nullable(),
  appointmentStatus: appointmentStatusEnum,
  appointmentDate: z.string().optional().nullable(),
  appointmentBranch: branchEnum.optional().nullable(),
  receivingBranch: branchEnum,
  adminStaffId: z.number(),
  hasInteraction: z.boolean().optional(),
  customerType: customerTypeEnum.optional(),
  procedureId: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  contactDate: z.string()
});

const contactFilters = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  branch: branchEnum.optional(),
  adminStaffId: z.number().optional(),
  channel: channelEnum.optional(),
  appointmentStatus: appointmentStatusEnum.optional(),
  customerType: customerTypeEnum.optional(),
  searchName: z.string().optional(),
  // Pagination
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(50)
});

const statsFilters = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  branch: branchEnum.optional(),
  adminStaffId: z.number().optional()
});

// Role enum
const roleEnum = z.enum(["admin", "manager", "staff"]);

// Admin-only procedure (admin only)
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'ต้องเป็น Admin เท่านั้น' });
  }
  return next({ ctx });
});

// Manager procedure (admin or manager)
const managerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'manager') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'ต้องเป็นหัวหน้าขึ้นไป' });
  }
  return next({ ctx });
});

// Helper: check if user can access data (staff can only see their own)
function canAccessAllData(role: string): boolean {
  return role === 'admin' || role === 'manager';
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Admin Staff Management
  adminStaff: router({
    list: protectedProcedure.query(async () => {
      return getAllAdminStaff();
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getAdminStaffById(input.id);
      }),
    
    create: adminProcedure
      .input(adminStaffInput)
      .mutation(async ({ input }) => {
        const id = await createAdminStaff(input);
        return { id, success: true };
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        data: adminStaffInput.partial()
      }))
      .mutation(async ({ input }) => {
        await updateAdminStaff(input.id, input.data);
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteAdminStaff(input.id);
        return { success: true };
      }),
  }),

  // Contact Management
  contacts: router({
    list: protectedProcedure
      .input(contactFilters.optional())
      .query(async ({ input, ctx }) => {
        const filters = input || {};
        // Staff ดูได้เฉพาะข้อมูลของตัวเอง
        if (ctx.user.role === 'staff' && ctx.user.linkedAdminStaffId) {
          filters.adminStaffId = ctx.user.linkedAdminStaffId;
        }
        return getContacts(filters);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const contact = await getContactById(input.id);
        if (!contact) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'ไม่พบข้อมูลการติดต่อ' });
        }
        // Staff ดูได้เฉพาะข้อมูลของตัวเอง
        if (ctx.user.role === 'staff' && ctx.user.linkedAdminStaffId) {
          if (contact.adminStaffId !== ctx.user.linkedAdminStaffId) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้' });
          }
        }
        return contact;
      }),

    create: protectedProcedure
      .input(contactInput)
      .mutation(async ({ input, ctx }) => {
        const id = await createContact({
          ...input,
          createdBy: ctx.user.id
        });
        return { id, success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: contactInput.partial()
      }))
      .mutation(async ({ input, ctx }) => {
        // ตรวจสอบว่ามีข้อมูลอยู่หรือไม่
        const contact = await getContactById(input.id);
        if (!contact) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'ไม่พบข้อมูลการติดต่อ' });
        }
        // Staff แก้ไขได้เฉพาะข้อมูลของตัวเอง
        if (ctx.user.role === 'staff' && ctx.user.linkedAdminStaffId) {
          if (contact.adminStaffId !== ctx.user.linkedAdminStaffId) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'ไม่มีสิทธิ์แก้ไขข้อมูลนี้' });
          }
        }
        await updateContact(input.id, input.data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // ตรวจสอบว่ามีข้อมูลอยู่หรือไม่
        const contact = await getContactById(input.id);
        if (!contact) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'ไม่พบข้อมูลการติดต่อ' });
        }
        // Staff ลบได้เฉพาะข้อมูลของตัวเอง
        if (ctx.user.role === 'staff' && ctx.user.linkedAdminStaffId) {
          if (contact.adminStaffId !== ctx.user.linkedAdminStaffId) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'ไม่มีสิทธิ์ลบข้อมูลนี้' });
          }
        }
        await deleteContact(input.id);
        return { success: true };
      }),
    
    bulkCreate: protectedProcedure
      .input(z.object({
        contacts: z.array(contactInput)
      }))
      .mutation(async ({ input, ctx }) => {
        const contactsWithCreator = input.contacts.map(c => ({
          ...c,
          createdBy: ctx.user.id
        }));
        const count = await bulkCreateContacts(contactsWithCreator);
        return { count, success: true };
      }),

    import: protectedProcedure
      .input(z.object({
        fileData: z.string(),
        fileName: z.string()
      }))
      .mutation(async ({ input, ctx }) => {
        // Import Excel file processing
        const { importExcelData } = await import('./excel');
        return importExcelData(input.fileData, input.fileName, ctx.user.id);
      }),

    export: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        branch: branchEnum.optional(),
        adminStaffId: z.number().optional(),
        channel: channelEnum.optional(),
        appointmentStatus: appointmentStatusEnum.optional(),
        includeStats: z.boolean().optional()
      }))
      .mutation(async ({ input }) => {
        const { exportToExcel } = await import('./excel');
        return exportToExcel(input);
      }),
  }),

  // Statistics & Reports
  stats: router({
    overview: protectedProcedure
      .input(statsFilters.optional())
      .query(async ({ input, ctx }) => {
        const filters = input || {};
        // Staff ดูได้เฉพาะข้อมูลของตัวเอง
        if (ctx.user.role === 'staff' && ctx.user.linkedAdminStaffId) {
          filters.adminStaffId = ctx.user.linkedAdminStaffId;
        }
        return getContactStats(filters);
      }),
    
    adminPerformance: managerProcedure
      .input(statsFilters.optional())
      .query(async ({ input }) => {
        return getAdminPerformance(input || {});
      }),

    adminCommissions: managerProcedure
      .input(statsFilters.optional())
      .query(async ({ input }) => {
        return calculateAdminCommissions(input || {});
      }),
  }),

  // Commission Settings
  commission: router({
    list: protectedProcedure
      .query(async () => {
        return getAllCommissionTiers();
      }),

    getByBranch: protectedProcedure
      .input(z.object({ branch: branchEnum.optional() }))
      .query(async ({ input }) => {
        return getCommissionTiers(input.branch);
      }),

    create: managerProcedure
      .input(z.object({
        name: z.string().min(1, "ชื่อขั้นต้องไม่ว่าง"),
        minCount: z.number().min(1, "จำนวนขั้นต่ำต้องมากกว่า 0"),
        maxCount: z.number().nullable().optional(),
        amountPerPerson: z.number().min(0, "ค่าคอมต้องไม่ติดลบ"),
        branch: branchEnum.nullable().optional(),
        sortOrder: z.number().optional(),
        isActive: z.boolean().optional()
      }))
      .mutation(async ({ input }) => {
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

    update: managerProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        minCount: z.number().optional(),
        maxCount: z.number().nullable().optional(),
        amountPerPerson: z.number().optional(),
        branch: branchEnum.nullable().optional(),
        sortOrder: z.number().optional(),
        isActive: z.boolean().optional()
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateCommissionTier(id, data);
        return { success: true };
      }),

    delete: managerProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteCommissionTier(input.id);
        return { success: true };
      }),
  }),

  // User Management (admin only)
  users: router({
    list: adminProcedure
      .query(async () => {
        return getAllUsers();
      }),

    updateRole: adminProcedure
      .input(z.object({
        userId: z.number(),
        role: roleEnum,
        linkedAdminStaffId: z.number().nullable().optional()
      }))
      .mutation(async ({ input }) => {
        await updateUserRole(input.userId, input.role, input.linkedAdminStaffId);
        return { success: true };
      }),

    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getUserById(input.id);
      }),
  }),

  // Procedures Management (หัตถการ)
  procedures: router({
    list: protectedProcedure
      .query(async () => {
        return getAllProcedures();
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const procedure = await getProcedureById(input.id);
        if (!procedure) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'ไม่พบข้อมูลหัตถการ' });
        }
        return procedure;
      }),

    create: managerProcedure
      .input(z.object({
        name: z.string().min(1, "ชื่อหัตถการต้องไม่ว่าง"),
        description: z.string().optional().nullable(),
        sortOrder: z.number().optional(),
        isActive: z.boolean().optional()
      }))
      .mutation(async ({ input }) => {
        const id = await createProcedure({
          name: input.name,
          description: input.description ?? null,
          sortOrder: input.sortOrder ?? 0,
          isActive: input.isActive ?? true
        });
        return { id, success: true };
      }),

    update: managerProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional().nullable(),
        sortOrder: z.number().optional(),
        isActive: z.boolean().optional()
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateProcedure(id, data);
        return { success: true };
      }),

    delete: managerProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteProcedure(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
