import { Request, Response } from "express";

import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  createPayment,
  updateInvoiceStatus,
} from "./billing.service";

import {
  createInvoiceSchema,
  invoiceQuerySchema,
  createPaymentSchema,
  updateInvoiceStatusSchema,
} from "./billing.validation";

export const createInvoiceController = async (
  req: Request,
  res: Response
) => {
  try {
    const validation = createInvoiceSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
    }

    const invoice = await createInvoice(validation.data);

    return res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: invoice,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create invoice",
    });
  }
};

export const getInvoicesController = async (
  req: Request,
  res: Response
) => {
  try {
    const validation = invoiceQuerySchema.safeParse(req.query);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: validation.error.flatten(),
      });
    }

    const invoices = await getInvoices(validation.data);

    return res.status(200).json({
      success: true,
      message: "Invoices retrieved successfully",
      data: invoices,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve invoices",
    });
  }
};

export const getInvoiceByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const invoice = await getInvoiceById(String(req.params.id));

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Invoice retrieved successfully",
      data: invoice,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve invoice",
    });
  }
};

export const createPaymentController = async (
  req: Request,
  res: Response
) => {
  try {
    const validation = createPaymentSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
    }

    const payment = await createPayment(
      String(req.params.id),
      validation.data
    );

    return res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: payment,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to record payment",
    });
  }
};

export const updateInvoiceStatusController = async (
  req: Request,
  res: Response
) => {
  try {
    const validation = updateInvoiceStatusSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
        errors: validation.error.flatten(),
      });
    }

    const invoice = await updateInvoiceStatus(
      String(req.params.id),
      validation.data.status
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Invoice status updated successfully",
      data: invoice,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update invoice status",
    });
  }
};