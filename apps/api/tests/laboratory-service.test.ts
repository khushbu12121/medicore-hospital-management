
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPoolQuery, mockConnect, mockClientQuery, mockRelease } =
  vi.hoisted(() => ({
    mockPoolQuery: vi.fn(),
    mockConnect: vi.fn(),
    mockClientQuery: vi.fn(),
    mockRelease: vi.fn(),
  }));

vi.mock("../src/config/database", () => ({
  pool: {
    query: mockPoolQuery,
    connect: mockConnect,
  },
}));

import {
  createLabOrder,
  getLabOrders,
  getLabOrderById,
  updateLabOrderStatus,
  createLabResult,
  verifyLabResult,
} from "../src/modules/laboratory/laboratory.service";

describe("Laboratory Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockConnect.mockResolvedValue({
      query: mockClientQuery,
      release: mockRelease,
    });
  });

  // ---------------- CREATE LAB ORDER ----------------

  describe("createLabOrder", () => {
    const validData = {
      encounter_id: "encounter-123",
      patient_id: "patient-123",
      ordered_by: "staff-123",
      test_name: "CBC",
      test_code: "CBC001",
      priority: "urgent" as const,
      notes: "Test notes",
    };

    it("should create lab order successfully", async () => {
      mockClientQuery
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({
          rows: [
            {
              id: "encounter-123",
              patient_id: "patient-123",
              status: "active",
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ id: "patient-123" }] })
        .mockResolvedValueOnce({ rows: [{ id: "staff-123" }] })
        .mockResolvedValueOnce({
          rows: [{ id: "lab-123", test_name: "CBC" }],
        })
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const result = await createLabOrder(validData);

      expect(result).toEqual({
        id: "lab-123",
        test_name: "CBC",
      });

      expect(mockClientQuery).toHaveBeenCalledWith("BEGIN");
      expect(mockClientQuery).toHaveBeenCalledWith("COMMIT");
      expect(mockRelease).toHaveBeenCalled();
    });

    it("should use null for optional test_code and notes", async () => {
      const data = {
        ...validData,
        test_code: undefined,
        notes: undefined,
      };

      mockClientQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: "encounter-123",
              patient_id: "patient-123",
              status: "active",
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ id: "patient-123" }] })
        .mockResolvedValueOnce({ rows: [{ id: "staff-123" }] })
        .mockResolvedValueOnce({ rows: [{ id: "lab-123" }] })
        .mockResolvedValueOnce({ rows: [] });

      await createLabOrder(data);

      const insertCall = mockClientQuery.mock.calls[4];

      expect(insertCall[1]).toContain(null);
    });

    it("should throw when encounter does not exist", async () => {
      mockClientQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

      await expect(createLabOrder(validData)).rejects.toThrow(
        "Encounter not found"
      );

      expect(mockClientQuery).toHaveBeenCalledWith("ROLLBACK");
      expect(mockRelease).toHaveBeenCalled();
    });

    it("should throw when patient does not match encounter", async () => {
      mockClientQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: "encounter-123",
              patient_id: "different-patient",
              status: "active",
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] });

      await expect(createLabOrder(validData)).rejects.toThrow(
        "Patient does not match encounter"
      );

      expect(mockClientQuery).toHaveBeenCalledWith("ROLLBACK");
    });

    it("should reject cancelled encounters", async () => {
      mockClientQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: "encounter-123",
              patient_id: "patient-123",
              status: "cancelled",
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] });

      await expect(createLabOrder(validData)).rejects.toThrow(
        "Cannot order lab tests for cancelled encounter"
      );

      expect(mockClientQuery).toHaveBeenCalledWith("ROLLBACK");
    });

    it("should throw when patient is inactive or missing", async () => {
      mockClientQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: "encounter-123",
              patient_id: "patient-123",
              status: "active",
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await expect(createLabOrder(validData)).rejects.toThrow(
        "Patient not found or inactive"
      );

      expect(mockClientQuery).toHaveBeenCalledWith("ROLLBACK");
    });

    it("should throw when ordering staff is inactive or missing", async () => {
      mockClientQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: "encounter-123",
              patient_id: "patient-123",
              status: "active",
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ id: "patient-123" }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await expect(createLabOrder(validData)).rejects.toThrow(
        "Ordering staff not found or inactive"
      );

      expect(mockClientQuery).toHaveBeenCalledWith("ROLLBACK");
    });

    it("should rollback when database insert fails", async () => {
      mockClientQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: "encounter-123",
              patient_id: "patient-123",
              status: "active",
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ id: "patient-123" }] })
        .mockResolvedValueOnce({ rows: [{ id: "staff-123" }] })
        .mockRejectedValueOnce(new Error("Database error"))
        .mockResolvedValueOnce({ rows: [] });

      await expect(createLabOrder(validData)).rejects.toThrow(
        "Database error"
      );

      expect(mockClientQuery).toHaveBeenCalledWith("ROLLBACK");
      expect(mockRelease).toHaveBeenCalled();
    });
  });

  // ---------------- GET LAB ORDERS ----------------

  describe("getLabOrders", () => {
    it("should return lab orders without filters", async () => {
      mockPoolQuery.mockResolvedValue({
        rows: [{ id: "lab-1" }, { id: "lab-2" }],
      });

      const result = await getLabOrders({
        page: 1,
        limit: 20,
      });

      expect(result).toHaveLength(2);
      expect(mockPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining("GROUP BY lo.id"),
        [20, 0]
      );
    });

    it("should filter by patient_id", async () => {
      mockPoolQuery.mockResolvedValue({ rows: [] });

      await getLabOrders({
        patient_id: "patient-123",
        page: 1,
        limit: 20,
      });

      expect(mockPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining("lo.patient_id = $1"),
        ["patient-123", 20, 0]
      );
    });

    it("should filter by encounter_id", async () => {
      mockPoolQuery.mockResolvedValue({ rows: [] });

      await getLabOrders({
        encounter_id: "encounter-123",
        page: 1,
        limit: 20,
      });

      expect(mockPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining("lo.encounter_id = $1"),
        ["encounter-123", 20, 0]
      );
    });

    it("should filter by status", async () => {
      mockPoolQuery.mockResolvedValue({ rows: [] });

      await getLabOrders({
        status: "completed",
        page: 1,
        limit: 20,
      });

      expect(mockPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining("lo.status = $1"),
        ["completed", 20, 0]
      );
    });

    it("should apply all filters together", async () => {
      mockPoolQuery.mockResolvedValue({ rows: [] });

      await getLabOrders({
        patient_id: "patient-123",
        encounter_id: "encounter-123",
        status: "ordered",
        page: 2,
        limit: 10,
      });

      expect(mockPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining(
          "lo.patient_id = $1 AND lo.encounter_id = $2 AND lo.status = $3"
        ),
        ["patient-123", "encounter-123", "ordered", 10, 10]
      );
    });

    it("should calculate offset correctly", async () => {
      mockPoolQuery.mockResolvedValue({ rows: [] });

      await getLabOrders({
        page: 3,
        limit: 15,
      });

      expect(mockPoolQuery).toHaveBeenCalledWith(
        expect.any(String),
        [15, 30]
      );
    });
  });

  // ---------------- GET LAB ORDER BY ID ----------------

  describe("getLabOrderById", () => {
    it("should return lab order when found", async () => {
      const labOrder = { id: "lab-123", test_name: "CBC" };

      mockPoolQuery.mockResolvedValue({
        rows: [labOrder],
      });

      const result = await getLabOrderById("lab-123");

      expect(result).toEqual(labOrder);
      expect(mockPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining("WHERE lo.id = $1"),
        ["lab-123"]
      );
    });

    it("should return null when lab order is not found", async () => {
      mockPoolQuery.mockResolvedValue({
        rows: [],
      });

      const result = await getLabOrderById("missing-id");

      expect(result).toBeNull();
    });
  });

  // ---------------- UPDATE LAB ORDER STATUS ----------------

  describe("updateLabOrderStatus", () => {
    it("should update lab order status", async () => {
      mockPoolQuery.mockResolvedValue({
        rows: [{ id: "lab-123", status: "processing" }],
      });

      const result = await updateLabOrderStatus(
        "lab-123",
        "processing"
      );

      expect(result).toEqual({
        id: "lab-123",
        status: "processing",
      });

      expect(mockPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE lab_orders"),
        ["lab-123", "processing"]
      );
    });

    it("should return null when lab order does not exist", async () => {
      mockPoolQuery.mockResolvedValue({
        rows: [],
      });

      const result = await updateLabOrderStatus(
        "missing-id",
        "collected"
      );

      expect(result).toBeNull();
    });

    it("should set collected_at when status is collected", async () => {
      mockPoolQuery.mockResolvedValue({
        rows: [{ id: "lab-123", status: "collected" }],
      });

      await updateLabOrderStatus("lab-123", "collected");

      expect(mockPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining("WHEN $2::varchar = 'collected'"),
        ["lab-123", "collected"]
      );
    });

    it("should set completed_at when status is completed", async () => {
      mockPoolQuery.mockResolvedValue({
        rows: [{ id: "lab-123", status: "completed" }],
      });

      await updateLabOrderStatus("lab-123", "completed");

      expect(mockPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining("WHEN $2::varchar = 'completed'"),
        ["lab-123", "completed"]
      );
    });
  });

  // ---------------- CREATE LAB RESULT ----------------

  describe("createLabResult", () => {
    const resultData = {
      result_value: "12.5",
      unit: "g/dL",
      reference_range: "12-16",
      abnormal_flag: "normal" as const,
      interpretation: "Within normal range",
      performed_by: "staff-123",
    };

    it("should create lab result successfully", async () => {
      mockClientQuery
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({
          rows: [{ id: "lab-123", status: "processing" }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: "result-123", result_value: "12.5" }],
        })
        .mockResolvedValueOnce({ rows: [] }) // UPDATE
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const result = await createLabResult("lab-123", resultData);

      expect(result).toEqual({
        id: "result-123",
        result_value: "12.5",
      });

      expect(mockClientQuery).toHaveBeenCalledWith("BEGIN");
      expect(mockClientQuery).toHaveBeenCalledWith("COMMIT");
      expect(mockRelease).toHaveBeenCalled();
    });

    it("should use null for optional fields", async () => {
      const data = {
        result_value: "12.5",
      };

      mockClientQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{ id: "lab-123", status: "processing" }],
        })
        .mockResolvedValueOnce({ rows: [{ id: "result-123" }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await createLabResult("lab-123", data);

      const insertCall = mockClientQuery.mock.calls[2];

      expect(insertCall[1]).toEqual([
        "lab-123",
        "12.5",
        null,
        null,
        null,
        null,
        null,
      ]);
    });

    it("should throw when lab order does not exist", async () => {
      mockClientQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await expect(
        createLabResult("missing-id", resultData)
      ).rejects.toThrow("Lab order not found");

      expect(mockClientQuery).toHaveBeenCalledWith("ROLLBACK");
    });

    it("should reject cancelled lab orders", async () => {
      mockClientQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{ id: "lab-123", status: "cancelled" }],
        })
        .mockResolvedValueOnce({ rows: [] });

      await expect(
        createLabResult("lab-123", resultData)
      ).rejects.toThrow("Cannot add result to cancelled lab order");

      expect(mockClientQuery).toHaveBeenCalledWith("ROLLBACK");
    });

    it("should rollback when result insertion fails", async () => {
      mockClientQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{ id: "lab-123", status: "processing" }],
        })
        .mockRejectedValueOnce(new Error("Insert failed"))
        .mockResolvedValueOnce({ rows: [] });

      await expect(
        createLabResult("lab-123", resultData)
      ).rejects.toThrow("Insert failed");

      expect(mockClientQuery).toHaveBeenCalledWith("ROLLBACK");
      expect(mockRelease).toHaveBeenCalled();
    });
  });

  // ---------------- VERIFY LAB RESULT ----------------

  describe("verifyLabResult", () => {
    it("should verify lab result successfully", async () => {
      const verifiedResult = {
        id: "result-123",
        verified_by: "staff-123",
      };

      mockPoolQuery.mockResolvedValue({
        rows: [verifiedResult],
      });

      const result = await verifyLabResult(
        "result-123",
        "staff-123"
      );

      expect(result).toEqual(verifiedResult);

      expect(mockPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE lab_results"),
        ["result-123", "staff-123"]
      );
    });

    it("should return null when result does not exist", async () => {
      mockPoolQuery.mockResolvedValue({
        rows: [],
      });

      const result = await verifyLabResult(
        "missing-result",
        "staff-123"
      );

      expect(result).toBeNull();
    });
  });
});
