import { Router, Response, NextFunction } from "express";

import {
  createConsentController,
  getConsentsController,
  getConsentByIdController,
  updateConsentStatusController,
} from "./consent.controller";

import {
  authenticate,
  authorize,
  AuthenticatedRequest,
} from "../../middleware/auth.middleware";

import { pool } from "../../config/database";

const router = Router();

// Patients can create consent records only for themselves
const verifyConsentCreationOwnership = (
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
      message: "You can only create consent records for yourself",
    });
  }

  next();
};

// Verify ownership of a consent record
const verifyConsentOwnership = async (
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

    // Staff roles retain access based on RBAC
    if (user.role !== "patient") {
      return next();
    }

    const consentId = String(req.params.id);

    const result = await pool.query(
      `SELECT patient_id
       FROM consents
       WHERE id = $1`,
      [consentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Consent record not found",
      });
    }

    if (result.rows[0].patient_id !== user.patientId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this consent record",
      });
    }

    next();
  } catch (error) {
    console.error("Consent ownership check error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify consent access",
    });
  }
};

// Create consent record
router.post(
  "/",
  authenticate,
  authorize("administrator", "doctor", "nurse", "patient"),
  verifyConsentCreationOwnership,
  createConsentController
);

// List consent records — patients cannot access the directory
router.get(
  "/",
  authenticate,
  authorize("administrator", "doctor", "nurse"),
  getConsentsController
);

// Get consent details
router.get(
  "/:id",
  authenticate,
  authorize("administrator", "doctor", "nurse", "patient"),
  verifyConsentOwnership,
  getConsentByIdController
);

// Update consent status
router.patch(
  "/:id/status",
  authenticate,
  authorize("administrator", "doctor", "nurse", "patient"),
  verifyConsentOwnership,
  updateConsentStatusController
);

export default router;