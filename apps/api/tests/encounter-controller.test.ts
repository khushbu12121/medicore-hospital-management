
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/modules/encounters/encounter.service", () => ({
  createEncounter: vi.fn(),
  getEncounters: vi.fn(),
  getEncounterById: vi.fn(),
  updateEncounterStatus: vi.fn(),
}));

import {
  createEncounter,
  getEncounters,
  getEncounterById,
  updateEncounterStatus,
} from "../src/modules/encounters/encounter.service";

import {
  createEncounterController,
  getEncountersController,
  getEncounterByIdController,
  updateEncounterStatusController,
} from "../src/modules/encounters/encounter.controller";

const mockRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const UUID1 = "123e4567-e89b-12d3-a456-426614174000";
const UUID2 = "123e4567-e89b-12d3-a456-426614174001";
const UUID3 = "123e4567-e89b-12d3-a456-426614174002";

const validEncounter = {
  patient_id: UUID1,
  appointment_id: UUID2,
  provider_id: UUID3,
  department_id: UUID1,
  encounter_type: "outpatient",
  chief_complaint: "Fever",
  clinical_notes: "Patient has mild fever",
  diagnosis_summary: "Viral fever",
};

describe("Encounter Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================
  // CREATE ENCOUNTER
  // =========================

  describe("createEncounterController", () => {
    it("should return 400 for invalid request body", async () => {
      const req: any = {
        body: {},
      };
      const res = mockRes();

      await createEncounterController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Validation failed",
        })
      );

      expect(createEncounter).not.toHaveBeenCalled();
    });

    it("should create encounter successfully", async () => {
      const encounter = {
        id: UUID1,
        encounter_number: "ENC-2026-ABC123",
        ...validEncounter,
      };

      vi.mocked(createEncounter).mockResolvedValue(encounter as any);

      const req: any = {
        body: validEncounter,
      };
      const res = mockRes();

      await createEncounterController(req, res);

      expect(createEncounter).toHaveBeenCalledWith(validEncounter);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Encounter created successfully",
        data: encounter,
      });
    });

    it("should return 400 when service throws an error", async () => {
      vi.mocked(createEncounter).mockRejectedValue(
        new Error("Patient not found or inactive")
      );

      const req: any = {
        body: validEncounter,
      };
      const res = mockRes();

      await createEncounterController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Patient not found or inactive",
      });
    });

    it("should use default error message when error has no message", async () => {
      vi.mocked(createEncounter).mockRejectedValue({});

      const req: any = {
        body: validEncounter,
      };
      const res = mockRes();

      await createEncounterController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Failed to create encounter",
      });
    });
  });

  // =========================
  // GET ENCOUNTERS
  // =========================

  describe("getEncountersController", () => {
    it("should return 400 for invalid query parameters", async () => {
      const req: any = {
        query: {
          patient_id: "invalid-uuid",
        },
      };
      const res = mockRes();

      await getEncountersController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Invalid query parameters",
        })
      );

      expect(getEncounters).not.toHaveBeenCalled();
    });

    it("should retrieve encounters successfully", async () => {
      const encounters = [
        {
          id: UUID1,
          encounter_number: "ENC-2026-ABC123",
          status: "in_progress",
        },
      ];

      vi.mocked(getEncounters).mockResolvedValue(encounters as any);

      const req: any = {
        query: {},
      };
      const res = mockRes();

      await getEncountersController(req, res);

      expect(getEncounters).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Encounters retrieved successfully",
        data: encounters,
      });
    });

    it("should retrieve encounters with filters", async () => {
      const encounters = [{ id: UUID1 }];

      vi.mocked(getEncounters).mockResolvedValue(encounters as any);

      const req: any = {
        query: {
          patient_id: UUID1,
          provider_id: UUID3,
          status: "completed",
          page: "2",
          limit: "10",
        },
      };
      const res = mockRes();

      await getEncountersController(req, res);

      expect(getEncounters).toHaveBeenCalledWith({
        patient_id: UUID1,
        provider_id: UUID3,
        status: "completed",
        page: 2,
        limit: 10,
      });

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 500 when service throws an error", async () => {
      vi.mocked(getEncounters).mockRejectedValue(
        new Error("Database error")
      );

      const req: any = {
        query: {},
      };
      const res = mockRes();

      await getEncountersController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Database error",
      });
    });

    it("should use default error message when error has no message", async () => {
      vi.mocked(getEncounters).mockRejectedValue({});

      const req: any = {
        query: {},
      };
      const res = mockRes();

      await getEncountersController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Failed to retrieve encounters",
      });
    });
  });

  // =========================
  // GET ENCOUNTER BY ID
  // =========================

  describe("getEncounterByIdController", () => {
    it("should return 404 when encounter is not found", async () => {
      vi.mocked(getEncounterById).mockResolvedValue(null);

      const req: any = {
        params: {
          id: UUID1,
        },
      };
      const res = mockRes();

      await getEncounterByIdController(req, res);

      expect(getEncounterById).toHaveBeenCalledWith(UUID1);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Encounter not found",
      });
    });

    it("should retrieve encounter successfully", async () => {
      const encounter = {
        id: UUID1,
        encounter_number: "ENC-2026-ABC123",
        patient_first_name: "John",
        provider_first_name: "Doctor",
      };

      vi.mocked(getEncounterById).mockResolvedValue(encounter as any);

      const req: any = {
        params: {
          id: UUID1,
        },
      };
      const res = mockRes();

      await getEncounterByIdController(req, res);

      expect(getEncounterById).toHaveBeenCalledWith(UUID1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Encounter retrieved successfully",
        data: encounter,
      });
    });

    it("should return 500 when service throws an error", async () => {
      vi.mocked(getEncounterById).mockRejectedValue(
        new Error("Database error")
      );

      const req: any = {
        params: {
          id: UUID1,
        },
      };
      const res = mockRes();

      await getEncounterByIdController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Database error",
      });
    });

    it("should use default error message when error has no message", async () => {
      vi.mocked(getEncounterById).mockRejectedValue({});

      const req: any = {
        params: {
          id: UUID1,
        },
      };
      const res = mockRes();

      await getEncounterByIdController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Failed to retrieve encounter",
      });
    });
  });

  // =========================
  // UPDATE ENCOUNTER STATUS
  // =========================

  describe("updateEncounterStatusController", () => {
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

      await updateEncounterStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Invalid status",
        })
      );

      expect(updateEncounterStatus).not.toHaveBeenCalled();
    });

    it("should return 404 when encounter is not found", async () => {
      vi.mocked(updateEncounterStatus).mockResolvedValue(null);

      const req: any = {
        params: {
          id: UUID1,
        },
        body: {
          status: "completed",
        },
      };
      const res = mockRes();

      await updateEncounterStatusController(req, res);

      expect(updateEncounterStatus).toHaveBeenCalledWith(
        UUID1,
        "completed"
      );

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Encounter not found",
      });
    });

    it("should update encounter status successfully", async () => {
      const encounter = {
        id: UUID1,
        status: "completed",
      };

      vi.mocked(updateEncounterStatus).mockResolvedValue(
        encounter as any
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

      await updateEncounterStatusController(req, res);

      expect(updateEncounterStatus).toHaveBeenCalledWith(
        UUID1,
        "completed"
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Encounter status updated successfully",
        data: encounter,
      });
    });

    it("should return 500 when service throws an error", async () => {
      vi.mocked(updateEncounterStatus).mockRejectedValue(
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

      await updateEncounterStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Database error",
      });
    });

    it("should use default error message when error has no message", async () => {
      vi.mocked(updateEncounterStatus).mockRejectedValue({});

      const req: any = {
        params: {
          id: UUID1,
        },
        body: {
          status: "cancelled",
        },
      };
      const res = mockRes();

      await updateEncounterStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Failed to update encounter status",
      });
    });
  });
});
