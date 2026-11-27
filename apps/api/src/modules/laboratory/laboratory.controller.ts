import { Request, Response } from "express";

import {
  createLabOrder,
  getLabOrders,
  getLabOrderById,
  updateLabOrderStatus,
  createLabResult,
  verifyLabResult,
} from "./laboratory.service";

import {
  createLabOrderSchema,
  labOrderQuerySchema,
  updateLabOrderStatusSchema,
  createLabResultSchema,
  verifyLabResultSchema,
} from "./laboratory.validation";

export const createLabOrderController = async (
  req: Request,
  res: Response
) => {
  try {
    const validation = createLabOrderSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
    }

    const order = await createLabOrder(validation.data);

    return res.status(201).json({
      success: true,
      message: "Lab order created successfully",
      data: order,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create lab order",
    });
  }
};

export const getLabOrdersController = async (
  req: Request,
  res: Response
) => {
  try {
    const validation = labOrderQuerySchema.safeParse(req.query);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: validation.error.flatten(),
      });
    }

    const orders = await getLabOrders(validation.data);

    return res.status(200).json({
      success: true,
      message: "Lab orders retrieved successfully",
      data: orders,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve lab orders",
    });
  }
};

export const getLabOrderByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const order = await getLabOrderById(String(req.params.id));

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Lab order not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lab order retrieved successfully",
      data: order,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve lab order",
    });
  }
};

export const updateLabOrderStatusController = async (
  req: Request,
  res: Response
) => {
  try {
    const validation = updateLabOrderStatusSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
        errors: validation.error.flatten(),
      });
    }

    const order = await updateLabOrderStatus(
      String(req.params.id),
      validation.data.status
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Lab order not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lab order status updated successfully",
      data: order,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update lab order status",
    });
  }
};

export const createLabResultController = async (
  req: Request,
  res: Response
) => {
  try {
    const validation = createLabResultSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
    }

    const result = await createLabResult(
      String(req.params.id),
      validation.data
    );

    return res.status(201).json({
      success: true,
      message: "Lab result recorded successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to record lab result",
    });
  }
};

export const verifyLabResultController = async (
  req: Request,
  res: Response
) => {
  try {
    const validation = verifyLabResultSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
    }

    const result = await verifyLabResult(
      String(req.params.resultId),
      validation.data.verified_by
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Lab result not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lab result verified successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify lab result",
    });
  }
};