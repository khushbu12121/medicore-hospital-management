import { pool } from "../../config/database";
import {
  createConsentSchema,
  consentQuerySchema,
  updateConsentStatusSchema,
} from "./consent.validation";

export const createConsent = async (input: unknown) => {
  const data = createConsentSchema.parse(input);

  // Verify patient exists
  const patientResult = await pool.query(
    `SELECT id FROM patients WHERE id = $1`,
    [data.patient_id]
  );

  if (patientResult.rows.length === 0) {
    throw new Error("Patient not found");
  }

  const result = await pool.query(
    `INSERT INTO consents (
      patient_id,
      consent_type,
      consent_version,
      status,
      consent_text,
      recorded_by
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [
      data.patient_id,
      data.consent_type,
      data.consent_version,
      "pending",
      data.consent_text ?? null,
      data.recorded_by ?? null,
    ]
  );

  return result.rows[0];
};

export const getConsents = async (input: unknown) => {
  const filters = consentQuerySchema.parse(input);

  const conditions: string[] = [];
  const values: any[] = [];

  const addFilter = (column: string, value: any) => {
    values.push(value);
    conditions.push(`${column} = $${values.length}`);
  };

  if (filters.patient_id) {
    addFilter("patient_id", filters.patient_id);
  }

  if (filters.consent_type) {
    addFilter("consent_type", filters.consent_type);
  }

  if (filters.status) {
    addFilter("status", filters.status);
  }

  const whereClause =
    conditions.length > 0
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM consents ${whereClause}`,
    values
  );

  const total = Number(countResult.rows[0].count);

  const offset = (filters.page - 1) * filters.limit;

  const queryValues = [...values, filters.limit, offset];

  const result = await pool.query(
    `SELECT *
     FROM consents
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${queryValues.length - 1}
     OFFSET $${queryValues.length}`,
    queryValues
  );

  return {
    data: result.rows,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
};

export const getConsentById = async (id: string) => {
  const result = await pool.query(
    `SELECT * FROM consents WHERE id = $1`,
    [id]
  );

  return result.rows[0] ?? null;
};

export const updateConsentStatus = async (
  id: string,
  input: unknown
) => {
  const data = updateConsentStatusSchema.parse(input);

  const existing = await getConsentById(id);

  if (!existing) {
    throw new Error("Consent not found");
  }

  if (existing.status === "withdrawn") {
    throw new Error("Withdrawn consent cannot be modified");
  }

  if (data.status === "granted") {
    const result = await pool.query(
      `UPDATE consents
       SET status = $2,
           granted_at = NOW(),
           withdrawn_at = NULL
       WHERE id = $1
       RETURNING *`,
      [id, data.status]
    );

    return result.rows[0];
  }

  if (data.status === "withdrawn") {
    const result = await pool.query(
      `UPDATE consents
       SET status = $2,
           withdrawn_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, data.status]
    );

    return result.rows[0];
  }

  const result = await pool.query(
    `UPDATE consents
     SET status = $2,
         granted_at = NULL,
         withdrawn_at = NULL
     WHERE id = $1
     RETURNING *`,
    [id, data.status]
  );

  return result.rows[0];
};