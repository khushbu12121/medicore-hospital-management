
import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  createStaff,
  getStaffList,
  getStaffById,
  updateStaff,
  updateStaffStatus,
} from "../src/modules/staff/staff.service";

import {
  createStaffController,
  getStaffListController,
  getStaffByIdController,
  updateStaffController,
  updateStaffStatusController,
} from "../src/modules/staff/staff.controller";

vi.mock("../src/modules/staff/staff.service", () => ({
  createStaff: vi.fn(),
  getStaffList: vi.fn(),
  getStaffById: vi.fn(),
  updateStaff: vi.fn(),
  updateStaffStatus: vi.fn(),
}));

const mockRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const staffData = {
  id: "staff-123",
  employee_code: "EMP001",
  first_name: "Khushbu",
  last_name: "Bansal",
  email: "khushbu@example.com",
  phone: "9876543210",
  role: "Doctor",
  department_id: null,
  specialization: "General Medicine",
  license_number: "LIC001",
  is_active: true,
};

describe("Staff Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // CREATE STAFF

  describe("createStaffController", () => {
    it("should create staff successfully", async () => {
      (createStaff as any).mockResolvedValue(staffData);

      const req: any = { body: staffData };
      const res = mockRes();

      await createStaffController(req, res);

      expect(createStaff).toHaveBeenCalledWith(staffData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Staff created successfully",
        data: staffData,
      });
    });

    it("should return 400 when creation fails", async () => {
      (createStaff as any).mockRejectedValue(
        new Error("Employee code already exists")
      );

      const req: any = { body: staffData };
      const res = mockRes();

      await createStaffController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Employee code already exists",
      });
    });
  });

  // GET STAFF LIST

  describe("getStaffListController", () => {
    it("should retrieve staff list successfully", async () => {
      const result = {
        data: [staffData],
        total: 1,
        page: 1,
        limit: 20,
      };

      (getStaffList as any).mockResolvedValue(result);

      const req: any = { query: {} };
      const res = mockRes();

      await getStaffListController(req, res);

      expect(getStaffList).toHaveBeenCalledWith(req.query);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Staff retrieved successfully",
        ...result,
      });
    });

    it("should pass filters to service", async () => {
      const query = {
        role: "Doctor",
        search: "Khushbu",
        page: "2",
        limit: "10",
      };

      (getStaffList as any).mockResolvedValue({
        data: [],
        total: 0,
        page: 2,
        limit: 10,
      });

      const req: any = { query };
      const res = mockRes();

      await getStaffListController(req, res);

      expect(getStaffList).toHaveBeenCalledWith(query);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 400 when retrieving staff list fails", async () => {
      (getStaffList as any).mockRejectedValue(
        new Error("Database error")
      );

      const req: any = { query: {} };
      const res = mockRes();

      await getStaffListController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Database error",
      });
    });
  });

  // GET STAFF BY ID

  describe("getStaffByIdController", () => {
    it("should retrieve staff by ID successfully", async () => {
      (getStaffById as any).mockResolvedValue(staffData);

      const req: any = { params: { id: "staff-123" } };
      const res = mockRes();

      await getStaffByIdController(req, res);

      expect(getStaffById).toHaveBeenCalledWith("staff-123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Staff retrieved successfully",
        data: staffData,
      });
    });

    it("should return 404 when staff does not exist", async () => {
      (getStaffById as any).mockResolvedValue(null);

      const req: any = { params: { id: "missing-id" } };
      const res = mockRes();

      await getStaffByIdController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Staff not found",
      });
    });

    it("should return 400 when service throws an error", async () => {
      (getStaffById as any).mockRejectedValue(
        new Error("Database error")
      );

      const req: any = { params: { id: "staff-123" } };
      const res = mockRes();

      await getStaffByIdController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Database error",
      });
    });
  });

  // UPDATE STAFF

  describe("updateStaffController", () => {
    it("should update staff successfully", async () => {
      const updatedStaff = {
        ...staffData,
        first_name: "Updated",
      };

      (updateStaff as any).mockResolvedValue(updatedStaff);

      const req: any = {
        params: { id: "staff-123" },
        body: { first_name: "Updated" },
      };

      const res = mockRes();

      await updateStaffController(req, res);

      expect(updateStaff).toHaveBeenCalledWith(
        "staff-123",
        { first_name: "Updated" }
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Staff updated successfully",
        data: updatedStaff,
      });
    });

    it("should return 404 when staff to update does not exist", async () => {
      (updateStaff as any).mockResolvedValue(null);

      const req: any = {
        params: { id: "missing-id" },
        body: { first_name: "Updated" },
      };

      const res = mockRes();

      await updateStaffController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Staff not found",
      });
    });

    it("should return 400 when update fails", async () => {
      (updateStaff as any).mockRejectedValue(
        new Error("Update failed")
      );

      const req: any = {
        params: { id: "staff-123" },
        body: { first_name: "Updated" },
      };

      const res = mockRes();

      await updateStaffController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Update failed",
      });
    });
  });

  // UPDATE STAFF STATUS

  describe("updateStaffStatusController", () => {
    it("should update staff status successfully", async () => {
      const updatedStaff = {
        ...staffData,
        is_active: false,
      };

      (updateStaffStatus as any).mockResolvedValue(updatedStaff);

      const req: any = {
        params: { id: "staff-123" },
        body: { is_active: false },
      };

      const res = mockRes();

      await updateStaffStatusController(req, res);

      expect(updateStaffStatus).toHaveBeenCalledWith(
        "staff-123",
        false
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Staff status updated successfully",
        data: updatedStaff,
      });
    });

    it("should return 400 when is_active is not boolean", async () => {
      const req: any = {
        params: { id: "staff-123" },
        body: { is_active: "false" },
      };

      const res = mockRes();

      await updateStaffStatusController(req, res);

      expect(updateStaffStatus).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "is_active must be a boolean",
      });
    });

    it("should return 404 when staff does not exist", async () => {
      (updateStaffStatus as any).mockResolvedValue(null);

      const req: any = {
        params: { id: "missing-id" },
        body: { is_active: true },
      };

      const res = mockRes();

      await updateStaffStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Staff not found",
      });
    });

    it("should return 400 when status update fails", async () => {
      (updateStaffStatus as any).mockRejectedValue(
        new Error("Status update failed")
      );

      const req: any = {
        params: { id: "staff-123" },
        body: { is_active: true },
      };

      const res = mockRes();

      await updateStaffStatusController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Status update failed",
      });
    });
  });
});
