import csv
from pathlib import Path
from statistics import mean


VALID_LAB_UNITS = {
    "hemoglobin": ["g/dL"],
    "glucose": ["mg/dL"],
    "wbc": ["cells/uL"],
}

REFERENCE_RANGES = {
    "hemoglobin": (12.0, 17.5),
    "glucose": (70.0, 140.0),
    "wbc": (4000.0, 11000.0),
}


def read_csv_file(filepath):
    with open(filepath, newline="", encoding="utf-8") as file:
        return list(csv.DictReader(file))


def safe_float(value):
    try:
        if value is None or value.strip() == "":
            return None
        return float(value)
    except (ValueError, AttributeError):
        return None


def process_lab_data(rows):
    processed = []
    errors = []

    for index, row in enumerate(rows, start=1):
        test_name = row.get("test_name", "").strip().lower()
        value = safe_float(row.get("value"))
        unit = row.get("unit", "").strip()

        if not test_name:
            errors.append(f"Row {index}: Missing test name")
            continue

        if value is None:
            errors.append(f"Row {index}: Missing or invalid numeric value")
            continue

        allowed_units = VALID_LAB_UNITS.get(test_name)

        if allowed_units is None:
            errors.append(f"Row {index}: Unknown test '{test_name}'")
            continue

        if unit not in allowed_units:
            errors.append(f"Row {index}: Invalid unit '{unit}' for {test_name}")
            continue

        low, high = REFERENCE_RANGES[test_name]

        processed.append({
            "patient_id": row.get("patient_id", ""),
            "test_name": test_name,
            "value": value,
            "unit": unit,
            "reference_low": low,
            "reference_high": high,
            "status": "within_range" if low <= value <= high else "outside_range",
        })

    return processed, errors


def process_appointment_data(rows):
    processed = []
    errors = []

    valid_statuses = {
        "scheduled", "completed", "cancelled", "no_show"
    }

    for index, row in enumerate(rows, start=1):
        appointment_id = row.get("appointment_id", "").strip()
        status = row.get("status", "").strip().lower()
        duration = safe_float(row.get("duration_minutes"))

        if not appointment_id:
            errors.append(f"Row {index}: Missing appointment ID")
            continue

        if status not in valid_statuses:
            errors.append(f"Row {index}: Invalid status '{status}'")
            continue

        if duration is None or duration <= 0:
            errors.append(f"Row {index}: Invalid duration")
            continue

        processed.append({
            "appointment_id": appointment_id,
            "status": status,
            "duration_minutes": duration,
        })

    return processed, errors


def generate_lab_report(rows):
    total = len(rows)
    within_range = sum(
        1 for row in rows if row["status"] == "within_range"
    )
    outside_range = total - within_range

    return {
        "total_tests": total,
        "within_range": within_range,
        "outside_range": outside_range,
    }


def generate_appointment_report(rows):
    statuses = {}

    for row in rows:
        statuses[row["status"]] = statuses.get(row["status"], 0) + 1

    durations = [row["duration_minutes"] for row in rows]

    return {
        "total_appointments": len(rows),
        "status_counts": statuses,
        "average_duration_minutes": round(mean(durations), 2) if durations else 0,
    }


def save_report(report, filepath):
    Path(filepath).parent.mkdir(parents=True, exist_ok=True)

    with open(filepath, "w", encoding="utf-8") as file:
        for key, value in report.items():
            file.write(f"{key}: {value}\n")
