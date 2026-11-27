import { randomBytes } from "crypto";
import { pool } from "../../config/database";
import type { CreatePatientInput } from "./patient.validation";

export const createPatient = async (data: CreatePatientInput) => {
  const patientNumber = `PT-${new Date().getFullYear()}-${randomBytes(4)
    .toString("hex")
    .toUpperCase()}`;

  const query = `
    INSERT INTO patients (
      patient_number,
      first_name,
      last_name,
      date_of_birth,
      gender,
      phone,
      email,
      address,
      blood_group,
      emergency_contact_name,
      emergency_contact_phone,
      allergies,
      medical_notes
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11, $12, $13
    )
    RETURNING
      id,
      patient_number,
      first_name,
      last_name,
      date_of_birth,
      gender,
      phone,
      email,
      address,
      blood_group,
      emergency_contact_name,
      emergency_contact_phone,
      allergies,
      medical_notes,
      is_active,
      created_at,
      updated_at
  `;

  const values = [
    patientNumber,
    data.first_name,
    data.last_name,
    data.date_of_birth,
    data.gender ?? null,
    data.phone ?? null,
    data.email ?? null,
    data.address ?? null,
    data.blood_group ?? null,
    data.emergency_contact_name ?? null,
    data.emergency_contact_phone ?? null,
    data.allergies ?? null,
    data.medical_notes ?? null,
  ];

  const result = await pool.query(query, values);

  return result.rows[0];
};

export const getPatients = async (
  search: string | undefined,
  page: number,
  limit: number
) => {
  const offset = (page - 1) * limit;

  let whereClause = "";
  const values: unknown[] = [];

  if (search) {
    whereClause = `
      WHERE
        first_name ILIKE $1
        OR last_name ILIKE $1
        OR patient_number ILIKE $1
        OR phone ILIKE $1
        OR email ILIKE $1
    `;

    values.push(`%${search}%`);
  }

  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM patients
    ${whereClause}
  `;

  const countResult = await pool.query(countQuery, values);

  const total = countResult.rows[0].total;

  const dataQuery = `
    SELECT
      id,
      patient_number,
      first_name,
      last_name,
      date_of_birth,
      gender,
      phone,
      email,
      blood_group,
      is_active,
      created_at
    FROM patients
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${values.length + 1}
    OFFSET $${values.length + 2}
  `;

  const dataResult = await pool.query(dataQuery, [
    ...values,
    limit,
    offset,
  ]);

  return {
    data: dataResult.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getPatientById = async (id: string) => {
  const result = await pool.query(
    `
      SELECT *
      FROM patients
      WHERE id = $1
    `,
    [id]
  );

  return result.rows[0] ?? null;
};