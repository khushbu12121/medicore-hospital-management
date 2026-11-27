import { Request, Response } from "express";
import {
  createStaff,
  getStaffList,
  getStaffById,
  updateStaff,
  updateStaffStatus,
} from "./staff.service";

export const createStaffController = async (
  req: Request,
  res: Response
) => {
  try {
    const staff = await createStaff(req.body);

    return res.status(201).json({
      success: true,
      message: "Staff created successfully",
      data: staff,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getStaffListController = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await getStaffList(req.query);

    return res.status(200).json({
      success: true,
      message: "Staff retrieved successfully",
      ...result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getStaffByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const staff = await getStaffById(String(req.params.id));

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Staff retrieved successfully",
      data: staff,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateStaffController = async (
  req: Request,
  res: Response
) => {
  try {
    const staff = await updateStaff(
      String(req.params.id),
      req.body
    );

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Staff updated successfully",
      data: staff,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateStaffStatusController = async (
  req: Request,
  res: Response
) => {
  try {
    const { is_active } = req.body;

    if (typeof is_active !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "is_active must be a boolean",
      });
    }

    const staff = await updateStaffStatus(
      String(req.params.id),
      is_active
    );

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Staff status updated successfully",
      data: staff,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};