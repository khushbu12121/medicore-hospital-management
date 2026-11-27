
import { describe, it, expect } from "vitest";

import {
  createPatientSchema,
  patientListQuerySchema,
} from "../src/modules/patients/patient.validation";

import {
  createAppointmentSchema,
  appointmentListQuerySchema,
  updateAppointmentStatusSchema,
} from "../src/modules/appointments/appointment.validation";

import {
  createPrescriptionSchema,
  prescriptionQuerySchema,
  updatePrescriptionStatusSchema,
} from "../src/modules/prescriptions/prescription.validation";

import {
  createLabOrderSchema,
  labOrderQuerySchema,
  updateLabOrderStatusSchema,
  createLabResultSchema,
  verifyLabResultSchema,
} from "../src/modules/laboratory/laboratory.validation";

const UUID1 = "550e8400-e29b-41d4-a716-446655440000";
const UUID2 = "550e8400-e29b-41d4-a716-446655440001";
const UUID3 = "550e8400-e29b-41d4-a716-446655440002";

describe("Patient Validation", () => {
  const validPatient = {
    first_name: "Khushbu",
    last_name: "Bansal",
    date_of_birth: "2000-01-01",
  };

  it("accepts valid patient data", () => {
    expect(createPatientSchema.safeParse(validPatient).success).toBe(true);
  });

  it("rejects empty first name", () => {
    expect(
      createPatientSchema.safeParse({
        ...validPatient,
        first_name: "",
      }).success
    ).toBe(false);
  });

  it("rejects empty last name", () => {
    expect(
      createPatientSchema.safeParse({
        ...validPatient,
        last_name: "",
      }).success
    ).toBe(false);
  });

  it("rejects missing first name", () => {
    const { first_name, ...data } = validPatient;

    expect(createPatientSchema.safeParse(data).success).toBe(false);
  });

  it("rejects invalid date of birth", () => {
    expect(
      createPatientSchema.safeParse({
        ...validPatient,
        date_of_birth: "invalid-date",
      }).success
    ).toBe(false);
  });

  it("rejects future date of birth", () => {
    expect(
      createPatientSchema.safeParse({
        ...validPatient,
        date_of_birth: "2099-01-01",
      }).success
    ).toBe(false);
  });

  it("rejects invalid email", () => {
    expect(
      createPatientSchema.safeParse({
        ...validPatient,
        email: "not-an-email",
      }).success
    ).toBe(false);
  });

  it("rejects invalid gender", () => {
    expect(
      createPatientSchema.safeParse({
        ...validPatient,
        gender: "unknown-value",
      }).success
    ).toBe(false);
  });

  it("rejects invalid blood group", () => {
    expect(
      createPatientSchema.safeParse({
        ...validPatient,
        blood_group: "X+",
      }).success
    ).toBe(false);
  });

  it("trims patient names", () => {
    const result = createPatientSchema.safeParse({
      ...validPatient,
      first_name: "  Khushbu  ",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.first_name).toBe("Khushbu");
    }
  });

  it("accepts valid patient query parameters", () => {
    expect(
      patientListQuerySchema.safeParse({
        search: "Khushbu",
        page: "1",
        limit: "10",
      }).success
    ).toBe(true);
  });

  it("rejects patient query page less than 1", () => {
    expect(
      patientListQuerySchema.safeParse({
        page: "0",
      }).success
    ).toBe(false);
  });

  it("rejects patient query limit above 100", () => {
    expect(
      patientListQuerySchema.safeParse({
        limit: "101",
      }).success
    ).toBe(false);
  });
});

describe("Appointment Validation", () => {
  const validAppointment = {
    patient_id: UUID1,
    provider_id: UUID2,
    scheduled_start: "2030-01-01T10:00:00Z",
    scheduled_end: "2030-01-01T11:00:00Z",
  };

  it("accepts valid appointment", () => {
    expect(
      createAppointmentSchema.safeParse(validAppointment).success
    ).toBe(true);
  });

  it("rejects invalid patient UUID", () => {
    expect(
      createAppointmentSchema.safeParse({
        ...validAppointment,
        patient_id: "invalid-id",
      }).success
    ).toBe(false);
  });

  it("rejects invalid provider UUID", () => {
    expect(
      createAppointmentSchema.safeParse({
        ...validAppointment,
        provider_id: "invalid-id",
      }).success
    ).toBe(false);
  });

  it("rejects missing appointment start time", () => {
    const { scheduled_start, ...data } = validAppointment;

    expect(createAppointmentSchema.safeParse(data).success).toBe(false);
  });

  it("rejects invalid datetime format", () => {
    expect(
      createAppointmentSchema.safeParse({
        ...validAppointment,
        scheduled_start: "not-a-date",
      }).success
    ).toBe(false);
  });

  it("rejects end time before start time", () => {
    expect(
      createAppointmentSchema.safeParse({
        ...validAppointment,
        scheduled_end: "2029-12-31T09:00:00Z",
      }).success
    ).toBe(false);
  });

  it("rejects equal appointment start and end times", () => {
    expect(
      createAppointmentSchema.safeParse({
        ...validAppointment,
        scheduled_end: validAppointment.scheduled_start,
      }).success
    ).toBe(false);
  });

  it("applies default appointment type", () => {
    const result = createAppointmentSchema.safeParse(validAppointment);

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.appointment_type).toBe("consultation");
    }
  });

  it("rejects invalid appointment status", () => {
    expect(
      updateAppointmentStatusSchema.safeParse({
        status: "invalid-status",
      }).success
    ).toBe(false);
  });

  it("accepts valid appointment status", () => {
    expect(
      updateAppointmentStatusSchema.safeParse({
        status: "completed",
      }).success
    ).toBe(true);
  });

  it("rejects appointment pagination limit above 100", () => {
    expect(
      appointmentListQuerySchema.safeParse({
        limit: "101",
      }).success
    ).toBe(false);
  });
});

