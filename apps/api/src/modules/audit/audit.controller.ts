import { Request, Response } from "express";
import {
  createAuditLog,
  getAuditLogs,
  getAuditLogById,
} from "./audit.service";

export const createAuditController = async (
  req: Request,
  res: Response
) => {
  try {
    const audit = await createAuditLog(req.body);

    return res.status(201).json({
      success: true,
      message: "Audit log created successfully",
      data: audit,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAuditLogsController = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await getAuditLogs(req.query);

    return res.status(200).json({
      success: true,
      message: "Audit logs retrieved successfully",
      ...result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAuditLogByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = String(req.params.id);

    const audit = await getAuditLogById(id);

    if (!audit) {
      return res.status(404).json({
        success: false,
        message: "Audit log not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Audit log retrieved successfully",
      data: audit,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};