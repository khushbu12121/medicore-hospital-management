import { Request, Response } from "express";

import {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  updatePrescriptionStatus,
} from "./prescription.service";

import {
  createPrescriptionSchema,
  prescriptionQuerySchema,
  updatePrescriptionStatusSchema,
} from "./prescription.validation";

export const createPrescriptionController = async (
  req: Request,
  res: Response
) => {
  try {
    const validation = createPrescriptionSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
    }

    const prescription = await createPrescription(validation.data);

    return res.status(201).json({
      success: true,
      message: "Prescription created successfully",
      data: prescription,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create prescription",
    });
  }
};

export const getPrescriptionsController = async (
  req: Request,
  res: Response
) => {
  try {
    const validation = prescriptionQuerySchema.safeParse(req.query);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: validation.error.flatten(),
      });
    }

    const prescriptions = await getPrescriptions(validation.data);

    return res.status(200).json({
      success: true,
      message: "Prescriptions retrieved successfully",
      data: prescriptions,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve prescriptions",
    });
  }
};

export const getPrescriptionByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const prescription = await getPrescriptionById(
      String(req.params.id)
    );

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Prescription retrieved successfully",
      data: prescription,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve prescription",
    });
  }
};

export const updatePrescriptionStatusController = async (
  req: Request,
  res: Response
) => {
  try {
    const validation = updatePrescriptionStatusSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
        errors: validation.error.flatten(),
      });
    }

    const prescription = await updatePrescriptionStatus(
      String(req.params.id),
      validation.data.status
    );

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Prescription status updated successfully",
      data: prescription,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update prescription status",
    });
  }
};