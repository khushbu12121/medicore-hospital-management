import { Router, Response, NextFunction } from "express";

import {
  bookAppointment,
  listAppointments,
  getAppointment,
  changeAppointmentStatus,
} from "./appointment.controller";

import {
  authenticate,
  authorize,
  AuthenticatedRequest,
} from "../../middleware/auth.middleware";

import { pool } from "../../config/database";

const router = Router();

// Patients can book only for themselves
const verifyAppointmentBookingOwnership = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (
    req.user?.role === "patient" &&
    req.body.patient_id !== req.user.patientId
  ) {
    return res.status(403).json({
      success: false,
      message: "You can only book appointments for yourself",
    });
  }

  next();
};

// Verify appointment ownership for patients
const verifyAppointmentOwnership = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Staff roles can access appointments according to their role permissions
    if (user.role !== "patient") {
      return next();
    }

    const appointmentId = String(req.params.id);

    const result = await pool.query(
      `SELECT patient_id
       FROM appointments
       WHERE id = $1`,
      [appointmentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (result.rows[0].patient_id !== user.patientId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this appointment",
      });
    }

    next();
  } catch (error) {
    console.error("Appointment ownership check error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify appointment access",
    });
  }
};

// Book appointment
router.post(
  "/",
  authenticate,
  authorize("administrator", "receptionist", "patient"),
  verifyAppointmentBookingOwnership,
  bookAppointment
);

// List appointments
router.get(
  "/",
  authenticate,
  authorize("administrator", "receptionist", "doctor", "nurse"),
  listAppointments
);

// Get appointment details
router.get(
  "/:id",
  authenticate,
  authorize("administrator", "receptionist", "doctor", "nurse", "patient"),
  verifyAppointmentOwnership,
  getAppointment
);

// Change appointment status
router.patch(
  "/:id/status",
  authenticate,
  authorize("administrator", "receptionist", "doctor"),
  changeAppointmentStatus
);

export default router;