import { describe, it, expect, vi, beforeEach } from "vitest";

import { register, login } from "../src/modules/auth/auth.controller";
import { registerPatient, loginUser } from "../src/modules/auth/auth.service";

vi.mock("../src/modules/auth/auth.service", () => ({
  registerPatient: vi.fn(),
  loginUser: vi.fn(),
}));

const mockRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("Auth Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // REGISTER
  it("should register patient successfully", async () => {
    const req: any = {
      body: {
        email: "patient@example.com",
        password: "password123",
        patient_id: "550e8400-e29b-41d4-a716-446655440000",
      },
    };

    const res = mockRes();
    const user = { id: "user-123", email: "patient@example.com" };

    vi.mocked(registerPatient).mockResolvedValue(user as any);

    await register(req, res);

    expect(registerPatient).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Patient account created successfully",
      data: user,
    });
  });

  it("should return 400 for invalid registration data", async () => {
    const req: any = {
      body: {
        email: "invalid-email",
        password: "123",
        patient_id: "invalid-id",
      },
    };

    const res = mockRes();

    await register(req, res);

    expect(registerPatient).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Validation failed",
        errors: expect.any(Array),
      })
    );
  });

  it("should return 400 when registration service fails", async () => {
    const req: any = {
      body: {
        email: "patient@example.com",
        password: "password123",
        patient_id: "550e8400-e29b-41d4-a716-446655440000",
      },
    };

    const res = mockRes();

    vi.mocked(registerPatient).mockRejectedValue(
      new Error("Patient already exists")
    );

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Patient already exists",
    });
  });

  // LOGIN
  it("should login successfully", async () => {
    const req: any = {
      body: {
        email: "patient@example.com",
        password: "password123",
      },
    };

    const res = mockRes();

    const result = {
      user: { id: "user-123", email: "patient@example.com" },
      token: "jwt-token",
    };

    vi.mocked(loginUser).mockResolvedValue(result as any);

    await login(req, res);

    expect(loginUser).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Login successful",
      data: result,
    });
  });

  it("should return 400 for invalid login data", async () => {
    const req: any = {
      body: {
        email: "invalid-email",
        password: "",
      },
    };

    const res = mockRes();

    await login(req, res);

    expect(loginUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Validation failed",
        errors: expect.any(Array),
      })
    );
  });

  it("should return 401 for invalid credentials", async () => {
    const req: any = {
      body: {
        email: "patient@example.com",
        password: "wrongpassword",
      },
    };

    const res = mockRes();

    vi.mocked(loginUser).mockRejectedValue(
      new Error("Invalid credentials")
    );

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid credentials",
    });
  });

  it("should return 403 when account is inactive", async () => {
    const req: any = {
      body: {
        email: "patient@example.com",
        password: "password123",
      },
    };

    const res = mockRes();

    vi.mocked(loginUser).mockRejectedValue(
      new Error("Account is inactive")
    );

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Account is inactive",
    });
  });

  it("should return 401 when login service fails unexpectedly", async () => {
    const req: any = {
      body: {
        email: "patient@example.com",
        password: "password123",
      },
    };

    const res = mockRes();

    vi.mocked(loginUser).mockRejectedValue(
      new Error("Something went wrong")
    );

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Something went wrong",
    });
  });
});