describe("Prescription Validation", () => {
  const validPrescription = {
    encounter_id: UUID1,
    patient_id: UUID2,
    prescriber_id: UUID3,
    items: [
      {
        medication_name: "Paracetamol",
        dosage: "500mg",
        frequency: "Twice daily",
      },
    ],
  };

  it("accepts valid prescription", () => {
    expect(
      createPrescriptionSchema.safeParse(validPrescription).success
    ).toBe(true);
  });

  it("rejects invalid encounter UUID", () => {
    expect(
      createPrescriptionSchema.safeParse({
        ...validPrescription,
        encounter_id: "invalid",
      }).success
    ).toBe(false);
  });

  it("rejects prescription without items", () => {
    expect(
      createPrescriptionSchema.safeParse({
        ...validPrescription,
        items: [],
      }).success
    ).toBe(false);
  });

  it("rejects empty medication name", () => {
    expect(
      createPrescriptionSchema.safeParse({
        ...validPrescription,
        items: [
          {
            medication_name: "",
            dosage: "500mg",
            frequency: "Twice daily",
          },
        ],
      }).success
    ).toBe(false);
  });

  it("rejects missing dosage", () => {
    expect(
      createPrescriptionSchema.safeParse({
        ...validPrescription,
        items: [
          {
            medication_name: "Paracetamol",
            frequency: "Twice daily",
          },
        ],
      }).success
    ).toBe(false);
  });

  it("rejects zero quantity", () => {
    expect(
      createPrescriptionSchema.safeParse({
        ...validPrescription,
        items: [
          {
            medication_name: "Paracetamol",
            dosage: "500mg",
            frequency: "Twice daily",
            quantity: 0,
          },
        ],
      }).success
    ).toBe(false);
  });

  it("rejects negative refills", () => {
    expect(
      createPrescriptionSchema.safeParse({
        ...validPrescription,
        items: [
          {
            medication_name: "Paracetamol",
            dosage: "500mg",
            frequency: "Twice daily",
            refills: -1,
          },
        ],
      }).success
    ).toBe(false);
  });

  it("defaults refills to zero", () => {
    const result = createPrescriptionSchema.safeParse(validPrescription);

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.items[0].refills).toBe(0);
    }
  });

  it("rejects invalid prescription status", () => {
    expect(
      updatePrescriptionStatusSchema.safeParse({
        status: "pending",
      }).success
    ).toBe(false);
  });

  it("rejects invalid prescription pagination", () => {
    expect(
      prescriptionQuerySchema.safeParse({
        page: "0",
      }).success
    ).toBe(false);
  });
});

describe("Laboratory Validation", () => {
  const validLabOrder = {
    encounter_id: UUID1,
    patient_id: UUID2,
    ordered_by: UUID3,
    test_name: "CBC",
  };

  it("accepts valid laboratory order", () => {
    expect(
      createLabOrderSchema.safeParse(validLabOrder).success
    ).toBe(true);
  });

  it("rejects invalid encounter UUID", () => {
    expect(
      createLabOrderSchema.safeParse({
        ...validLabOrder,
        encounter_id: "invalid",
      }).success
    ).toBe(false);
  });

  it("rejects empty test name", () => {
    expect(
      createLabOrderSchema.safeParse({
        ...validLabOrder,
        test_name: "",
      }).success
    ).toBe(false);
  });

  it("applies routine priority by default", () => {
    const result = createLabOrderSchema.safeParse(validLabOrder);

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.priority).toBe("routine");
    }
  });

  it("rejects invalid priority", () => {
    expect(
      createLabOrderSchema.safeParse({
        ...validLabOrder,
        priority: "low",
      }).success
    ).toBe(false);
  });

  it("rejects invalid laboratory status", () => {
    expect(
      updateLabOrderStatusSchema.safeParse({
        status: "unknown",
      }).success
    ).toBe(false);
  });

  it("accepts valid laboratory status", () => {
    expect(
      updateLabOrderStatusSchema.safeParse({
        status: "processing",
      }).success
    ).toBe(true);
  });

  it("rejects empty laboratory result", () => {
    expect(
      createLabResultSchema.safeParse({
        result_value: "",
      }).success
    ).toBe(false);
  });

  it("accepts valid laboratory result", () => {
    expect(
      createLabResultSchema.safeParse({
        result_value: "12.5",
        unit: "g/dL",
        reference_range: "12-16",
        abnormal_flag: "normal",
      }).success
    ).toBe(true);
  });

  it("rejects invalid abnormal flag", () => {
    expect(
      createLabResultSchema.safeParse({
        result_value: "12.5",
        abnormal_flag: "unknown",
      }).success
    ).toBe(false);
  });

  it("rejects invalid verifier UUID", () => {
    expect(
      verifyLabResultSchema.safeParse({
        verified_by: "invalid",
      }).success
    ).toBe(false);
  });

  it("rejects laboratory pagination limit above 100", () => {
    expect(
      labOrderQuerySchema.safeParse({
        limit: "101",
      }).success
    ).toBe(false);
  });
});
