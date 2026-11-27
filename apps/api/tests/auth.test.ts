import { describe, it, expect, beforeAll } from "vitest";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";

const TEST_SECRET = "medicore_test_secret_123456";

process.env.JWT_SECRET = TEST_SECRET;

let authenticate: any;
let authorize: any;

const createToken = (role: string) => {
  return jwt.sign(
    {
      userId: "test-user-123",
      email: "test@medicore.com",
      role,
      patientId: role === "patient" ? "patient-123" : null,
      staffId: null,
    },
    TEST_SECRET,
    { expiresIn: "1h" }
  );
};

let app: express.Express;

beforeAll(async () => {
  const middleware = await import("../src/middleware/auth.middleware");

  authenticate = middleware.authenticate;
  authorize = middleware.authorize;

  app = express();

  app.get("/protected", authenticate, (_req, res) => {
    res.status(200).json({ success: true });
  });

  app.get(
    "/admin",
    authenticate,
    authorize("administrator"),
    (_req, res) => {
      res.status(200).json({ success: true });
    }
  );

  app.get(
    "/doctor",
    authenticate,
    authorize("doctor", "administrator"),
    (_req, res) => {
      res.status(200).json({ success: true });
    }
  );
});

describe("Authentication Middleware", () => {
  it("should reject requests without a token", async () => {
    const response = await request(app).get("/protected");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("should reject an invalid token", async () => {
    const response = await request(app)
      .get("/protected")
      .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);
  });

  it("should allow a valid JWT token", async () => {
    const token = createToken("patient");

    const response = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});

describe("Role-Based Authorization Middleware", () => {
  it("should reject a patient accessing administrator route", async () => {
    const token = createToken("patient");

    const response = await request(app)
      .get("/admin")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
  });

  it("should allow an administrator to access administrator route", async () => {
    const token = createToken("administrator");

    const response = await request(app)
      .get("/admin")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  it("should allow a doctor to access doctor route", async () => {
    const token = createToken("doctor");

    const response = await request(app)
      .get("/doctor")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  it("should reject a receptionist accessing doctor-only route", async () => {
    const token = createToken("receptionist");

    const response = await request(app)
      .get("/doctor")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
  });
});