import { pool } from "../../config/database";
import crypto from "crypto";
import type {
  CreatePrescriptionInput,
  PrescriptionQueryInput,
} from "./prescription.validation";

export const createPrescription = async (
  data: CreatePrescriptionInput
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Validate encounter
    const encounterResult = await client.query(
      `SELECT id, patient_id, provider_id, status
       FROM encounters
       WHERE id = $1`,
      [data.encounter_id]
    );

    if (!encounterResult.rows.length) {
      throw new Error("Encounter not found");
    }

    const encounter = encounterResult.rows[0];

    if (encounter.patient_id !== data.patient_id) {
      throw new Error("Patient does not match encounter");
    }

    if (encounter.provider_id !== data.prescriber_id) {
      throw new Error("Prescriber does not match encounter provider");
    }

    if (encounter.status === "cancelled") {
      throw new Error("Cannot prescribe for a cancelled encounter");
    }

    // Validate patient
    const patientResult = await client.query(
      `SELECT id FROM patients
       WHERE id = $1 AND is_active = true`,
      [data.patient_id]
    );

    if (!patientResult.rows.length) {
      throw new Error("Patient not found or inactive");
    }

    // Validate prescriber
    const providerResult = await client.query(
      `SELECT id FROM staff
       WHERE id = $1 AND is_active = true AND role = 'doctor'`,
      [data.prescriber_id]
    );

    if (!providerResult.rows.length) {
      throw new Error("Prescriber not found or inactive");
    }

    const prescriptionNumber = `RX-${new Date().getFullYear()}-${crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase()}`;

    // Create prescription
    const prescriptionResult = await client.query(
      `INSERT INTO prescriptions (
        prescription_number,
        encounter_id,
        patient_id,
        prescriber_id,
        instructions
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        prescriptionNumber,
        data.encounter_id,
        data.patient_id,
        data.prescriber_id,
        data.instructions ?? null,
      ]
    );

    const prescription = prescriptionResult.rows[0];

    // Insert all medication items
    for (const item of data.items) {
      await client.query(
        `INSERT INTO prescription_items (
          prescription_id,
          medication_name,
          dosage,
          route,
          frequency,
          duration,
          quantity,
          refills,
          instructions
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          prescription.id,
          item.medication_name,
          item.dosage,
          item.route ?? null,
          item.frequency,
          item.duration ?? null,
          item.quantity ?? null,
          item.refills ?? 0,
          item.instructions ?? null,
        ]
      );
    }

    await client.query("COMMIT");

    // Return prescription with items
    const finalResult = await pool.query(
      `SELECT p.*,
        COALESCE(
          json_agg(to_jsonb(pi)) FILTER (WHERE pi.id IS NOT NULL),
          '[]'
        ) AS items
       FROM prescriptions p
       LEFT JOIN prescription_items pi
         ON pi.prescription_id = p.id
       WHERE p.id = $1
       GROUP BY p.id`,
      [prescription.id]
    );

    return finalResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getPrescriptions = async (
  filters: PrescriptionQueryInput
) => {
  const {
    patient_id,
    encounter_id,
    status,
    page,
    limit,
  } = filters;

  const conditions: string[] = [];
  const values: any[] = [];

  if (patient_id) {
    values.push(patient_id);
    conditions.push(`p.patient_id = $${values.length}`);
  }

  if (encounter_id) {
    values.push(encounter_id);
    conditions.push(`p.encounter_id = $${values.length}`);
  }

  if (status) {
    values.push(status);
    conditions.push(`p.status = $${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const offset = (page - 1) * limit;

  values.push(limit);
  values.push(offset);

  const result = await pool.query(
    `SELECT p.*,
       COALESCE(
         json_agg(to_jsonb(pi)) FILTER (WHERE pi.id IS NOT NULL),
         '[]'
       ) AS items
     FROM prescriptions p
     LEFT JOIN prescription_items pi
       ON pi.prescription_id = p.id
     ${whereClause}
     GROUP BY p.id
     ORDER BY p.prescribed_at DESC
     LIMIT $${values.length - 1}
     OFFSET $${values.length}`,
    values
  );

  return result.rows;
};

export const getPrescriptionById = async (id: string) => {
  const result = await pool.query(
    `SELECT p.*,
       COALESCE(
         json_agg(to_jsonb(pi)) FILTER (WHERE pi.id IS NOT NULL),
         '[]'
       ) AS items
     FROM prescriptions p
     LEFT JOIN prescription_items pi
       ON pi.prescription_id = p.id
     WHERE p.id = $1
     GROUP BY p.id`,
    [id]
  );

  return result.rows[0] ?? null;
};

export const updatePrescriptionStatus = async (
  id: string,
  status: string
) => {
  const result = await pool.query(
    `UPDATE prescriptions
     SET status = $2::varchar
     WHERE id = $1
     RETURNING *`,
    [id, status]
  );

  return result.rows[0] ?? null;
};