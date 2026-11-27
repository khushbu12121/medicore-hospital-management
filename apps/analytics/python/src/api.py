from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from src.data_processing import (
    read_csv_file,
    process_lab_data,
    process_appointment_data,
    generate_lab_report,
    generate_appointment_report,
)

app = FastAPI(
    title="MediCore Analytics API",
    description="API for laboratory and appointment data analytics",
    version="1.0.0",
)


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"


class AnalyticsRequest(BaseModel):
    records: list[dict[str, Any]]


@app.get("/")
def root():
    return {
        "message": "MediCore Analytics API is running",
        "version": "1.0.0",
        "documentation": "/docs",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "MediCore Analytics API",
    }


@app.post("/analytics/laboratory")
def laboratory_analytics(request: AnalyticsRequest):
    try:
        processed, errors = process_lab_data(request.records)
        report = generate_lab_report(processed)

        return {
            "success": True,
            "data": processed,
            "report": report,
            "errors": errors,
            "records_received": len(request.records),
            "records_processed": len(processed),
            "records_rejected": len(errors),
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Laboratory analytics failed: {str(exc)}",
        )


@app.post("/analytics/appointments")
def appointment_analytics(request: AnalyticsRequest):
    try:
        processed, errors = process_appointment_data(request.records)
        report = generate_appointment_report(processed)

        return {
            "success": True,
            "data": processed,
            "report": report,
            "errors": errors,
            "records_received": len(request.records),
            "records_processed": len(processed),
            "records_rejected": len(errors),
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Appointment analytics failed: {str(exc)}",
        )


@app.get("/analytics/laboratory/sample")
def laboratory_sample():
    try:
        rows = read_csv_file(DATA_DIR / "lab_samples.csv")
        processed, errors = process_lab_data(rows)

        return {
            "success": True,
            "report": generate_lab_report(processed),
            "data": processed,
            "errors": errors,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to process laboratory sample: {str(exc)}",
        )


@app.get("/analytics/appointments/sample")
def appointment_sample():
    try:
        rows = read_csv_file(DATA_DIR / "appointment_samples.csv")
        processed, errors = process_appointment_data(rows)

        return {
            "success": True,
            "report": generate_appointment_report(processed),
            "data": processed,
            "errors": errors,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to process appointment sample: {str(exc)}",
        )