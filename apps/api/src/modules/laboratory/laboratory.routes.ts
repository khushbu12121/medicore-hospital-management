import { Router } from "express";

import {
  createLabOrderController,
  getLabOrdersController,
  getLabOrderByIdController,
  updateLabOrderStatusController,
  createLabResultController,
  verifyLabResultController,
} from "./laboratory.controller";

import {
  authenticate,
  authorize,
} from "../../middleware/auth.middleware";

const router = Router();

// Create laboratory order
router.post(
  "/",
  authenticate,
  authorize("administrator", "doctor", "nurse"),
  createLabOrderController
);

// View laboratory orders
router.get(
  "/",
  authenticate,
  authorize("administrator", "doctor", "nurse", "lab_technician"),
  getLabOrdersController
);

// View specific laboratory order
router.get(
  "/:id",
  authenticate,
  authorize("administrator", "doctor", "nurse", "lab_technician"),
  getLabOrderByIdController
);

// Update laboratory order status
router.patch(
  "/:id/status",
  authenticate,
  authorize("administrator", "doctor", "lab_technician"),
  updateLabOrderStatusController
);

// Enter laboratory results
router.post(
  "/:id/results",
  authenticate,
  authorize("administrator", "lab_technician"),
  createLabResultController
);

// Verify laboratory results
router.patch(
  "/results/:resultId/verify",
  authenticate,
  authorize("administrator", "lab_technician"),
  verifyLabResultController
);

export default router;