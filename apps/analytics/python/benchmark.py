import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "src"))

from data_processing import process_lab_data, process_appointment_data

lab_row = {
    "patient_id": "P001",
    "test_name": "glucose",
    "value": "100",
    "unit": "mg/dL",
}

appointment_row = {
    "appointment_id": "A001",
    "status": "completed",
    "duration_minutes": "30",
}

lab_dataset = [lab_row] * 10000
appointment_dataset = [appointment_row] * 10000

start = time.perf_counter()
labs, lab_errors = process_lab_data(lab_dataset)
lab_time = time.perf_counter() - start

start = time.perf_counter()
appointments, appointment_errors = process_appointment_data(appointment_dataset)
appointment_time = time.perf_counter() - start

print("=== BENCHMARK ===")
print("Lab records processed:", len(labs))
print("Lab errors:", len(lab_errors))
print("Lab processing time:", round(lab_time, 4), "seconds")

print("Appointment records processed:", len(appointments))
print("Appointment errors:", len(appointment_errors))
print("Appointment processing time:", round(appointment_time, 4), "seconds")

assert len(labs) == 10000
assert len(appointments) == 10000
assert len(lab_errors) == 0
assert len(appointment_errors) == 0

print("Correctness checks: PASSED")
