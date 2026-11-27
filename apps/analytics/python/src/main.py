from pathlib import Path
from data_processing import (
    read_csv_file,
    process_lab_data,
    process_appointment_data,
    generate_lab_report,
    generate_appointment_report,
    save_report,
)

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
REPORT_DIR = BASE_DIR / "reports"

labs = read_csv_file(DATA_DIR / "lab_samples.csv")
appointments = read_csv_file(DATA_DIR / "appointment_samples.csv")

processed_labs, lab_errors = process_lab_data(labs)
processed_appointments, appointment_errors = process_appointment_data(appointments)

lab_report = generate_lab_report(processed_labs)
appointment_report = generate_appointment_report(processed_appointments)

save_report(lab_report, REPORT_DIR / "lab_report.txt")
save_report(appointment_report, REPORT_DIR / "appointment_report.txt")

print("=== LAB PROCESSING ===")
print("Valid records:", len(processed_labs))
print("Errors:", lab_errors)
print("Report:", lab_report)

print("\n=== APPOINTMENT PROCESSING ===")
print("Valid records:", len(processed_appointments))
print("Errors:", appointment_errors)
print("Report:", appointment_report)

print("\nReports generated successfully.")
