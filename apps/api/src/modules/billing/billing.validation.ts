import { z } from "zod";

const invoiceItemSchema = z.object({
  description: z.string().min(1).max(255),
  quantity: z.number().positive(),
  unit_price: z.number().min(0),
});

export const createInvoiceSchema = z.object({
  patient_id: z.string().uuid(),
  encounter_id: z.string().uuid().optional().nullable(),
  created_by: z.string().uuid().optional().nullable(),
  due_date: z.string().optional().nullable(),
  tax_amount: z.number().min(0).default(0),
  discount_amount: z.number().min(0).default(0),
  items: z.array(invoiceItemSchema).min(1),
});

export const invoiceQuerySchema = z.object({
  patient_id: z.string().uuid().optional(),
  status: z.enum([
    "pending",
    "partially_paid",
    "paid",
    "cancelled",
    "refunded",
  ]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createPaymentSchema = z.object({
  amount: z.number().positive(),
  payment_method: z.enum([
    "cash",
    "card",
    "upi",
    "bank_transfer",
    "insurance",
  ]),
  transaction_reference: z.string().max(255).optional().nullable(),
  received_by: z.string().uuid().optional().nullable(),
});

export const updateInvoiceStatusSchema = z.object({
  status: z.enum([
    "pending",
    "partially_paid",
    "paid",
    "cancelled",
    "refunded",
  ]),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type InvoiceQueryInput = z.infer<typeof invoiceQuerySchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;