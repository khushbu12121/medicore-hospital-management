import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

const TEST_SECRET = "medicore_test_secret_123456";

process.env.JWT_SECRET = TEST_SECRET;

let app: any;

const createPatientToken = (patientId: string) => {
  return jwt.sign(
    {
      userId: "test-patient-user",
      email: "patient@test.com",
      role: "patient",
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

describe("Patient Privacy - Integration Tests", () => {
  const patientAId = "patient-111";
  const patientBId = "patient-222";

  const patientAToken = createPatientToken(patientAId);

  it("should prevent Patient A from accessing Patient B's record", async () => {
    const response = await request(app)
      .get(`/api/v1/patients/${patientBId}`)
      .set("Authorization", `Bearer ${patientAToken}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it("should prevent patients from viewing the patient directory", async () => {
    const response = await request(app)
      .get("/api/v1/patients")
      .set("Authorization", `Bearer ${patientAToken}`);

    expect(response.status).toBe(403);
  });

  it("should prevent patients from registering another patient", async () => {
    const response = await request(app)
      .post("/api/v1/patients")
      .set("Authorization", `Bearer ${patientAToken}`)
      .send({
        firstName: "Test",
        lastName: "Patient",
      });

    expect(response.status).toBe(403);
  });

  it("should reject access to patient records without authentication", async () => {
    const response = await request(app)
      .get(`/api/v1/patients/${patientBId}`);

    expect(response.status).toBe(401);
  });
});