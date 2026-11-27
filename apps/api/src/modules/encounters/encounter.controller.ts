import { Request, Response } from "express";
import {
  createEncounter,
  getEncounters,
  getEncounterById,
  updateEncounterStatus,
} from "./encounter.service";

import {
  createEncounterSchema,
  encounterQuerySchema,
  updateEncounterStatusSchema,
} from "./encounter.validation";

export const createEncounterController = async (
  req: Request,
  res: Response
) => {
  try {
    const validation = createEncounterSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
    }

    const encounter = await createEncounter(validation.data);

    return res.status(201).json({
      success: true,
      message: "Encounter created successfully",
      data: encounter,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create encounter",
    });
  }
};

export const getEncountersController = async (
  req: Request,
  res: Response
) => {
  try {
    const validation = encounterQuerySchema.safeParse(req.query);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: validation.error.flatten(),
      });
    }

    const encounters = await getEncounters(validation.data);

    return res.status(200).json({
      success: true,
      message: "Encounters retrieved successfully",
      data: encounters,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve encounters",
    });
  }
};

export const getEncounterByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const encounter = await getEncounterById(String(req.params.id));
    if (!encounter) {
      return res.status(404).json({
        success: false,
        message: "Encounter not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Encounter retrieved successfully",
      data: encounter,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve encounter",
    });
  }
};

export const updateEncounterStatusController = async (
  req: Request,
  res: Response
) => {
  try {
    const validation = updateEncounterStatusSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
        errors: validation.error.flatten(),
      });
    }

    const encounter = await updateEncounterStatus(
     String(req.params.id),
      validation.data.status
    );

    if (!encounter) {
      return res.status(404).json({
        success: false,
        message: "Encounter not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Encounter status updated successfully",
      data: encounter,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update encounter status",
    });
  }
};