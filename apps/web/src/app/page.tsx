"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

const navigation = [
  { name: "Dashboard", icon: "⌂" },
  { name: "Patients", icon: "♙" },
  { name: "Appointments", icon: "▦" },
  { name: "Encounters", icon: "✚" },
  { name: "Prescriptions", icon: "℞" },
  { name: "Laboratory", icon: "⚗" },
  { name: "Billing", icon: "₹" },
  { name: "Staff", icon: "♧" },
  { name: "Audit Logs", icon: "◷" },
  { name: "Consents", icon: "📋" },
];

const stats = [
  { title: "Total Patients", value: "1,284", change: "+12%", icon: "♙" },
  { title: "Appointments Today", value: "42", change: "+8%", icon: "▦" },
  { title: "Active Encounters", value: "18", change: "Today", icon: "✚" },
  {
    title: "Pending Lab Orders",
    value: "16",
    change: "Requires attention",
    icon: "⚗",
  },
];

const appointments = [
  {
    patient: "Aarav Sharma",
    id: "PT-1001",
    doctor: "Dr. Priya Mehta",
    time: "09:00 AM",
    type: "General Consultation",
    status: "Confirmed",
  },
  {
    patient: "Ananya Gupta",
    id: "PT-1002",
    doctor: "Dr. Rahul Verma",
    time: "09:30 AM",
    type: "Follow-up",
    status: "Checked In",
  },
  {
    patient: "Rohan Singh",
    id: "PT-1003",
    doctor: "Dr. Priya Mehta",
    time: "10:00 AM",
    type: "Consultation",
    status: "Pending",
  },
  {
    patient: "Meera Patel",
    id: "PT-1004",
    doctor: "Dr. Amit Kumar",
    time: "10:30 AM",
    type: "Routine Checkup",
    status: "Confirmed",
  },
  {
    patient: "Kabir Joshi",
    id: "PT-1005",
    doctor: "Dr. Rahul Verma",
    time: "11:00 AM",
    type: "Follow-up",
    status: "Confirmed",
  },
];

type PatientForm = {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  phone: string;
  email: string;
  blood_group: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  allergies: string;
  medical_notes: string;
};

const emptyPatientForm: PatientForm = {
  first_name: "",
  last_name: "",
  date_of_birth: "",
  gender: "",
  phone: "",
  email: "",
  blood_group: "",
  address: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  allergies: "",
  medical_notes: "",
};
const emptyPrescriptionItem = {
  medication_name: "",
  dosage: "",
  route: "",
  frequency: "",
  duration: "",
  quantity: "",
  refills: "0",
  instructions: "",
};
export default function Home() {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [activePage, setActivePage] = useState("Dashboard");
  const [search, setSearch] = useState("");
  const [user, setUser] = useState<any>(null);
  
  // Patient states
  const [patients, setPatients] = useState<any[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientsError, setPatientsError] = useState("");
  const [refreshPatients, setRefreshPatients] = useState(0);

  // Appointment states
  const [appointmentsList, setAppointmentsList] = useState<any[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState("");
  const [refreshAppointments, setRefreshAppointments] = useState(0);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  
  const [savingAppointment, setSavingAppointment] = useState(false);
  const [appointmentMessage, setAppointmentMessage] = useState("");
  const [appointmentMessageType, setAppointmentMessageType] = useState<
    "success" | "error"
  >("success");

  const [appointmentForm, setAppointmentForm] = useState({
    patient_id: "",
    provider_id: "",
    scheduled_date: "",
    scheduled_start: "",
    scheduled_end: "",
    appointment_type: "consultation",
    reason: "",
    notes: "",
  });
 // Encounter states
const [encountersList, setEncountersList] = useState<any[]>([]);
const [encountersLoading, setEncountersLoading] = useState(false);
const [encountersError, setEncountersError] = useState("");
const [refreshEncounters, setRefreshEncounters] = useState(0);

const [showEncounterForm, setShowEncounterForm] = useState(false);
const [savingEncounter, setSavingEncounter] = useState(false);
const [encounterMessage, setEncounterMessage] = useState("");
const [encounterMessageType, setEncounterMessageType] = useState<
  "success" | "error"
>("success");

const [encounterForm, setEncounterForm] = useState({
  patient_id: "",
  appointment_id: "",
  provider_id: "",
  department_id: "",
  encounter_type: "outpatient",
  chief_complaint: "",
  clinical_notes: "",
  diagnosis_summary: "",
});

// Prescription states
const [prescriptionsList, setPrescriptionsList] = useState<any[]>([]);
const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
const [prescriptionsError, setPrescriptionsError] = useState("");
const [refreshPrescriptions, setRefreshPrescriptions] = useState(0);

const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
const [savingPrescription, setSavingPrescription] = useState(false);
const [prescriptionMessage, setPrescriptionMessage] = useState("");
const [prescriptionMessageType, setPrescriptionMessageType] = useState<
  "success" | "error"
>("success");

const [prescriptionForm, setPrescriptionForm] = useState({
  encounter_id: "",
  patient_id: "",
  prescriber_id: "",
  instructions: "",
  items: [
    {
      medication_name: "",
      dosage: "",
      route: "",
      frequency: "",
      duration: "",
      quantity: "",
      refills: "0",
      instructions: "",
    },
  ],
});

const [laboratoryOrders, setLaboratoryOrders] = useState<any[]>([]);
const [laboratoryLoading, setLaboratoryLoading] = useState(false);
const [laboratoryError, setLaboratoryError] = useState("");
const [refreshLaboratory, setRefreshLaboratory] = useState(0);

const [showLabOrderForm, setShowLabOrderForm] = useState(false);
const [showLabResultForm, setShowLabResultForm] = useState(false);

const [selectedLabOrder, setSelectedLabOrder] = useState<any>(null);

const [labSearch, setLabSearch] = useState("");
const [labStatusFilter, setLabStatusFilter] = useState("all");
  // Patient form states
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [savingPatient, setSavingPatient] = useState(false);
  const [patientMessage, setPatientMessage] = useState("");
  const [patientMessageType, setPatientMessageType] = useState<
    "success" | "error"
  >("success");

  const [patientForm, setPatientForm] =
    useState<PatientForm>(emptyPatientForm);

    const [otherModuleData, setOtherModuleData] = useState<any[]>([]);
const [otherModuleLoading, setOtherModuleLoading] = useState(false);
const [otherModuleError, setOtherModuleError] = useState("");
const [refreshOtherModule, setRefreshOtherModule] = useState(0);


useEffect(() => {
  const moduleEndpoints: Record<string, string> = {
  Billing: "/billing/invoices",
  Staff: "/staff",
  "Audit Logs": "/audit",
  Consents: "/consents",
};

  const endpoint = moduleEndpoints[activePage];

  if (!endpoint) return;

  async function fetchOtherModule() {
    setOtherModuleLoading(true);
    setOtherModuleError("");
    setOtherModuleData([]);

    try {
      const token = localStorage.getItem("medicore_token");

      const response = await fetch(
        `${API_URL}${endpoint}?page=1&limit=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Failed to load ${activePage}`);
      }

      const data = result.data;

      if (Array.isArray(data)) {
        setOtherModuleData(data);
      } else if (data && Array.isArray(data.items)) {
        setOtherModuleData(data.items);
      } else if (data && Array.isArray(data.records)) {
        setOtherModuleData(data.records);
      } else {
        setOtherModuleData([]);
      }
    } catch (error: any) {
      setOtherModuleError(error.message || "Unable to load data");
    } finally {
      setOtherModuleLoading(false);
    }
  }

  fetchOtherModule();
}, [activePage, refreshOtherModule]);

  // Authentication
  useEffect(() => {
    const token = localStorage.getItem("medicore_token");
    const savedUser = localStorage.getItem("medicore_user");

    if (!token) {
      router.replace("/login");
      return;
    }

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("medicore_user");
      }
    }

    setAuthChecked(true);
  }, [router]);

  // Logout
  function handleLogout() {
    localStorage.removeItem("medicore_token");
    localStorage.removeItem("medicore_user");
    router.replace("/login");
  }

  // Fetch patients
  useEffect(() => {
    if (
  activePage !== "Patients" &&
  activePage !== "Appointments" &&
  activePage !== "Encounters" &&
  activePage !== "Prescriptions"
) {
  return;
}

    async function fetchPatients() {
      setPatientsLoading(true);
      setPatientsError("");

      try {
        const token = localStorage.getItem("medicore_token");

        const patientSearch =
          activePage === "Patients" ? search : "";

        const response = await fetch(
          `${API_URL}/patients?search=${encodeURIComponent(patientSearch)}&page=1&limit=100`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Failed to fetch patients",
          );
        }

        setPatients(result.data || []);
      } catch (error: any) {
        setPatientsError(
          error.message || "Unable to load patients",
        );
      } finally {
        setPatientsLoading(false);
      }
    }

    fetchPatients();
  }, [activePage, search, refreshPatients]);

  // Fetch appointments
  useEffect(() => {
    if (
  activePage !== "Appointments" &&
  activePage !== "Prescriptions" &&
  activePage !== "Encounters"
) {
  return;
}

    async function fetchAppointments() {
      setAppointmentsLoading(true);
      setAppointmentsError("");

      try {
        const token = localStorage.getItem("medicore_token");

        const response = await fetch(
          `${API_URL}/appointments?page=1&limit=100`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Failed to fetch appointments",
          );
        }

        setAppointmentsList(result.data || []);
      } catch (error: any) {
        setAppointmentsError(
          error.message || "Unable to load appointments",
        );
      } finally {
        setAppointmentsLoading(false);
      }
    }

    fetchAppointments();
  }, [activePage, refreshAppointments]);
 
  // Fetch encounters
