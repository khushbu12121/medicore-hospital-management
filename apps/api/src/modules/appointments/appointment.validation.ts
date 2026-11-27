import { z } from "zod";

export const createAppointmentSchema = z
  .object({
    patient_id: z.string().uuid("Invalid patient ID"),
    provider_id: z.string().uuid("Invalid provider ID"),
    department_id: z.string().uuid().optional().nullable(),

    scheduled_start: z.string().datetime({ offset: true }),
    scheduled_end: z.string().datetime({ offset: true }),

    appointment_type: z
      .string()
      .trim()
      .min(1)
      .max(50)
      .default("consultation"),

    reason: z.string().trim().optional().nullable(),
    notes: z.string().trim().optional().nullable(),
  })
  .refine(
    (data) => new Date(data.scheduled_end) > new Date(data.scheduled_start),
    {
      message: "Appointment end time must be after start time",
      path: ["scheduled_end"],
    }
  );

export const appointmentListQuerySchema = z.object({
  patient_id: z.string().uuid().optional(),
  provider_id: z.string().uuid().optional(),

  status: z
    .enum([
      "scheduled",
      "confirmed",
      "checked_in",
      "completed",
      "cancelled",
      "no_show",
    ])
    .optional(),

  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum([
    "scheduled",
    "confirmed",
    "checked_in",
    "completed",
    "cancelled",
    "no_show",
  ]),
  cancellation_reason: z.string().trim().optional().nullable(),
});

export type CreateAppointmentInput = z.infer<
  typeof createAppointmentSchema
>;