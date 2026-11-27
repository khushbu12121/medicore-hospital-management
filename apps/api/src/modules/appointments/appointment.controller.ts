import { Request, Response } from "express";

import {
  createAppointmentSchema,
  appointmentListQuerySchema,
  updateAppointmentStatusSchema,
} from "./appointment.validation";

import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
} from "./appointment.service";

export const bookAppointment = async (
  req: Request,
  res: Response
) => {
  try {
    const validation = createAppointmentSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.issues,
      });
    }

    const appointment = await createAppointment(validation.data);

    return res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      data: appointment,
    });
  } catch (error: any) {
    if (error.message === "PATIENT_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Patient not found or inactive",
      });
    }

    if (error.message === "PROVIDER_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Doctor not found or inactive",
      });
    }

    if (error.message === "APPOINTMENT_CONFLICT") {
      return res.status(409).json({
        success: false,
        message: "Doctor already has an appointment during this time",
      });
    }

    console.error("Book appointment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to book appointment",
    });
  }
};

export const listAppointments = async (
  req: Request,
  res: Response
) => {
  try {
    const validation = appointmentListQuerySchema.safeParse(req.query);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: validation.error.issues,
      });
    }

    const {
      patient_id,
      provider_id,
      status,
      page,
      limit,
    } = validation.data;

    const result = await getAppointments(
      patient_id,
      provider_id,
      status,
      page,
      limit
    );

    return res.status(200).json({
      success: true,
      message: "Appointments retrieved successfully",
      ...result,
    });
  } catch (error) {
    console.error("List appointments error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve appointments",
    });
  }
};

export const getAppointment = async (
  req: Request,
  res: Response
) => {
  try {
    const appointmentId = String(req.params.id);

    const appointment = await getAppointmentById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Appointment retrieved successfully",
      data: appointment,
    });
  } catch (error) {
    console.error("Get appointment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve appointment",
    });
  }
};

export const changeAppointmentStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const appointmentId = String(req.params.id);

    const validation =
      updateAppointmentStatusSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.issues,
      });
    }

    const appointment = await updateAppointmentStatus(
      appointmentId,
      validation.data.status,
      validation.data.cancellation_reason
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Appointment status updated successfully",
      data: appointment,
    });
  } catch (error) {
    console.error("Update appointment status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update appointment status",
    });
  }
};
