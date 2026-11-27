import { Router } from "express";

import {
  createStaffController,
  getStaffListController,
  getStaffByIdController,
  updateStaffController,
  updateStaffStatusController,
} from "./staff.controller";

import {
  authenticate,
  authorize,
} from "../../middleware/auth.middleware";

const router = Router();

// Create staff member
router.post(
  "/",
  authenticate,
  authorize("administrator"),
  createStaffController
);

// List/search staff
router.get(
  "/",
  authenticate,
  authorize("administrator", "receptionist", "doctor", "nurse"),
  getStaffListController
);

// Get staff member by ID
router.get(
  "/:id",
  authenticate,
  authorize("administrator", "receptionist", "doctor", "nurse"),
  getStaffByIdController
);

// Update staff information
router.patch(
  "/:id",
  authenticate,
  authorize("administrator"),
  updateStaffController
);

// Activate/deactivate staff
router.patch(
  "/:id/status",
  authenticate,
  authorize("administrator"),
  updateStaffStatusController
);

export default router;