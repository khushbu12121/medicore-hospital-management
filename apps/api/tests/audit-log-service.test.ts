
import { describe, it, expect, vi, beforeEach } from "vitest";

const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
}));

vi.mock("../src/config/database", () => ({
  pool: {
    query: queryMock,
  },
}));

import {
  createAuditLog,
  getAuditLogs,
  getAuditLogById,
} from "../src/modules/audit/audit.service";

describe("Audit Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // CREATE AUDIT LOG
  // ============================================

  describe("createAuditLog", () => {
    it("should create an audit log successfully", async () => {
      const input = {
        user_id: "11111111-1111-4111-8111-111111111111",
        action: "CREATE",
        entity_type: "patient",
        entity_id: "22222222-2222-4222-8222-222222222222",
        patient_id: "33333333-3333-4333-8333-333333333333",
        ip_address: "127.0.0.1",
        request_id: "request-123",
        details: {
          message: "Patient created",
        },
      };

      const mockAuditLog = {
        id: "44444444-4444-4444-8444-444444444444",
        ...input,
      };

      queryMock.mockResolvedValueOnce({
        rows: [mockAuditLog],
      });

      const result = await createAuditLog(input);

      expect(result).toEqual(mockAuditLog);
      expect(queryMock).toHaveBeenCalledTimes(1);
    });

    it("should insert correct values into database", async () => {
      const input = {
        action: "LOGIN",
        entity_type: "user",
      };

      queryMock.mockResolvedValueOnce({
        rows: [{ id: "audit-1" }],
      });

      await createAuditLog(input);

      const queryValues = queryMock.mock.calls[0][1];

      expect(queryValues).toEqual([
        null,
        "LOGIN",
        "user",
        null,
        null,
        null,
        null,
        null,
      ]);
    });

    it("should handle optional fields as null", async () => {
      const input = {
        action: "READ",
        entity_type: "patient",
      };

      queryMock.mockResolvedValueOnce({
        rows: [{ id: "audit-1" }],
      });

      await createAuditLog(input);

      const values = queryMock.mock.calls[0][1];

      expect(values[0]).toBeNull();
      expect(values[3]).toBeNull();
      expect(values[4]).toBeNull();
      expect(values[5]).toBeNull();
      expect(values[6]).toBeNull();
      expect(values[7]).toBeNull();
    });

    it("should serialize details as JSON", async () => {
      const details = {
        changed_fields: ["name", "email"],
        previous_value: "old",
        new_value: "new",
      };

      queryMock.mockResolvedValueOnce({
        rows: [{ id: "audit-1" }],
      });

      await createAuditLog({
        action: "UPDATE",
        entity_type: "patient",
        details,
      });

      const values = queryMock.mock.calls[0][1];

      expect(values[7]).toBe(JSON.stringify(details));
    });

    it("should handle null details", async () => {
      queryMock.mockResolvedValueOnce({
        rows: [{ id: "audit-1" }],
      });

      await createAuditLog({
        action: "DELETE",
        entity_type: "patient",
        details: null,
      });

      const values = queryMock.mock.calls[0][1];

      expect(values[7]).toBeNull();
    });

    it("should reject empty action", async () => {
      await expect(
        createAuditLog({
          action: "",
          entity_type: "patient",
        })
      ).rejects.toThrow();

      expect(queryMock).not.toHaveBeenCalled();
    });

    it("should reject empty entity_type", async () => {
      await expect(
        createAuditLog({
          action: "CREATE",
          entity_type: "",
        })
      ).rejects.toThrow();

      expect(queryMock).not.toHaveBeenCalled();
    });

    it("should reject action longer than 100 characters", async () => {
      await expect(
        createAuditLog({
          action: "A".repeat(101),
          entity_type: "patient",
        })
      ).rejects.toThrow();

      expect(queryMock).not.toHaveBeenCalled();
    });

    it("should reject entity_type longer than 100 characters", async () => {
      await expect(
        createAuditLog({
          action: "CREATE",
          entity_type: "A".repeat(101),
        })
      ).rejects.toThrow();

      expect(queryMock).not.toHaveBeenCalled();
    });

    it("should reject invalid user_id UUID", async () => {
      await expect(
        createAuditLog({
          user_id: "invalid-uuid",
          action: "CREATE",
          entity_type: "patient",
        })
      ).rejects.toThrow();

      expect(queryMock).not.toHaveBeenCalled();
    });

    it("should reject invalid entity_id UUID", async () => {
      await expect(
        createAuditLog({
          action: "CREATE",
          entity_type: "patient",
          entity_id: "invalid-uuid",
        })
      ).rejects.toThrow();

      expect(queryMock).not.toHaveBeenCalled();
    });

    it("should reject invalid patient_id UUID", async () => {
      await expect(
        createAuditLog({
          action: "CREATE",
          entity_type: "patient",
          patient_id: "invalid-uuid",
        })
      ).rejects.toThrow();

      expect(queryMock).not.toHaveBeenCalled();
    });

    it("should propagate database error", async () => {
      queryMock.mockRejectedValueOnce(
        new Error("Database error")
      );

      await expect(
        createAuditLog({
          action: "CREATE",
          entity_type: "patient",
        })
      ).rejects.toThrow("Database error");
    });
  });

  // ============================================
  // GET AUDIT LOGS
  // ============================================

  describe("getAuditLogs", () => {
    it("should return audit logs with default pagination", async () => {
      const mockLogs = [
        { id: "audit-1", action: "CREATE" },
        { id: "audit-2", action: "UPDATE" },
      ];

      queryMock
        .mockResolvedValueOnce({
          rows: [{ count: "2" }],
        })
        .mockResolvedValueOnce({
          rows: mockLogs,
        });

      const result = await getAuditLogs({});

      expect(result.data).toEqual(mockLogs);

      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });

      expect(queryMock).toHaveBeenCalledTimes(2);
    });

    it("should return empty data when no audit logs exist", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [{ count: "0" }],
        })
        .mockResolvedValueOnce({
          rows: [],
        });

      const result = await getAuditLogs({});

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });

    it("should filter by user_id", async () => {
      const userId = "11111111-1111-4111-8111-111111111111";

      queryMock
        .mockResolvedValueOnce({
          rows: [{ count: "1" }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: "audit-1", user_id: userId }],
        });

      const result = await getAuditLogs({
        user_id: userId,
      });

      expect(result.data).toHaveLength(1);

      expect(queryMock.mock.calls[0][0]).toContain(
        "WHERE user_id = $1"
      );

      expect(queryMock.mock.calls[0][1]).toEqual([
        userId,
      ]);
    });

    it("should filter by action", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [{ count: "1" }],
        })
        .mockResolvedValueOnce({
          rows: [{ action: "CREATE" }],
        });

      const result = await getAuditLogs({
        action: "CREATE",
      });

      expect(result.data).toHaveLength(1);

      expect(queryMock.mock.calls[0][0]).toContain(
        "WHERE action = $1"
      );

      expect(queryMock.mock.calls[0][1]).toEqual([
        "CREATE",
      ]);
    });

    it("should filter by entity_type", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [{ count: "1" }],
        })
        .mockResolvedValueOnce({
          rows: [{ entity_type: "patient" }],
        });

      const result = await getAuditLogs({
        entity_type: "patient",
      });

      expect(result.data).toHaveLength(1);

      expect(queryMock.mock.calls[0][0]).toContain(
        "WHERE entity_type = $1"
      );
    });

    it("should filter by entity_id", async () => {
      const entityId =
        "22222222-2222-4222-8222-222222222222";

      queryMock
        .mockResolvedValueOnce({
          rows: [{ count: "1" }],
        })
        .mockResolvedValueOnce({
          rows: [{ entity_id: entityId }],
        });

      const result = await getAuditLogs({
        entity_id: entityId,
      });

      expect(result.data).toHaveLength(1);
      expect(queryMock.mock.calls[0][1]).toEqual([
        entityId,
      ]);
    });

    it("should filter by patient_id", async () => {
      const patientId =
        "33333333-3333-4333-8333-333333333333";

      queryMock
        .mockResolvedValueOnce({
          rows: [{ count: "1" }],
        })
        .mockResolvedValueOnce({
          rows: [{ patient_id: patientId }],
        });

      const result = await getAuditLogs({
        patient_id: patientId,
      });

      expect(result.data).toHaveLength(1);
      expect(queryMock.mock.calls[0][1]).toEqual([
        patientId,
      ]);
    });

    it("should filter by request_id", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [{ count: "1" }],
        })
        .mockResolvedValueOnce({
          rows: [{ request_id: "request-123" }],
        });

      const result = await getAuditLogs({
        request_id: "request-123",
      });

      expect(result.data).toHaveLength(1);

      expect(queryMock.mock.calls[0][0]).toContain(
        "WHERE request_id = $1"
      );

      expect(queryMock.mock.calls[0][1]).toEqual([
        "request-123",
      ]);
    });

    it("should apply multiple filters together", async () => {
      const userId =
        "11111111-1111-4111-8111-111111111111";

      const patientId =
        "33333333-3333-4333-8333-333333333333";

      queryMock
        .mockResolvedValueOnce({
          rows: [{ count: "1" }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: "audit-1" }],
        });

      await getAuditLogs({
        user_id: userId,
        action: "CREATE",
        entity_type: "patient",
        patient_id: patientId,
        request_id: "request-123",
      });

      const countQuery = queryMock.mock.calls[0][0];
      const countValues = queryMock.mock.calls[0][1];

      expect(countQuery).toContain("user_id = $1");
      expect(countQuery).toContain("action = $2");
      expect(countQuery).toContain("entity_type = $3");
      expect(countQuery).toContain("patient_id = $4");
      expect(countQuery).toContain("request_id = $5");

      expect(countValues).toEqual([
        userId,
        "CREATE",
        "patient",
        patientId,
        "request-123",
      ]);
    });

    it("should calculate pagination correctly", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [{ count: "50" }],
        })
        .mockResolvedValueOnce({
          rows: [],
        });

      const result = await getAuditLogs({
        page: 3,
        limit: 10,
      });

      expect(result.pagination).toEqual({
        page: 3,
        limit: 10,
        total: 50,
        totalPages: 5,
      });

      const dataValues = queryMock.mock.calls[1][1];

      expect(dataValues).toEqual([10, 20]);
    });

    it("should calculate totalPages correctly", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [{ count: "21" }],
        })
        .mockResolvedValueOnce({
          rows: [],
        });

      const result = await getAuditLogs({
        limit: 10,
      });

      expect(result.pagination.totalPages).toBe(3);
    });

    it("should use correct limit and offset", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [{ count: "100" }],
        })
        .mockResolvedValueOnce({
          rows: [],
        });

      await getAuditLogs({
        page: 2,
        limit: 25,
      });

      const dataValues = queryMock.mock.calls[1][1];

      expect(dataValues).toEqual([25, 25]);
    });

    it("should reject invalid page number", async () => {
      await expect(
        getAuditLogs({
          page: 0,
        })
      ).rejects.toThrow();

      expect(queryMock).not.toHaveBeenCalled();
    });

    it("should reject negative page number", async () => {
      await expect(
        getAuditLogs({
          page: -1,
        })
      ).rejects.toThrow();

      expect(queryMock).not.toHaveBeenCalled();
    });

    it("should reject invalid limit", async () => {
      await expect(
        getAuditLogs({
          limit: 0,
        })
      ).rejects.toThrow();

      expect(queryMock).not.toHaveBeenCalled();
    });

    it("should reject limit greater than 100", async () => {
      await expect(
        getAuditLogs({
          limit: 101,
        })
      ).rejects.toThrow();

      expect(queryMock).not.toHaveBeenCalled();
    });

    it("should reject invalid user_id UUID", async () => {
      await expect(
        getAuditLogs({
          user_id: "invalid-uuid",
        })
      ).rejects.toThrow();

      expect(queryMock).not.toHaveBeenCalled();
    });

    it("should reject invalid entity_id UUID", async () => {
      await expect(
        getAuditLogs({
          entity_id: "invalid-uuid",
        })
      ).rejects.toThrow();

      expect(queryMock).not.toHaveBeenCalled();
    });

    it("should reject invalid patient_id UUID", async () => {
      await expect(
        getAuditLogs({
          patient_id: "invalid-uuid",
        })
      ).rejects.toThrow();

      expect(queryMock).not.toHaveBeenCalled();
    });

    it("should propagate database error from count query", async () => {
      queryMock.mockRejectedValueOnce(
        new Error("Count query failed")
      );

      await expect(
        getAuditLogs({})
      ).rejects.toThrow("Count query failed");
    });

    it("should propagate database error from data query", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [{ count: "5" }],
        })
        .mockRejectedValueOnce(
          new Error("Data query failed")
        );

      await expect(
        getAuditLogs({})
      ).rejects.toThrow("Data query failed");
    });
  });

  // ============================================
  // GET AUDIT LOG BY ID
  // ============================================

  describe("getAuditLogById", () => {
    it("should return audit log when found", async () => {
      const mockAuditLog = {
        id: "44444444-4444-4444-8444-444444444444",
        action: "CREATE",
        entity_type: "patient",
      };

      queryMock.mockResolvedValueOnce({
        rows: [mockAuditLog],
      });

      const result = await getAuditLogById(
        mockAuditLog.id
      );

      expect(result).toEqual(mockAuditLog);
      expect(queryMock).toHaveBeenCalledTimes(1);
    });

    it("should return null when audit log does not exist", async () => {
      queryMock.mockResolvedValueOnce({
        rows: [],
      });

      const result = await getAuditLogById(
        "44444444-4444-4444-8444-444444444444"
      );

      expect(result).toBeNull();
    });

    it("should query using the provided ID", async () => {
      const id =
        "44444444-4444-4444-8444-444444444444";

      queryMock.mockResolvedValueOnce({
        rows: [{ id }],
      });

      await getAuditLogById(id);

      expect(queryMock.mock.calls[0][1]).toEqual([
        id,
      ]);
    });

    it("should propagate database error", async () => {
      queryMock.mockRejectedValueOnce(
        new Error("Database error")
      );

      await expect(
        getAuditLogById(
          "44444444-4444-4444-8444-444444444444"
        )
      ).rejects.toThrow("Database error");
    });
  });
});
