import { z } from "zod";

export const auditQuerySchema = z.object({
  user_id: z.string().uuid().optional(),
  action: z.string().optional(),
  entity_type: z.string().optional(),
  entity_id: z.string().uuid().optional(),
  patient_id: z.string().uuid().optional(),
  request_id: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const createAuditSchema = z.object({
  user_id: z.string().uuid().optional().nullable(),
  action: z.string().min(1).max(100),
  entity_type: z.string().min(1).max(100),
  entity_id: z.string().uuid().optional().nullable(),
  patient_id: z.string().uuid().optional().nullable(),
  ip_address: z.string().optional().nullable(),
  request_id: z.string().optional().nullable(),
  details: z.record(z.string(), z.any()).optional().nullable(),
});