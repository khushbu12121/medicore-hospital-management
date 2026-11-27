import { pool } from "../../config/database";
import crypto from "crypto";
import type {
  CreateLabOrderInput,
  LabOrderQueryInput,
  CreateLabResultInput,
} from "./laboratory.validation";

export const createLabOrder = async (data: CreateLabOrderInput) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const encounter = await client.query(
      `SELECT id, patient_id, status
       FROM encounters
       WHERE id = $1`,
      [data.encounter_id]
    );

    if (!encounter.rows.length) {
      throw new Error("Encounter not found");
    }

    if (encounter.rows[0].patient_id !== data.patient_id) {
      throw new Error("Patient does not match encounter");
    }

    if (encounter.rows[0].status === "cancelled") {
      throw new Error("Cannot order lab tests for cancelled encounter");
    }

    const patient = await client.query(
      `SELECT id FROM patients
       WHERE id = $1 AND is_active = true`,
      [data.patient_id]
    );

    if (!patient.rows.length) {
      throw new Error("Patient not found or inactive");
    }

    const staff = await client.query(
      `SELECT id FROM staff
       WHERE id = $1 AND is_active = true`,
      [data.ordered_by]
    );

    if (!staff.rows.length) {
      throw new Error("Ordering staff not found or inactive");
    }

    const orderNumber = `LAB-${new Date().getFullYear()}-${crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase()}`;

    const result = await client.query(
      `INSERT INTO lab_orders (
        order_number,
        encounter_id,
        patient_id,
        ordered_by,
        test_name,
        test_code,
        priority,
        notes
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *`,
      [
        orderNumber,
        data.encounter_id,
        data.patient_id,
        data.ordered_by,
        data.test_name,
        data.test_code ?? null,
        data.priority,
        data.notes ?? null,
      ]
    );

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getLabOrders = async (filters: LabOrderQueryInput) => {
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
    conditions.push(`lo.patient_id = $${values.length}`);
  }

  if (encounter_id) {
    values.push(encounter_id);
    conditions.push(`lo.encounter_id = $${values.length}`);
  }

  if (status) {
    values.push(status);
    conditions.push(`lo.status = $${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const offset = (page - 1) * limit;
  values.push(limit);
  values.push(offset);

  const result = await pool.query(
    `SELECT lo.*,
       COALESCE(
         json_agg(to_jsonb(lr))
           FILTER (WHERE lr.id IS NOT NULL),
         '[]'
       ) AS results
     FROM lab_orders lo
     LEFT JOIN lab_results lr
       ON lr.lab_order_id = lo.id
     ${whereClause}
     GROUP BY lo.id
     ORDER BY lo.ordered_at DESC
     LIMIT $${values.length - 1}
     OFFSET $${values.length}`,
    values
  );

  return result.rows;
};

export const getLabOrderById = async (id: string) => {
  const result = await pool.query(
    `SELECT lo.*,
       COALESCE(
         json_agg(to_jsonb(lr))
           FILTER (WHERE lr.id IS NOT NULL),
         '[]'
       ) AS results
     FROM lab_orders lo
     LEFT JOIN lab_results lr
       ON lr.lab_order_id = lo.id
     WHERE lo.id = $1
     GROUP BY lo.id`,
    [id]
  );

  return result.rows[0] ?? null;
};

export const updateLabOrderStatus = async (
  id: string,
  status: string
) => {
  const result = await pool.query(
    `UPDATE lab_orders
     SET status = $2::varchar,
         collected_at = CASE
           WHEN $2::varchar = 'collected'
             THEN COALESCE(collected_at, NOW())
           ELSE collected_at
         END,
         completed_at = CASE
           WHEN $2::varchar = 'completed'
             THEN NOW()
           ELSE completed_at
         END
     WHERE id = $1
     RETURNING *`,
    [id, status]
  );

  return result.rows[0] ?? null;
};

export const createLabResult = async (
  labOrderId: string,
  data: CreateLabResultInput
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const order = await client.query(
      `SELECT id, status
       FROM lab_orders
       WHERE id = $1
       FOR UPDATE`,
      [labOrderId]
    );

    if (!order.rows.length) {
      throw new Error("Lab order not found");
    }

    if (order.rows[0].status === "cancelled") {
      throw new Error("Cannot add result to cancelled lab order");
    }

    const result = await client.query(
      `INSERT INTO lab_results (
        lab_order_id,
        result_value,
        unit,
        reference_range,
        abnormal_flag,
        interpretation,
        performed_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *`,
      [
        labOrderId,
        data.result_value,
        data.unit ?? null,
        data.reference_range ?? null,
        data.abnormal_flag ?? null,
        data.interpretation ?? null,
        data.performed_by ?? null,
      ]
    );

    await client.query(
      `UPDATE lab_orders
       SET status = 'completed',
           completed_at = NOW()
       WHERE id = $1`,
      [labOrderId]
    );

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const verifyLabResult = async (
  resultId: string,
  verifiedBy: string
) => {
  const result = await pool.query(
    `UPDATE lab_results
     SET verified_by = $2,
         verified_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [resultId, verifiedBy]
  );

  return result.rows[0] ?? null;
};