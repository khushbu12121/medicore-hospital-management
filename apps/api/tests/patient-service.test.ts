import { describe, it, expect, beforeEach, vi } from "vitest";

const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
}));

vi.mock("../src/config/database", () => ({
  pool: {
    query: queryMock,
  },
}));

import {
  createPatient,
  getPatients,
  getPatientById,
} from "../src/modules/patients/patient.service";

describe("Patient Service", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  // ---------------- CREATE PATIENT ----------------

  describe("createPatient", () => {
    it("should create a patient successfully", async () => {
      const mockPatient = {
        id: "patient-123",
        patient_number: "PT-2026-ABCD1234",
        first_name: "Khushbu",
        last_name: "Bansal",
        is_active: true,
      };

      queryMock.mockResolvedValue({
        rows: [mockPatient],
      });

      const result = await createPatient({
        first_name: "Khushbu",
        last_name: "Bansal",
        date_of_birth: "2004-03-12",
        gender: "female",
        phone: "9876543210",
        email: "khushbu@example.com",
        address: "India",
        blood_group: "B+",
        emergency_contact_name: "Emergency Contact",
        emergency_contact_phone: "9999999999",
        allergies: "None",
        medical_notes: "Test notes",
      });

      expect(result).toEqual(mockPatient);
      expect(queryMock).toHaveBeenCalledTimes(1);
    });

    it("should handle optional fields as null", async () => {
      const mockPatient = {
        id: "patient-456",
        first_name: "Test",
        last_name: "Patient",
      };

      queryMock.mockResolvedValue({
        rows: [mockPatient],
      });

      const result = await createPatient({
        first_name: "Test",
        last_name: "Patient",
        date_of_birth: "2000-01-01",
      });

      expect(result).toEqual(mockPatient);

      const values = queryMock.mock.calls[0][1];

      expect(values[4]).toBeNull();
      expect(values[5]).toBeNull();
      expect(values[6]).toBeNull();
      expect(values[7]).toBeNull();
    });

    it("should throw error when database query fails", async () => {
      queryMock.mockRejectedValue(new Error("Database error"));

      await expect(
        createPatient({
          first_name: "Test",
          last_name: "Patient",
          date_of_birth: "2000-01-01",
        })
      ).rejects.toThrow("Database error");
    });
  });

  // ---------------- GET PATIENTS ----------------

  describe("getPatients", () => {
    it("should return patients with pagination", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [{ total: 25 }],
        })
        .mockResolvedValueOnce({
          rows: [
            { id: "patient-1", first_name: "A" },
            { id: "patient-2", first_name: "B" },
          ],
        });

      const result = await getPatients(undefined, 2, 10);

      expect(result.data).toHaveLength(2);

      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      });

      expect(queryMock).toHaveBeenCalledTimes(2);
    });

    it("should search patients by search term", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [{ total: 1 }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: "patient-1", first_name: "Khushbu" }],
        });

      const result = await getPatients("Khushbu", 1, 10);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].first_name).toBe("Khushbu");

      expect(queryMock.mock.calls[0][1]).toEqual([
        "%Khushbu%",
      ]);
    });

    it("should return empty results when no patients exist", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [{ total: 0 }],
        })
        .mockResolvedValueOnce({
          rows: [],
        });

      const result = await getPatients(undefined, 1, 10);

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });

    it("should calculate offset correctly", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [{ total: 50 }],
        })
        .mockResolvedValueOnce({
          rows: [],
        });

      await getPatients(undefined, 3, 10);

      const dataQueryValues = queryMock.mock.calls[1][1];

      expect(dataQueryValues).toEqual([10, 20]);
    });

    it("should throw error when database query fails", async () => {
      queryMock.mockRejectedValue(new Error("Database error"));

      await expect(
        getPatients(undefined, 1, 10)
      ).rejects.toThrow("Database error");
    });
  });

  // ---------------- GET PATIENT BY ID ----------------

  describe("getPatientById", () => {
    it("should return patient when found", async () => {
      const mockPatient = {
        id: "patient-123",
        first_name: "Khushbu",
        last_name: "Bansal",
      };

      queryMock.mockResolvedValue({
        rows: [mockPatient],
      });

      const result = await getPatientById("patient-123");

      expect(result).toEqual(mockPatient);
    });

    it("should return null when patient does not exist", async () => {
      queryMock.mockResolvedValue({
        rows: [],
      });

      const result = await getPatientById("non-existent");

      expect(result).toBeNull();
    });

    it("should throw error when database query fails", async () => {
      queryMock.mockRejectedValue(new Error("Database error"));

      await expect(
        getPatientById("patient-123")
      ).rejects.toThrow("Database error");
    });
  });
});