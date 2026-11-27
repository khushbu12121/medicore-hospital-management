import { z } from "zod";

const prescriptionItemSchema = z.object({
  medication_name: z.string().min(1).max(255),
  dosage: z.string().min(1).max(100),
  route: z.string().max(100).optional().nullable(),
  frequency: z.string().min(1).max(100),
  duration: z.string().max(100).optional().nullable(),
  quantity: z.number().int().positive().optional().nullable(),
  refills: z.number().int().min(0).default(0),
  instructions: z.string().optional().nullable(),
});

export const createPrescriptionSchema = z.object({
  encounter_id: z.string().uuid(),
  patient_id: z.string().uuid(),
  prescriber_id: z.string().uuid(),
  instructions: z.string().optional().nullable(),
  items: z.array(prescriptionItemSchema).min(1),
});

export const prescriptionQuerySchema = z.object({
  patient_id: z.string().uuid().optional(),
  encounter_id: z.string().uuid().optional(),
  status: z.enum(["active", "completed", "cancelled"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const updatePrescriptionStatusSchema = z.object({
  status: z.enum(["active", "completed", "cancelled"]),
});

export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;
export type PrescriptionQueryInput = z.infer<typeof prescriptionQuerySchema>;