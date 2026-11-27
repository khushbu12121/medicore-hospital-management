
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/modules/patients/patient.service", () => ({
  createPatient: vi.fn(),
  getPatients: vi.fn(),
  getPatientById: vi.fn(),
}));

import {
  createPatient,
  getPatients,
  getPatientById,
} from "../src/modules/patients/patient.service";

import {
  registerPatient,
  listPatients,
  getPatient,
} from "../src/modules/patients/patient.controller";

const mockedCreate = vi.mocked(createPatient);
const mockedList = vi.mocked(getPatients);
const mockedGet = vi.mocked(getPatientById);

const patient = {
  id: "11111111-1111-4111-8111-111111111111",
  patient_number: "PT-2026-ABCD1234",
  first_name: "Khushbu",
  last_name: "Bansal",
  date_of_birth: "2004-03-12",
  gender: "female",
  phone: "9876543210",
  email: "khushbu@example.com",
  blood_group: "O+",
  is_active: true,
};

const validPatient = {
  first_name: "Khushbu",
  last_name: "Bansal",
  date_of_birth: "2004-03-12",
  gender: "female",
  phone: "9876543210",
  email: "khushbu@example.com",
  address: "Jaipur, Rajasthan",
  blood_group: "O+",
  emergency_contact_name: "Family Member",
  emergency_contact_phone: "9876543211",
  allergies: "None",
  medical_notes: "No known medical conditions",
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

describe("Patient Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ================= REGISTER PATIENT =================

  describe("registerPatient", () => {
    it("should register patient successfully", async () => {
      mockedCreate.mockResolvedValue(patient as any);

      const req = createMockRequest({
        body: validPatient,
      });

      const res = createMockResponse();

      await registerPatient(req, res);

      expect(mockedCreate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    it("should return 400 for invalid patient data", async () => {
      const req = createMockRequest({
        body: {
          first_name: "",
          last_name: "",
          date_of_birth: "invalid-date",
          email: "invalid-email",
        },
      });

      const res = createMockResponse();

      await registerPatient(req, res);

      expect(mockedCreate).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
    });

    it("should return 500 when patient registration fails", async () => {
      mockedCreate.mockRejectedValue(
        new Error("Database error")
      );

      const req = createMockRequest({
        body: validPatient,
      });

      const res = createMockResponse();

      await registerPatient(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ================= LIST PATIENTS =================

  describe("listPatients", () => {
    it("should list patients successfully", async () => {
      const result = {
        data: [patient],
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

      await listPatients(req, res);

      expect(mockedList).toHaveBeenCalledWith(
        undefined,
        1,
        10
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });

    it("should list patients with search and pagination", async () => {
      mockedList.mockResolvedValue({
        data: [patient],
        pagination: {
          page: 2,
          limit: 5,
          total: 1,
          totalPages: 1,
        },
      } as any);

      const req = createMockRequest({
        query: {
          search: "Khushbu",
          page: "2",
          limit: "5",
        },
      });

      const res = createMockResponse();

      await listPatients(req, res);

      expect(mockedList).toHaveBeenCalledWith(
        "Khushbu",
        2,
        5
      );

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 400 for invalid query parameters", async () => {
      const req = createMockRequest({
        query: {
          page: "0",
          limit: "200",
        },
      });

      const res = createMockResponse();

      await listPatients(req, res);

      expect(mockedList).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 500 when listing patients fails", async () => {
      mockedList.mockRejectedValue(
        new Error("Database error")
      );

      const req = createMockRequest({
        query: {},
      });

      const res = createMockResponse();

      await listPatients(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ================= GET PATIENT =================

  describe("getPatient", () => {
    it("should get patient successfully", async () => {
      mockedGet.mockResolvedValue(patient as any);

      const req = createMockRequest({
        params: {
          id: patient.id,
        },
      });

      const res = createMockResponse();

      await getPatient(req, res);

      expect(mockedGet).toHaveBeenCalledWith(patient.id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });

    it("should return 404 when patient does not exist", async () => {
      mockedGet.mockResolvedValue(null as any);

      const req = createMockRequest({
        params: {
          id: patient.id,
        },
      });

      const res = createMockResponse();

      await getPatient(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should return 500 when getting patient fails", async () => {
      mockedGet.mockRejectedValue(
        new Error("Database error")
      );

      const req = createMockRequest({
        params: {
          id: patient.id,
        },
      });

      const res = createMockResponse();

      await getPatient(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
