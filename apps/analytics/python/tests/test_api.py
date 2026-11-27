from fastapi.testclient import TestClient

from src.api import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_laboratory_analytics_valid_records():
    payload = {
        "records": [
            {
                "patient_id": "P101",
                "test_name": "glucose",
                "value": "95",
                "unit": "mg/dL",
            },
            {
                "patient_id": "P102",
                "test_name": "glucose",
                "value": "180",
                "unit": "mg/dL",
            },
        ]
    }

    response = client.post("/analytics/laboratory", json=payload)

    assert response.status_code == 200

    result = response.json()

    assert result["success"] is True
    assert result["records_received"] == 2
    assert result["records_processed"] == 2
    assert result["records_rejected"] == 0
    assert result["report"]["within_range"] == 1
    assert result["report"]["outside_range"] == 1


def test_laboratory_analytics_invalid_record():
    payload = {
        "records": [
            {
                "patient_id": "P103",
                "test_name": "glucose",
                "value": "abc",
                "unit": "mg/dL",
            }
        ]
    }

    response = client.post("/analytics/laboratory", json=payload)

    assert response.status_code == 200

    result = response.json()

    assert result["records_processed"] == 0
    assert result["records_rejected"] == 1
    assert len(result["errors"]) == 1


def test_appointment_analytics_valid_records():
    payload = {
        "records": [
            {
                "appointment_id": "A101",
                "status": "completed",
                "duration_minutes": "30",
            },
            {
                "appointment_id": "A102",
                "status": "scheduled",
                "duration_minutes": "45",
            },
        ]
    }

    response = client.post("/analytics/appointments", json=payload)

    assert response.status_code == 200

    result = response.json()

    assert result["success"] is True
    assert result["records_processed"] == 2
    assert result["records_rejected"] == 0
    assert result["report"]["total_appointments"] == 2
    assert result["report"]["average_duration_minutes"] == 37.5


def test_appointment_analytics_invalid_record():
    payload = {
        "records": [
            {
                "appointment_id": "A103",
                "status": "invalid_status",
                "duration_minutes": "30",
            }
        ]
    }

    response = client.post("/analytics/appointments", json=payload)

    assert response.status_code == 200

    result = response.json()

    assert result["records_processed"] == 0
    assert result["records_rejected"] == 1
    assert len(result["errors"]) == 1