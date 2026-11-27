
import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockPoolQuery,
  mockConnect,
  mockClientQuery,
  mockRelease,
} = vi.hoisted(() => ({
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
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  updatePrescriptionStatus,
} from "../src/modules/prescriptions/prescription.service";

describe("Prescription Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockConnect.mockResolvedValue({
      query: mockClientQuery,
      release: mockRelease,
    });
  });

  // ============== CREATE PRESCRIPTION ==============

  describe("createPrescription", () => {
    const validData = {
      encounter_id: "encounter-123",
      patient_id: "patient-123",
      prescriber_id: "doctor-123",
      instructions: "Take medicines after meals",
      items: [
        {
          medication_name: "Paracetamol",
          dosage: "500mg",
          route: "oral",
          frequency: "Twice daily",
          duration: "5 days",
          quantity: 10,
          refills: 1,
          instructions: "After food",
        },
      ],
    };

    const mockEncounter = {
      id: "encounter-123",
      patient_id: "patient-123",
      provider_id: "doctor-123",
      status: "active",
    };

    const setupSuccessfulCreation = (itemsCount = 1) => {
      mockClientQuery
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [mockEncounter] }) // Encounter
        .mockResolvedValueOnce({ rows: [{ id: "patient-123" }] }) // Patient
        .mockResolvedValueOnce({ rows: [{ id: "doctor-123" }] }) // Doctor
        .mockResolvedValueOnce({
          rows: [{ id: "prescription-123" }],
        }); // Prescription insert

      for (let i = 0; i < itemsCount; i++) {
        mockClientQuery.mockResolvedValueOnce({ rows: [] });
      }

      mockClientQuery.mockResolvedValueOnce({ rows: [] }); // COMMIT

      mockPoolQuery.mockResolvedValue({
        rows: [
          {
            id: "prescription-123",
            items: validData.items,
          },
        ],
      });
    };

    it("should create prescription successfully", async () => {
      setupSuccessfulCreation();

      const result = await createPrescription(validData);

      expect(result).toEqual({
        id: "prescription-123",
        items: validData.items,
      });

      expect(mockClientQuery).toHaveBeenCalledWith("BEGIN");
      expect(mockClientQuery).toHaveBeenCalledWith("COMMIT");
      expect(mockRelease).toHaveBeenCalled();
    });

    it("should insert prescription items", async () => {
      setupSuccessfulCreation();

      await createPrescription(validData);

      expect(mockClientQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO prescription_items"),
        expect.arrayContaining([
          "prescription-123",
          "Paracetamol",
          "500mg",
          "oral",
          "Twice daily",
          "5 days",
          10,
          1,
          "After food",
        ])
      );
    });

    it("should create prescription with multiple medications", async () => {
      const data = {
        ...validData,
        items: [
          validData.items[0],
          {
            medication_name: "Cetirizine",
            dosage: "10mg",
            frequency: "Once daily",
            refills: 0,
          },
        ],
      };

      setupSuccessfulCreation(2);

      const result = await createPrescription(data);

      expect(result).toBeDefined();

      const itemInsertCalls = mockClientQuery.mock.calls.filter(
        (call) =>
          typeof call[0] === "string" &&
          call[0].includes("INSERT INTO prescription_items")
      );

      expect(itemInsertCalls).toHaveLength(2);
    });

    it("should use null for optional prescription instructions", async () => {
      const data = {
        ...validData,
        instructions: undefined,
      };

      setupSuccessfulCreation();

      await createPrescription(data);

      const insertCall = mockClientQuery.mock.calls.find(
        (call) =>
          typeof call[0] === "string" &&
          call[0].includes("INSERT INTO prescriptions")
      );

      expect(insertCall?.[1]).toContain(null);
    });

    it("should use null for optional medication fields", async () => {
      const data = {
        ...validData,
        items: [
          {
            medication_name: "Medicine",
            dosage: "10mg",
            frequency: "Daily",
            refills: 0,
          },
        ],
      };

      setupSuccessfulCreation();

      await createPrescription(data);

      const itemInsertCall = mockClientQuery.mock.calls.find(
        (call) =>
          typeof call[0] === "string" &&
          call[0].includes("INSERT INTO prescription_items")
      );

      expect(itemInsertCall?.[1]).toEqual([
        "prescription-123",
        "Medicine",
        "10mg",
        null,
        "Daily",
        null,
        null,
        0,
        null,
      ]);
    });

    it("should throw when encounter does not exist", async () => {
      mockClientQuery
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // Encounter
        .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

      await expect(createPrescription(validData)).rejects.toThrow(
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
              ...mockEncounter,
              patient_id: "another-patient",
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] });

      await expect(createPrescription(validData)).rejects.toThrow(
        "Patient does not match encounter"
      );

      expect(mockClientQuery).toHaveBeenCalledWith("ROLLBACK");
    });

    it("should throw when prescriber does not match encounter provider", async () => {
      mockClientQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [
            {
              ...mockEncounter,
              provider_id: "another-doctor",
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] });

      await expect(createPrescription(validData)).rejects.toThrow(
        "Prescriber does not match encounter provider"
      );

      expect(mockClientQuery).toHaveBeenCalledWith("ROLLBACK");
    });

    it("should reject cancelled encounters", async () => {
      mockClientQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [
            {
              ...mockEncounter,
              status: "cancelled",
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] });

      await expect(createPrescription(validData)).rejects.toThrow(
        "Cannot prescribe for a cancelled encounter"
      );

      expect(mockClientQuery).toHaveBeenCalledWith("ROLLBACK");
    });

    it("should throw when patient is inactive or missing", async () => {
      mockClientQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [mockEncounter] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await expect(createPrescription(validData)).rejects.toThrow(
        "Patient not found or inactive"
      );

      expect(mockClientQuery).toHaveBeenCalledWith("ROLLBACK");
    });

    it("should throw when prescriber is inactive or not a doctor", async () => {
      mockClientQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [mockEncounter] })
        .mockResolvedValueOnce({ rows: [{ id: "patient-123" }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await expect(createPrescription(validData)).rejects.toThrow(
        "Prescriber not found or inactive"
      );

      expect(mockClientQuery).toHaveBeenCalledWith("ROLLBACK");
    });

    it("should rollback when prescription insert fails", async () => {
      mockClientQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [mockEncounter] })
        .mockResolvedValueOnce({ rows: [{ id: "patient-123" }] })
        .mockResolvedValueOnce({ rows: [{ id: "doctor-123" }] })
        .mockRejectedValueOnce(new Error("Prescription insert failed"))
        .mockResolvedValueOnce({ rows: [] });

      await expect(createPrescription(validData)).rejects.toThrow(
        "Prescription insert failed"
      );

      expect(mockClientQuery).toHaveBeenCalledWith("ROLLBACK");
      expect(mockRelease).toHaveBeenCalled();
    });

    it("should rollback when medication item insert fails", async () => {
      mockClientQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [mockEncounter] })
        .mockResolvedValueOnce({ rows: [{ id: "patient-123" }] })
        .mockResolvedValueOnce({ rows: [{ id: "doctor-123" }] })
        .mockResolvedValueOnce({
          rows: [{ id: "prescription-123" }],
        })
        .mockRejectedValueOnce(new Error("Medication insert failed"))
        .mockResolvedValueOnce({ rows: [] });

      await expect(createPrescription(validData)).rejects.toThrow(
        "Medication insert failed"
      );

      expect(mockClientQuery).toHaveBeenCalledWith("ROLLBACK");
      expect(mockRelease).toHaveBeenCalled();
    });

    it("should rollback when final prescription fetch fails", async () => {
      setupSuccessfulCreation();

      mockPoolQuery.mockRejectedValueOnce(
        new Error("Final fetch failed")
      );

      await expect(createPrescription(validData)).rejects.toThrow(
        "Final fetch failed"
      );

      expect(mockClientQuery).toHaveBeenCalledWith("ROLLBACK");
      expect(mockRelease).toHaveBeenCalled();
    });
  });

  // ============== GET PRESCRIPTIONS ==============

  describe("getPrescriptions", () => {
    it("should return prescriptions without filters", async () => {
      mockPoolQuery.mockResolvedValue({
        rows: [{ id: "prescription-1" }, { id: "prescription-2" }],
      });

      const result = await getPrescriptions({
        page: 1,
        limit: 20,
      });

      expect(result).toHaveLength(2);

      expect(mockPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining("GROUP BY p.id"),
        [20, 0]
      );
    });

    it("should filter by patient ID", async () => {
      mockPoolQuery.mockResolvedValue({ rows: [] });

      await getPrescriptions({
        patient_id: "patient-123",
        page: 1,
        limit: 20,
      });

      expect(mockPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining("p.patient_id = $1"),
        ["patient-123", 20, 0]
      );
    });

    it("should filter by encounter ID", async () => {
      mockPoolQuery.mockResolvedValue({ rows: [] });

      await getPrescriptions({
        encounter_id: "encounter-123",
        page: 1,
        limit: 20,
      });

      expect(mockPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining("p.encounter_id = $1"),
        ["encounter-123", 20, 0]
      );
    });

    it("should filter by status", async () => {
      mockPoolQuery.mockResolvedValue({ rows: [] });

      await getPrescriptions({
        status: "completed",
        page: 1,
        limit: 20,
      });

      expect(mockPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining("p.status = $1"),
        ["completed", 20, 0]
      );
    });

    it("should apply all filters together", async () => {
      mockPoolQuery.mockResolvedValue({ rows: [] });

      await getPrescriptions({
        patient_id: "patient-123",
        encounter_id: "encounter-123",
        status: "active",
        page: 2,
        limit: 10,
      });

      expect(mockPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining(
          "p.patient_id = $1 AND p.encounter_id = $2 AND p.status = $3"
        ),
        ["patient-123", "encounter-123", "active", 10, 10]
      );
    });

    it("should calculate pagination offset correctly", async () => {
      mockPoolQuery.mockResolvedValue({ rows: [] });

      await getPrescriptions({
        page: 4,
        limit: 15,
      });

      expect(mockPoolQuery).toHaveBeenCalledWith(
        expect.any(String),
        [15, 45]
      );
    });
  });

  // ============== GET PRESCRIPTION BY ID ==============

  describe("getPrescriptionById", () => {
    it("should return prescription when found", async () => {
      const prescription = {
        id: "prescription-123",
        items: [],
      };

      mockPoolQuery.mockResolvedValue({
        rows: [prescription],
      });

      const result = await getPrescriptionById("prescription-123");

      expect(result).toEqual(prescription);

      expect(mockPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining("WHERE p.id = $1"),
        ["prescription-123"]
      );
    });

    it("should return null when prescription is not found", async () => {
      mockPoolQuery.mockResolvedValue({
        rows: [],
      });

      const result = await getPrescriptionById("missing-id");

      expect(result).toBeNull();
    });
  });

  // ============== UPDATE STATUS ==============

  describe("updatePrescriptionStatus", () => {
    it("should update prescription status successfully", async () => {
      const updatedPrescription = {
        id: "prescription-123",
        status: "completed",
      };

      mockPoolQuery.mockResolvedValue({
        rows: [updatedPrescription],
      });

      const result = await updatePrescriptionStatus(
        "prescription-123",
        "completed"
      );

      expect(result).toEqual(updatedPrescription);

      expect(mockPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE prescriptions"),
        ["prescription-123", "completed"]
      );
    });

    it("should return null when prescription does not exist", async () => {
      mockPoolQuery.mockResolvedValue({
        rows: [],
      });

      const result = await updatePrescriptionStatus(
        "missing-id",
        "cancelled"
      );

      expect(result).toBeNull();
    });

    it("should allow changing status to active", async () => {
      mockPoolQuery.mockResolvedValue({
        rows: [{ id: "prescription-123", status: "active" }],
      });

      const result = await updatePrescriptionStatus(
        "prescription-123",
        "active"
      );

      expect(result?.status).toBe("active");
    });

    it("should allow changing status to cancelled", async () => {
      mockPoolQuery.mockResolvedValue({
        rows: [{ id: "prescription-123", status: "cancelled" }],
      });

      const result = await updatePrescriptionStatus(
        "prescription-123",
        "cancelled"
      );

      expect(result?.status).toBe("cancelled");
    });
  });
});
