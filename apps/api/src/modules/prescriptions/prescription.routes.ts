import { Router } from "express";

import {
  createPrescriptionController,
  getPrescriptionsController,
  getPrescriptionByIdController,
  updatePrescriptionStatusController,
} from "./prescription.controller";

import {
  authenticate,
  authorize,
} from "../../middleware/auth.middleware";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("administrator", "doctor"),
  createPrescriptionController
);

router.get(
  "/",
  authenticate,
  authorize("administrator", "doctor", "nurse"),
  getPrescriptionsController
);

router.get(
  "/:id",
  authenticate,
  authorize("administrator", "doctor", "nurse"),
  getPrescriptionByIdController
);

router.patch(
  "/:id/status",
  authenticate,
  authorize("administrator", "doctor", "nurse"),
  updatePrescriptionStatusController
);

export default router;