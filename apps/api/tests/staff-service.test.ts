
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockQuery } = vi.hoisted(() => ({
  mockQuery: vi.fn(),
}));

vi.mock("../src/config/database", () => ({
  pool: {
    query: mockQuery,
  },
}));

import {
  createStaff,
  getStaffList,
  getStaffById,
  updateStaff,
  updateStaffStatus,
} from "../src/modules/staff/staff.service";

describe("Staff Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const staff = {
    id: "staff-123",
    employee_code: "EMP001",
    first_name: "John",
    last_name: "Doe",
    email: "john@example.com",
    phone: "1234567890",
    role: "doctor",
    department_id: "550e8400-e29b-41d4-a716-446655440000",
    specialization: "Cardiology",
    license_number: "LIC001",
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  // --------------------------------------------------
  // CREATE STAFF
  // --------------------------------------------------

  describe("createStaff", () => {
    it("should create staff successfully with all fields", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [staff],
      });

      const result = await createStaff({
        employee_code: "EMP001",
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        phone: "1234567890",
        role: "doctor",
        department_id: "550e8400-e29b-41d4-a716-446655440000",
        specialization: "Cardiology",
        license_number: "LIC001",
      });

      expect(result).toEqual(staff);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO staff"),
        [
          "EMP001",
          "John",
          "Doe",
          "john@example.com",
          "1234567890",
          "doctor",
          "550e8400-e29b-41d4-a716-446655440000",
          "Cardiology",
          "LIC001",
        ],
      );
    });

    it("should create staff when optional fields are omitted", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [staff],
      });

      await createStaff({
        employee_code: "EMP001",
        first_name: "John",
        last_name: "Doe",
        role: "doctor",
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO staff"),
        [
          "EMP001",
          "John",
          "Doe",
          null,
          null,
          "doctor",
          null,
          null,
          null,
        ],
      );
    });

    it("should accept nullable optional fields", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [staff],
      });

      await createStaff({
        employee_code: "EMP001",
        first_name: "John",
        last_name: "Doe",
        email: null,
        phone: null,
        role: "doctor",
        department_id: null,
        specialization: null,
        license_number: null,
      });

      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it("should throw validation error for missing employee_code", async () => {
      await expect(
        createStaff({
          first_name: "John",
          last_name: "Doe",
          role: "doctor",
        }),
      ).rejects.toThrow();

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("should throw validation error for empty employee_code", async () => {
      await expect(
        createStaff({
          employee_code: "",
          first_name: "John",
          last_name: "Doe",
          role: "doctor",
        }),
      ).rejects.toThrow();

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("should throw validation error for missing first_name", async () => {
      await expect(
        createStaff({
          employee_code: "EMP001",
          last_name: "Doe",
          role: "doctor",
        }),
      ).rejects.toThrow();

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("should throw validation error for missing last_name", async () => {
      await expect(
        createStaff({
          employee_code: "EMP001",
          first_name: "John",
          role: "doctor",
        }),
      ).rejects.toThrow();

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("should throw validation error for missing role", async () => {
      await expect(
        createStaff({
          employee_code: "EMP001",
          first_name: "John",
          last_name: "Doe",
        }),
      ).rejects.toThrow();

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("should throw validation error for invalid email", async () => {
      await expect(
        createStaff({
          employee_code: "EMP001",
          first_name: "John",
          last_name: "Doe",
          role: "doctor",
          email: "invalid-email",
        }),
      ).rejects.toThrow();

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("should throw validation error for invalid department UUID", async () => {
      await expect(
        createStaff({
          employee_code: "EMP001",
          first_name: "John",
          last_name: "Doe",
          role: "doctor",
          department_id: "invalid-uuid",
        }),
      ).rejects.toThrow();

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("should throw validation error when employee_code exceeds max length", async () => {
      await expect(
        createStaff({
          employee_code: "E".repeat(51),
          first_name: "John",
          last_name: "Doe",
          role: "doctor",
        }),
      ).rejects.toThrow();

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("should throw validation error when first_name exceeds max length", async () => {
      await expect(
        createStaff({
          employee_code: "EMP001",
          first_name: "J".repeat(101),
          last_name: "Doe",
          role: "doctor",
        }),
      ).rejects.toThrow();

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("should throw validation error when last_name exceeds max length", async () => {
      await expect(
        createStaff({
          employee_code: "EMP001",
          first_name: "John",
          last_name: "D".repeat(101),
          role: "doctor",
        }),
      ).rejects.toThrow();

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("should throw validation error when role exceeds max length", async () => {
      await expect(
        createStaff({
          employee_code: "EMP001",
          first_name: "John",
          last_name: "Doe",
          role: "R".repeat(101),
        }),
      ).rejects.toThrow();

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("should propagate database errors", async () => {
      mockQuery.mockRejectedValueOnce(new Error("Database error"));

      await expect(
        createStaff({
          employee_code: "EMP001",
          first_name: "John",
          last_name: "Doe",
          role: "doctor",
        }),
      ).rejects.toThrow("Database error");
    });
  });

  // --------------------------------------------------
  // GET STAFF LIST
  // --------------------------------------------------

  describe("getStaffList", () => {
    it("should return staff list with default pagination", async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ count: "10" }],
        })
        .mockResolvedValueOnce({
          rows: [staff],
        });

      const result = await getStaffList({});

      expect(result.data).toEqual([staff]);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 10,
        totalPages: 1,
      });

      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it("should calculate pagination correctly", async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ count: "45" }],
        })
        .mockResolvedValueOnce({
          rows: [staff],
        });

      const result = await getStaffList({
        page: 2,
        limit: 10,
      });

      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 45,
        totalPages: 5,
      });

      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("LIMIT"),
        [10, 10],
      );
    });

    it("should filter staff by role", async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ count: "1" }],
        })
        .mockResolvedValueOnce({
          rows: [staff],
        });

      const result = await getStaffList({
        role: "doctor",
      });

      expect(result.data).toEqual([staff]);

      expect(mockQuery).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining("role = $1"),
        ["doctor"],
      );
    });

    it("should filter staff by department", async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ count: "1" }],
        })
        .mockResolvedValueOnce({
          rows: [staff],
        });

      const result = await getStaffList({
        department_id: "550e8400-e29b-41d4-a716-446655440000",
      });

      expect(result.data).toEqual([staff]);

      expect(mockQuery).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining("department_id = $1"),
        ["550e8400-e29b-41d4-a716-446655440000"],
      );
    });

    it("should filter active staff", async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ count: "1" }],
        })
        .mockResolvedValueOnce({
          rows: [staff],
        });

      await getStaffList({
        is_active: true,
      });

      expect(mockQuery).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining("is_active = $1"),
        [true],
      );
    });

    it("should filter inactive staff", async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ count: "1" }],
        })
        .mockResolvedValueOnce({
          rows: [],
        });

      await getStaffList({
        is_active: false,
      });

      expect(mockQuery).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining("is_active = $1"),
        [false],
      );
    });

    it("should search staff by name, employee code, or email", async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ count: "1" }],
        })
        .mockResolvedValueOnce({
          rows: [staff],
        });

      await getStaffList({
        search: "John",
      });

      expect(mockQuery).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining("first_name ILIKE"),
        ["%John%"],
      );

      expect(mockQuery).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining("last_name ILIKE"),
        ["%John%"],
      );
    });

    it("should combine multiple filters", async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ count: "1" }],
        })
        .mockResolvedValueOnce({
          rows: [staff],
        });

      await getStaffList({
        role: "doctor",
        department_id: "550e8400-e29b-41d4-a716-446655440000",
        is_active: true,
        search: "John",
        page: 2,
        limit: 10,
      });

      expect(mockQuery).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining("WHERE"),
        [
          "doctor",
          "550e8400-e29b-41d4-a716-446655440000",
          true,
          "%John%",
        ],
      );

      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("LIMIT"),
        [
          "doctor",
          "550e8400-e29b-41d4-a716-446655440000",
          true,
          "%John%",
          10,
          10,
        ],
      );
    });

    it("should return empty data when no staff found", async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ count: "0" }],
        })
        .mockResolvedValueOnce({
          rows: [],
        });

      const result = await getStaffList({});

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });

    it("should return zero totalPages when total is zero", async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ count: "0" }],
        })
        .mockResolvedValueOnce({
          rows: [],
        });

      const result = await getStaffList({
        page: 1,
        limit: 10,
      });

      expect(result.pagination.totalPages).toBe(0);
    });

    it("should throw validation error for invalid department UUID", async () => {
      await expect(
        getStaffList({
          department_id: "invalid",
        }),
      ).rejects.toThrow();

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("should throw validation error for invalid page", async () => {
      await expect(
        getStaffList({
          page: 0,
        }),
      ).rejects.toThrow();

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("should throw validation error for invalid limit", async () => {
      await expect(
        getStaffList({
          limit: 101,
        }),
      ).rejects.toThrow();

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("should propagate count query database errors", async () => {
      mockQuery.mockRejectedValueOnce(new Error("Count query failed"));

      await expect(getStaffList({})).rejects.toThrow(
        "Count query failed",
      );
    });

    it("should propagate staff list query database errors", async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ count: "1" }],
        })
        .mockRejectedValueOnce(new Error("Staff query failed"));

      await expect(getStaffList({})).rejects.toThrow(
        "Staff query failed",
      );
    });
  });

  // --------------------------------------------------
  // GET STAFF BY ID
  // --------------------------------------------------

  describe("getStaffById", () => {
    it("should return staff when found", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [staff],
      });

      const result = await getStaffById("staff-123");

      expect(result).toEqual(staff);
      expect(mockQuery).toHaveBeenCalledWith(
        "SELECT * FROM staff WHERE id = $1",
        ["staff-123"],
      );
    });

    it("should return null when staff does not exist", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
      });

      const result = await getStaffById("non-existent");

      expect(result).toBeNull();
    });

    it("should propagate database errors", async () => {
      mockQuery.mockRejectedValueOnce(new Error("Database error"));

      await expect(getStaffById("staff-123")).rejects.toThrow(
        "Database error",
      );
    });
  });

  // --------------------------------------------------
  // UPDATE STAFF
  // --------------------------------------------------

  describe("updateStaff", () => {
    it("should update staff successfully", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            ...staff,
            first_name: "Jane",
          },
        ],
      });

      const result = await updateStaff("staff-123", {
        first_name: "Jane",
      });

      expect(result.first_name).toBe("Jane");

      expect(mockQuery).toHaveBeenCalledWith(
  expect.stringMatching(/UPDATE staff\s+SET first_name = \$1/),
  ["Jane", "staff-123"],
);
    });

    it("should update multiple fields", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            ...staff,
            first_name: "Jane",
            last_name: "Smith",
            role: "nurse",
          },
        ],
      });

      const result = await updateStaff("staff-123", {
        first_name: "Jane",
        last_name: "Smith",
        role: "nurse",
      });

      expect(result.first_name).toBe("Jane");
      expect(result.last_name).toBe("Smith");
      expect(result.role).toBe("nurse");
    });

    it("should allow nullable fields to be set to null", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            ...staff,
            email: null,
            phone: null,
          },
        ],
      });

      await updateStaff("staff-123", {
        email: null,
        phone: null,
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("email = $1"),
        [null, null, "staff-123"],
      );
    });

    it("should throw error when no fields are provided", async () => {
      await expect(
        updateStaff("staff-123", {}),
      ).rejects.toThrow("No fields provided for update");

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("should throw validation error for invalid email", async () => {
      await expect(
        updateStaff("staff-123", {
          email: "invalid-email",
        }),
      ).rejects.toThrow();

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("should throw validation error for empty first_name", async () => {
      await expect(
        updateStaff("staff-123", {
          first_name: "",
        }),
      ).rejects.toThrow();

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("should throw validation error for empty last_name", async () => {
      await expect(
        updateStaff("staff-123", {
          last_name: "",
        }),
      ).rejects.toThrow();

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("should throw validation error for empty role", async () => {
      await expect(
        updateStaff("staff-123", {
          role: "",
        }),
      ).rejects.toThrow();

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("should throw validation error for invalid department UUID", async () => {
      await expect(
        updateStaff("staff-123", {
          department_id: "invalid-uuid",
        }),
      ).rejects.toThrow();

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("should return null when staff does not exist", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
      });

      const result = await updateStaff("non-existent", {
        first_name: "Jane",
      });

      expect(result).toBeNull();
    });

    it("should propagate database errors", async () => {
      mockQuery.mockRejectedValueOnce(new Error("Database error"));

      await expect(
        updateStaff("staff-123", {
          first_name: "Jane",
        }),
      ).rejects.toThrow("Database error");
    });
  });

  // --------------------------------------------------
  // UPDATE STAFF STATUS
  // --------------------------------------------------

  describe("updateStaffStatus", () => {
    it("should activate staff successfully", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            ...staff,
            is_active: true,
          },
        ],
      });

      const result = await updateStaffStatus(
        "staff-123",
        true,
      );

      expect(result.is_active).toBe(true);

      expect(mockQuery).toHaveBeenCalledWith(
  expect.stringMatching(/UPDATE staff\s+SET is_active = \$2/),
  ["staff-123", true],
);
    });

    it("should deactivate staff successfully", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            ...staff,
            is_active: false,
          },
        ],
      });

      const result = await updateStaffStatus(
        "staff-123",
        false,
      );

      expect(result.is_active).toBe(false);

      expect(mockQuery).toHaveBeenCalledWith(
  expect.stringMatching(/UPDATE staff\s+SET is_active = \$2/),
  ["staff-123", false],
);
    });

    it("should return null when staff does not exist", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
      });

      const result = await updateStaffStatus(
        "non-existent",
        false,
      );

      expect(result).toBeNull();
    });

    it("should propagate database errors", async () => {
      mockQuery.mockRejectedValueOnce(new Error("Database error"));

      await expect(
        updateStaffStatus("staff-123", false),
      ).rejects.toThrow("Database error");
    });
  });
});
