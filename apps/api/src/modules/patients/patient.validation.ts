import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .nullable();

export const createPatientSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(100),
  last_name: z.string().trim().min(1, "Last name is required").max(100),

  date_of_birth: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date of birth")
    .refine((value) => new Date(value) <= new Date(), "Date of birth cannot be in the future"),

  gender: z
    .enum(["male", "female", "other", "prefer_not_to_say"])
    .optional()
    .nullable(),

  phone: z.string().trim().max(20).optional().nullable(),

  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .optional()
    .nullable(),

  address: optionalText,
  blood_group: z
    .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .optional()
    .nullable(),

  emergency_contact_name: optionalText,
  emergency_contact_phone: z.string().trim().max(20).optional().nullable(),
  allergies: optionalText,
  medical_notes: optionalText,
});

export const patientListQuerySchema = z.object({
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;