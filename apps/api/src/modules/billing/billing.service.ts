import { pool } from "../../config/database";
import crypto from "crypto";
import type {
  CreateInvoiceInput,
  InvoiceQueryInput,
  CreatePaymentInput,
} from "./billing.validation";

export const createInvoice = async (data: CreateInvoiceInput) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const patient = await client.query(
      `SELECT id FROM patients WHERE id = $1 AND is_active = true`,
      [data.patient_id]
    );

    if (!patient.rows.length) {
      throw new Error("Patient not found or inactive");
    }

    if (data.encounter_id) {
      const encounter = await client.query(
        `SELECT id, patient_id FROM encounters WHERE id = $1`,
        [data.encounter_id]
      );

      if (!encounter.rows.length) {
        throw new Error("Encounter not found");
      }

      if (encounter.rows[0].patient_id !== data.patient_id) {
        throw new Error("Encounter patient mismatch");
      }
    }

    const subtotal = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );

    const total = subtotal + data.tax_amount - data.discount_amount;

    if (total < 0) {
      throw new Error("Discount cannot exceed subtotal plus tax");
    }

    const invoiceNumber = `INV-${new Date().getFullYear()}-${crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase()}`;

    const invoiceResult = await client.query(
      `INSERT INTO invoices (
        invoice_number,
        patient_id,
        encounter_id,
        subtotal,
        tax_amount,
        discount_amount,
        total_amount,
        due_date,
        created_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [
        invoiceNumber,
        data.patient_id,
        data.encounter_id ?? null,
        subtotal,
        data.tax_amount,
        data.discount_amount,
        total,
        data.due_date ?? null,
        data.created_by ?? null,
      ]
    );

    const invoice = invoiceResult.rows[0];

    for (const item of data.items) {
      const lineTotal = item.quantity * item.unit_price;

      await client.query(
        `INSERT INTO invoice_items (
          invoice_id,
          description,
          quantity,
          unit_price,
          line_total
        )
        VALUES ($1,$2,$3,$4,$5)`,
        [
          invoice.id,
          item.description,
          item.quantity,
          item.unit_price,
          lineTotal,
        ]
      );
    }

    await client.query("COMMIT");

    return getInvoiceById(invoice.id);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getInvoices = async (filters: InvoiceQueryInput) => {
  const conditions: string[] = [];
  const values: any[] = [];

  if (filters.patient_id) {
    values.push(filters.patient_id);
    conditions.push(`i.patient_id = $${values.length}`);
  }

  if (filters.status) {
    values.push(filters.status);
    conditions.push(`i.status = $${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const offset = (filters.page - 1) * filters.limit;

  values.push(filters.limit);
  values.push(offset);

  const result = await pool.query(
    `SELECT i.*,
       COALESCE(
         json_agg(DISTINCT to_jsonb(ii))
           FILTER (WHERE ii.id IS NOT NULL),
         '[]'
       ) AS items,
       COALESCE(
         json_agg(DISTINCT to_jsonb(p))
           FILTER (WHERE p.id IS NOT NULL),
         '[]'
       ) AS payments
     FROM invoices i
     LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
     LEFT JOIN payments p ON p.invoice_id = i.id
     ${whereClause}
     GROUP BY i.id
     ORDER BY i.issued_at DESC
     LIMIT $${values.length - 1}
     OFFSET $${values.length}`,
    values
  );

  return result.rows;
};

export const getInvoiceById = async (id: string) => {
  const result = await pool.query(
    `SELECT i.*,
       COALESCE(
         json_agg(DISTINCT to_jsonb(ii))
           FILTER (WHERE ii.id IS NOT NULL),
         '[]'
       ) AS items,
       COALESCE(
         json_agg(DISTINCT to_jsonb(p))
           FILTER (WHERE p.id IS NOT NULL),
         '[]'
       ) AS payments
     FROM invoices i
     LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
     LEFT JOIN payments p ON p.invoice_id = i.id
     WHERE i.id = $1
     GROUP BY i.id`,
    [id]
  );

  return result.rows[0] ?? null;
};

export const createPayment = async (
  invoiceId: string,
  data: CreatePaymentInput
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const invoiceResult = await client.query(
      `SELECT * FROM invoices WHERE id = $1 FOR UPDATE`,
      [invoiceId]
    );

    if (!invoiceResult.rows.length) {
      throw new Error("Invoice not found");
    }

    const invoice = invoiceResult.rows[0];

    if (["cancelled", "refunded"].includes(invoice.status)) {
      throw new Error("Payment not allowed for this invoice status");
    }

    const paymentSum = await client.query(
      `SELECT COALESCE(SUM(amount), 0) AS paid
       FROM payments
       WHERE invoice_id = $1 AND status = 'completed'`,
      [invoiceId]
    );

    const paidSoFar = Number(paymentSum.rows[0].paid);
    const outstanding = Number(invoice.total_amount) - paidSoFar;

    if (data.amount > outstanding) {
      throw new Error(`Payment exceeds outstanding balance: ${outstanding}`);
    }

    const paymentNumber = `PAY-${new Date().getFullYear()}-${crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase()}`;

    const paymentResult = await client.query(
      `INSERT INTO payments (
        payment_number,
        invoice_id,
        patient_id,
        amount,
        payment_method,
        transaction_reference,
        status,
        paid_at,
        received_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,'completed',NOW(),$7)
      RETURNING *`,
      [
        paymentNumber,
        invoiceId,
        invoice.patient_id,
        data.amount,
        data.payment_method,
        data.transaction_reference ?? null,
        data.received_by ?? null,
      ]
    );

    const newPaid = paidSoFar + data.amount;

    const newStatus =
      newPaid >= Number(invoice.total_amount)
        ? "paid"
        : "partially_paid";

    await client.query(
      `UPDATE invoices
       SET status = $2::varchar
       WHERE id = $1`,
      [invoiceId, newStatus]
    );

    await client.query("COMMIT");

    return paymentResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const updateInvoiceStatus = async (
  id: string,
  status: string
) => {
  const result = await pool.query(
    `UPDATE invoices
     SET status = $2::varchar
     WHERE id = $1
     RETURNING *`,
    [id, status]
  );

  return result.rows[0] ?? null;
};