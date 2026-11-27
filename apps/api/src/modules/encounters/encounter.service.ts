import { pool } from "../../config/database";
import crypto from "crypto";
import type { CreateEncounterInput, EncounterQueryInput } from "./encounter.validation";

export const createEncounter = async (data: CreateEncounterInput) => {
  // Verify patient
  const patient = await pool.query(
    `SELECT id FROM patients WHERE id = $1 AND is_active = true`,
    [data.patient_id]
  );

  if (!patient.rows.length) {
    throw new Error("Patient not found or inactive");
  }

  // Verify provider
  const provider = await pool.query(
    `SELECT id FROM staff
     WHERE id = $1 AND is_active = true AND role = 'doctor'`,
    [data.provider_id]
  );

  if (!provider.rows.length) {
    throw new Error("Doctor not found or inactive");
  }

  // Verify appointment if supplied
  if (data.appointment_id) {
    const appointment = await pool.query(
      `SELECT id, patient_id, provider_id, status
       FROM appointments
       WHERE id = $1`,
      [data.appointment_id]
    );

    if (!appointment.rows.length) {
      throw new Error("Appointment not found");
    }

    const appt = appointment.rows[0];

    if (appt.patient_id !== data.patient_id || appt.provider_id !== data.provider_id) {
      throw new Error("Appointment patient or provider mismatch");
    }

    if (appt.status === "cancelled" || appt.status === "no_show") {
      throw new Error("Cannot create encounter for cancelled or no-show appointment");
    }
  }

  const encounterNumber = `ENC-${new Date().getFullYear()}-${crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase()}`;

  const result = await pool.query(
    `INSERT INTO encounters (
      encounter_number,
      patient_id,
      appointment_id,
      provider_id,
      department_id,
      encounter_type,
      chief_complaint,
      clinical_notes,
      diagnosis_summary
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *`,
    [
      encounterNumber,
      data.patient_id,
      data.appointment_id ?? null,
      data.provider_id,
      data.department_id ?? null,
      data.encounter_type,
      data.chief_complaint ?? null,
      data.clinical_notes ?? null,
      data.diagnosis_summary ?? null,
    ]
  );

  return result.rows[0];
};

export const getEncounters = async (filters: EncounterQueryInput) => {
  const { patient_id, provider_id, status, page, limit } = filters;

  const conditions: string[] = [];
  const values: any[] = [];

  if (patient_id) {
    values.push(patient_id);
    conditions.push(`patient_id = $${values.length}`);
  }

  if (provider_id) {
    values.push(provider_id);
    conditions.push(`provider_id = $${values.length}`);
  }

  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const offset = (page - 1) * limit;

  values.push(limit);
  values.push(offset);

  const result = await pool.query(
    `SELECT *
     FROM encounters
     ${whereClause}
     ORDER BY started_at DESC
     LIMIT $${values.length - 1}
     OFFSET $${values.length}`,
    values
  );

  return result.rows;
};

export const getEncounterById = async (id: string) => {
  const result = await pool.query(
    `SELECT e.*,
            p.first_name AS patient_first_name,
            p.last_name AS patient_last_name,
            s.first_name AS provider_first_name,
            s.last_name AS provider_last_name
     FROM encounters e
     JOIN patients p ON p.id = e.patient_id
     JOIN staff s ON s.id = e.provider_id
     WHERE e.id = $1`,
    [id]
  );

  return result.rows[0] ?? null;
};

export const updateEncounterStatus = async (
  id: string,
  status: string
) => {
  const result = await pool.query(
    `UPDATE encounters
     SET status = $2::varchar,
         completed_at = CASE
           WHEN $2::varchar = 'completed' THEN NOW()
           ELSE completed_at
         END
     WHERE id = $1
     RETURNING *`,
    [id, status]
  );

  return result.rows[0] ?? null;
};