import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

const TEST_SECRET = "medicore_test_secret_123456";
process.env.JWT_SECRET = TEST_SECRET;

let app: any;

const token = (role: string, patientId: string | null = null) =>
  jwt.sign(
    {
      userId: "test-user-123",
      email: "test@medicore.com",
      role,
      patientId,
      staffId: null,
    },
    TEST_SECRET,
    { expiresIn: "1h" }
  );

beforeAll(async () => {
  const application = await import("../src/app");
  app = application.default;
});

// ---------------- LABORATORY ----------------

describe("Laboratory RBAC", () => {
  it("should deny patients from creating lab orders", async () => {
    const res = await request(app)
      .post("/api/v1/laboratory")
      .set("Authorization", `Bearer ${token("patient")}`)
      .send({});

    expect(res.status).toBe(403);
  });

  it("should allow lab technicians to view lab orders", async () => {
    const res = await request(app)
      .get("/api/v1/laboratory")
      .set("Authorization", `Bearer ${token("lab_technician")}`);

    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });

  it("should deny nurses from changing lab order status", async () => {
    const res = await request(app)
      .patch("/api/v1/laboratory/test-id/status")
      .set("Authorization", `Bearer ${token("nurse")}`)
      .send({});

    expect(res.status).toBe(403);
  });

  it("should deny doctors from entering lab results", async () => {
    const res = await request(app)
      .post("/api/v1/laboratory/test-id/results")
      .set("Authorization", `Bearer ${token("doctor")}`)
      .send({});

    expect(res.status).toBe(403);
  });

  it("should deny doctors from verifying lab results", async () => {
    const res = await request(app)
      .patch("/api/v1/laboratory/results/test-id/verify")
      .set("Authorization", `Bearer ${token("doctor")}`)
      .send({});

    expect(res.status).toBe(403);
  });
});

// ---------------- BILLING ----------------

describe("Billing RBAC", () => {
  it("should deny patients from viewing invoices", async () => {
    const res = await request(app)
      .get("/api/v1/billing/invoices")
      .set("Authorization", `Bearer ${token("patient")}`);

    expect(res.status).toBe(403);
  });

  it("should deny doctors from creating invoices", async () => {
    const res = await request(app)
      .post("/api/v1/billing/invoices")
      .set("Authorization", `Bearer ${token("doctor")}`)
      .send({});

    expect(res.status).toBe(403);
  });

  it("should deny receptionists from changing invoice status", async () => {
    const res = await request(app)
      .patch("/api/v1/billing/invoices/test-id/status")
      .set("Authorization", `Bearer ${token("receptionist")}`)
      .send({});

    expect(res.status).toBe(403);
  });

  it("should allow billing officers to access invoices", async () => {
    const res = await request(app)
      .get("/api/v1/billing/invoices")
      .set("Authorization", `Bearer ${token("billing_officer")}`);

    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });
});

// ---------------- CONSENT ----------------

describe("Consent Privacy & RBAC", () => {
  it("should deny patients from viewing all consent records", async () => {
    const res = await request(app)
      .get("/api/v1/consents")
      .set("Authorization", `Bearer ${token("patient", "patient-111")}`);

    expect(res.status).toBe(403);
  });

  it("should prevent patients from creating consent for another patient", async () => {
    const res = await request(app)
      .post("/api/v1/consents")
      .set("Authorization", `Bearer ${token("patient", "patient-111")}`)
      .send({
        patient_id: "patient-222",
      });

    expect(res.status).toBe(403);
  });

  it("should deny receptionists from accessing consent records", async () => {
    const res = await request(app)
      .get("/api/v1/consents")
      .set("Authorization", `Bearer ${token("receptionist")}`);

    expect(res.status).toBe(403);
  });
});

// ---------------- STAFF ----------------

describe("Staff RBAC", () => {
  it("should deny patients from viewing staff directory", async () => {
    const res = await request(app)
      .get("/api/v1/staff")
      .set("Authorization", `Bearer ${token("patient")}`);

    expect(res.status).toBe(403);
  });

  it("should deny doctors from creating staff members", async () => {
    const res = await request(app)
      .post("/api/v1/staff")
      .set("Authorization", `Bearer ${token("doctor")}`)
      .send({});

    expect(res.status).toBe(403);
  });

  it("should deny receptionists from updating staff information", async () => {
    const res = await request(app)
      .patch("/api/v1/staff/test-id")
      .set("Authorization", `Bearer ${token("receptionist")}`)
      .send({});

    expect(res.status).toBe(403);
  });

  it("should deny nurses from changing staff status", async () => {
    const res = await request(app)
      .patch("/api/v1/staff/test-id/status")
      .set("Authorization", `Bearer ${token("nurse")}`)
      .send({});

    expect(res.status).toBe(403);
  });
});

// ---------------- AUDIT ----------------

describe("Audit Log RBAC", () => {
  it("should deny patients from viewing audit logs", async () => {
    const res = await request(app)
      .get("/api/v1/audit")
      .set("Authorization", `Bearer ${token("patient")}`);

    expect(res.status).toBe(403);
  });

  it("should deny doctors from viewing audit logs", async () => {
    const res = await request(app)
      .get("/api/v1/audit")
      .set("Authorization", `Bearer ${token("doctor")}`);

    expect(res.status).toBe(403);
  });

  it("should deny nurses from creating audit records", async () => {
    const res = await request(app)
      .post("/api/v1/audit")
      .set("Authorization", `Bearer ${token("nurse")}`)
      .send({});

    expect(res.status).toBe(403);
  });
});