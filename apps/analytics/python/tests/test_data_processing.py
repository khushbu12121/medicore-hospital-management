import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from data_processing import (
    safe_float,
    process_lab_data,
    process_appointment_data,
    generate_lab_report,
    generate_appointment_report,
)


def test_safe_float():
    assert safe_float("12.5") == 12.5
    assert safe_float("") is None
    assert safe_float("abc") is None


def test_lab_valid_record():
    rows = [{
        "patient_id": "P001",
        "test_name": "glucose",
        "value": "100",
        "unit": "mg/dL",
    }]

    processed, errors = process_lab_data(rows)

    assert len(processed) == 1
    assert len(errors) == 0
    assert processed[0]["status"] == "within_range"


def test_lab_invalid_unit():
    rows = [{
        "patient_id": "P001",
        "test_name": "glucose",
        "value": "100",
        "unit": "wrong_unit",
    }]

    processed, errors = process_lab_data(rows)

    assert len(processed) == 0
    assert len(errors) == 1


def test_lab_missing_value():
    rows = [{
        "patient_id": "P001",
        "test_name": "glucose",
        "value": "",
        "unit": "mg/dL",
    }]

    processed, errors = process_lab_data(rows)

    assert len(processed) == 0
    assert len(errors) == 1


def test_appointment_processing():
    rows = [{
        "appointment_id": "A001",
        "status": "completed",
        "duration_minutes": "30",
    }]

    processed, errors = process_appointment_data(rows)

    assert len(processed) == 1
    assert errors == []


def test_invalid_appointment():
    rows = [{
        "appointment_id": "A001",
        "status": "wrong",
        "duration_minutes": "30",
    }]

    processed, errors = process_appointment_data(rows)

    assert len(processed) == 0
    assert len(errors) == 1


def test_lab_report():
    rows = [
        {"status": "within_range"},
        {"status": "outside_range"},
    ]

    report = generate_lab_report(rows)

    assert report["total_tests"] == 2
    assert report["within_range"] == 1
    assert report["outside_range"] == 1


def test_appointment_report():
    rows = [
        {"status": "completed", "duration_minutes": 30},
        {"status": "scheduled", "duration_minutes": 60},
    ]

    report = generate_appointment_report(rows)

    assert report["total_appointments"] == 2
    assert report["average_duration_minutes"] == 45