useEffect(() => {
  async function fetchEncounters() {
    setEncountersLoading(true);
    setEncountersError("");

    try {
      const token = localStorage.getItem("medicore_token");

      const response = await fetch(
        `${API_URL}/encounters?page=1&limit=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to fetch encounters",
        );
      }

      setEncountersList(result.data || []);
    } catch (error: any) {
      setEncountersError(
        error.message || "Unable to load encounters",
      );
    } finally {
      setEncountersLoading(false);
    }
  }

  fetchEncounters();
}, [refreshEncounters]);
  // Fetch doctors
  useEffect(() => {
    if (
  activePage !== "Appointments" &&
  activePage !== "Encounters"
) {
  return;
}

    async function fetchDoctors() {
      try {
        const token = localStorage.getItem("medicore_token");

        const response = await fetch(
          `${API_URL}/staff?role=doctor&is_active=true&page=1&limit=100`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Failed to fetch doctors",
          );
        }

        setDoctors(result.data || []);
      } catch (error: any) {
        setAppointmentMessage(
          error.message || "Unable to load doctors",
        );
        setAppointmentMessageType("error");
      }
    }

    fetchDoctors();
  }, [activePage]);
 
  // Fetch prescriptions
useEffect(() => {
  if (activePage !== "Prescriptions") return;

  async function fetchPrescriptions() {
    setPrescriptionsLoading(true);
    setPrescriptionsError("");

    try {
      const token = localStorage.getItem("medicore_token");

      const response = await fetch(
        `${API_URL}/prescriptions?page=1&limit=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to fetch prescriptions",
        );
      }

      setPrescriptionsList(result.data || []);
    } catch (error: any) {
      setPrescriptionsError(
        error.message || "Unable to load prescriptions",
      );
    } finally {
      setPrescriptionsLoading(false);
    }
  }

  fetchPrescriptions();
}, [activePage, refreshPrescriptions]);


