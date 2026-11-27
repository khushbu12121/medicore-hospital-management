import { Router } from "express";

import {
  createEncounterController,
  getEncountersController,
  getEncounterByIdController,
  updateEncounterStatusController,
} from "./encounter.controller";

import {
  authenticate,
  authorize,
} from "../../middleware/auth.middleware";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("administrator", "doctor"),
  createEncounterController
);

router.get(
  "/",
  authenticate,
  authorize("administrator", "doctor", "nurse"),
  getEncountersController
);

router.get(
  "/:id",
  authenticate,
  authorize("administrator", "doctor", "nurse"),
  getEncounterByIdController
);

router.patch(
  "/:id/status",
  authenticate,
  authorize("administrator", "doctor"),
  updateEncounterStatusController
);

export default router;