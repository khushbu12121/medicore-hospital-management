
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/config/database", () => ({
  pool: {
    query: vi.fn(),
  },
}));

import { pool } from "../src/config/database";
import {
  createEncounter,
  getEncounters,
  getEncounterById,
  updateEncounterStatus,
} from "../src/modules/encounters/encounter.service";

const mockedQuery = vi.mocked(pool.query);

const patientId = "11111111-1111-4111-8111-111111111111";
const providerId = "22222222-2222-4222-8222-222222222222";
const appointmentId = "33333333-3333-4333-8333-333333333333";
const encounterId = "44444444-4444-4444-8444-444444444444";

const mockEncounter = {
  id: encounterId,
  encounter_number: "ENC-2026-ABC12345",
  patient_id: patientId,
  provider_id: providerId,
  appointment_id: appointmentId,
  status: "in_progress",
};

describe("Encounter Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // CREATE ENCOUNTER

  describe("createEncounter", () => {
    const validData = {
      patient_id: patientId,
      provider_id: providerId,
      appointment_id: appointmentId,
      encounter_type: "outpatient",
      chief_complaint: "Fever",
      clinical_notes: "Patient has fever for 2 days",
      diagnosis_summary: "Viral fever",
    };

    it("should create encounter successfully", async () => {
      mockedQuery
        .mockResolvedValueOnce({ rows: [{ id: patientId }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: providerId }] } as any)
        .mockResolvedValueOnce({
          rows: [
            {
              id: appointmentId,
              patient_id: patientId,
              provider_id: providerId,
              status: "scheduled",
            },
          ],
        } as any)
        .mockResolvedValueOnce({ rows: [mockEncounter] } as any);

      const result = await createEncounter(validData);

      expect(result).toEqual(mockEncounter);
      expect(mockedQuery).toHaveBeenCalledTimes(4);
      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO encounters"),
        expect.arrayContaining([
          expect.stringMatching(/^ENC-\d{4}-/),
          patientId,
          appointmentId,
          providerId,
        ])
      );
    });

    it("should throw error when patient does not exist or is inactive", async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [] } as any);

      await expect(createEncounter(validData)).rejects.toThrow(
        "Patient not found or inactive"
      );

      expect(mockedQuery).toHaveBeenCalledTimes(1);
    });

    it("should throw error when doctor does not exist or is inactive", async () => {
      mockedQuery
        .mockResolvedValueOnce({ rows: [{ id: patientId }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      await expect(createEncounter(validData)).rejects.toThrow(
        "Doctor not found or inactive"
      );

      expect(mockedQuery).toHaveBeenCalledTimes(2);
    });

    it("should throw error when appointment does not exist", async () => {
      mockedQuery
        .mockResolvedValueOnce({ rows: [{ id: patientId }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: providerId }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      await expect(createEncounter(validData)).rejects.toThrow(
        "Appointment not found"
      );
    });

    it("should throw error when appointment patient does not match", async () => {
      mockedQuery
        .mockResolvedValueOnce({ rows: [{ id: patientId }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: providerId }] } as any)
        .mockResolvedValueOnce({
          rows: [
            {
              id: appointmentId,
              patient_id: "99999999-9999-4999-8999-999999999999",
              provider_id: providerId,
              status: "scheduled",
            },
          ],
        } as any);

      await expect(createEncounter(validData)).rejects.toThrow(
        "Appointment patient or provider mismatch"
      );
    });

    it("should throw error when appointment provider does not match", async () => {
      mockedQuery
        .mockResolvedValueOnce({ rows: [{ id: patientId }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: providerId }] } as any)
        .mockResolvedValueOnce({
          rows: [
            {
              id: appointmentId,
              patient_id: patientId,
              provider_id: "99999999-9999-4999-8999-999999999999",
              status: "scheduled",
            },
          ],
        } as any);

      await expect(createEncounter(validData)).rejects.toThrow(
        "Appointment patient or provider mismatch"
      );
    });

    it("should reject cancelled appointment", async () => {
      mockedQuery
        .mockResolvedValueOnce({ rows: [{ id: patientId }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: providerId }] } as any)
        .mockResolvedValueOnce({
          rows: [
            {
              id: appointmentId,
              patient_id: patientId,
              provider_id: providerId,
              status: "cancelled",
            },
          ],
        } as any);

      await expect(createEncounter(validData)).rejects.toThrow(
        "Cannot create encounter for cancelled or no-show appointment"
      );
    });

    it("should reject no-show appointment", async () => {
      mockedQuery
        .mockResolvedValueOnce({ rows: [{ id: patientId }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: providerId }] } as any)
        .mockResolvedValueOnce({
          rows: [
            {
              id: appointmentId,
              patient_id: patientId,
              provider_id: providerId,
              status: "no_show",
            },
          ],
        } as any);

      await expect(createEncounter(validData)).rejects.toThrow(
        "Cannot create encounter for cancelled or no-show appointment"
      );
    });

    it("should create encounter without appointment", async () => {
      const data = {
        patient_id: patientId,
        provider_id: providerId,
        encounter_type: "outpatient",
      };

      mockedQuery
        .mockResolvedValueOnce({ rows: [{ id: patientId }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: providerId }] } as any)
        .mockResolvedValueOnce({ rows: [mockEncounter] } as any);

      const result = await createEncounter(data as any);

      expect(result).toEqual(mockEncounter);
      expect(mockedQuery).toHaveBeenCalledTimes(3);
    });

    it("should use null for optional fields", async () => {
      const data = {
        patient_id: patientId,
        provider_id: providerId,
        encounter_type: "outpatient",
      };

      mockedQuery
        .mockResolvedValueOnce({ rows: [{ id: patientId }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: providerId }] } as any)
        .mockResolvedValueOnce({ rows: [mockEncounter] } as any);

      await createEncounter(data as any);

      const insertCall = mockedQuery.mock.calls[2];

      expect(insertCall[1]).toContain(null);
    });
  });

  // GET ENCOUNTERS

  describe("getEncounters", () => {
    it("should return encounters without filters", async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [mockEncounter],
      } as any);

      const result = await getEncounters({
        page: 1,
        limit: 20,
      } as any);

      expect(result).toEqual([mockEncounter]);
      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining("FROM encounters"),
        [20, 0]
      );
    });

    it("should filter by patient_id", async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [] } as any);

      await getEncounters({
        patient_id: patientId,
        page: 1,
        limit: 20,
      } as any);

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining("patient_id = $1"),
        [patientId, 20, 0]
      );
    });

    it("should filter by provider_id", async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [] } as any);

      await getEncounters({
        provider_id: providerId,
        page: 1,
        limit: 20,
      } as any);

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining("provider_id = $1"),
        [providerId, 20, 0]
      );
    });

    it("should filter by status", async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [] } as any);

      await getEncounters({
        status: "completed",
        page: 1,
        limit: 20,
      } as any);

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining("status = $1"),
        ["completed", 20, 0]
      );
    });

    it("should apply all filters together", async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [] } as any);

      await getEncounters({
        patient_id: patientId,
        provider_id: providerId,
        status: "in_progress",
        page: 2,
        limit: 10,
      } as any);

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining("patient_id = $1 AND provider_id = $2 AND status = $3"),
        [patientId, providerId, "in_progress", 10, 10]
      );
    });

    it("should calculate pagination offset correctly", async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [] } as any);

      await getEncounters({
        page: 3,
        limit: 10,
      } as any);

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.any(String),
        [10, 20]
      );
    });

    it("should return empty array when no encounters found", async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [] } as any);

      const result = await getEncounters({
        page: 1,
        limit: 20,
      } as any);

      expect(result).toEqual([]);
    });
  });

  // GET ENCOUNTER BY ID

  describe("getEncounterById", () => {
    it("should return encounter when found", async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [mockEncounter],
      } as any);

      const result = await getEncounterById(encounterId);

      expect(result).toEqual(mockEncounter);
      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining("WHERE e.id = $1"),
        [encounterId]
      );
    });

    it("should return null when encounter not found", async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [],
      } as any);

      const result = await getEncounterById(encounterId);

      expect(result).toBeNull();
    });
  });

  // UPDATE ENCOUNTER STATUS

  describe("updateEncounterStatus", () => {
    it("should update encounter status", async () => {
      const updatedEncounter = {
        ...mockEncounter,
        status: "cancelled",
      };

      mockedQuery.mockResolvedValueOnce({
        rows: [updatedEncounter],
      } as any);

      const result = await updateEncounterStatus(
        encounterId,
        "cancelled"
      );

      expect(result).toEqual(updatedEncounter);
      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE encounters"),
        [encounterId, "cancelled"]
      );
    });

    it("should set completed_at when status is completed", async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [{ ...mockEncounter, status: "completed" }],
      } as any);

      await updateEncounterStatus(encounterId, "completed");

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining("WHEN $2::varchar = 'completed' THEN NOW()"),
        [encounterId, "completed"]
      );
    });

    it("should not modify completed_at for other statuses", async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [{ ...mockEncounter, status: "in_progress" }],
      } as any);

      await updateEncounterStatus(encounterId, "in_progress");

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining("ELSE completed_at"),
        [encounterId, "in_progress"]
      );
    });

    it("should return null when encounter does not exist", async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [],
      } as any);

      const result = await updateEncounterStatus(
        encounterId,
        "completed"
      );

      expect(result).toBeNull();
    });
  });
});
