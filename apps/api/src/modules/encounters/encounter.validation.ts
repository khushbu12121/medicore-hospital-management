import { z } from "zod";

export const createEncounterSchema = z.object({
  patient_id: z.string().uuid(),
  appointment_id: z.string().uuid().optional().nullable(),
  provider_id: z.string().uuid(),
  department_id: z.string().uuid().optional().nullable(),
  encounter_type: z.string().min(1).max(50).default("outpatient"),
  chief_complaint: z.string().optional().nullable(),
  clinical_notes: z.string().optional().nullable(),
  diagnosis_summary: z.string().optional().nullable(),
});

export const encounterQuerySchema = z.object({
  patient_id: z.string().uuid().optional(),
  provider_id: z.string().uuid().optional(),
  status: z.enum(["in_progress", "completed", "cancelled"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateEncounterStatusSchema = z.object({
  status: z.enum(["in_progress", "completed", "cancelled"]),
});

export type CreateEncounterInput = z.infer<typeof createEncounterSchema>;
export type EncounterQueryInput = z.infer<typeof encounterQuerySchema>;