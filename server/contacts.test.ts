import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock database functions
vi.mock('./db', () => ({
  getAllAdminStaff: vi.fn().mockResolvedValue([
    { id: 1, name: 'Admin1', branch: 'lamlukka', isActive: true, createdAt: new Date() },
    { id: 2, name: 'Admin2', branch: 'salaya', isActive: true, createdAt: new Date() }
  ]),
  getAdminStaffById: vi.fn().mockResolvedValue({ id: 1, name: 'Admin1', branch: 'lamlukka', isActive: true }),
  createAdminStaff: vi.fn().mockResolvedValue(1),
  updateAdminStaff: vi.fn().mockResolvedValue(undefined),
  deleteAdminStaff: vi.fn().mockResolvedValue(undefined),
  getContacts: vi.fn().mockResolvedValue([
    {
      id: 1,
      patientName: 'Test Patient',
      channel: 'facebook',
      phoneNumber: '0812345678',
      appointmentStatus: 'appointed',
      appointmentDate: '2026-02-15',
      appointmentBranch: 'lamlukka',
      receivingBranch: 'lamlukka',
      adminStaffId: 1,
      hasInteraction: true,
      notes: null,
      contactDate: '2026-02-01',
      createdBy: 1,
      createdAt: new Date()
    }
  ]),
  getContactById: vi.fn().mockResolvedValue({
    id: 1,
    patientName: 'Test Patient',
    channel: 'facebook',
    appointmentStatus: 'appointed'
  }),
  createContact: vi.fn().mockResolvedValue(1),
  updateContact: vi.fn().mockResolvedValue(undefined),
  deleteContact: vi.fn().mockResolvedValue(undefined),
  bulkCreateContacts: vi.fn().mockResolvedValue(5),
  getContactStats: vi.fn().mockResolvedValue({
    total: 100,
    appointed: 70,
    notAppointed: 30,
    appointedRate: 70,
    byChannel: [
      { channel: 'facebook', count: 40 },
      { channel: 'line', count: 30 },
      { channel: 'instagram', count: 20 },
      { channel: 'tiktok', count: 10 }
    ],
    byBranch: [
      { branch: 'lamlukka', count: 60 },
      { branch: 'salaya', count: 40 }
    ]
  }),
  getAdminPerformance: vi.fn().mockResolvedValue([
    {
      adminStaffId: 1,
      total: 50,
      appointed: 35,
      notAppointed: 15,
      appointedRate: 70,
      byChannel: { facebook: 20, line: 15, instagram: 10, tiktok: 5 }
    }
  ])
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: 'user' | 'admin' | 'manager' | 'staff' = 'user'): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("adminStaff router", () => {
  it("lists all admin staff", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.adminStaff.list();

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Admin1');
  });

  it("gets admin staff by id", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.adminStaff.getById({ id: 1 });

    expect(result?.name).toBe('Admin1');
  });

  it("creates admin staff (admin only)", async () => {
    const ctx = createAuthContext('admin');
    const caller = appRouter.createCaller(ctx);

    const result = await caller.adminStaff.create({
      name: 'New Admin',
      branch: 'lamlukka',
      isActive: true
    });

    expect(result.success).toBe(true);
    expect(result.id).toBe(1);
  });

  it("rejects non-admin from creating admin staff", async () => {
    const ctx = createAuthContext('user');
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.adminStaff.create({
        name: 'New Admin',
        branch: 'lamlukka'
      })
    ).rejects.toThrow('ต้องเป็น Admin เท่านั้น');
  });
});

describe("contacts router", () => {
  it("lists contacts with filters", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.contacts.list({
      startDate: '2026-02-01',
      endDate: '2026-02-28'
    });

    expect(result).toHaveLength(1);
    expect(result[0].patientName).toBe('Test Patient');
  });

  it("creates a contact", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.contacts.create({
      patientName: 'New Patient',
      channel: 'line',
      appointmentStatus: 'appointed',
      receivingBranch: 'salaya',
      adminStaffId: 1,
      contactDate: '2026-02-10'
    });

    expect(result.success).toBe(true);
    expect(result.id).toBe(1);
  });

  it("validates required fields", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.contacts.create({
        patientName: '', // Empty name should fail
        channel: 'facebook',
        appointmentStatus: 'appointed',
        receivingBranch: 'lamlukka',
        adminStaffId: 1,
        contactDate: '2026-02-10'
      })
    ).rejects.toThrow();
  });

  it("bulk creates contacts", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.contacts.bulkCreate({
      contacts: [
        {
          patientName: 'Patient 1',
          channel: 'facebook',
          appointmentStatus: 'appointed',
          receivingBranch: 'lamlukka',
          adminStaffId: 1,
          contactDate: '2026-02-10'
        },
        {
          patientName: 'Patient 2',
          channel: 'line',
          appointmentStatus: 'not_appointed',
          receivingBranch: 'salaya',
          adminStaffId: 2,
          contactDate: '2026-02-11'
        }
      ]
    });

    expect(result.success).toBe(true);
    expect(result.count).toBe(5);
  });
});

describe("stats router", () => {
  it("returns overview statistics", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stats.overview({
      startDate: '2026-02-01',
      endDate: '2026-02-28'
    });

    expect(result?.total).toBe(100);
    expect(result?.appointed).toBe(70);
    expect(result?.appointedRate).toBe(70);
  });

  it("returns admin performance data", async () => {
    const ctx = createAuthContext('manager');
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stats.adminPerformance({
      startDate: '2026-02-01',
      endDate: '2026-02-28'
    });

    expect(result).toHaveLength(1);
    expect(result[0].appointedRate).toBe(70);
  });
});
