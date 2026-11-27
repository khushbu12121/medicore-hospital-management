import { z } from "zod";

export const createStaffSchema = z.object({
  employee_code: z.string().min(1).max(50),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  role: z.string().min(1).max(100),
  department_id: z.string().uuid().optional().nullable(),
  specialization: z.string().optional().nullable(),
  license_number: z.string().optional().nullable(),
});

export const staffQuerySchema = z.object({
  role: z.string().optional(),
  department_id: z.string().uuid().optional(),
  is_active: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const updateStaffSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  role: z.string().min(1).optional(),
  department_id: z.string().uuid().optional().nullable(),
  specialization: z.string().optional().nullable(),
  license_number: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});