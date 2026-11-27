
import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  createLabOrder,
  getLabOrders,
  getLabOrderById,
  updateLabOrderStatus,
  createLabResult,
  verifyLabResult,
} from "../src/modules/laboratory/laboratory.service";

import {
  createLabOrderController,
  getLabOrdersController,
  getLabOrderByIdController,
  updateLabOrderStatusController,
  createLabResultController,
  verifyLabResultController,
} from "../src/modules/laboratory/laboratory.controller";

vi.mock("../src/modules/laboratory/laboratory.service", () => ({
  createLabOrder: vi.fn(),
  getLabOrders: vi.fn(),
  getLabOrderById: vi.fn(),
  updateLabOrderStatus: vi.fn(),
  createLabResult: vi.fn(),
  verifyLabResult: vi.fn(),
}));

const mockRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const patientId = "550e8400-e29b-41d4-a716-446655440001";
const encounterId = "550e8400-e29b-41d4-a716-446655440002";
const staffId = "550e8400-e29b-41d4-a716-446655440003";
const orderId = "550e8400-e29b-41d4-a716-446655440004";
const resultId = "550e8400-e29b-41d4-a716-446655440005";

const orderData = {
  id: orderId,
  order_number: "LAB-2026-12345678",
  encounter_id: encounterId,
  patient_id: patientId,
  ordered_by: staffId,
  test_name: "CBC",
  test_code: "CBC001",
  priority: "routine",
  notes: "Blood test",
  status: "ordered",
};

const validOrderBody = {
  encounter_id: encounterId,
  patient_id: patientId,
  ordered_by: staffId,
  test_name: "CBC",
  test_code: "CBC001",
  priority: "urgent",
  notes: "Blood test",
};

const resultData = {
  id: resultId,
  lab_order_id: orderId,
  result_value: "12.5",
  unit: "g/dL",
  reference_range: "12-16",
  abnormal_flag: "normal",
  interpretation: "Within normal range",
  performed_by: staffId,
};

