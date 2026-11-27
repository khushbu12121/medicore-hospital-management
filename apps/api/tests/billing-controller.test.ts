
import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  createPayment,
  updateInvoiceStatus,
} from "../src/modules/billing/billing.service";

import {
  createInvoiceController,
  getInvoicesController,
  getInvoiceByIdController,
  createPaymentController,
  updateInvoiceStatusController,
} from "../src/modules/billing/billing.controller";

vi.mock("../src/modules/billing/billing.service", () => ({
  createInvoice: vi.fn(),
  getInvoices: vi.fn(),
  getInvoiceById: vi.fn(),
  createPayment: vi.fn(),
  updateInvoiceStatus: vi.fn(),
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
const invoiceId = "550e8400-e29b-41d4-a716-446655440004";

const invoiceData = {
  id: invoiceId,
  invoice_number: "INV-2026-12345678",
  patient_id: patientId,
  encounter_id: encounterId,
  subtotal: 1000,
  tax_amount: 100,
  discount_amount: 50,
  total_amount: 1050,
  status: "pending",
};

const validInvoiceBody = {
  patient_id: patientId,
  encounter_id: encounterId,
  created_by: staffId,
  due_date: "2026-12-31",
  tax_amount: 100,
  discount_amount: 50,
  items: [
    {
      description: "Consultation",
      quantity: 2,
      unit_price: 500,
    },
  ],
};

describe("Billing Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // CREATE INVOICE

  describe("createInvoiceController", () => {
    it("should create invoice successfully", async () => {
      (createInvoice as any).mockResolvedValue(invoiceData);

      const req: any = { body: validInvoiceBody };
      const res = mockRes();

      await createInvoiceController(req, res);

      expect(createInvoice).toHaveBeenCalledWith(
        expect.objectContaining(validInvoiceBody)
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Invoice created successfully",
        data: invoiceData,
      });
    });

    it("should return 400 for invalid invoice data", async () => {
      const req: any = {
        body: {
          patient_id: "invalid-id",
          items: [],
        },
      };

      const res = mockRes();

      await createInvoiceController(req, res);

      expect(createInvoice).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Validation failed",
          errors: expect.any(Object),
        })
      );
    });

    it("should return 400 when invoice creation fails", async () => {
      (createInvoice as any).mockRejectedValue(
        new Error("Patient not found or inactive")
      );

      const req: any = { body: validInvoiceBody };
      const res = mockRes();

      await createInvoiceController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Patient not found or inactive",
      });
    });
  });

  // GET INVOICES

  describe("getInvoicesController", () => {
    it("should retrieve invoices successfully", async () => {
      (getInvoices as any).mockResolvedValue([invoiceData]);

      const req: any = { query: {} };
      const res = mockRes();

      await getInvoicesController(req, res);

      expect(getInvoices).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Invoices retrieved successfully",
        data: [invoiceData],
      });
    });

    it("should pass filters to service", async () => {
      const query = {
        patient_id: patientId,
        status: "pending",
        page: "2",
        limit: "10",
      };

      (getInvoices as any).mockResolvedValue([]);

      const req: any = { query };
      const res = mockRes();

      await getInvoicesController(req, res);

      expect(getInvoices).toHaveBeenCalledWith({
        patient_id: patientId,
        status: "pending",
        page: 2,
        limit: 10,
      });

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 400 for invalid query parameters", async () => {
      const req: any = {
        query: {
          patient_id: "invalid",
          status: "wrong-status",
          page: "0",
          limit: "200",
        },
      };

      const res = mockRes();

      await getInvoicesController(req, res);

      expect(getInvoices).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Invalid query parameters",
          errors: expect.any(Object),
        })
      );
    });

    it("should return 500 when retrieving invoices fails", async () => {
      (getInvoices as any).mockRejectedValue(
        new Error("Database error")
      );

      const req: any = { query: {} };
      const res = mockRes();

      await getInvoicesController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Database error",
      });
    });
  });

  // GET INVOICE BY ID

  describe("getInvoiceByIdController", () => {
    it("should retrieve invoice successfully", async () => {
      (getInvoiceById as any).mockResolvedValue(invoiceData);

      const req: any = {
        params: { id: invoiceId },
      };

      const res = mockRes();

      await getInvoiceByIdController(req, res);

      expect(getInvoiceById).toHaveBeenCalledWith(invoiceId);
      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Invoice retrieved successfully",
        data: invoiceData,
      });
    });

    it("should return 404 when invoice does not exist", async () => {
      (getInvoiceById as any).mockResolvedValue(null);

      const req: any = {
        params: { id: "missing-id" },
      };

      const res = mockRes();

      await getInvoiceByIdController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invoice not found",
      });
    });

    it("should return 500 when fetching invoice fails", async () => {
      (getInvoiceById as any).mockRejectedValue(
        new Error("Database error")
      );

      const req: any = {
        params: { id: invoiceId },
      };

      const res = mockRes();

      await getInvoiceByIdController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Database error",
      });
    });
  });

  // CREATE PAYMENT

  describe("createPaymentController", () => {
    const paymentBody = {
      amount: 500,
      payment_method: "upi",
      transaction_reference: "TXN123",
      received_by: staffId,
    };

    const paymentData = {
      id: "payment-123",
      invoice_id: invoiceId,
      amount: 500,
      payment_method: "upi",
      status: "completed",
    };

    it("should record payment successfully", async () => {
      (createPayment as any).mockResolvedValue(paymentData);

      const req: any = {
        params: { id: invoiceId },
        body: paymentBody,
      };

      const res = mockRes();

      await createPaymentController(req, res);

      expect(createPayment).toHaveBeenCalledWith(
        invoiceId,
        paymentBody
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Payment recorded successfully",
        data: paymentData,
      });
    });

    it("should return 400 for invalid payment data", async () => {
      const req: any = {
        params: { id: invoiceId },
        body: {
          amount: -100,
          payment_method: "invalid-method",
        },
      };

      const res = mockRes();

      await createPaymentController(req, res);

      expect(createPayment).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Validation failed",
          errors: expect.any(Object),
        })
      );
    });

    it("should return 400 when payment creation fails", async () => {
      (createPayment as any).mockRejectedValue(
        new Error("Payment exceeds outstanding balance")
      );

      const req: any = {
        params: { id: invoiceId },
        body: paymentBody,
      };

      const res = mockRes();

      await createPaymentController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Payment exceeds outstanding balance",
      });
    });
  });

  // UPDATE INVOICE STATUS

  describe("updateInvoiceStatusController", () => {
    it("should update invoice status successfully", async () => {
      const updatedInvoice = {
        ...invoiceData,
        status: "paid",
      };

      (updateInvoiceStatus as any).mockResolvedValue(updatedInvoice);

      const req: any = {
        params: { id: invoiceId },
        body: { status: "paid" },
      };

      const res = mockRes();

      await updateInvoiceStatusController(req, res);

      expect(updateInvoiceStatus).toHaveBeenCalledWith(
        invoiceId,
        "paid"
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Invoice status updated successfully",
        data: updatedInvoice,
      });
    });

    it("should return 400 for invalid status", async () => {
      const req: any = {
        params: { id: invoiceId },
        body: { status: "invalid-status" },
      };

      const res = mockRes();

      await updateInvoiceStatusController(req, res);

      expect(updateInvoiceStatus).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Invalid status",
          errors: expect.any(Object),
        })
      );
    });

    it("should return 404 when invoice does not exist", async () => {
      (updateInvoiceStatus as any).mockResolvedValue(null);

      const req: any = {
        params: { id: invoiceId },
        body: { status: "paid" },
      };

      const res = mockRes();

      await updateInvoiceStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invoice not found",
      });
    });

    it("should return 500 when status update fails", async () => {
      (updateInvoiceStatus as any).mockRejectedValue(
        new Error("Database error")
      );

      const req: any = {
        params: { id: invoiceId },
        body: { status: "paid" },
      };

      const res = mockRes();

      await updateInvoiceStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Database error",
      });
    });
  });
});
