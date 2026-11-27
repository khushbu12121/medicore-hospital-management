import { randomBytes } from "crypto";
import { pool } from "../../config/database";
import { CreateAppointmentInput } from "./appointment.validation";

export const createAppointment = async (
  input: CreateAppointmentInput
) => {
  // Verify patient exists and is active
  const patientResult = await pool.query(
    `SELECT id
     FROM patients
     WHERE id = $1 AND is_active = true`,
    [input.patient_id]
  );

  if (patientResult.rows.length === 0) {
    throw new Error("PATIENT_NOT_FOUND");
  }

  // Verify provider exists and is an active doctor
  const providerResult = await pool.query(
    `SELECT id
     FROM staff
     WHERE id = $1
       AND role = 'doctor'
       AND is_active = true`,
    [input.provider_id]
  );

  if (providerResult.rows.length === 0) {
    throw new Error("PROVIDER_NOT_FOUND");
  }

  // Check for overlapping appointments
  const conflictResult = await pool.query(
    `SELECT id
     FROM appointments
     WHERE provider_id = $1
       AND status IN ('scheduled', 'confirmed', 'checked_in')
       AND scheduled_start < $3
       AND scheduled_end > $2`,
    [
      input.provider_id,
      input.scheduled_start,
      input.scheduled_end,
    ]
  );

  if (conflictResult.rows.length > 0) {
    throw new Error("APPOINTMENT_CONFLICT");
  }

  const appointmentNumber =
    `APT-${new Date().getFullYear()}-${randomBytes(4)
      .toString("hex")
      .toUpperCase()}`;

  const result = await pool.query(
    `INSERT INTO appointments (
        appointment_number,
        patient_id,
        provider_id,
        department_id,
        scheduled_start,
        scheduled_end,
        appointment_type,
        reason,
        notes
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      appointmentNumber,
      input.patient_id,
      input.provider_id,
      input.department_id ?? null,
      input.scheduled_start,
      input.scheduled_end,
      input.appointment_type,
      input.reason ?? null,
      input.notes ?? null,
    ]
  );

  return result.rows[0];
};

export const getAppointments = async (
  patientId: string | undefined,
  providerId: string | undefined,
  status: string | undefined,
  page: number,
  limit: number
) => {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (patientId) {
    values.push(patientId);
    conditions.push(`patient_id = $${values.length}`);
  }

  if (providerId) {
    values.push(providerId);
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

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM appointments ${whereClause}`,
    values
  );

  values.push(limit);
  values.push(offset);

  const result = await pool.query(
    `SELECT *
     FROM appointments
     ${whereClause}
     ORDER BY scheduled_start DESC
     LIMIT $${values.length - 1}
     OFFSET $${values.length}`,
    values
  );

  return {
    data: result.rows,
    pagination: {
      page,
      limit,
      total: Number(countResult.rows[0].count),
      totalPages: Math.ceil(
        Number(countResult.rows[0].count) / limit
      ),
    },
  };
};

export const getAppointmentById = async (id: string) => {
  const result = await pool.query(
    `SELECT *
     FROM appointments
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] ?? null;
};

export const updateAppointmentStatus = async (
  id: string,
  status: string,
  cancellationReason?: string | null
) => {
  const result = await pool.query(
    `UPDATE appointments
     SET status = $2::varchar,
         cancelled_at = CASE
           WHEN $2::varchar = 'cancelled' THEN NOW()
           ELSE cancelled_at
         END,
         cancellation_reason = CASE
           WHEN $2::varchar = 'cancelled' THEN $3::text
           ELSE cancellation_reason
         END
     WHERE id = $1
     RETURNING *`,
    [id, status, cancellationReason ?? null]
  );

  return result.rows[0] ?? null;
};