useEffect(() => {
  if (activePage !== "Laboratory") return;

  async function fetchLaboratoryOrders() {
    setLaboratoryLoading(true);
    setLaboratoryError("");

    try {
      const token = localStorage.getItem("medicore_token");

      const response = await fetch(
        `${API_URL}/laboratory?page=1&limit=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch laboratory orders");
      }

      setLaboratoryOrders(result.data || []);
    } catch (error: any) {
      setLaboratoryError(error.message || "Unable to load laboratory orders");
    } finally {
      setLaboratoryLoading(false);
    }
  }

  fetchLaboratoryOrders();
}, [activePage, refreshLaboratory]);
  // Register patient
  async function handleAddPatient(e: React.FormEvent) {
    e.preventDefault();

    setSavingPatient(true);
    setPatientMessage("");

    try {
      const token = localStorage.getItem("medicore_token");

      const payload = {
        ...patientForm,
        gender: patientForm.gender || null,
        blood_group: patientForm.blood_group || null,
        phone: patientForm.phone || null,
        email: patientForm.email || null,
        address: patientForm.address || null,
        emergency_contact_name:
          patientForm.emergency_contact_name || null,
        emergency_contact_phone:
          patientForm.emergency_contact_phone || null,
        allergies: patientForm.allergies || null,
        medical_notes: patientForm.medical_notes || null,
      };

      const response = await fetch(`${API_URL}/patients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        const validationErrors = result.errors
          ?.map((error: any) => error.message)
          .join(", ");

        throw new Error(
          validationErrors ||
            result.message ||
            "Failed to register patient",
        );
      }

      setPatientMessage("Patient registered successfully!");
      setPatientMessageType("success");

      setPatientForm(emptyPatientForm);
      setShowPatientForm(false);


      async function updateLabOrderStatus(orderId: string, status: string) {
  try {
    const token = localStorage.getItem("medicore_token");

    const response = await fetch(
      `${API_URL}/laboratory/${orderId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to update status");
    }

    alert("Laboratory order status updated successfully!");
    setRefreshLaboratory((prev) => prev + 1);
  } catch (error: any) {
    alert(error.message || "Unable to update status");
  }
}


async function addLabResult(orderId: string) {
  const resultValue = prompt("Enter result value:");
  if (!resultValue) return;

  const unit = prompt("Enter unit (optional):") || "";
  const referenceRange = prompt("Enter reference range (optional):") || "";
  const abnormalFlag = prompt(
    "Abnormal flag (normal/low/high/critical/abnormal), optional:"
  ) || "";

  try {
    const token = localStorage.getItem("medicore_token");

    const response = await fetch(
      `${API_URL}/laboratory/${orderId}/results`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          result_value: resultValue,
          unit: unit || null,
          reference_range: referenceRange || null,
          abnormal_flag: abnormalFlag || null,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to add lab result");
    }

    alert("Lab result added successfully!");
    setRefreshLaboratory((prev) => prev + 1);
  } catch (error: any) {
    alert(error.message || "Unable to add result");
  }
}


async function verifyLabResult(resultId: string) {
  const verifiedBy = prompt("Enter your staff UUID to verify this result:");

  if (!verifiedBy) return;

  try {
    const token = localStorage.getItem("medicore_token");

    const response = await fetch(
      `${API_URL}/laboratory/results/${resultId}/verify`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          verified_by: verifiedBy,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to verify result");
    }

    alert("Lab result verified successfully!");
    setRefreshLaboratory((prev) => prev + 1);
  } catch (error: any) {
    alert(error.message || "Unable to verify result");
  }
}


async function createLabOrder() {
  const encounterId = prompt("Enter Encounter UUID:");
  if (!encounterId) return;

  const patientId = prompt("Enter Patient UUID:");
  if (!patientId) return;

  const orderedBy = prompt("Enter Ordering Staff UUID:");
  if (!orderedBy) return;

  const testName = prompt("Enter Test Name:");
  if (!testName) return;

  const testCode = prompt("Enter Test Code (optional):") || "";
  const priority = prompt("Priority (routine/urgent/stat):") || "routine";
  const notes = prompt("Notes (optional):") || "";

  try {
    const token = localStorage.getItem("medicore_token");

    const response = await fetch(`${API_URL}/laboratory`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        encounter_id: encounterId,
        patient_id: patientId,
        ordered_by: orderedBy,
        test_name: testName,
        test_code: testCode || null,
        priority,
        notes: notes || null,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to create lab order");
    }

    alert("Laboratory order created successfully!");
    setShowLabOrderForm(false);
    setRefreshLaboratory((prev) => prev + 1);
  } catch (error: any) {
    alert(error.message || "Unable to create laboratory order");
  }
}

      // Refresh patients table
      setRefreshPatients((previous) => previous + 1);
    } catch (error: any) {
      setPatientMessage(
        error.message || "Something went wrong",
      );
      setPatientMessageType("error");
    } finally {
      setSavingPatient(false);
    }
  }

  // Book appointment
  async function handleBookAppointment(e: React.FormEvent) {
    e.preventDefault();

    setSavingAppointment(true);
    setAppointmentMessage("");

    try {
      const startDateTime = new Date(
        `${appointmentForm.scheduled_date}T${appointmentForm.scheduled_start}`,
      );

      const endDateTime = new Date(
        `${appointmentForm.scheduled_date}T${appointmentForm.scheduled_end}`,
      );

      if (endDateTime <= startDateTime) {
        throw new Error(
          "End time must be after start time",
        );
      }

      const payload = {
        patient_id: appointmentForm.patient_id,
        provider_id: appointmentForm.provider_id,
        scheduled_start: startDateTime.toISOString(),
        scheduled_end: endDateTime.toISOString(),
        appointment_type: appointmentForm.appointment_type,
        reason: appointmentForm.reason || null,
        notes: appointmentForm.notes || null,
      };

      const token = localStorage.getItem("medicore_token");

      const response = await fetch(`${API_URL}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        const validationErrors = result.errors
          ?.map((error: any) => error.message)
          .join(", ");

        throw new Error(
          validationErrors ||
            result.message ||
            "Failed to book appointment",
        );
      }

      setAppointmentMessage(
        "Appointment booked successfully!",
      );
      setAppointmentMessageType("success");

      setAppointmentForm({
        patient_id: "",
        provider_id: "",
        scheduled_date: "",
        scheduled_start: "",
        scheduled_end: "",
        appointment_type: "consultation",
        reason: "",
        notes: "",
      });

      setShowAppointmentForm(false);
      setRefreshAppointments((previous) => previous + 1);
    } catch (error: any) {
      setAppointmentMessage(
        error.message || "Unable to book appointment",
      );
      setAppointmentMessageType("error");
    } finally {
      setSavingAppointment(false);
    }
  }

  // Update appointment status
  async function handleAppointmentStatus(
    id: string,
    status: string,
  ) {
    try {
      const token = localStorage.getItem("medicore_token");

      const response = await fetch(
        `${API_URL}/appointments/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to update status",
        );
      }

      setAppointmentMessage(
        "Appointment status updated successfully!",
      );
      setAppointmentMessageType("success");

      setRefreshAppointments((previous) => previous + 1);
    } catch (error: any) {
      setAppointmentMessage(
        error.message || "Failed to update appointment",
      );
      setAppointmentMessageType("error");
    }
  }

  const filteredAppointments = appointments.filter((appointment) =>
    `${appointment.patient} ${appointment.doctor} ${appointment.id}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  // Create encounter
async function handleCreateEncounter(e: React.FormEvent) {
  e.preventDefault();

  setSavingEncounter(true);
  setEncounterMessage("");

  try {
    const token = localStorage.getItem("medicore_token");

    const payload = {
      patient_id: encounterForm.patient_id,
      provider_id: encounterForm.provider_id,
      appointment_id: encounterForm.appointment_id || null,
      department_id: encounterForm.department_id || null,
      encounter_type: encounterForm.encounter_type,
      chief_complaint: encounterForm.chief_complaint || null,
      clinical_notes: encounterForm.clinical_notes || null,
      diagnosis_summary: encounterForm.diagnosis_summary || null,
    };

    const response = await fetch(`${API_URL}/encounters`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Failed to create encounter",
      );
    }

    setEncounterMessage("Encounter created successfully!");
    setEncounterMessageType("success");

    setEncounterForm({
      patient_id: "",
      appointment_id: "",
      provider_id: "",
      department_id: "",
      encounter_type: "outpatient",
      chief_complaint: "",
      clinical_notes: "",
      diagnosis_summary: "",
    });

    setShowEncounterForm(false);
    setRefreshEncounters((previous) => previous + 1);
  } catch (error: any) {
    setEncounterMessage(
      error.message || "Unable to create encounter",
    );
    setEncounterMessageType("error");
  } finally {
    setSavingEncounter(false);
  }
}
// Create prescription
async function handleCreatePrescription(e: React.FormEvent) {
  e.preventDefault();

  setSavingPrescription(true);
  setPrescriptionMessage("");

  try {
    const token = localStorage.getItem("medicore_token");

    const payload = {
      encounter_id: prescriptionForm.encounter_id,
      patient_id: prescriptionForm.patient_id,
      prescriber_id: prescriptionForm.prescriber_id,
      instructions: prescriptionForm.instructions || null,

      items: prescriptionForm.items.map((item) => ({
        medication_name: item.medication_name,
        dosage: item.dosage,
        route: item.route || null,
        frequency: item.frequency,
        duration: item.duration || null,
        quantity: item.quantity
          ? Number(item.quantity)
          : null,
        refills: Number(item.refills || 0),
        instructions: item.instructions || null,
      })),
    };

    const response = await fetch(`${API_URL}/prescriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      const validationErrors = result.errors
        ? JSON.stringify(result.errors)
        : "";

      throw new Error(
        validationErrors ||
          result.message ||
          "Failed to create prescription",
      );
    }

    setPrescriptionMessage(
      "Prescription created successfully!",
    );
    setPrescriptionMessageType("success");

    setPrescriptionForm({
      encounter_id: "",
      patient_id: "",
      prescriber_id: "",
      instructions: "",
      items: [{ ...emptyPrescriptionItem }],
    });

    setShowPrescriptionForm(false);

    setRefreshPrescriptions((prev) => prev + 1);
  } catch (error: any) {
    setPrescriptionMessage(
      error.message || "Failed to create prescription",
    );
    setPrescriptionMessageType("error");
  } finally {
    setSavingPrescription(false);
  }
}


async function createLabOrder() {
  const encounterId = prompt("Enter Encounter UUID:");
  if (!encounterId) return;

  const patientId = prompt("Enter Patient UUID:");
  if (!patientId) return;

  const orderedBy = prompt("Enter Ordering Staff UUID:");
  if (!orderedBy) return;

  const testName = prompt("Enter Test Name:");
  if (!testName) return;

  const testCode = prompt("Enter Test Code (optional):") || "";
  const priorityInput = prompt(
    "Priority: routine / urgent / stat",
    "routine"
  );

  const priority = (priorityInput || "routine").toLowerCase();

  if (!["routine", "urgent", "stat"].includes(priority)) {
    alert("Invalid priority. Use routine, urgent, or stat.");
    return;
  }

  const notes = prompt("Enter notes (optional):") || "";

  try {
    const token = localStorage.getItem("medicore_token");

    const response = await fetch(`${API_URL}/laboratory`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        encounter_id: encounterId,
        patient_id: patientId,
        ordered_by: orderedBy,
        test_name: testName,
        test_code: testCode || null,
        priority,
        notes: notes || null,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to create laboratory order");
    }

    alert("Laboratory order created successfully!");

    setRefreshLaboratory((prev) => prev + 1);
  } catch (error: any) {
    alert(error.message || "Unable to create laboratory order");
  }
}
// Add medicine item
function handleAddMedicine() {
  setPrescriptionForm((previous) => ({
    ...previous,
    items: [
      ...previous.items,
      { ...emptyPrescriptionItem },
    ],
  }));

}

// Remove medicine item
function handleRemoveMedicine(index: number) {
  setPrescriptionForm((prev) => ({
    ...prev,
    items: prev.items.filter((_, i) => i !== index),
  }));
}

// Update medicine item
function handleMedicineChange(
  index: number,
  field: string,
  value: string,
) {
  setPrescriptionForm((prev) => ({
    ...prev,
    items: prev.items.map((item, i) =>
      i === index
        ? { ...item, [field]: value }
        : item,
    ),
  }));
}

async function handlePrescriptionStatus(
  prescriptionId: string,
  status: string,
) {
  try {
    const token = localStorage.getItem("medicore_token");

    const response = await fetch(
      `${API_URL}/prescriptions/${prescriptionId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Failed to update prescription status",
      );
    }

    setPrescriptionMessage(
      "Prescription status updated successfully!",
    );
    setPrescriptionMessageType("success");

    setRefreshPrescriptions((prev) => prev + 1);
  } catch (error: any) {
    setPrescriptionMessage(
      error.message || "Failed to update status",
    );
    setPrescriptionMessageType("error");
  }
}
// Update encounter status
async function handleEncounterStatus(
  encounterId: string,
  status: string,
) {
  try {
    const token = localStorage.getItem("medicore_token");

    const response = await fetch(
      `${API_URL}/encounters/${encounterId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Failed to update encounter status",
      );
    }

    setEncounterMessage("Encounter status updated successfully!");
    setEncounterMessageType("success");

    setRefreshEncounters((previous) => previous + 1);
  } catch (error: any) {
    setEncounterMessage(
      error.message || "Unable to update encounter status",
    );
    setEncounterMessageType("error");
    setRefreshEncounters((previous) => previous + 1);
  }
}

  
  // Loading screen
  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-slate-500">Loading MediCore...</p>
        </div>
      </div>
    );
  }

  const role = user?.role || "administrator";

  const displayRole =
    role === "administrator"
      ? "Admin"
      : role.charAt(0).toUpperCase() +
        role.slice(1).replaceAll("_", " ");

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-800">
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
          <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl text-white">
              ✚
            </div>

            <div>
              <h1 className="text-lg font-bold text-slate-900">
                MediCore
              </h1>

              <p className="text-xs text-slate-500">
                Hospital Management
              </p>
            </div>
          </div>

          <div className="px-4 py-6">
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Main Menu
            </p>

            <nav className="space-y-1">
              {navigation.map((item) => {
                const isActive = activePage === item.name;

                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      setActivePage(item.name);
                      setPatientMessage("");
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span className="flex w-6 justify-center text-lg">
                      {item.icon}
                    </span>

                    {item.name}

                    {isActive && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-blue-600" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto border-t border-slate-100 p-4">
            <div className="rounded-xl bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-900">
                MediCore Hospital
              </p>

              <p className="mt-1 text-xs text-blue-700">
                Healthcare Management System
              </p>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">

          {/* Header */}
          <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {activePage}
              </h2>

              <p className="hidden text-sm text-slate-500 sm:block">
                Hospital Management System
              </p>
            </div>

            <div className="flex items-center gap-3">

              {/* Search */}
              <div className="hidden md:block">
                <input
                  type="text"
                  placeholder={
                    activePage === "Patients"
                      ? "Search patients..."
                      : "Search appointments..."
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-64 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Notifications */}
              <button className="relative rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50">
                🔔

                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
              </button>

              {/* User */}
              <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                  {user?.email?.charAt(0)?.toUpperCase() || "A"}
                </div>

                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-slate-800">
                    {user?.email || "Admin User"}
                  </p>

                  <p className="text-xs capitalize text-slate-500">
                    {user?.role || "Administrator"}
                  </p>
                </div>

                {/* Logout */}
<button
  onClick={handleLogout}
  className="ml-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
>
  Logout
</button>
</div>
</div>
</header>

{/* Content */}
<div className="flex-1 p-5 sm:p-8">

  {/* Dashboard */}
  {activePage === "Dashboard" && (
    <>
      {/* Dashboard Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Good morning, {displayRole}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Here's what's happening at your hospital today.
          </p>
        </div>

        <button
          onClick={() => setActivePage("Appointments")}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          + New Appointment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  {stat.label}
                </p>

                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {stat.value}
                </h3>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                {stat.icon}
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      {/* Dashboard Grid */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* Today's Appointments */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div>
              <h4 className="font-bold text-slate-900">
                Today's Appointments
              </h4>

              <p className="mt-1 text-sm text-slate-500">
                Upcoming patient visits
              </p>
            </div>

            <button
              onClick={() => setActivePage("Appointments")}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View All →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr className="text-xs text-slate-500">
                  <th className="px-5 py-4 font-medium">
                    Patient
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Doctor
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Time
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredAppointments.map((appointment) => (
                  <tr
                    key={appointment.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">
                        {appointment.patient}
                      </div>

                      <div className="text-xs text-slate-400">
                        {appointment.id}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {appointment.doctor}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {appointment.time}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          appointment.status === "Completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : appointment.status === "Cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 className="font-bold text-slate-900">
            Quick Actions
          </h4>

          <p className="mt-1 text-sm text-slate-500">
            Common hospital tasks
          </p>

          <div className="mt-5 space-y-3">
            <button
              onClick={() => {
                setActivePage("Patients");
                setPatientMessage("");
                setShowPatientForm(true);
              }}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:bg-slate-50"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-xl">
                ♙
              </span>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Register Patient
                </p>

                <p className="text-xs text-slate-500">
                  Add a new patient
                </p>
              </div>
            </button>

            <button
              onClick={() => setActivePage("Appointments")}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:bg-slate-50"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-xl">
                📅
              </span>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Book Appointment
                </p>

                <p className="text-xs text-slate-500">
                  Schedule a patient visit
                </p>
              </div>
            </button>

            <button
              onClick={() => setActivePage("Encounters")}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:bg-slate-50"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-xl">
                🩺
              </span>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Create Encounter
                </p>

                <p className="text-xs text-slate-500">
                  Start a patient consultation
                </p>
              </div>
            </button>

            <button
              onClick={() => setActivePage("Laboratory")}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:bg-slate-50"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-xl">
                🧪
              </span>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Lab Orders
                </p>

                <p className="text-xs text-slate-500">
                  Manage laboratory tests
                </p>
              </div>
            </button>
          </div>
        </section>

{/* Hospital Overview */}
<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-3">
  <h4 className="font-bold text-slate-900">
    Hospital Overview
  </h4>

  <p className="mt-1 text-sm text-slate-500">
    Hospital operational summary
  </p>

  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-sm text-slate-500">Available Beds</p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        68 / 100
      </p>

      <p className="mt-1 text-xs text-emerald-600">
        68% occupancy capacity available
      </p>
    </div>

    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-sm text-slate-500">Doctors On Duty</p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        12
      </p>

      <p className="mt-1 text-xs text-blue-600">
        Currently available
      </p>
    </div>

    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-sm text-slate-500">Departments</p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        8
      </p>

      <p className="mt-1 text-xs text-slate-500">
        Active departments
      </p>
    </div>
  </div>
</section>

{/* Pending Tasks */}
<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
  <h4 className="font-bold text-slate-900">
    Pending Tasks
  </h4>

  <div className="mt-5 space-y-3">
    <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-3">
      <span className="text-xl">⚠️</span>

      <div>
        <p className="text-sm font-semibold text-amber-900">
          6 Lab Results Pending
        </p>

        <p className="text-xs text-amber-700">
          Awaiting review
        </p>
      </div>
    </div>

    <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-3">
      <span className="text-xl">📋</span>

      <div>
        <p className="text-sm font-semibold text-blue-900">
          4 Bills Awaiting Payment
        </p>

        <p className="text-xs text-blue-700">
          Billing department
        </p>
      </div>
    </div>

    <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-3">
      <span className="text-xl">✓</span>

      <div>
        <p className="text-sm font-semibold text-emerald-900">
          System Status Healthy
        </p>

        <p className="text-xs text-emerald-700">
          All services operational
        </p>
      </div>
    </div>
  </div>
</section>

</div>
</>
)}

  {/* Patients */}
  {activePage === "Patients" && (
    <div className="space-y-6">

      {/* Patient heading */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">
            Patient Management
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Manage registered hospital patients
          </p>
        </div>

        <button
          onClick={() => {
            setPatientMessage("");
            setShowPatientForm(true);
          }}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Register Patient
        </button>
      </div>

      {/* Message */}
      {patientMessage && !showPatientForm && (
        <div
          className={`rounded-xl p-4 text-sm ${
            patientMessageType === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {patientMessage}
        </div>
      )}

      {/* Loading */}
      {patientsLoading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

          <p className="mt-3 text-sm text-slate-500">
            Loading patients...
          </p>
        </div>
      )}

      {/* Error */}
      {!patientsLoading && patientsError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="font-semibold text-red-700">
            Failed to load patients
          </p>

          <p className="mt-1 text-sm text-red-600">
            {patientsError}
          </p>

          <button
            onClick={() =>
              setRefreshPatients((previous) => previous + 1)
            }
            className="mt-3 rounded-lg bg-red-600 px-3 py-2 text-sm text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Patient list */}
      {!patientsLoading && !patientsError && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h4 className="font-bold text-slate-900">
              Registered Patients
            </h4>

            <p className="mt-1 text-sm text-slate-500">
              {patients.length} patient(s) found
            </p>
          </div>

          {patients.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl">♙</div>

              <h4 className="mt-3 font-semibold text-slate-800">
                No patients found
              </h4>

              <p className="mt-1 text-sm text-slate-500">
                Register your first patient to get started.
              </p>

              <button
                onClick={() => {
                  setPatientMessage("");
                  setShowPatientForm(true);
                }}
                className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                + Register Patient
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-xs text-slate-500">
                    <th className="px-5 py-4 font-medium">
                      Patient
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Patient ID
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Date of Birth
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Gender
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Phone
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Blood Group
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {patients.map((patient) => (
                    <tr
                      key={patient.id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800">
                          {patient.first_name} {patient.last_name}
                        </div>

                        <div className="text-xs text-slate-400">
                          {patient.email || "No email"}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                          {patient.patient_number || "N/A"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {patient.date_of_birth
                          ? new Date(
                              patient.date_of_birth,
                            ).toLocaleDateString()
                          : "N/A"}
                      </td>

                      <td className="px-5 py-4 capitalize text-slate-600">
                        {patient.gender || "N/A"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {patient.phone || "N/A"}
                      </td>

                      <td className="px-5 py-4">
                        {patient.blood_group ? (
                          <span className="rounded-lg bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                            {patient.blood_group}
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Register Patient Modal */}
      {showPatientForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Register New Patient
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Enter patient details below
                </p>
              </div>

              <button
                onClick={() => {
                  setShowPatientForm(false);
                  setPatientForm(emptyPatientForm);
                  setPatientMessage("");
                }}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleAddPatient}
              className="space-y-5 p-5"
            >

              {/* Basic info */}
              <div>
                <h4 className="mb-3 font-semibold text-slate-800">
                  Basic Information
                </h4>

                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    required
                    placeholder="First name *"
                    value={patientForm.first_name}
                    onChange={(e) =>
                      setPatientForm({
                        ...patientForm,
                        first_name: e.target.value,
                      })
                    }
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />

                  <input
                    required
                    placeholder="Last name *"
                    value={patientForm.last_name}
                    onChange={(e) =>
                      setPatientForm({
                        ...patientForm,
                        last_name: e.target.value,
                      })
                    }
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />

                  <input
                    required
                    type="date"
                    max={new Date().toISOString().split("T")[0]}
                    value={patientForm.date_of_birth}
                    onChange={(e) =>
                      setPatientForm({
                        ...patientForm,
                        date_of_birth: e.target.value,
                      })
                    }
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />

                  <select
                    value={patientForm.gender}
                    onChange={(e) =>
                      setPatientForm({
                        ...patientForm,
                        gender: e.target.value,
                      })
                    }
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">
                      Prefer not to say
                    </option>
                  </select>

                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={patientForm.phone}
                    onChange={(e) =>
                      setPatientForm({
                        ...patientForm,
                        phone: e.target.value,
                      })
                    }
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />

                  <input
                    type="email"
                    placeholder="Email address"
                    value={patientForm.email}
                    onChange={(e) =>
                      setPatientForm({
                        ...patientForm,
                        email: e.target.value,
                      })
                    }
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />

                  <select
                    value={patientForm.blood_group}
                    onChange={(e) =>
                      setPatientForm({
                        ...patientForm,
                        blood_group: e.target.value,
                      })
                    }
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">Blood Group</option>

                    {[
                      "A+",
                      "A-",
                      "B+",
                      "B-",
                      "AB+",
                      "AB-",
                      "O+",
                      "O-",
                    ].map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                </div>

                <textarea
                  placeholder="Address"
                  rows={2}
                  value={patientForm.address}
                  onChange={(e) =>
                    setPatientForm({
                      ...patientForm,
                      address: e.target.value,
                    })
                  }
                  className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* Emergency contact */}
              <div>
                <h4 className="mb-3 font-semibold text-slate-800">
                  Emergency Contact
                </h4>

                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    placeholder="Contact name"
                    value={patientForm.emergency_contact_name}
                    onChange={(e) =>
                      setPatientForm({
                        ...patientForm,
                        emergency_contact_name: e.target.value,
                      })
                    }
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />

                  <input
                    type="tel"
                    placeholder="Emergency contact phone"
                    value={patientForm.emergency_contact_phone}
                    onChange={(e) =>
                      setPatientForm({
                        ...patientForm,
                        emergency_contact_phone: e.target.value,
                      })
                    }
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Medical information */}
              <div>
                <h4 className="mb-3 font-semibold text-slate-800">
                  Medical Information
                </h4>

                <textarea
                  placeholder="Known allergies"
                  rows={2}
                  value={patientForm.allergies}
                  onChange={(e) =>
                    setPatientForm({
                      ...patientForm,
                      allergies: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />

                <textarea
                  placeholder="Medical notes"
                  rows={3}
                  value={patientForm.medical_notes}
                  onChange={(e) =>
                    setPatientForm({
                      ...patientForm,
                      medical_notes: e.target.value,
                    })
                  }
                  className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* Error */}
              {patientMessage &&
                patientMessageType === "error" && (
                  <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    {patientMessage}
                  </div>
                )}

              {/* Buttons */}
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPatientForm(false);
                    setPatientForm(emptyPatientForm);
                    setPatientMessage("");
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingPatient}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingPatient
                    ? "Registering..."
                    : "Register Patient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )}

  {/* Appointments */}
  {activePage === "Appointments" && (
    <div className="space-y-6">

      {/* Appointment heading */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">
            Appointment Management
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Manage and track hospital appointments
          </p>
        </div>

        <button
          onClick={() => {
            setAppointmentMessage("");
            setShowAppointmentForm(true);
          }}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Book Appointment
        </button>
      </div>

      {/* Message */}
      {appointmentMessage && !showAppointmentForm && (
        <div
          className={`rounded-xl p-4 text-sm ${
            appointmentMessageType === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {appointmentMessage}
        </div>
      )}

      {/* Loading */}
      {appointmentsLoading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

          <p className="mt-3 text-sm text-slate-500">
            Loading appointments...
          </p>
        </div>
      )}

      {/* Error */}
      {!appointmentsLoading && appointmentsError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="font-semibold text-red-700">
            Failed to load appointments
          </p>

          <p className="mt-1 text-sm text-red-600">
            {appointmentsError}
          </p>

          <button
            onClick={() =>
              setRefreshAppointments((previous) => previous + 1)
            }
            className="mt-3 rounded-lg bg-red-600 px-3 py-2 text-sm text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Appointment list */}
      {!appointmentsLoading && !appointmentsError && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h4 className="font-bold text-slate-900">
              Appointments
            </h4>

            <p className="mt-1 text-sm text-slate-500">
              {appointmentsList.length} appointment(s) found
            </p>
          </div>

          {appointmentsList.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl">📅</div>

              <h4 className="mt-3 font-semibold text-slate-800">
                No appointments found
              </h4>

              <p className="mt-1 text-sm text-slate-500">
                Book your first appointment to get started.
              </p>

              <button
  onClick={() => setShowAppointmentForm(true)}
  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
>
  + Book Appointment
</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-xs text-slate-500">
                    <th className="px-5 py-4 font-medium">
                      Patient
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Doctor
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Date
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Time
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Status
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Update Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {appointmentsList.map((appointment: any) => (
                    <tr
                      key={appointment.id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 font-medium text-slate-800">
                        {appointment.patient_name ||
  appointment.patient?.first_name ||
  (patients.find(
    (p: any) => p.id === appointment.patient_id
  )
    ? `${patients.find(
        (p: any) => p.id === appointment.patient_id
      )?.first_name} ${patients.find(
        (p: any) => p.id === appointment.patient_id
      )?.last_name || ""}`
    : appointment.patient_id || "Unknown Patient")}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {appointment.provider_name ||
  appointment.doctor?.first_name ||
  (doctors.find(
    (d: any) => d.id === appointment.provider_id
  )
    ? `${doctors.find(
        (d: any) => d.id === appointment.provider_id
      )?.first_name || doctors.find(
        (d: any) => d.id === appointment.provider_id
      )?.name || "Doctor"} ${
        doctors.find(
          (d: any) => d.id === appointment.provider_id
        )?.last_name || ""
      }`
    : appointment.provider_id || "Unknown Doctor")}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {appointment.scheduled_start
                          ? new Date(
                              appointment.scheduled_start,
                            ).toLocaleDateString()
                          : "N/A"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {appointment.scheduled_start
                          ? new Date(
                              appointment.scheduled_start,
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "N/A"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            appointment.status === "completed"
                              ? "bg-emerald-100 text-emerald-700"
                              : appointment.status === "cancelled"
                                ? "bg-red-100 text-red-700"
                                : appointment.status === "checked_in"
                                  ? "bg-blue-100 text-blue-700"
                                  : appointment.status === "no_show"
                                    ? "bg-slate-100 text-slate-700"
                                    : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {appointment.status?.replaceAll("_", " ") ||
                            "scheduled"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <select
                          value={appointment.status || "scheduled"}
                          onChange={(e) =>
                            handleAppointmentStatus(
                              appointment.id,
                              e.target.value,
                            )
                          }
                          className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-blue-500"
                        >
                          <option value="scheduled">
                            Scheduled
                          </option>

                          <option value="confirmed">
                            Confirmed
                          </option>

                          <option value="checked_in">
                            Checked In
                          </option>

                          <option value="completed">
                            Completed
                          </option>

                          <option value="cancelled">
                            Cancelled
                          </option>

                          <option value="no_show">
                            No Show
                          </option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
      {/* Book Appointment Modal */}
{showAppointmentForm && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

      {/* Modal Header */}
      <div className="flex items-center justify-between border-b border-slate-200 p-5">
        <div>
          <h3 className="text-xl font-bold text-slate-900">
            Book Appointment
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Schedule a new patient appointment
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowAppointmentForm(false);
            setAppointmentMessage("");
          }}
          className="rounded-lg px-3 py-2 text-xl text-slate-500 hover:bg-slate-100"
        >
          ✕
        </button>
      </div>

      {/* Form */}
      <form
        onSubmit={handleBookAppointment}
        className="space-y-5 p-5"
      >

        {/* Patient */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Patient *
          </label>

          <select
            required
            value={appointmentForm.patient_id}
            onChange={(e) =>
              setAppointmentForm((previous) => ({
                ...previous,
                patient_id: e.target.value,
              }))
            }
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="">Select patient</option>

            {patients.map((patient: any) => (
              <option key={patient.id} value={patient.id}>
                {patient.first_name} {patient.last_name}
                {patient.patient_number
                  ? ` (${patient.patient_number})`
                  : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Doctor */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Doctor *
          </label>

         <select
  required
  value={prescriptionForm.prescriber_id}
  onChange={(e) =>
    setPrescriptionForm((previous) => ({
      ...previous,
      prescriber_id: e.target.value,
    }))
  }
  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
>
  <option value="">Select doctor</option>

  {doctors.map((doctor: any) => (
    <option key={doctor.id} value={doctor.id}>
      {doctor.first_name || doctor.name || ""}
      {doctor.last_name
        ? ` ${doctor.last_name}`
        : ""}
    </option>
  ))}
</select>
        </div>

        {/* Appointment Type */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Appointment Type *
          </label>

          <select
            required
            value={appointmentForm.appointment_type}
            onChange={(e) =>
              setAppointmentForm((previous) => ({
                ...previous,
                appointment_type: e.target.value,
              }))
            }
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="consultation">Consultation</option>
            <option value="follow_up">Follow Up</option>
            <option value="routine_checkup">Routine Checkup</option>
            <option value="emergency">Emergency</option>
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Appointment Date *
          </label>

          <input
            type="date"
            required
            value={appointmentForm.scheduled_date}
            onChange={(e) =>
              setAppointmentForm((previous) => ({
                ...previous,
                scheduled_date: e.target.value,
              }))
            }
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
        </div>

        {/* Time */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Start Time *
            </label>

            <input
              type="time"
              required
              value={appointmentForm.scheduled_start}
              onChange={(e) =>
                setAppointmentForm((previous) => ({
                  ...previous,
                  scheduled_start: e.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              End Time *
            </label>

            <input
              type="time"
              required
              value={appointmentForm.scheduled_end}
              onChange={(e) =>
                setAppointmentForm((previous) => ({
                  ...previous,
                  scheduled_end: e.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Reason for Appointment
          </label>

          <input
            type="text"
            value={appointmentForm.reason}
            onChange={(e) =>
              setAppointmentForm((previous) => ({
                ...previous,
                reason: e.target.value,
              }))
            }
            placeholder="Enter reason for appointment"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Notes
          </label>

          <textarea
            rows={3}
            value={appointmentForm.notes}
            onChange={(e) =>
              setAppointmentForm((previous) => ({
                ...previous,
                notes: e.target.value,
              }))
            }
            placeholder="Additional notes..."
            className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
        </div>

        {/* Error message */}
        {appointmentMessage &&
          appointmentMessageType === "error" && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {appointmentMessage}
            </div>
          )}

        {/* Buttons */}
        <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
          <button
            type="button"
            onClick={() => {
              setShowAppointmentForm(false);
              setAppointmentMessage("");
            }}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={savingAppointment}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingAppointment
              ? "Booking..."
              : "Book Appointment"}
          </button>
        </div>

      </form>
    </div>
  </div>
)}
    </div>
  )}

  {/* Encounters */}
{activePage === "Encounters" && (
  <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h3 className="text-2xl font-bold text-slate-900">
          Encounter Management
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Manage patient clinical encounters and records
        </p>
      </div>

      <button
        onClick={() => {
          setEncounterMessage("");
          setShowEncounterForm(true);
        }}
        className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
      >
        + Create Encounter
      </button>
    </div>

    {/* Message */}
    {encounterMessage && !showEncounterForm && (
      <div
        className={`rounded-xl p-4 text-sm ${
          encounterMessageType === "success"
            ? "bg-emerald-50 text-emerald-700"
            : "bg-red-50 text-red-700"
        }`}
      >
        {encounterMessage}
      </div>
    )}

    {/* Loading */}
    {encountersLoading && (
      <div className="rounded-2xl border bg-white p-10 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        <p className="mt-3 text-sm text-slate-500">
          Loading encounters...
        </p>
      </div>
    )}

    {/* Error */}
    {!encountersLoading && encountersError && (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <p className="font-semibold text-red-700">
          Failed to load encounters
        </p>

        <p className="mt-1 text-sm text-red-600">
          {encountersError}
        </p>

        <button
          onClick={() =>
            setRefreshEncounters((previous) => previous + 1)
          }
          className="mt-3 rounded-lg bg-red-600 px-3 py-2 text-sm text-white"
        >
          Retry
        </button>
      </div>
    )}

    {/* Encounter list */}
    {!encountersLoading && !encountersError && (
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h4 className="font-bold text-slate-900">
            Encounters
          </h4>

          <p className="mt-1 text-sm text-slate-500">
            {encountersList.length} encounter(s) found
          </p>
        </div>

        {encountersList.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl">🩺</div>

            <h4 className="mt-3 font-semibold text-slate-800">
              No encounters found
            </h4>

            <p className="mt-1 text-sm text-slate-500">
              Create your first patient encounter.
            </p>

            <button
              onClick={() => setShowEncounterForm(true)}
              className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              + Create Encounter
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr className="text-xs text-slate-500">
                  <th className="px-5 py-4">Encounter Number</th>
                  <th className="px-5 py-4">Patient</th>
                  <th className="px-5 py-4">Doctor</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Update Status</th>
                </tr>
              </thead>

              <tbody>
                {encountersList.map((encounter: any) => (
                  <tr
                    key={encounter.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {encounter.encounter_number || encounter.id}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {encounter.patient_id}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {encounter.provider_id}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {encounter.encounter_type || "Outpatient"}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {encounter.started_at
                        ? new Date(
                            encounter.started_at,
                          ).toLocaleDateString()
                        : "N/A"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          encounter.status === "completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : encounter.status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {encounter.status?.replaceAll("_", " ") ||
                          "in progress"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <select
                        value={encounter.status || "in_progress"}
                        onChange={(e) =>
                          handleEncounterStatus(
                            encounter.id,
                            e.target.value,
                          )
                        }
                        className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-blue-500"
                      >
                        <option value="in_progress">
                          In Progress
                        </option>

                        <option value="completed">
                          Completed
                        </option>

                        <option value="cancelled">
                          Cancelled
                        </option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    )}
    {/* Create Encounter Modal */}
{showEncounterForm && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
      <div className="flex items-center justify-between border-b p-5">
        <div>
          <h3 className="text-xl font-bold text-slate-900">
            Create Encounter
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Add a new clinical encounter
          </p>
        </div>

        <button
          onClick={() => {
            setShowEncounterForm(false);
            setEncounterMessage("");
          }}
          className="rounded-lg px-3 py-2 text-xl text-slate-500 hover:bg-slate-100"
        >
          ×
        </button>
      </div>

      <form
        onSubmit={handleCreateEncounter}
        className="space-y-5 p-5"
      >
        {/* Patient */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Patient *
          </label>

          <select
            required
            value={encounterForm.patient_id}
            onChange={(e) =>
              setEncounterForm({
                ...encounterForm,
                patient_id: e.target.value,
                appointment_id: "",
              })
            }
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500"
          >
            <option value="">Select patient</option>

            {patients.map((patient: any) => (
              <option key={patient.id} value={patient.id}>
                {patient.first_name} {patient.last_name}
                {patient.patient_number
                  ? ` (${patient.patient_number})`
                  : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Doctor */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Doctor *
          </label>

          <select
            required
            value={encounterForm.provider_id}
            onChange={(e) =>
              setEncounterForm({
                ...encounterForm,
                provider_id: e.target.value,
              })
            }
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500"
          >
            <option value="">Select doctor</option>

            {doctors.map((doctor: any) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.first_name} {doctor.last_name}
              </option>
            ))}
          </select>
        </div>

        {/* Appointment */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Related Appointment (Optional)
          </label>

          <select
            value={encounterForm.appointment_id}
            onChange={(e) =>
              setEncounterForm({
                ...encounterForm,
                appointment_id: e.target.value,
              })
            }
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500"
          >
            <option value="">No appointment linked</option>

            {appointmentsList
              .filter(
                (appointment: any) =>
                  !encounterForm.patient_id ||
                  appointment.patient_id ===
                    encounterForm.patient_id,
              )
              .filter(
                (appointment: any) =>
                  !["cancelled", "no_show"].includes(
                    appointment.status,
                  ),
              )
              .map((appointment: any) => (
                <option
                  key={appointment.id}
                  value={appointment.id}
                >
                  {appointment.id} —{" "}
                  {appointment.scheduled_start
                    ? new Date(
                        appointment.scheduled_start,
                      ).toLocaleString()
                    : "Appointment"}
                </option>
              ))}
          </select>
        </div>

        {/* Encounter Type */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Encounter Type *
          </label>

          <select
            required
            value={encounterForm.encounter_type}
            onChange={(e) =>
              setEncounterForm({
                ...encounterForm,
                encounter_type: e.target.value,
              })
            }
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500"
          >
            <option value="outpatient">Outpatient</option>
            <option value="inpatient">Inpatient</option>
            <option value="emergency">Emergency</option>
            <option value="follow_up">Follow Up</option>
            <option value="consultation">Consultation</option>
          </select>
        </div>

        {/* Department ID */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Department ID (Optional)
          </label>

          <input
            value={encounterForm.department_id}
            onChange={(e) =>
              setEncounterForm({
                ...encounterForm,
                department_id: e.target.value,
              })
            }
            placeholder="Enter department UUID"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500"
          />
        </div>

        {/* Chief Complaint */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Chief Complaint
          </label>

          <textarea
            rows={3}
            value={encounterForm.chief_complaint}
            onChange={(e) =>
              setEncounterForm({
                ...encounterForm,
                chief_complaint: e.target.value,
              })
            }
            placeholder="What is the patient complaining about?"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500"
          />
        </div>

        {/* Clinical Notes */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Clinical Notes
          </label>

          <textarea
            rows={4}
            value={encounterForm.clinical_notes}
            onChange={(e) =>
              setEncounterForm({
                ...encounterForm,
                clinical_notes: e.target.value,
              })
            }
            placeholder="Enter clinical notes..."
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500"
          />
        </div>

        {/* Diagnosis */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Diagnosis Summary
          </label>

          <textarea
            rows={3}
            value={encounterForm.diagnosis_summary}
            onChange={(e) =>
              setEncounterForm({
                ...encounterForm,
                diagnosis_summary: e.target.value,
              })
            }
            placeholder="Enter diagnosis..."
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500"
          />
        </div>

        {/* Error */}
        {encounterMessage && showEncounterForm && (
          <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {encounterMessage}
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-3 border-t pt-4">
          <button
            type="button"
            onClick={() => {
              setShowEncounterForm(false);
              setEncounterMessage("");
            }}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={savingEncounter}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingEncounter
              ? "Creating..."
              : "Create Encounter"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
  </div>
)}
{/* Prescriptions Module */}
{activePage === "Prescriptions" && (
  <section className="space-y-6">

    {/* Header */}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Prescription Management
        </h2>

        <p className="mt-1 text-slate-500">
          Manage patient medications and prescriptions
        </p>
      </div>

      <button
        onClick={() => {
          setPrescriptionMessage("");
          setShowPrescriptionForm(true);
        }}
        className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
      >
        + Create Prescription
      </button>
    </div>

    {/* Message */}
    {prescriptionMessage && (
      <div
        className={`rounded-xl p-4 ${
          prescriptionMessageType === "success"
            ? "bg-green-50 text-green-700"
            : "bg-red-50 text-red-700"
        }`}
      >
        {prescriptionMessage}
      </div>
    )}

    {/* Loading */}
    {prescriptionsLoading && (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        Loading prescriptions...
      </div>
    )}

    {/* Error */}
    {prescriptionsError && (
      <div className="rounded-xl bg-red-50 p-5 text-red-700">
        <p>{prescriptionsError}</p>

        <button
          onClick={() =>
            setRefreshPrescriptions((prev) => prev + 1)
          }
          className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-white"
        >
          Retry
        </button>
      </div>
    )}

    {/* Prescriptions Table */}
    {!prescriptionsLoading && !prescriptionsError && (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-100 p-6">
          <h3 className="text-lg font-semibold text-slate-900">
            Prescriptions
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {prescriptionsList.length} prescription(s) found
          </p>
        </div>

        {prescriptionsList.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500">
              No prescriptions found.
            </p>

            <button
              onClick={() => setShowPrescriptionForm(true)}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white"
            >
              Create First Prescription
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-sm text-slate-500">
                <tr>
                  <th className="px-5 py-4">Prescription</th>
                  <th className="px-5 py-4">Patient</th>
                  <th className="px-5 py-4">Prescriber</th>
                  <th className="px-5 py-4">Medicines</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Update Status</th>
                </tr>
              </thead>

              <tbody>
                {prescriptionsList.map((prescription: any) => (
                  <tr
                    key={prescription.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">
                        {prescription.prescription_number ||
                          prescription.id}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      {prescription.patient_name ||
                        prescription.patient_id}
                    </td>

                    <td className="px-5 py-4">
                      {prescription.prescriber_name ||
                        prescription.prescriber_id}
                    </td>

                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        {(prescription.items || []).map(
                          (item: any, index: number) => (
                            <div key={item.id || index}>
                              <span className="font-medium">
                                {item.medication_name}
                              </span>

                              <span className="text-sm text-slate-500">
                                {" "}({item.dosage})
                              </span>
                            </div>
                          ),
                        )}

                        {(!prescription.items ||
                          prescription.items.length === 0) && (
                          <span className="text-slate-400">
                            No items
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {prescription.prescribed_at
                        ? new Date(
                            prescription.prescribed_at,
                          ).toLocaleDateString()
                        : "—"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          prescription.status === "active"
                            ? "bg-blue-100 text-blue-700"
                            : prescription.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {prescription.status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <select
                        value={prescription.status || "active"}
                        onChange={(e) =>
                          handlePrescriptionStatus(
                            prescription.id,
                            e.target.value,
                          )
                        }
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      >
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )}
    {/* Create Prescription Modal */}

{showPrescriptionForm && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-xl">

      {/* Modal Header */}
      <div className="flex items-center justify-between border-b p-5">
        <div>
          <h3 className="text-xl font-bold text-slate-900">
            Create Prescription
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Prescribe medicines for a patient
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowPrescriptionForm(false);
            setPrescriptionMessage("");
          }}
          className="rounded-lg px-3 py-2 text-xl text-slate-500 hover:bg-slate-100"
        >
          ×
        </button>
      </div>

      {/* Form */}
      <form
        onSubmit={handleCreatePrescription}
        className="space-y-5 p-5"
      >

        {/* Encounter */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Encounter *
          </label>

          <select
            required
            value={prescriptionForm.encounter_id}
            onChange={(e) => {
              const selectedEncounter = encountersList.find(
                (encounter: any) =>
                  encounter.id === e.target.value,
              );

              setPrescriptionForm((prev) => ({
                ...prev,
                encounter_id: e.target.value,
                patient_id:
                  selectedEncounter?.patient_id || prev.patient_id,
                prescriber_id:
                  selectedEncounter?.provider_id || prev.prescriber_id,
              }));
            }}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500"
          >
            <option value="">Select encounter</option>

            {encountersList
              .filter(
                (encounter: any) =>
                  encounter.status !== "cancelled",
              )
              .map((encounter: any) => (
                <option
                  key={encounter.id}
                  value={encounter.id}
                >
                  {encounter.encounter_number || encounter.id}
                  {" — "}
                  {encounter.encounter_type || "Encounter"}
                </option>
              ))}
          </select>
        </div>

        {/* Patient */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Patient *
          </label>

          <select
            required
            value={prescriptionForm.patient_id}
            onChange={(e) =>
              setPrescriptionForm((prev) => ({
                ...prev,
                patient_id: e.target.value,
              }))
            }
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500"
          >
            <option value="">Select patient</option>

            {patients.map((patient: any) => (
              <option
                key={patient.id}
                value={patient.id}
              >
                {patient.first_name} {patient.last_name}
                {patient.patient_number
                  ? ` (${patient.patient_number})`
                  : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Prescriber */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Prescriber *
          </label>

          <select
            required
            value={prescriptionForm.prescriber_id}
            onChange={(e) =>
              setPrescriptionForm((prev) => ({
                ...prev,
                prescriber_id: e.target.value,
              }))
            }
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500"
          >
            <option value="">Select doctor</option>

            {doctors.map((doctor: any) => (
              <option
                key={doctor.id}
                value={doctor.id}
              >
                {doctor.first_name} {doctor.last_name}
              </option>
            ))}
          </select>
        </div>

        {/* General instructions */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Prescription Instructions
          </label>

          <textarea
            rows={2}
            value={prescriptionForm.instructions}
            onChange={(e) =>
              setPrescriptionForm((prev) => ({
                ...prev,
                instructions: e.target.value,
              }))
            }
            placeholder="General instructions for the patient..."
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500"
          />
        </div>

        {/* Medicines */}
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h4 className="font-semibold text-slate-900">
              Medicines
            </h4>

            <button
              type="button"
              onClick={handleAddMedicine}
              className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100"
            >
              + Add Medicine
            </button>
          </div>

          {prescriptionForm.items.map(
            (item, index) => (
              <div
                key={index}
                className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h5 className="font-medium text-slate-800">
                    Medicine {index + 1}
                  </h5>

                  {prescriptionForm.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveMedicine(index)
                      }
                      className="text-sm font-medium text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  {/* Medicine Name */}
                  <div>
                    <label className="mb-1 block text-sm text-slate-600">
                      Medicine Name *
                    </label>

                    <input
                      required
                      value={item.medication_name}
                      onChange={(e) =>
                        handleMedicineChange(
                          index,
                          "medication_name",
                          e.target.value,
                        )
                      }
                      placeholder="e.g. Paracetamol"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Dosage */}
                  <div>
                    <label className="mb-1 block text-sm text-slate-600">
                      Dosage *
                    </label>

                    <input
                      required
                      value={item.dosage}
                      onChange={(e) =>
                        handleMedicineChange(
                          index,
                          "dosage",
                          e.target.value,
                        )
                      }
                      placeholder="e.g. 500 mg"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Route */}
                  <div>
                    <label className="mb-1 block text-sm text-slate-600">
                      Route
                    </label>

                    <select
                      value={item.route}
                      onChange={(e) =>
                        handleMedicineChange(
                          index,
                          "route",
                          e.target.value,
                        )
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
                    >
                      <option value="">Select route</option>
                      <option value="oral">Oral</option>
                      <option value="intravenous">Intravenous</option>
                      <option value="intramuscular">Intramuscular</option>
                      <option value="topical">Topical</option>
                      <option value="inhalation">Inhalation</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Frequency */}
                  <div>
                    <label className="mb-1 block text-sm text-slate-600">
                      Frequency *
                    </label>

                    <input
                      required
                      value={item.frequency}
                      onChange={(e) =>
                        handleMedicineChange(
                          index,
                          "frequency",
                          e.target.value,
                        )
                      }
                      placeholder="e.g. Twice daily"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="mb-1 block text-sm text-slate-600">
                      Duration
                    </label>

                    <input
                      value={item.duration}
                      onChange={(e) =>
                        handleMedicineChange(
                          index,
                          "duration",
                          e.target.value,
                        )
                      }
                      placeholder="e.g. 5 days"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="mb-1 block text-sm text-slate-600">
                      Quantity
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleMedicineChange(
                          index,
                          "quantity",
                          e.target.value,
                        )
                      }
                      placeholder="Quantity"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Refills */}
                  <div>
                    <label className="mb-1 block text-sm text-slate-600">
                      Refills
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={item.refills}
                      onChange={(e) =>
                        handleMedicineChange(
                          index,
                          "refills",
                          e.target.value,
                        )
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Medicine instructions */}
                  <div>
                    <label className="mb-1 block text-sm text-slate-600">
                      Medicine Instructions
                    </label>

                    <input
                      value={item.instructions}
                      onChange={(e) =>
                        handleMedicineChange(
                          index,
                          "instructions",
                          e.target.value,
                        )
                      }
                      placeholder="e.g. After meals"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            ),
          )}
        </div>

        {/* Error message */}
        {prescriptionMessage &&
          showPrescriptionForm &&
          prescriptionMessageType === "error" && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {prescriptionMessage}
            </div>
          )}

        {/* Buttons */}
        <div className="flex justify-end gap-3 border-t pt-4">
          <button
            type="button"
            onClick={() => {
              setShowPrescriptionForm(false);
              setPrescriptionMessage("");
            }}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={savingPrescription}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingPrescription
              ? "Creating..."
              : "Create Prescription"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
  </section>
)}


{activePage === "Laboratory" && (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold">Laboratory</h1>
        <p className="text-gray-500">
          Manage laboratory orders, test results and verification
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setRefreshLaboratory((prev) => prev + 1)}
          className="px-4 py-2 border rounded-lg hover:bg-gray-100"
        >
          Refresh
        </button>

        <button
          onClick={createLabOrder}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + New Lab Order
        </button>
      </div>
    </div>

    {/* Error */}
    {laboratoryError && (
      <div className="p-4 bg-red-100 text-red-700 rounded-lg">
        {laboratoryError}
      </div>
    )}

    {/* Search and Filter */}
    <div className="flex flex-col md:flex-row gap-4">
      <input
        type="text"
        placeholder="Search test name, patient, order number..."
        value={labSearch}
        onChange={(e) => setLabSearch(e.target.value)}
        className="border rounded-lg px-4 py-2 flex-1"
      />

      <select
        value={labStatusFilter}
        onChange={(e) => setLabStatusFilter(e.target.value)}
        className="border rounded-lg px-4 py-2"
      >
        <option value="all">All Statuses</option>
        <option value="ordered">Ordered</option>
        <option value="collected">Collected</option>
        <option value="processing">Processing</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>

    {/* Loading */}
    {laboratoryLoading && (
      <div className="p-8 text-center">
        Loading laboratory orders...
      </div>
    )}

    {/* Orders Table */}
    {!laboratoryLoading && (
      <div className="overflow-x-auto bg-white rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Order Number</th>
              <th className="px-4 py-3 text-left">Test Name</th>
              <th className="px-4 py-3 text-left">Patient ID</th>
              <th className="px-4 py-3 text-left">Priority</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Ordered At</th>
              <th className="px-4 py-3 text-left">Results</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {laboratoryOrders
              .filter((order) => {
                const search = labSearch.toLowerCase();

                const matchesSearch =
                  String(order.order_number || "")
                    .toLowerCase()
                    .includes(search) ||
                  String(order.test_name || "")
                    .toLowerCase()
                    .includes(search) ||
                  String(order.patient_id || "")
                    .toLowerCase()
                    .includes(search);

                const matchesStatus =
                  labStatusFilter === "all" ||
                  order.status === labStatusFilter;

                return matchesSearch && matchesStatus;
              })
              .map((order) => (
                <tr key={order.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {order.order_number || order.id}
                  </td>

                  <td className="px-4 py-3 font-medium">
                    {order.test_name}
                    {order.test_code && (
                      <div className="text-xs text-gray-500">
                        {order.test_code}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {order.patient_id}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        order.priority === "stat"
                          ? "bg-red-100 text-red-700"
                          : order.priority === "urgent"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {order.priority}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
                      {order.status}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    {order.ordered_at
                      ? new Date(order.ordered_at).toLocaleDateString()
                      : "-"}
                  </td>

                  <td className="px-4 py-3">
                    {order.results?.length > 0 ? (
                      <div className="space-y-1">
                        {order.results.map((result: any) => (
                          <div key={result.id}>
                            <div>
                              <strong>{result.result_value}</strong>
                              {result.unit && ` ${result.unit}`}
                            </div>

                            {result.abnormal_flag && (
                              <span className="text-xs text-orange-600">
                                {result.abnormal_flag}
                              </span>
                            )}

                            {result.verified_at ? (
                              <span className="text-xs text-green-600 block">
                                Verified ✓
                              </span>
                            ) : (
                              <button
                                onClick={() => verifyLabResult(result.id)}
                                className="text-xs text-blue-600 underline"
                              >
                                Verify
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">No results</span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-2 min-w-[130px]">
                      <button
                        onClick={() => addLabResult(order.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        + Add Result
                      </button>

                      <select
                        value={order.status}
                        onChange={(e) =>
                          updateLabOrderStatus(order.id, e.target.value)
                        }
                        className="border rounded px-2 py-1"
                      >
                        <option value="ordered">Ordered</option>
                        <option value="collected">Collected</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {laboratoryOrders.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No laboratory orders found.
          </div>
        )}
      </div>
    )}
  </div>
)}
 {activePage !== "Dashboard" &&
  activePage !== "Patients" &&
  activePage !== "Appointments" &&
  activePage !== "Encounters" &&
  activePage !== "Prescriptions" &&
  activePage !== "Laboratory" && (
    <section className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {activePage}
          </h1>
          <p className="text-gray-500 mt-1">
            Manage {activePage.toLowerCase()} records
          </p>
        </div>

        <button
          onClick={() => setRefreshOtherModule((prev) => prev + 1)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {otherModuleLoading && (
        <p className="text-gray-500">Loading data...</p>
      )}

      {otherModuleError && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
          {otherModuleError}
        </div>
      )}

      {!otherModuleLoading &&
        !otherModuleError &&
        otherModuleData.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center border">
            <p className="text-gray-500">No records found.</p>
          </div>
        )}

      {!otherModuleLoading && otherModuleData.length > 0 && (
        <div className="bg-white rounded-xl border overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                {Object.keys(otherModuleData[0])
                  .slice(0, 8)
                  .map((key) => (
                    <th
                      key={key}
                      className="px-4 py-3 text-left text-sm font-semibold text-gray-700"
                    >
                      {key}
                    </th>
                  ))}
              </tr>
            </thead>

            <tbody>
              {otherModuleData.map((record, index) => (
                <tr key={record.id || index} className="border-t">
                  {Object.keys(otherModuleData[0])
                    .slice(0, 8)
                    .map((key) => (
                      <td
                        key={key}
                        className="px-4 py-3 text-sm text-gray-600"
                      >
                        {record[key] !== null &&
                        record[key] !== undefined
                          ? String(record[key])
                          : "-"}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )}
</div>
</main>
</div>
</div>
);
}