import { z } from "zod";

export const createLabOrderSchema = z.object({
  encounter_id: z.string().uuid(),
  patient_id: z.string().uuid(),
  ordered_by: z.string().uuid(),
  test_name: z.string().min(1).max(255),
  test_code: z.string().max(50).optional().nullable(),
  priority: z.enum(["routine", "urgent", "stat"]).default("routine"),
  notes: z.string().optional().nullable(),
});

export const labOrderQuerySchema = z.object({
  patient_id: z.string().uuid().optional(),
  encounter_id: z.string().uuid().optional(),
  status: z.enum([
    "ordered",
    "collected",
    "processing",
    "completed",
    "cancelled",
  ]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateLabOrderStatusSchema = z.object({
  status: z.enum([
    "ordered",
    "collected",
    "processing",
    "completed",
    "cancelled",
  ]),
});

export const createLabResultSchema = z.object({
  result_value: z.string().min(1),
  unit: z.string().max(50).optional().nullable(),
  reference_range: z.string().max(100).optional().nullable(),
  abnormal_flag: z.enum([
    "normal",
    "low",
    "high",
    "critical",
    "abnormal",
  ]).optional().nullable(),
  interpretation: z.string().optional().nullable(),
  performed_by: z.string().uuid().optional().nullable(),
});

export const verifyLabResultSchema = z.object({
  verified_by: z.string().uuid(),
});

export type CreateLabOrderInput = z.infer<typeof createLabOrderSchema>;
export type LabOrderQueryInput = z.infer<typeof labOrderQuerySchema>;
export type CreateLabResultInput = z.infer<typeof createLabResultSchema>;