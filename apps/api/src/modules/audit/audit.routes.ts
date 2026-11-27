import { Router } from "express";

import {
  createAuditController,
  getAuditLogsController,
  getAuditLogByIdController,
} from "./audit.controller";

import {
  authenticate,
  authorize,
} from "../../middleware/auth.middleware";

const router = Router();

// Create audit log
router.post(
  "/",
  authenticate,
  authorize("administrator"),
  createAuditController
);

// View audit logs
router.get(
  "/",
  authenticate,
  authorize("administrator"),
  getAuditLogsController
);

// View individual audit log
router.get(
  "/:id",
  authenticate,
  authorize("administrator"),
  getAuditLogByIdController
);

export default router;