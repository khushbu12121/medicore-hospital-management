
-- MediCore Hospital Management Database
-- PostgreSQL 16
-- Synthetic/demo patient data only

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- 1. DEPARTMENTS
-- =====================================================

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 2. STAFF / PROVIDERS
-- =====================================================

CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_code VARCHAR(30) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    role VARCHAR(30) NOT NULL CHECK (
        role IN (
            'doctor',
            'nurse',
            'receptionist',
            'lab_technician',
            'billing_officer',
            'administrator'
        )
    ),
    department_id UUID REFERENCES departments(id),
    specialization VARCHAR(150),
    license_number VARCHAR(100) UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 3. PATIENTS
-- =====================================================

CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_number VARCHAR(30) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(30),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    blood_group VARCHAR(5),
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    allergies TEXT,
    medical_notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patients_name
ON patients(last_name, first_name);

CREATE INDEX idx_patients_phone
ON patients(phone);

-- =====================================================
-- 4. USER ACCOUNTS
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (
        role IN (
            'patient',
            'doctor',
            'nurse',
            'receptionist',
            'lab_technician',
            'billing_officer',
            'administrator'
        )
    ),
    patient_id UUID UNIQUE REFERENCES patients(id),
    staff_id UUID UNIQUE REFERENCES staff(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (
        (role = 'patient' AND patient_id IS NOT NULL)
        OR
        (role <> 'patient' AND staff_id IS NOT NULL)
    )
);

-- =====================================================
-- 5. PROVIDER SCHEDULES
-- =====================================================

CREATE TABLE provider_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES staff(id),
    day_of_week SMALLINT NOT NULL CHECK (
        day_of_week BETWEEN 0 AND 6
    ),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes INTEGER NOT NULL DEFAULT 30
        CHECK (slot_duration_minutes > 0),
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_until DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (end_time > start_time),
    CHECK (
        effective_until IS NULL
        OR effective_until >= effective_from
    )
);

CREATE INDEX idx_provider_schedules_provider
ON provider_schedules(provider_id, day_of_week);

-- =====================================================
-- 6. APPOINTMENTS
-- =====================================================

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_number VARCHAR(30) NOT NULL UNIQUE,
    patient_id UUID NOT NULL REFERENCES patients(id),
    provider_id UUID NOT NULL REFERENCES staff(id),
    department_id UUID REFERENCES departments(id),
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    appointment_type VARCHAR(50) NOT NULL DEFAULT 'consultation',
    status VARCHAR(30) NOT NULL DEFAULT 'scheduled'
        CHECK (
            status IN (
                'scheduled',
                'confirmed',
                'checked_in',
                'completed',
                'cancelled',
                'no_show'
            )
        ),
    reason TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (scheduled_end > scheduled_start)
);

CREATE INDEX idx_appointments_patient
ON appointments(patient_id, scheduled_start DESC);

CREATE INDEX idx_appointments_provider
ON appointments(provider_id, scheduled_start);

CREATE INDEX idx_appointments_status
ON appointments(status);

-- =====================================================
-- 7. ENCOUNTERS
-- =====================================================

CREATE TABLE encounters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_number VARCHAR(30) NOT NULL UNIQUE,
    patient_id UUID NOT NULL REFERENCES patients(id),
    appointment_id UUID UNIQUE REFERENCES appointments(id),
    provider_id UUID NOT NULL REFERENCES staff(id),
    department_id UUID REFERENCES departments(id),
    encounter_type VARCHAR(50) NOT NULL DEFAULT 'outpatient',
    status VARCHAR(30) NOT NULL DEFAULT 'in_progress'
        CHECK (
            status IN (
                'in_progress',
                'completed',
                'cancelled'
            )
        ),
    chief_complaint TEXT,
    clinical_notes TEXT,
    diagnosis_summary TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_encounters_patient
ON encounters(patient_id, started_at DESC);

CREATE INDEX idx_encounters_provider
ON encounters(provider_id, started_at DESC);

-- =====================================================
-- 8. DIAGNOSES
-- =====================================================

