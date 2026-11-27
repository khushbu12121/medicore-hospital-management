import { describe, it, expect, beforeEach, vi } from "vitest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Set JWT_SECRET before auth.service is imported
vi.hoisted(() => {
  process.env.JWT_SECRET = "test-secret-for-auth-service";
  process.env.JWT_EXPIRES_IN = "1d";
});

const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
}));

vi.mock("../src/config/database", () => ({
  pool: {
    query: queryMock,
  },
}));

import {
  registerPatient,
  loginUser,
} from "../src/modules/auth/auth.service";

describe("Auth Service", () => {
  const patientId = "11111111-1111-4111-8111-111111111111";
  const userId = "22222222-2222-4222-8222-222222222222";

  const validRegisterInput = {
    email: "Test@Example.com",
    password: "Password123",
    patient_id: patientId,
  };

  const validLoginInput = {
    email: "Test@Example.com",
    password: "Password123",
  };

  beforeEach(() => {
    queryMock.mockReset();
  });

  // ==========================================
  // REGISTER PATIENT
  // ==========================================

  describe("registerPatient", () => {
    it("should register a patient successfully", async () => {
      queryMock
        .mockResolvedValueOnce({ rows: [] }) // email check
        .mockResolvedValueOnce({ rows: [{ id: patientId }] }) // patient check
        .mockResolvedValueOnce({ rows: [] }) // existing account check
        .mockResolvedValueOnce({
          rows: [
            {
              id: userId,
              email: "test@example.com",
              role: "patient",
              patient_id: patientId,
              is_active: true,
              created_at: new Date(),
            },
          ],
        });

      const result = await registerPatient(validRegisterInput);

      expect(result).toBeDefined();
      expect(result.email).toBe("test@example.com");
      expect(result.role).toBe("patient");
      expect(result.patient_id).toBe(patientId);

      expect(queryMock).toHaveBeenCalledTimes(4);
    });

    it("should convert email to lowercase", async () => {
      queryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: patientId }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{ email: "test@example.com" }],
        });

      await registerPatient(validRegisterInput);

      expect(queryMock.mock.calls[0][1]).toEqual([
        "test@example.com",
      ]);

      expect(queryMock.mock.calls[3][1][0]).toBe(
        "test@example.com"
      );
    });

    it("should reject duplicate email", async () => {
      queryMock.mockResolvedValueOnce({
        rows: [{ id: userId }],
      });

      await expect(
        registerPatient(validRegisterInput)
      ).rejects.toThrow("Email already registered");

      expect(queryMock).toHaveBeenCalledTimes(1);
    });

    it("should reject when patient does not exist", async () => {
      queryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await expect(
        registerPatient(validRegisterInput)
      ).rejects.toThrow("Patient not found");

      expect(queryMock).toHaveBeenCalledTimes(2);
    });

    it("should reject when patient already has an account", async () => {
      queryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: patientId }] })
        .mockResolvedValueOnce({ rows: [{ id: userId }] });

      await expect(
        registerPatient(validRegisterInput)
      ).rejects.toThrow(
        "An account already exists for this patient"
      );

      expect(queryMock).toHaveBeenCalledTimes(3);
    });

    it("should hash password before storing it", async () => {
      queryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: patientId }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{ id: userId }],
        });

      await registerPatient(validRegisterInput);

      const insertCall = queryMock.mock.calls[3];
      const storedPassword = insertCall[1][1];

      expect(storedPassword).not.toBe(
        validRegisterInput.password
      );

      expect(
        await bcrypt.compare(
          validRegisterInput.password,
          storedPassword
        )
      ).toBe(true);
    });

    it("should use bcrypt salt rounds of 12", async () => {
      queryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: patientId }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{ id: userId }],
        });

      await registerPatient(validRegisterInput);

      const storedPassword = queryMock.mock.calls[3][1][1];

      expect(storedPassword).toMatch(/^\$2[aby]\$12\$/);
    });

    it("should propagate database errors during email lookup", async () => {
      queryMock.mockRejectedValueOnce(
        new Error("Database error")
      );

      await expect(
        registerPatient(validRegisterInput)
      ).rejects.toThrow("Database error");
    });

    it("should propagate database errors during patient lookup", async () => {
      queryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockRejectedValueOnce(
          new Error("Database error")
        );

      await expect(
        registerPatient(validRegisterInput)
      ).rejects.toThrow("Database error");
    });

    it("should propagate database errors during account insertion", async () => {
      queryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: patientId }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockRejectedValueOnce(
          new Error("Database error")
        );

      await expect(
        registerPatient(validRegisterInput)
      ).rejects.toThrow("Database error");
    });
  });

  // ==========================================
  // LOGIN USER
  // ==========================================

  describe("loginUser", () => {
    const passwordHash = bcrypt.hashSync(
      "Password123",
      12
    );

    const mockUser = {
      id: userId,
      email: "test@example.com",
      password_hash: passwordHash,
      role: "patient",
      patient_id: patientId,
      staff_id: null,
      is_active: true,
    };

    it("should login successfully with correct credentials", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [mockUser],
        })
        .mockResolvedValueOnce({
          rows: [],
        });

      const result = await loginUser(validLoginInput);

      expect(result.token).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(userId);
      expect(result.user.email).toBe("test@example.com");
      expect(result.user.role).toBe("patient");
      expect(result.user.patient_id).toBe(patientId);

      expect(queryMock).toHaveBeenCalledTimes(2);
    });

    it("should convert login email to lowercase", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [mockUser],
        })
        .mockResolvedValueOnce({
          rows: [],
        });

      await loginUser(validLoginInput);

      expect(queryMock.mock.calls[0][1]).toEqual([
        "test@example.com",
      ]);
    });

    it("should reject when user does not exist", async () => {
      queryMock.mockResolvedValueOnce({
        rows: [],
      });

      await expect(
        loginUser(validLoginInput)
      ).rejects.toThrow("Invalid email or password");

      expect(queryMock).toHaveBeenCalledTimes(1);
    });

    it("should reject inactive account", async () => {
      queryMock.mockResolvedValueOnce({
        rows: [
          {
            ...mockUser,
            is_active: false,
          },
        ],
      });

      await expect(
        loginUser(validLoginInput)
      ).rejects.toThrow("Account is inactive");

      expect(queryMock).toHaveBeenCalledTimes(1);
    });

    it("should reject incorrect password", async () => {
      queryMock.mockResolvedValueOnce({
        rows: [mockUser],
      });

      await expect(
        loginUser({
          email: "Test@Example.com",
          password: "WrongPassword123",
        })
      ).rejects.toThrow("Invalid email or password");

      expect(queryMock).toHaveBeenCalledTimes(1);
    });

    it("should update last login after successful authentication", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [mockUser],
        })
        .mockResolvedValueOnce({
          rows: [],
        });

      await loginUser(validLoginInput);

      expect(queryMock.mock.calls[1][0]).toContain(
        "UPDATE users SET last_login_at = NOW()"
      );

      expect(queryMock.mock.calls[1][1]).toEqual([
        userId,
      ]);
    });

    it("should generate a valid JWT token", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [mockUser],
        })
        .mockResolvedValueOnce({
          rows: [],
        });

      const result = await loginUser(validLoginInput);

      const decoded = jwt.verify(
        result.token,
        "test-secret-for-auth-service"
      ) as jwt.JwtPayload;

      expect(decoded.userId).toBe(userId);
      expect(decoded.email).toBe("test@example.com");
      expect(decoded.role).toBe("patient");
      expect(decoded.patientId).toBe(patientId);
      expect(decoded.staffId).toBeNull();
    });

    it("should include staff information in JWT for staff users", async () => {
      const staffUser = {
        ...mockUser,
        role: "doctor",
        patient_id: null,
        staff_id: "33333333-3333-4333-8333-333333333333",
      };

      queryMock
        .mockResolvedValueOnce({
          rows: [staffUser],
        })
        .mockResolvedValueOnce({
          rows: [],
        });

      const result = await loginUser(validLoginInput);

      const decoded = jwt.verify(
        result.token,
        "test-secret-for-auth-service"
      ) as jwt.JwtPayload;

      expect(decoded.role).toBe("doctor");
      expect(decoded.staffId).toBe(staffUser.staff_id);
      expect(decoded.patientId).toBeNull();
    });

    it("should return only safe user information", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [mockUser],
        })
        .mockResolvedValueOnce({
          rows: [],
        });

      const result = await loginUser(validLoginInput);

      expect(result.user).not.toHaveProperty("password_hash");
      expect(result.user).not.toHaveProperty("password");
    });

    it("should propagate database error during login lookup", async () => {
      queryMock.mockRejectedValueOnce(
        new Error("Database error")
      );

      await expect(
        loginUser(validLoginInput)
      ).rejects.toThrow("Database error");
    });

    it("should propagate database error during last login update", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [mockUser],
        })
        .mockRejectedValueOnce(
          new Error("Database error")
        );

      await expect(
        loginUser(validLoginInput)
      ).rejects.toThrow("Database error");
    });
  });
});