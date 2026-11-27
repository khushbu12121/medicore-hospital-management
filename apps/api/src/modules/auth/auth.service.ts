import { pool } from "../../config/database";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { LoginInput, RegisterInput } from "./auth.validation";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing from environment variables");
}

export const registerPatient = async (data: RegisterInput) => {
  const existingUser = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [data.email.toLowerCase()]
  );

  if (existingUser.rows.length > 0) {
    throw new Error("Email already registered");
  }

  const patientExists = await pool.query(
    "SELECT id FROM patients WHERE id = $1",
    [data.patient_id]
  );

  if (patientExists.rows.length === 0) {
    throw new Error("Patient not found");
  }

  const existingPatientUser = await pool.query(
    "SELECT id FROM users WHERE patient_id = $1",
    [data.patient_id]
  );

  if (existingPatientUser.rows.length > 0) {
    throw new Error("An account already exists for this patient");
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const result = await pool.query(
    `INSERT INTO users (email, password_hash, role, patient_id)
     VALUES ($1, $2, 'patient', $3)
     RETURNING id, email, role, patient_id, is_active, created_at`,
    [data.email.toLowerCase(), passwordHash, data.patient_id]
  );

  return result.rows[0];
};

export const loginUser = async (data: LoginInput) => {
  const result = await pool.query(
    `SELECT id, email, password_hash, role, patient_id, staff_id, is_active
     FROM users
     WHERE email = $1`,
    [data.email.toLowerCase()]
  );

  if (result.rows.length === 0) {
    throw new Error("Invalid email or password");
  }

  const user = result.rows[0];

  if (!user.is_active) {
    throw new Error("Account is inactive");
  }

  const passwordMatch = await bcrypt.compare(
    data.password,
    user.password_hash
  );

  if (!passwordMatch) {
    throw new Error("Invalid email or password");
  }

  await pool.query(
    "UPDATE users SET last_login_at = NOW() WHERE id = $1",
    [user.id]
  );

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      patientId: user.patient_id,
      staffId: user.staff_id,
    },
    JWT_SECRET,
    {
      expiresIn: (process.env.JWT_EXPIRES_IN || "1d") as jwt.SignOptions["expiresIn"],
    }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      patient_id: user.patient_id,
      staff_id: user.staff_id,
    },
  };
};