CREATE TABLE diagnoses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_id UUID NOT NULL REFERENCES encounters(id)
        ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id),
    diagnosis_code VARCHAR(30),
    diagnosis_name VARCHAR(255) NOT NULL,
    diagnosis_type VARCHAR(30) NOT NULL DEFAULT 'primary'
        CHECK (
            diagnosis_type IN (
                'primary',
                'secondary'
            )
        ),
    notes TEXT,
    diagnosed_by UUID REFERENCES staff(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_diagnoses_encounter
ON diagnoses(encounter_id);

CREATE INDEX idx_diagnoses_patient
ON diagnoses(patient_id);

-- =====================================================
-- 9. PRESCRIPTIONS
-- =====================================================

CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_number VARCHAR(30) NOT NULL UNIQUE,
    encounter_id UUID NOT NULL REFERENCES encounters(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    prescriber_id UUID NOT NULL REFERENCES staff(id),
    status VARCHAR(30) NOT NULL DEFAULT 'active'
        CHECK (
            status IN (
                'active',
                'completed',
                'cancelled'
            )
        ),
    instructions TEXT,
    prescribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prescriptions_patient
ON prescriptions(patient_id);

-- =====================================================
-- 10. PRESCRIPTION ITEMS / MEDICATION ORDERS
-- =====================================================

CREATE TABLE prescription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id)
        ON DELETE CASCADE,
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    route VARCHAR(100),
    frequency VARCHAR(100) NOT NULL,
    duration VARCHAR(100),
    quantity INTEGER CHECK (quantity > 0),
    refills INTEGER NOT NULL DEFAULT 0 CHECK (refills >= 0),
    instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prescription_items_prescription
ON prescription_items(prescription_id);

-- =====================================================
-- 11. LAB ORDERS
-- =====================================================

CREATE TABLE lab_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(30) NOT NULL UNIQUE,
    encounter_id UUID NOT NULL REFERENCES encounters(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    ordered_by UUID NOT NULL REFERENCES staff(id),
    test_name VARCHAR(255) NOT NULL,
    test_code VARCHAR(50),
    priority VARCHAR(20) NOT NULL DEFAULT 'normal'
        CHECK (
            priority IN (
                'routine',
                'urgent',
                'stat'
            )
        ),
    status VARCHAR(30) NOT NULL DEFAULT 'ordered'
        CHECK (
            status IN (
                'ordered',
                'collected',
                'processing',
                'completed',
                'cancelled'
            )
        ),
    notes TEXT,
    ordered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    collected_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lab_orders_patient
ON lab_orders(patient_id, ordered_at DESC);

CREATE INDEX idx_lab_orders_status
ON lab_orders(status);

-- =====================================================
-- 12. LAB RESULTS
-- =====================================================

CREATE TABLE lab_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_order_id UUID NOT NULL REFERENCES lab_orders(id)
        ON DELETE CASCADE,
    result_value TEXT NOT NULL,
    unit VARCHAR(50),
    reference_range VARCHAR(100),
    abnormal_flag VARCHAR(20)
        CHECK (
            abnormal_flag IN (
                'normal',
                'low',
                'high',
                'critical',
                'abnormal'
            )
        ),
    interpretation TEXT,
    performed_by UUID REFERENCES staff(id),
    verified_by UUID REFERENCES staff(id),
    result_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lab_results_order
ON lab_results(lab_order_id);

-- =====================================================
-- 13. INVOICES / BILLING
-- =====================================================

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(30) NOT NULL UNIQUE,
    patient_id UUID NOT NULL REFERENCES patients(id),
    encounter_id UUID REFERENCES encounters(id),
    status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'partially_paid',
                'paid',
                'cancelled',
                'refunded'
            )
        ),
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (subtotal >= 0),
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (tax_amount >= 0),
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (discount_amount >= 0),
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (total_amount >= 0),
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_patient
ON invoices(patient_id, issued_at DESC);

CREATE INDEX idx_invoices_status
ON invoices(status);

-- =====================================================
-- 14. INVOICE ITEMS
-- =====================================================

CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id)
        ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1
        CHECK (quantity > 0),
    unit_price NUMERIC(12,2) NOT NULL
        CHECK (unit_price >= 0),
    line_total NUMERIC(12,2) NOT NULL
        CHECK (line_total >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoice_items_invoice
ON invoice_items(invoice_id);

-- =====================================================
-- 15. PAYMENTS
-- =====================================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_number VARCHAR(30) NOT NULL UNIQUE,
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(30) NOT NULL
        CHECK (
            payment_method IN (
                'cash',
                'card',
                'upi',
                'bank_transfer',
                'insurance'
            )
        ),
    transaction_reference VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'completed'
        CHECK (
            status IN (
                'pending',
                'completed',
                'failed',
                'refunded'
            )
        ),
    paid_at TIMESTAMPTZ,
    received_by UUID REFERENCES staff(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_invoice
ON payments(invoice_id);

CREATE INDEX idx_payments_patient
ON payments(patient_id);

-- =====================================================
-- 16. CONSENTS
-- =====================================================

CREATE TABLE consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    consent_type VARCHAR(100) NOT NULL,
    consent_version VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL
        CHECK (
            status IN (
                'granted',
                'withdrawn',
                'denied'
            )
        ),
    consent_text TEXT,
    granted_at TIMESTAMPTZ,
    withdrawn_at TIMESTAMPTZ,
    recorded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_consents_patient
ON consents(patient_id, consent_type);

-- =====================================================
-- 17. AUDIT LOGS
-- =====================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    patient_id UUID REFERENCES patients(id),
    ip_address INET,
    request_id VARCHAR(100),
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user
ON audit_logs(user_id, created_at DESC);

CREATE INDEX idx_audit_logs_entity
ON audit_logs(entity_type, entity_id);

CREATE INDEX idx_audit_logs_patient
ON audit_logs(patient_id, created_at DESC);

CREATE INDEX idx_audit_logs_created
ON audit_logs(created_at DESC);

-- =====================================================
-- 18. FHIR / EXTERNAL INTEGRATION RECORDS
-- =====================================================

CREATE TABLE integration_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type VARCHAR(100) NOT NULL,
    local_entity_type VARCHAR(100) NOT NULL,
    local_entity_id UUID NOT NULL,
    external_system VARCHAR(100) NOT NULL,
    external_id VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'synced',
                'failed'
            )
        ),
    payload JSONB,
    last_error TEXT,
    synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_integration_records_local
ON integration_records(local_entity_type, local_entity_id);

CREATE INDEX idx_integration_records_status
ON integration_records(status);

-- =====================================================
-- 19. UPDATED_AT TRIGGER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers

CREATE TRIGGER trg_patients_updated_at
BEFORE UPDATE ON patients
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_staff_updated_at
BEFORE UPDATE ON staff
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_appointments_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_encounters_updated_at
BEFORE UPDATE ON encounters
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_integration_records_updated_at
BEFORE UPDATE ON integration_records
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =====================================================
-- DATABASE COMPLETE
-- =====================================================

SELECT 'MediCore schema created successfully' AS message;
