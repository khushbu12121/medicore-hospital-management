import { Request, Response } from "express";
import {
  createConsent,
  getConsents,
  getConsentById,
  updateConsentStatus,
} from "./consent.service";

export const createConsentController = async (
  req: Request,
  res: Response
) => {
  try {
    const consent = await createConsent(req.body);

    return res.status(201).json({
      success: true,
      message: "Consent created successfully",
      data: consent,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getConsentsController = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await getConsents(req.query);

    return res.status(200).json({
      success: true,
      message: "Consents retrieved successfully",
      ...result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getConsentByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const consent = await getConsentById(String(req.params.id));

    if (!consent) {
      return res.status(404).json({
        success: false,
        message: "Consent not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Consent retrieved successfully",
      data: consent,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateConsentStatusController = async (
  req: Request,
  res: Response
) => {
  try {
    const consent = await updateConsentStatus(
      String(req.params.id),
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Consent status updated successfully",
      data: consent,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};