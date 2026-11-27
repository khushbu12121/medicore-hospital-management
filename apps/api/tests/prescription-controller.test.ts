
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/modules/prescriptions/prescription.service", () => ({
  createPrescription: vi.fn(),
  getPrescriptions: vi.fn(),
  getPrescriptionById: vi.fn(),
  updatePrescriptionStatus: vi.fn(),
}));

import {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  updatePrescriptionStatus,
} from "../src/modules/prescriptions/prescription.service";

import {
  createPrescriptionController,
  getPrescriptionsController,
  getPrescriptionByIdController,
  updatePrescriptionStatusController,
} from "../src/modules/prescriptions/prescription.controller";

const mockRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const UUID1 = "123e4567-e89b-12d3-a456-426614174000";
const UUID2 = "123e4567-e89b-12d3-a456-426614174001";
const UUID3 = "123e4567-e89b-12d3-a456-426614174002";

const validPrescription = {
  encounter_id: UUID1,
  patient_id: UUID2,
  prescriber_id: UUID3,
  instructions: "Take medicines after meals",
  items: [
    {
      medication_name: "Paracetamol",
      dosage: "500mg",
      route: "oral",
      frequency: "Twice daily",
      duration: "5 days",
      quantity: 10,
      refills: 0,
      instructions: "After meals",
    },
  ],
};

