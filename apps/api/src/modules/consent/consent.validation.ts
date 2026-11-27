import { z } from "zod";

export const createConsentSchema = z.object({
  patient_id: z.string().uuid(),
  consent_type: z.string().min(1).max(100),
  consent_version: z.string().min(1).max(50),
  consent_text: z.string().optional().nullable(),
  recorded_by: z.string().uuid().optional().nullable(),
});

export const consentQuerySchema = z.object({
  patient_id: z.string().uuid().optional(),
  consent_type: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const updateConsentStatusSchema = z.object({
  status: z.enum(["granted", "withdrawn", "pending"]),
});