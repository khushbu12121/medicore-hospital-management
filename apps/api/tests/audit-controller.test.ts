import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createAuditController,
  getAuditLogsController,
  getAuditLogByIdController,
} from "../src/modules/audit/audit.controller";

import {
  createAuditLog,
  getAuditLogs,
  getAuditLogById,
} from "../src/modules/audit/audit.service";

vi.mock("../src/modules/audit/audit.service", () => ({
  createAuditLog: vi.fn(),
  getAuditLogs: vi.fn(),
  getAuditLogById: vi.fn(),
}));

const mockRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("Audit Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // CREATE AUDIT LOG
  it("should create audit log successfully", async () => {
    const req: any = {
      body: { action: "CREATE_PATIENT" },
    };
    const res = mockRes();

    const audit = { id: "audit-123", action: "CREATE_PATIENT" };

    vi.mocked(createAuditLog).mockResolvedValue(audit as any);

    await createAuditController(req, res);

    expect(createAuditLog).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Audit log created successfully",
      data: audit,
    });
  });

  it("should return 400 when audit log creation fails", async () => {
    const req: any = { body: {} };
    const res = mockRes();

    vi.mocked(createAuditLog).mockRejectedValue(
      new Error("Creation failed")
    );

    await createAuditController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Creation failed",
    });
  });

  // GET AUDIT LOGS
  it("should retrieve audit logs successfully", async () => {
    const req: any = {
      query: { page: "1", limit: "10" },
    };
    const res = mockRes();

    const result = {
      data: [{ id: "audit-123" }],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    };

    vi.mocked(getAuditLogs).mockResolvedValue(result as any);

    await getAuditLogsController(req, res);

    expect(getAuditLogs).toHaveBeenCalledWith(req.query);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Audit logs retrieved successfully",
      ...result,
    });
  });

  it("should return 400 when retrieving audit logs fails", async () => {
    const req: any = { query: {} };
    const res = mockRes();

    vi.mocked(getAuditLogs).mockRejectedValue(
      new Error("Retrieval failed")
    );

    await getAuditLogsController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Retrieval failed",
    });
  });

  // GET AUDIT LOG BY ID
  it("should return 404 when audit log is not found", async () => {
    const req: any = {
      params: { id: "missing-id" },
    };
    const res = mockRes();

    vi.mocked(getAuditLogById).mockResolvedValue(null);

    await getAuditLogByIdController(req, res);

    expect(getAuditLogById).toHaveBeenCalledWith("missing-id");
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Audit log not found",
    });
  });

  it("should retrieve audit log by ID successfully", async () => {
    const req: any = {
      params: { id: "audit-123" },
    };
    const res = mockRes();

    const audit = {
      id: "audit-123",
      action: "CREATE_PATIENT",
    };

    vi.mocked(getAuditLogById).mockResolvedValue(audit as any);

    await getAuditLogByIdController(req, res);

    expect(getAuditLogById).toHaveBeenCalledWith("audit-123");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Audit log retrieved successfully",
      data: audit,
    });
  });

  it("should return 400 when retrieving audit log by ID fails", async () => {
    const req: any = {
      params: { id: "audit-123" },
    };
    const res = mockRes();

    vi.mocked(getAuditLogById).mockRejectedValue(
      new Error("Retrieval failed")
    );

    await getAuditLogByIdController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Retrieval failed",
    });
  });
});