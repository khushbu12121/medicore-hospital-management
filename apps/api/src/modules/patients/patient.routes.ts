import { Router, Response, NextFunction } from "express";

import {
  registerPatient,
  listPatients,
  getPatient,
} from "./patient.controller";

import {
  authenticate,
  authorize,
  AuthenticatedRequest,
} from "../../middleware/auth.middleware";

const router = Router();

// Register a new patient
router.post(
  "/",
  authenticate,
  authorize("administrator", "receptionist"),
  registerPatient
);

// List/search patients — patients cannot view the entire patient directory
router.get(
  "/",
  authenticate,
  authorize("administrator", "receptionist", "doctor", "nurse"),
  listPatients
);

// Get patient details — staff can access, patients can access only their own record
const authorizePatientAccess = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;
  const requestedPatientId = String(req.params.id);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const staffRoles = ["administrator", "receptionist", "doctor", "nurse"];

  if (staffRoles.includes(user.role)) {
    return next();
  }

  if (user.role === "patient" && user.patientId === requestedPatientId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "You are not authorized to access this patient's record",
  });
};

router.get(
  "/:id",
  authenticate,
  authorizePatientAccess,
  getPatient
);

export default router;