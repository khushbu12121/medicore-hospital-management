import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

const TEST_SECRET = "medicore_test_secret_123456";

process.env.JWT_SECRET = TEST_SECRET;

let app: any;

const createToken = (role: string, patientId: string | null = null) => {
  return jwt.sign(
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
};

beforeAll(async () => {
  const application = await import("../src/app");
  app = application.default;
});

describe("Appointment Workflow & Privacy Tests", () => {
  const patientToken = createToken("patient", "patient-111");

  it("should reject unauthenticated appointment booking", async () => {
    const response = await request(app)
      .post("/api/v1/appointments")
      .send({});

    expect(response.status).toBe(401);
  });

  it("should prevent patients from booking for another patient", async () => {
    const response = await request(app)
      .post("/api/v1/appointments")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({
        patient_id: "patient-222",
        provider_id: "provider-111",
        scheduled_start: "2026-12-01T10:00:00+05:30",
        scheduled_end: "2026-12-01T10:30:00+05:30",
        appointment_type: "consultation",
      });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it("should prevent patients from viewing all appointments", async () => {
    const response = await request(app)
      .get("/api/v1/appointments")
      .set("Authorization", `Bearer ${patientToken}`);

    expect(response.status).toBe(403);
  });

  it("should prevent patients from changing appointment status", async () => {
    const response = await request(app)
      .patch("/api/v1/appointments/test-appointment-id/status")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({
        status: "completed",
      });

    expect(response.status).toBe(403);
  });

  it("should prevent nurses from changing appointment status", async () => {
    const nurseToken = createToken("nurse");

    const response = await request(app)
      .patch("/api/v1/appointments/test-appointment-id/status")
      .set("Authorization", `Bearer ${nurseToken}`)
      .send({
        status: "completed",
      });

    expect(response.status).toBe(403);
  });
});