describe("Laboratory Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // CREATE LAB ORDER

  describe("createLabOrderController", () => {
    it("should create lab order successfully", async () => {
      (createLabOrder as any).mockResolvedValue(orderData);

      const req: any = { body: validOrderBody };
      const res = mockRes();

      await createLabOrderController(req, res);

      expect(createLabOrder).toHaveBeenCalledWith(
        expect.objectContaining(validOrderBody)
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Lab order created successfully",
        data: orderData,
      });
    });

    it("should return 400 for invalid order data", async () => {
      const req: any = {
        body: {
          encounter_id: "invalid",
          patient_id: "invalid",
          ordered_by: "invalid",
          test_name: "",
        },
      };

      const res = mockRes();

      await createLabOrderController(req, res);

      expect(createLabOrder).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Validation failed",
          errors: expect.any(Object),
        })
      );
    });

    it("should return 400 when creation fails", async () => {
      (createLabOrder as any).mockRejectedValue(
        new Error("Encounter not found")
      );

      const req: any = { body: validOrderBody };
      const res = mockRes();

      await createLabOrderController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Encounter not found",
      });
    });
  });

  // GET LAB ORDERS

  describe("getLabOrdersController", () => {
    it("should retrieve lab orders successfully", async () => {
      (getLabOrders as any).mockResolvedValue([orderData]);

      const req: any = { query: {} };
      const res = mockRes();

      await getLabOrdersController(req, res);

      expect(getLabOrders).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Lab orders retrieved successfully",
        data: [orderData],
      });
    });

    it("should pass query filters correctly", async () => {
      const query = {
        patient_id: patientId,
        encounter_id: encounterId,
        status: "completed",
        page: "2",
        limit: "10",
      };

      (getLabOrders as any).mockResolvedValue([]);

      const req: any = { query };
      const res = mockRes();

      await getLabOrdersController(req, res);

      expect(getLabOrders).toHaveBeenCalledWith({
        patient_id: patientId,
        encounter_id: encounterId,
        status: "completed",
        page: 2,
        limit: 10,
      });

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 400 for invalid query parameters", async () => {
      const req: any = {
        query: {
          patient_id: "invalid",
          status: "wrong",
          page: "0",
          limit: "500",
        },
      };

      const res = mockRes();

      await getLabOrdersController(req, res);

      expect(getLabOrders).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Invalid query parameters",
          errors: expect.any(Object),
        })
      );
    });

    it("should return 500 when retrieving orders fails", async () => {
      (getLabOrders as any).mockRejectedValue(
        new Error("Database error")
      );

      const req: any = { query: {} };
      const res = mockRes();

      await getLabOrdersController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Database error",
      });
    });
  });

  // GET LAB ORDER BY ID

  describe("getLabOrderByIdController", () => {
    it("should retrieve order successfully", async () => {
      (getLabOrderById as any).mockResolvedValue(orderData);

      const req: any = { params: { id: orderId } };
      const res = mockRes();

      await getLabOrderByIdController(req, res);

      expect(getLabOrderById).toHaveBeenCalledWith(orderId);
      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Lab order retrieved successfully",
        data: orderData,
      });
    });

    it("should return 404 when order does not exist", async () => {
      (getLabOrderById as any).mockResolvedValue(null);

      const req: any = { params: { id: "missing-id" } };
      const res = mockRes();

      await getLabOrderByIdController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Lab order not found",
      });
    });

    it("should return 500 when fetching order fails", async () => {
      (getLabOrderById as any).mockRejectedValue(
        new Error("Database error")
      );

      const req: any = { params: { id: orderId } };
      const res = mockRes();

      await getLabOrderByIdController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Database error",
      });
    });
  });

  // UPDATE LAB ORDER STATUS

  describe("updateLabOrderStatusController", () => {
    it("should update order status successfully", async () => {
      const updatedOrder = {
        ...orderData,
        status: "completed",
      };

      (updateLabOrderStatus as any).mockResolvedValue(updatedOrder);

      const req: any = {
        params: { id: orderId },
        body: { status: "completed" },
      };

      const res = mockRes();

      await updateLabOrderStatusController(req, res);

      expect(updateLabOrderStatus).toHaveBeenCalledWith(
        orderId,
        "completed"
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Lab order status updated successfully",
        data: updatedOrder,
      });
    });

    it("should return 400 for invalid status", async () => {
      const req: any = {
        params: { id: orderId },
        body: { status: "invalid-status" },
      };

      const res = mockRes();

      await updateLabOrderStatusController(req, res);

      expect(updateLabOrderStatus).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Invalid status",
          errors: expect.any(Object),
        })
      );
    });

    it("should return 404 when order does not exist", async () => {
      (updateLabOrderStatus as any).mockResolvedValue(null);

      const req: any = {
        params: { id: orderId },
        body: { status: "completed" },
      };

      const res = mockRes();

      await updateLabOrderStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Lab order not found",
      });
    });

    it("should return 500 when status update fails", async () => {
      (updateLabOrderStatus as any).mockRejectedValue(
        new Error("Database error")
      );

      const req: any = {
        params: { id: orderId },
        body: { status: "completed" },
      };

      const res = mockRes();

      await updateLabOrderStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Database error",
      });
    });
  });

  // CREATE LAB RESULT

  describe("createLabResultController", () => {
    const validResultBody = {
      result_value: "12.5",
      unit: "g/dL",
      reference_range: "12-16",
      abnormal_flag: "normal",
      interpretation: "Within normal range",
      performed_by: staffId,
    };

    it("should create lab result successfully", async () => {
      (createLabResult as any).mockResolvedValue(resultData);

      const req: any = {
        params: { id: orderId },
        body: validResultBody,
      };

      const res = mockRes();

      await createLabResultController(req, res);

      expect(createLabResult).toHaveBeenCalledWith(
        orderId,
        expect.objectContaining(validResultBody)
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Lab result recorded successfully",
        data: resultData,
      });
    });

    it("should return 400 for invalid result data", async () => {
      const req: any = {
        params: { id: orderId },
        body: {
          result_value: "",
          abnormal_flag: "wrong-value",
          performed_by: "invalid-id",
        },
      };

      const res = mockRes();

      await createLabResultController(req, res);

      expect(createLabResult).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Validation failed",
          errors: expect.any(Object),
        })
      );
    });

    it("should return 400 when result creation fails", async () => {
      (createLabResult as any).mockRejectedValue(
        new Error("Lab order not found")
      );

      const req: any = {
        params: { id: orderId },
        body: validResultBody,
      };

      const res = mockRes();

      await createLabResultController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Lab order not found",
      });
    });
  });

  // VERIFY LAB RESULT

  describe("verifyLabResultController", () => {
    it("should verify lab result successfully", async () => {
      const verifiedResult = {
        ...resultData,
        verified_by: staffId,
      };

      (verifyLabResult as any).mockResolvedValue(verifiedResult);

      const req: any = {
        params: { resultId },
        body: { verified_by: staffId },
      };

      const res = mockRes();

      await verifyLabResultController(req, res);

      expect(verifyLabResult).toHaveBeenCalledWith(
        resultId,
        staffId
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Lab result verified successfully",
        data: verifiedResult,
      });
    });

    it("should return 400 for invalid verification data", async () => {
      const req: any = {
        params: { resultId },
        body: { verified_by: "invalid-id" },
      };

      const res = mockRes();

      await verifyLabResultController(req, res);

      expect(verifyLabResult).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Validation failed",
          errors: expect.any(Object),
        })
      );
    });

    it("should return 404 when result does not exist", async () => {
      (verifyLabResult as any).mockResolvedValue(null);

      const req: any = {
        params: { resultId },
        body: { verified_by: staffId },
      };

      const res = mockRes();

      await verifyLabResultController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Lab result not found",
      });
    });

    it("should return 500 when verification fails", async () => {
      (verifyLabResult as any).mockRejectedValue(
        new Error("Database error")
      );

      const req: any = {
        params: { resultId },
        body: { verified_by: staffId },
      };

      const res = mockRes();

      await verifyLabResultController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Database error",
      });
    });
  });
});
