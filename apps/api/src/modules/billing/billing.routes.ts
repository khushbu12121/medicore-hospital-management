import { Router } from "express";

import {
  createInvoiceController,
  getInvoicesController,
  getInvoiceByIdController,
  createPaymentController,
  updateInvoiceStatusController,
} from "./billing.controller";

import {
  authenticate,
  authorize,
} from "../../middleware/auth.middleware";

const router = Router();

// Create invoice
router.post(
  "/invoices",
  authenticate,
  authorize("administrator", "billing_officer", "receptionist"),
  createInvoiceController
);

// List invoices
router.get(
  "/invoices",
  authenticate,
  authorize("administrator", "billing_officer", "receptionist"),
  getInvoicesController
);

// Get invoice details
router.get(
  "/invoices/:id",
  authenticate,
  authorize("administrator", "billing_officer", "receptionist"),
  getInvoiceByIdController
);

// Update invoice status
router.patch(
  "/invoices/:id/status",
  authenticate,
  authorize("administrator", "billing_officer"),
  updateInvoiceStatusController
);

// Record payment
router.post(
  "/invoices/:id/payments",
  authenticate,
  authorize("administrator", "billing_officer", "receptionist"),
  createPaymentController
);

export default router;