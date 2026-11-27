import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/modules/appointments/appointment.service", () => ({
  createAppointment: vi.fn(),
  getAppointments: vi.fn(),
  getAppointmentById: vi.fn(),
  updateAppointmentStatus: vi.fn(),
}));

import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
} from "../src/modules/appointments/appointment.service";

import {
  bookAppointment,
  listAppointments,
  getAppointment,
  changeAppointmentStatus,
} from "../src/modules/appointments/appointment.controller";

const mockedCreate = vi.mocked(createAppointment);
const mockedList = vi.mocked(getAppointments);
const mockedGet = vi.mocked(getAppointmentById);
const mockedUpdate = vi.mocked(updateAppointmentStatus);

const appointment = {
  id: "11111111-1111-4111-8111-111111111111",
  patient_id: "22222222-2222-4222-8222-222222222222",
  provider_id: "33333333-3333-4333-8333-333333333333",
  scheduled_start: "2026-12-01T10:00:00+05:30",
  scheduled_end: "2026-12-01T10:30:00+05:30",
  appointment_type: "consultation",
  status: "scheduled",
};

const validBooking = {
  patient_id: appointment.patient_id,
  provider_id: appointment.provider_id,
  scheduled_start: "2026-12-01T10:00:00+05:30",
  scheduled_end: "2026-12-01T10:30:00+05:30",
  appointment_type: "consultation",
  reason: "Regular checkup",
  notes: "Test appointment",
};

const createMockResponse = () => {
  const res: any = {};

  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);

  return res;
};

const createMockRequest = (overrides: any = {}) => {
  return {
    body: {},
    params: {},
    query: {},
    ...overrides,
  } as any;
};

describe("Appointment Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ================= BOOK APPOINTMENT =================

  describe("bookAppointment", () => {
    it("should create appointment successfully", async () => {
      mockedCreate.mockResolvedValue(appointment as any);

      const req = createMockRequest({
        body: validBooking,
      });

      const res = createMockResponse();

      await bookAppointment(req, res);

      expect(mockedCreate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    it("should return 400 for invalid booking data", async () => {
      const req = createMockRequest({
        body: {
          patient_id: "invalid-id",
          provider_id: "invalid-id",
        },
      });

      const res = createMockResponse();

      await bookAppointment(req, res);

      expect(mockedCreate).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 when patient does not exist", async () => {
      mockedCreate.mockRejectedValue(
        new Error("PATIENT_NOT_FOUND")
      );

      const req = createMockRequest({
        body: validBooking,
      });

      const res = createMockResponse();

      await bookAppointment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should return 404 when provider does not exist", async () => {
      mockedCreate.mockRejectedValue(
        new Error("PROVIDER_NOT_FOUND")
      );

      const req = createMockRequest({
        body: validBooking,
      });

      const res = createMockResponse();

      await bookAppointment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should return 409 when appointment conflicts", async () => {
      mockedCreate.mockRejectedValue(
        new Error("APPOINTMENT_CONFLICT")
      );

      const req = createMockRequest({
        body: validBooking,
      });

      const res = createMockResponse();

      await bookAppointment(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it("should return 500 for unexpected booking errors", async () => {
      mockedCreate.mockRejectedValue(
        new Error("Database error")
      );

      const req = createMockRequest({
        body: validBooking,
      });

      const res = createMockResponse();

      await bookAppointment(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ================= LIST APPOINTMENTS =================

  describe("listAppointments", () => {
    it("should list appointments successfully", async () => {
      const result = {
        data: [appointment],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      mockedList.mockResolvedValue(result as any);

      const req = createMockRequest({
        query: {},
      });

      const res = createMockResponse();

      await listAppointments(req, res);

      expect(mockedList).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
        1,
        10
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });

    it("should list appointments with filters", async () => {
      mockedList.mockResolvedValue({
        data: [appointment],
        pagination: {
          page: 2,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      } as any);

      const req = createMockRequest({
        query: {
          patient_id: appointment.patient_id,
          provider_id: appointment.provider_id,
          status: "scheduled",
          page: "2",
          limit: "10",
        },
      });

      const res = createMockResponse();

      await listAppointments(req, res);

      expect(mockedList).toHaveBeenCalledWith(
        appointment.patient_id,
        appointment.provider_id,
        "scheduled",
        2,
        10
      );

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 400 for invalid list query", async () => {
      const req = createMockRequest({
        query: {
          page: "0",
          limit: "200",
          status: "invalid_status",
        },
      });

      const res = createMockResponse();

      await listAppointments(req, res);

      expect(mockedList).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 500 when listing appointments fails", async () => {
      mockedList.mockRejectedValue(
        new Error("Database error")
      );

      const req = createMockRequest({
        query: {},
      });

      const res = createMockResponse();

      await listAppointments(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ================= GET APPOINTMENT =================

  describe("getAppointment", () => {
    it("should return appointment successfully", async () => {
      mockedGet.mockResolvedValue(appointment as any);

      const req = createMockRequest({
        params: {
          id: appointment.id,
        },
      });

      const res = createMockResponse();

      await getAppointment(req, res);

      expect(mockedGet).toHaveBeenCalledWith(appointment.id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });

    it("should return 404 when appointment does not exist", async () => {
      mockedGet.mockResolvedValue(null as any);

      const req = createMockRequest({
        params: {
          id: appointment.id,
        },
      });

      const res = createMockResponse();

      await getAppointment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should return 500 when getting appointment fails", async () => {
      mockedGet.mockRejectedValue(
        new Error("Database error")
      );

      const req = createMockRequest({
        params: {
          id: appointment.id,
        },
      });

      const res = createMockResponse();

      await getAppointment(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ================= CHANGE APPOINTMENT STATUS =================

  describe("changeAppointmentStatus", () => {
    it("should update appointment status successfully", async () => {
      mockedUpdate.mockResolvedValue({
        ...appointment,
        status: "confirmed",
      } as any);

      const req = createMockRequest({
        params: {
          id: appointment.id,
        },
        body: {
          status: "confirmed",
        },
      });

      const res = createMockResponse();

      await changeAppointmentStatus(req, res);

      expect(mockedUpdate).toHaveBeenCalledWith(
        appointment.id,
        "confirmed",
        undefined
      );

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should update appointment with cancellation reason", async () => {
      mockedUpdate.mockResolvedValue({
        ...appointment,
        status: "cancelled",
      } as any);

      const req = createMockRequest({
        params: {
          id: appointment.id,
        },
        body: {
          status: "cancelled",
          cancellation_reason: "Patient requested cancellation",
        },
      });

      const res = createMockResponse();

      await changeAppointmentStatus(req, res);

      expect(mockedUpdate).toHaveBeenCalledWith(
        appointment.id,
        "cancelled",
        "Patient requested cancellation"
      );

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 400 for invalid status", async () => {
      const req = createMockRequest({
        params: {
          id: appointment.id,
        },
        body: {
          status: "invalid_status",
        },
      });

      const res = createMockResponse();

      await changeAppointmentStatus(req, res);

      expect(mockedUpdate).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 when appointment does not exist", async () => {
      mockedUpdate.mockResolvedValue(null as any);

      const req = createMockRequest({
        params: {
          id: appointment.id,
        },
        body: {
          status: "confirmed",
        },
      });

      const res = createMockResponse();

      await changeAppointmentStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should return 500 when status update fails", async () => {
      mockedUpdate.mockRejectedValue(
        new Error("Database error")
      );

      const req = createMockRequest({
        params: {
          id: appointment.id,
        },
        body: {
          status: "confirmed",
        },
      });

      const res = createMockResponse();

      await changeAppointmentStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});