describe("Prescription Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================
  // CREATE PRESCRIPTION
  // =========================

  describe("createPrescriptionController", () => {
    it("should return 400 for invalid request body", async () => {
      const req: any = {
        body: {},
      };
      const res = mockRes();

      await createPrescriptionController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Validation failed",
        })
      );
      expect(createPrescription).not.toHaveBeenCalled();
    });

    it("should create prescription successfully", async () => {
      const prescription = {
        id: UUID1,
        prescription_number: "RX-2026-ABC123",
        ...validPrescription,
      };

      vi.mocked(createPrescription).mockResolvedValue(prescription as any);

      const req: any = {
        body: validPrescription,
      };
      const res = mockRes();

      await createPrescriptionController(req, res);

      expect(createPrescription).toHaveBeenCalledWith(validPrescription);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Prescription created successfully",
        data: prescription,
      });
    });

    it("should return 400 when service throws an error", async () => {
      vi.mocked(createPrescription).mockRejectedValue(
        new Error("Patient not found")
      );

      const req: any = {
        body: validPrescription,
      };
      const res = mockRes();

      await createPrescriptionController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Patient not found",
      });
    });

    it("should use default error message when error has no message", async () => {
      vi.mocked(createPrescription).mockRejectedValue({});

      const req: any = {
        body: validPrescription,
      };
      const res = mockRes();

      await createPrescriptionController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Failed to create prescription",
      });
    });
  });

  // =========================
  // GET PRESCRIPTIONS
  // =========================

  describe("getPrescriptionsController", () => {
    it("should return 400 for invalid query parameters", async () => {
      const req: any = {
        query: {
          patient_id: "invalid-uuid",
        },
      };
      const res = mockRes();

      await getPrescriptionsController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Invalid query parameters",
        })
      );
      expect(getPrescriptions).not.toHaveBeenCalled();
    });

    it("should retrieve prescriptions successfully", async () => {
      const prescriptions = [
        {
          id: UUID1,
          prescription_number: "RX-2026-ABC123",
          status: "active",
        },
      ];

      vi.mocked(getPrescriptions).mockResolvedValue(prescriptions as any);

      const req: any = {
        query: {},
      };
      const res = mockRes();

      await getPrescriptionsController(req, res);

      expect(getPrescriptions).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Prescriptions retrieved successfully",
        data: prescriptions,
      });
    });

    it("should retrieve prescriptions with filters", async () => {
      const prescriptions = [{ id: UUID1 }];

      vi.mocked(getPrescriptions).mockResolvedValue(prescriptions as any);

      const req: any = {
        query: {
          patient_id: UUID2,
          encounter_id: UUID1,
          status: "active",
          page: "2",
          limit: "10",
        },
      };
      const res = mockRes();

      await getPrescriptionsController(req, res);

      expect(getPrescriptions).toHaveBeenCalledWith({
        patient_id: UUID2,
        encounter_id: UUID1,
        status: "active",
        page: 2,
        limit: 10,
      });

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 500 when service throws an error", async () => {
      vi.mocked(getPrescriptions).mockRejectedValue(
        new Error("Database error")
      );

      const req: any = {
        query: {},
      };
      const res = mockRes();

      await getPrescriptionsController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Database error",
      });
    });

    it("should use default error message when error has no message", async () => {
      vi.mocked(getPrescriptions).mockRejectedValue({});

      const req: any = {
        query: {},
      };
      const res = mockRes();

      await getPrescriptionsController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Failed to retrieve prescriptions",
      });
    });
  });

  // =========================
  // GET PRESCRIPTION BY ID
  // =========================

  describe("getPrescriptionByIdController", () => {
    it("should return 404 when prescription is not found", async () => {
      vi.mocked(getPrescriptionById).mockResolvedValue(null);

      const req: any = {
        params: {
          id: UUID1,
        },
      };
      const res = mockRes();

      await getPrescriptionByIdController(req, res);

      expect(getPrescriptionById).toHaveBeenCalledWith(UUID1);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Prescription not found",
      });
    });

    it("should retrieve prescription successfully", async () => {
      const prescription = {
        id: UUID1,
        prescription_number: "RX-2026-ABC123",
        items: [],
      };

      vi.mocked(getPrescriptionById).mockResolvedValue(
        prescription as any
      );

      const req: any = {
        params: {
          id: UUID1,
        },
      };
      const res = mockRes();

      await getPrescriptionByIdController(req, res);

      expect(getPrescriptionById).toHaveBeenCalledWith(UUID1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Prescription retrieved successfully",
        data: prescription,
      });
    });

    it("should return 500 when service throws an error", async () => {
      vi.mocked(getPrescriptionById).mockRejectedValue(
        new Error("Database error")
      );

      const req: any = {
        params: {
          id: UUID1,
        },
      };
      const res = mockRes();

      await getPrescriptionByIdController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Database error",
      });
    });

    it("should use default error message when error has no message", async () => {
      vi.mocked(getPrescriptionById).mockRejectedValue({});

      const req: any = {
        params: {
          id: UUID1,
        },
      };
      const res = mockRes();

      await getPrescriptionByIdController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Failed to retrieve prescription",
      });
    });
  });

  // =========================
  // UPDATE PRESCRIPTION STATUS
  // =========================

  describe("updatePrescriptionStatusController", () => {
    it("should return 400 for invalid status", async () => {
      const req: any = {
        params: {
          id: UUID1,
        },
        body: {
          status: "invalid-status",
        },
      };
      const res = mockRes();

      await updatePrescriptionStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Invalid status",
        })
      );
      expect(updatePrescriptionStatus).not.toHaveBeenCalled();
    });

    it("should return 404 when prescription is not found", async () => {
      vi.mocked(updatePrescriptionStatus).mockResolvedValue(null);

      const req: any = {
        params: {
          id: UUID1,
        },
        body: {
          status: "completed",
        },
      };
      const res = mockRes();

      await updatePrescriptionStatusController(req, res);

      expect(updatePrescriptionStatus).toHaveBeenCalledWith(
        UUID1,
        "completed"
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Prescription not found",
      });
    });

    it("should update prescription status successfully", async () => {
      const prescription = {
        id: UUID1,
        status: "completed",
      };

      vi.mocked(updatePrescriptionStatus).mockResolvedValue(
        prescription as any
      );

      const req: any = {
        params: {
          id: UUID1,
        },
        body: {
          status: "completed",
        },
      };
      const res = mockRes();

      await updatePrescriptionStatusController(req, res);

      expect(updatePrescriptionStatus).toHaveBeenCalledWith(
        UUID1,
        "completed"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Prescription status updated successfully",
        data: prescription,
      });
    });

    it("should return 500 when service throws an error", async () => {
      vi.mocked(updatePrescriptionStatus).mockRejectedValue(
        new Error("Database error")
      );

      const req: any = {
        params: {
          id: UUID1,
        },
        body: {
          status: "cancelled",
        },
      };
      const res = mockRes();

      await updatePrescriptionStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Database error",
      });
    });

    it("should use default error message when error has no message", async () => {
      vi.mocked(updatePrescriptionStatus).mockRejectedValue({});

      const req: any = {
        params: {
          id: UUID1,
        },
        body: {
          status: "cancelled",
        },
      };
      const res = mockRes();

      await updatePrescriptionStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Failed to update prescription status",
      });
    });
  });
});
