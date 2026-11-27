
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/modules/consent/consent.service", () => ({
  createConsent: vi.fn(),
  getConsents: vi.fn(),
  getConsentById: vi.fn(),
  updateConsentStatus: vi.fn(),
}));

import {
  createConsent,
  getConsents,
  getConsentById,
  updateConsentStatus,
} from "../src/modules/consent/consent.service";

import {
  createConsentController,
  getConsentsController,
  getConsentByIdController,
  updateConsentStatusController,
} from "../src/modules/consent/consent.controller";

const mockRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const UUID1 = "123e4567-e89b-12d3-a456-426614174000";
const UUID2 = "123e4567-e89b-12d3-a456-426614174001";

describe("Consent Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================
  // CREATE CONSENT
  // =========================

  describe("createConsentController", () => {
    it("should create consent successfully", async () => {
      const body = {
        patient_id: UUID1,
        consent_type: "treatment",
        consent_version: "v1",
        consent_text: "Patient agrees to treatment",
        recorded_by: UUID2,
      };

      const consent = {
        id: UUID1,
        ...body,
        status: "pending",
      };

      vi.mocked(createConsent).mockResolvedValue(consent as any);

      const req: any = { body };
      const res = mockRes();

      await createConsentController(req, res);

      expect(createConsent).toHaveBeenCalledWith(body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Consent created successfully",
        data: consent,
      });
    });

    it("should return 400 when service throws an error", async () => {
      vi.mocked(createConsent).mockRejectedValue(
        new Error("Patient not found")
      );

      const req: any = {
        body: {
          patient_id: UUID1,
          consent_type: "treatment",
        },
      };
      const res = mockRes();

      await createConsentController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Patient not found",
      });
    });
  });

  // =========================
  // GET CONSENTS
  // =========================

  describe("getConsentsController", () => {
    it("should retrieve consents successfully", async () => {
      const result = {
        data: [
          {
            id: UUID1,
            patient_id: UUID2,
            consent_type: "treatment",
            status: "granted",
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      };

      vi.mocked(getConsents).mockResolvedValue(result as any);

      const req: any = {
        query: {},
      };
      const res = mockRes();

      await getConsentsController(req, res);

      expect(getConsents).toHaveBeenCalledWith(req.query);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Consents retrieved successfully",
        ...result,
      });
    });

    it("should return 400 when service throws an error", async () => {
      vi.mocked(getConsents).mockRejectedValue(
        new Error("Invalid query parameters")
      );

      const req: any = {
        query: {
          patient_id: "invalid",
        },
      };
      const res = mockRes();

      await getConsentsController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid query parameters",
      });
    });
  });

  // =========================
  // GET CONSENT BY ID
  // =========================

  describe("getConsentByIdController", () => {
    it("should return 404 when consent is not found", async () => {
      vi.mocked(getConsentById).mockResolvedValue(null);

      const req: any = {
        params: {
          id: UUID1,
        },
      };
      const res = mockRes();

      await getConsentByIdController(req, res);

      expect(getConsentById).toHaveBeenCalledWith(UUID1);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Consent not found",
      });
    });

    it("should retrieve consent successfully", async () => {
      const consent = {
        id: UUID1,
        patient_id: UUID2,
        consent_type: "treatment",
        status: "granted",
      };

      vi.mocked(getConsentById).mockResolvedValue(consent as any);

      const req: any = {
        params: {
          id: UUID1,
        },
      };
      const res = mockRes();

      await getConsentByIdController(req, res);

      expect(getConsentById).toHaveBeenCalledWith(UUID1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Consent retrieved successfully",
        data: consent,
      });
    });

    it("should return 400 when service throws an error", async () => {
      vi.mocked(getConsentById).mockRejectedValue(
        new Error("Database error")
      );

      const req: any = {
        params: {
          id: UUID1,
        },
      };
      const res = mockRes();

      await getConsentByIdController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Database error",
      });
    });
  });

  // =========================
  // UPDATE CONSENT STATUS
  // =========================

  describe("updateConsentStatusController", () => {
    it("should update consent status successfully", async () => {
      const body = {
        status: "granted",
      };

      const consent = {
        id: UUID1,
        status: "granted",
      };

      vi.mocked(updateConsentStatus).mockResolvedValue(consent as any);

      const req: any = {
        params: {
          id: UUID1,
        },
        body,
      };
      const res = mockRes();

      await updateConsentStatusController(req, res);

      expect(updateConsentStatus).toHaveBeenCalledWith(UUID1, body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Consent status updated successfully",
        data: consent,
      });
    });

    it("should return 400 when service throws an error", async () => {
      vi.mocked(updateConsentStatus).mockRejectedValue(
        new Error("Withdrawn consent cannot be modified")
      );

      const req: any = {
        params: {
          id: UUID1,
        },
        body: {
          status: "granted",
        },
      };
      const res = mockRes();

      await updateConsentStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Withdrawn consent cannot be modified",
      });
    });
  });
});
