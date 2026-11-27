import { Request, Response } from "express";
import {
  createPatientSchema,
  patientListQuerySchema,
} from "./patient.validation";

import {
  createPatient,
  getPatients,
  getPatientById,
} from "./patient.service";

export const registerPatient = async (
  req: Request,
  res: Response
) => {
  try {
    const validation = createPatientSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const patient = await createPatient(validation.data);

    return res.status(201).json({
      success: true,
      message: "Patient registered successfully",
      data: patient,
    });
  } catch (error) {
    console.error("Register patient error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to register patient",
    });
  }
};

export const listPatients = async (
  req: Request,
  res: Response
) => {
  try {
    const validation = patientListQuerySchema.safeParse(req.query);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: validation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const { search, page, limit } = validation.data;

    const result = await getPatients(search, page, limit);

    return res.status(200).json({
      success: true,
      message: "Patients retrieved successfully",
      ...result,
    });
  } catch (error) {
    console.error("List patients error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve patients",
    });
  }
};

export const getPatient = async (
  req: Request,
  res: Response
) => {
  try {
    const patientId = String(req.params.id);

const patient = await getPatientById(patientId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Patient retrieved successfully",
      data: patient,
    });
  } catch (error) {
    console.error("Get patient error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve patient",
    });
  }
};