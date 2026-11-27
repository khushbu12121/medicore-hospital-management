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
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
} from "../src/modules/appointments/appointment.service";

describe("Appointment Service", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  const appointmentInput = {
    patient_id: "11111111-1111-4111-8111-111111111111",
    provider_id: "22222222-2222-4222-8222-222222222222",
    department_id: null,
    scheduled_start: "2026-12-01T10:00:00+05:30",
    scheduled_end: "2026-12-01T10:30:00+05:30",
    appointment_type: "consultation",
    reason: "Regular checkup",
    notes: null,
  };

  // ================= CREATE APPOINTMENT =================

  describe("createAppointment", () => {
    it("should throw PATIENT_NOT_FOUND when patient does not exist", async () => {
      queryMock.mockResolvedValueOnce({
        rows: [],
      });

      await expect(
        createAppointment(appointmentInput)
      ).rejects.toThrow("PATIENT_NOT_FOUND");

      expect(queryMock).toHaveBeenCalledTimes(1);
    });

    it("should throw PROVIDER_NOT_FOUND when doctor does not exist", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [{ id: appointmentInput.patient_id }],
        })
        .mockResolvedValueOnce({
          rows: [],
        });

      await expect(
        createAppointment(appointmentInput)
      ).rejects.toThrow("PROVIDER_NOT_FOUND");

      expect(queryMock).toHaveBeenCalledTimes(2);
    });

    it("should throw APPOINTMENT_CONFLICT when overlapping appointment exists", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [{ id: appointmentInput.patient_id }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: appointmentInput.provider_id }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: "existing-appointment" }],
        });

      await expect(
        createAppointment(appointmentInput)
      ).rejects.toThrow("APPOINTMENT_CONFLICT");

      expect(queryMock).toHaveBeenCalledTimes(3);
    });

    it("should create appointment successfully", async () => {
      const mockAppointment = {
        id: "appointment-123",
        appointment_number: "APT-2026-ABCD1234",
        patient_id: appointmentInput.patient_id,
        provider_id: appointmentInput.provider_id,
        status: "scheduled",
      };

      queryMock
        .mockResolvedValueOnce({
          rows: [{ id: appointmentInput.patient_id }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: appointmentInput.provider_id }],
        })
        .mockResolvedValueOnce({
          rows: [],
        })
        .mockResolvedValueOnce({
          rows: [mockAppointment],
        });

      const result = await createAppointment(appointmentInput);

      expect(result).toEqual(mockAppointment);
      expect(queryMock).toHaveBeenCalledTimes(4);
    });

    it("should pass null for optional department, reason and notes", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [{ id: appointmentInput.patient_id }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: appointmentInput.provider_id }],
        })
        .mockResolvedValueOnce({
          rows: [],
        })
        .mockResolvedValueOnce({
          rows: [{ id: "appointment-123" }],
        });

      await createAppointment({
        ...appointmentInput,
        department_id: null,
        reason: null,
        notes: null,
      });

      const insertValues = queryMock.mock.calls[3][1];

      expect(insertValues[3]).toBeNull();
      expect(insertValues[7]).toBeNull();
      expect(insertValues[8]).toBeNull();
    });
  });

  // ================= GET APPOINTMENTS =================

  describe("getAppointments", () => {
    it("should return appointments with pagination", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [{ count: "25" }],
        })
        .mockResolvedValueOnce({
          rows: [
            { id: "appointment-1" },
            { id: "appointment-2" },
          ],
        });

      const result = await getAppointments(
        undefined,
        undefined,
        undefined,
        2,
        10
      );

      expect(result.data).toHaveLength(2);

      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      });

      expect(queryMock).toHaveBeenCalledTimes(2);
    });

    it("should filter appointments by patient", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [{ count: "1" }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: "appointment-1" }],
        });

      await getAppointments(
        "patient-123",
        undefined,
        undefined,
        1,
        10
      );

      expect(queryMock.mock.calls[0][1]).toEqual([
  "patient-123",
  10,
  0,
]);
    });

    it("should filter appointments by provider", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [{ count: "1" }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: "appointment-1" }],
        });

      await getAppointments(
        undefined,
        "doctor-123",
        undefined,
        1,
        10
      );

      expect(queryMock.mock.calls[0][1]).toEqual([
  "doctor-123",
  10,
  0,
]);
    });

    it("should filter appointments by status", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [{ count: "1" }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: "appointment-1" }],
        });

      await getAppointments(
        undefined,
        undefined,
        "scheduled",
        1,
        10
      );

      expect(queryMock.mock.calls[0][1]).toEqual([
  "scheduled",
  10,
  0,
]);
    });

    it("should combine multiple filters correctly", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [{ count: "2" }],
        })
        .mockResolvedValueOnce({
          rows: [
            { id: "appointment-1" },
            { id: "appointment-2" },
          ],
        });

      await getAppointments(
        "patient-123",
        "doctor-123",
        "scheduled",
        2,
        5
      );

      expect(queryMock.mock.calls[0][1]).toEqual([
  "patient-123",
  "doctor-123",
  "scheduled",
  5,
  5,
]);

      expect(queryMock.mock.calls[1][1]).toEqual([
  "patient-123",
  "doctor-123",
  "scheduled",
  5,
  5,
]);
    });

    it("should return empty list when no appointments exist", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [{ count: "0" }],
        })
        .mockResolvedValueOnce({
          rows: [],
        });

      const result = await getAppointments(
        undefined,
        undefined,
        undefined,
        1,
        10
      );

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });

  // ================= GET APPOINTMENT BY ID =================

  describe("getAppointmentById", () => {
    it("should return appointment when found", async () => {
      const mockAppointment = {
        id: "appointment-123",
        status: "scheduled",
      };

      queryMock.mockResolvedValue({
        rows: [mockAppointment],
      });

      const result = await getAppointmentById(
        "appointment-123"
      );

      expect(result).toEqual(mockAppointment);
    });

    it("should return null when appointment is not found", async () => {
      queryMock.mockResolvedValue({
        rows: [],
      });

      const result = await getAppointmentById(
        "non-existent"
      );

      expect(result).toBeNull();
    });
  });

  // ================= UPDATE STATUS =================

  describe("updateAppointmentStatus", () => {
    it("should update appointment status successfully", async () => {
      const mockAppointment = {
        id: "appointment-123",
        status: "completed",
      };

      queryMock.mockResolvedValue({
        rows: [mockAppointment],
      });

      const result = await updateAppointmentStatus(
        "appointment-123",
        "completed"
      );

      expect(result).toEqual(mockAppointment);

      expect(queryMock).toHaveBeenCalledWith(
        expect.any(String),
        [
          "appointment-123",
          "completed",
          null,
        ]
      );
    });

    it("should update cancellation reason when cancelling", async () => {
      const mockAppointment = {
        id: "appointment-123",
        status: "cancelled",
        cancellation_reason: "Patient requested",
      };

      queryMock.mockResolvedValue({
        rows: [mockAppointment],
      });

      const result = await updateAppointmentStatus(
        "appointment-123",
        "cancelled",
        "Patient requested"
      );

      expect(result).toEqual(mockAppointment);

      expect(queryMock.mock.calls[0][1]).toEqual([
        "appointment-123",
        "cancelled",
        "Patient requested",
      ]);
    });

    it("should return null when appointment does not exist", async () => {
      queryMock.mockResolvedValue({
        rows: [],
      });

      const result = await updateAppointmentStatus(
        "non-existent",
        "completed"
      );

      expect(result).toBeNull();
    });
  });
});