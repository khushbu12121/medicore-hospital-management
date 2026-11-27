import { pool } from "../../config/database";
import { createAuditSchema, auditQuerySchema } from "./audit.validation";

export const createAuditLog = async (input: unknown) => {
  const data = createAuditSchema.parse(input);

  const result = await pool.query(
    `INSERT INTO audit_logs (
      user_id,
      action,
      entity_type,
      entity_id,
      patient_id,
      ip_address,
      request_id,
      details
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8
    )
    RETURNING *`,
    [
      data.user_id ?? null,
      data.action,
      data.entity_type,
      data.entity_id ?? null,
      data.patient_id ?? null,
      data.ip_address ?? null,
      data.request_id ?? null,
      data.details ? JSON.stringify(data.details) : null,
    ]
  );

  return result.rows[0];
};

export const getAuditLogs = async (input: unknown) => {
  const filters = auditQuerySchema.parse(input);

  const conditions: string[] = [];
  const values: any[] = [];

  const addFilter = (column: string, value: any) => {
    values.push(value);
    conditions.push(`${column} = $${values.length}`);
  };

  if (filters.user_id) addFilter("user_id", filters.user_id);
  if (filters.action) addFilter("action", filters.action);
  if (filters.entity_type)
    addFilter("entity_type", filters.entity_type);
  if (filters.entity_id) addFilter("entity_id", filters.entity_id);
  if (filters.patient_id) addFilter("patient_id", filters.patient_id);
  if (filters.request_id) addFilter("request_id", filters.request_id);

  const whereClause =
    conditions.length > 0
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

  const offset = (filters.page - 1) * filters.limit;

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM audit_logs ${whereClause}`,
    values
  );

  const total = Number(countResult.rows[0].count);

  const dataValues = [...values];
  dataValues.push(filters.limit);
  dataValues.push(offset);

  const result = await pool.query(
    `SELECT *
     FROM audit_logs
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${dataValues.length - 1}
     OFFSET $${dataValues.length}`,
    dataValues
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

export const getAuditLogById = async (id: string) => {
  const result = await pool.query(
    `SELECT * FROM audit_logs WHERE id = $1`,
    [id]
  );

  return result.rows[0] ?? null;
};