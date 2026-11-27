import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

const TEST_SECRET = "medicore_test_secret_123456";

process.env.JWT_SECRET = TEST_SECRET;

let app: any;

const createToken = (role: string) => {
  return jwt.sign(
    {
      userId: "test-user-123",
      email: "test@medicore.com",
      role,
      patientId: null,
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

describe("Encounter Access Control", () => {
  it("should deny patients from creating encounters", async () => {
    const response = await request(app)
      .post("/api/v1/encounters")
      .set("Authorization", `Bearer ${createToken("patient")}`)
      .send({});

    expect(response.status).toBe(403);
  });

  it("should deny receptionists from viewing encounters", async () => {
    const response = await request(app)
      .get("/api/v1/encounters")
      .set("Authorization", `Bearer ${createToken("receptionist")}`);

    expect(response.status).toBe(403);
  });

  it("should allow nurses to access encounter listing", async () => {
    const response = await request(app)
      .get("/api/v1/encounters")
      .set("Authorization", `Bearer ${createToken("nurse")}`);

    expect(response.status).not.toBe(403);
    expect(response.status).not.toBe(401);
  });

  it("should deny nurses from changing encounter status", async () => {
    const response = await request(app)
      .patch("/api/v1/encounters/test-id/status")
      .set("Authorization", `Bearer ${createToken("nurse")}`)
      .send({});

    expect(response.status).toBe(403);
  });
});

describe("Prescription Access Control", () => {
  it("should deny patients from creating prescriptions", async () => {
    const response = await request(app)
      .post("/api/v1/prescriptions")
      .set("Authorization", `Bearer ${createToken("patient")}`)
      .send({});

    expect(response.status).toBe(403);
  });

  it("should deny receptionists from viewing prescriptions", async () => {
    const response = await request(app)
      .get("/api/v1/prescriptions")
      .set("Authorization", `Bearer ${createToken("receptionist")}`);

    expect(response.status).toBe(403);
  });

  it("should allow nurses to view prescriptions", async () => {
    const response = await request(app)
      .get("/api/v1/prescriptions")
      .set("Authorization", `Bearer ${createToken("nurse")}`);

    expect(response.status).not.toBe(403);
    expect(response.status).not.toBe(401);
  });

  it("should allow nurses to update prescription status", async () => {
    const response = await request(app)
      .patch("/api/v1/prescriptions/test-id/status")
      .set("Authorization", `Bearer ${createToken("nurse")}`)
      .send({});

    expect(response.status).not.toBe(403);
    expect(response.status).not.toBe(401);
  });
});