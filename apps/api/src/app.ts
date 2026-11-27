import express from "express";
import cors from "cors";
import helmet from "helmet";
import patientRoutes from "./modules/patients/patient.routes";
import appointmentRoutes from "./modules/appointments/appointment.routes";
import encounterRoutes from "./modules/encounters/encounter.routes";
import prescriptionRoutes from "./modules/prescriptions/prescription.routes";
import laboratoryRoutes from "./modules/laboratory/laboratory.routes";
import billingRoutes from "./modules/billing/billing.routes";
import auditRoutes from "./modules/audit/audit.routes";
import consentRoutes from "./modules/consent/consent.routes";
import staffRoutes from "./modules/staff/staff.routes";
import authRoutes from "./modules/auth/auth.routes";
import { authenticate, AuthenticatedRequest } from "./middleware/auth.middleware";
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "MediCore Hospital Management API",
    version: "1.0.0",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    service: "medicore-api",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/v1", (_req, res) => {
  res.json({
    success: true,
    message: "MediCore API v1",
    modules: [
      "patients",
      "appointments",
      "staff",
      "encounters",
      "prescriptions",
      "laboratory",
      "billing",
      "consent",
      "audit",
    ],
  });
});

app.get("/api/v1/auth/me", authenticate, (req: AuthenticatedRequest, res) => {
  res.json({
    success: true,
    message: "Authenticated successfully",
    user: req.user,
  });
});

// Patient routes
app.use("/api/v1/patients", patientRoutes);
app.use("/api/v1/appointments", appointmentRoutes);
app.use("/api/v1/encounters", encounterRoutes);
app.use("/api/v1/prescriptions", prescriptionRoutes);
app.use("/api/v1/laboratory", laboratoryRoutes);
app.use("/api/v1/billing", billingRoutes);
app.use("/api/v1/audit", auditRoutes);
app.use("/api/v1/consents", consentRoutes);
app.use("/api/v1/staff", staffRoutes);
app.use("/api/v1/auth", authRoutes);
export default app;