import { Request, Response } from "express";
import { loginSchema, registerSchema } from "./auth.validation";
import { loginUser, registerPatient } from "./auth.service";

export const register = async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const user = await registerPatient(validatedData);

    return res.status(201).json({
      success: true,
      message: "Patient account created successfully",
      data: user,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues,
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const result = await loginUser(validatedData);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues,
      });
    }

    const message = error.message || "Login failed";

    const statusCode =
      message === "Account is inactive" ? 403 : 401;

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
};