import { pool } from "../../config/database";
import {
  createStaffSchema,
  staffQuerySchema,
  updateStaffSchema,
} from "./staff.validation";

export const createStaff = async (input: unknown) => {
  const data = createStaffSchema.parse(input);

  const result = await pool.query(
    `INSERT INTO staff (
      employee_code,
      first_name,
      last_name,
      email,
      phone,
      role,
      department_id,
      specialization,
      license_number
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *`,
    [
      data.employee_code,
      data.first_name,
      data.last_name,
      data.email ?? null,
      data.phone ?? null,
      data.role,
      data.department_id ?? null,
      data.specialization ?? null,
      data.license_number ?? null,
    ]
  );

  return result.rows[0];
};

export const getStaffList = async (input: unknown) => {
  const filters = staffQuerySchema.parse(input);

  const conditions: string[] = [];
  const values: any[] = [];

  const addFilter = (column: string, value: any) => {
    values.push(value);
    conditions.push(`${column} = $${values.length}`);
  };

  if (filters.role) addFilter("role", filters.role);

  if (filters.department_id) {
    addFilter("department_id", filters.department_id);
  }

  if (filters.is_active !== undefined) {
    addFilter("is_active", filters.is_active);
  }

  if (filters.search) {
    values.push(`%${filters.search}%`);

    conditions.push(
      `(first_name ILIKE $${values.length}
       OR last_name ILIKE $${values.length}
       OR employee_code ILIKE $${values.length}
       OR email ILIKE $${values.length})`
    );
  }

  const whereClause =
    conditions.length > 0
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM staff ${whereClause}`,
    values
  );

  const total = Number(countResult.rows[0].count);

  const offset = (filters.page - 1) * filters.limit;

  const queryValues = [...values, filters.limit, offset];

  const result = await pool.query(
    `SELECT *
     FROM staff
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

export const getStaffById = async (id: string) => {
  const result = await pool.query(
    `SELECT * FROM staff WHERE id = $1`,
    [id]
  );

  return result.rows[0] ?? null;
};

export const updateStaff = async (
  id: string,
  input: unknown
) => {
  const data = updateStaffSchema.parse(input);

  const fields = Object.keys(data);

  if (fields.length === 0) {
    throw new Error("No fields provided for update");
  }

  const values = Object.values(data);

  const setClause = fields
    .map((field, index) => `${field} = $${index + 1}`)
    .join(", ");

  values.push(id);

  const result = await pool.query(
    `UPDATE staff
     SET ${setClause},
         updated_at = NOW()
     WHERE id = $${values.length}
     RETURNING *`,
    values
  );

  return result.rows[0] ?? null;
};

export const updateStaffStatus = async (
  id: string,
  is_active: boolean
) => {
  const result = await pool.query(
    `UPDATE staff
     SET is_active = $2,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, is_active]
  );

  return result.rows[0] ?? null;
};