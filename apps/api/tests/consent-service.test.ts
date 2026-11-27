import { describe, it, expect, beforeEach, vi } from "vitest";

const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
}));

vi.mock("../src/config/database", () => ({
  pool: {
    query: queryMock,
  },
}));

import {
  createConsent,
  getConsents,
  getConsentById,
  updateConsentStatus,
} from "../src/modules/consent/consent.service";

describe("Consent Service", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  const consentInput = {
    patient_id: "11111111-1111-4111-8111-111111111111",
    consent_type: "treatment",
    consent_version: "1.0",
    consent_text: "Patient consent text",
    recorded_by: "22222222-2222-4222-8222-222222222222",
  };

  // ================= CREATE CONSENT =================

  describe("createConsent", () => {
    it("should create consent successfully when patient exists", async () => {
      const mockConsent = {
        id: "consent-123",
        patient_id: consentInput.patient_id,
        consent_type: consentInput.consent_type,
        consent_version: consentInput.consent_version,
        status: "pending",
      };

      queryMock
        .mockResolvedValueOnce({
          rows: [{ id: consentInput.patient_id }],
        })
        .mockResolvedValueOnce({
          rows: [mockConsent],
        });

      const result = await createConsent(consentInput);

      expect(result).toEqual(mockConsent);
      expect(queryMock).toHaveBeenCalledTimes(2);
    });

    it("should throw Patient not found when patient does not exist", async () => {
      queryMock.mockResolvedValueOnce({
        rows: [],
      });

      await expect(
        createConsent(consentInput)
      ).rejects.toThrow("Patient not found");

      expect(queryMock).toHaveBeenCalledTimes(1);
    });

    it("should set optional fields to null", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [{ id: consentInput.patient_id }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: "consent-123" }],
        });

      await createConsent({
        patient_id: consentInput.patient_id,
        consent_type: consentInput.consent_type,
        consent_version: consentInput.consent_version,
      });

      const insertValues = queryMock.mock.calls[1][1];

      expect(insertValues[4]).toBeNull();
      expect(insertValues[5]).toBeNull();
      expect(insertValues[3]).toBe("pending");
    });

    it("should throw validation error for invalid input", async () => {
      await expect(
        createConsent({
          patient_id: "invalid-id",
          consent_type: "",
          consent_version: "",
        })
      ).rejects.toThrow();

      expect(queryMock).not.toHaveBeenCalled();
    });

    it("should propagate database error", async () => {
      queryMock.mockRejectedValueOnce(
        new Error("Database error")
      );

      await expect(
        createConsent(consentInput)
      ).rejects.toThrow("Database error");
    });
  });

  // ================= GET CONSENTS =================

  describe("getConsents", () => {
    it("should return consents with pagination", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [{ count: "25" }],
        })
        .mockResolvedValueOnce({
          rows: [
            { id: "consent-1" },
            { id: "consent-2" },
          ],
        });

      const result = await getConsents({
        page: 2,
        limit: 10,
      });

      expect(result.data).toHaveLength(2);

      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      });

      expect(queryMock).toHaveBeenCalledTimes(2);
      expect(queryMock.mock.calls[0][1]).toEqual([]);
      expect(queryMock.mock.calls[1][1]).toEqual([10, 10]);
    });

    it("should filter by patient ID", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [{ count: "1" }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: "consent-1" }],
        });

      await getConsents({
        patient_id: consentInput.patient_id,
        page: 1,
        limit: 10,
      });

      expect(queryMock.mock.calls[0][1]).toEqual([
        consentInput.patient_id,
      ]);

      expect(queryMock.mock.calls[1][1]).toEqual([
        consentInput.patient_id,
        10,
        0,
      ]);
    });

    it("should filter by consent type", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [{ count: "1" }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: "consent-1" }],
        });

      await getConsents({
        consent_type: "treatment",
        page: 1,
        limit: 10,
      });

      expect(queryMock.mock.calls[0][1]).toEqual([
        "treatment",
      ]);

      expect(queryMock.mock.calls[1][1]).toEqual([
        "treatment",
        10,
        0,
      ]);
    });

    it("should filter by status", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [{ count: "1" }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: "consent-1", status: "granted" }],
        });

      await getConsents({
        status: "granted",
        page: 1,
        limit: 10,
      });

      expect(queryMock.mock.calls[0][1]).toEqual([
        "granted",
      ]);

      expect(queryMock.mock.calls[1][1]).toEqual([
        "granted",
        10,
        0,
      ]);
    });

    it("should combine multiple filters", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [{ count: "2" }],
        })
        .mockResolvedValueOnce({
          rows: [
            { id: "consent-1" },
            { id: "consent-2" },
          ],
        });

      await getConsents({
        patient_id: consentInput.patient_id,
        consent_type: "treatment",
        status: "granted",
        page: 2,
        limit: 5,
      });

      expect(queryMock.mock.calls[0][1]).toEqual([
        consentInput.patient_id,
        "treatment",
        "granted",
      ]);

      expect(queryMock.mock.calls[1][1]).toEqual([
        consentInput.patient_id,
        "treatment",
        "granted",
        5,
        5,
      ]);
    });

    it("should return empty data when no consents exist", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [{ count: "0" }],
        })
        .mockResolvedValueOnce({
          rows: [],
        });

      const result = await getConsents({
        page: 1,
        limit: 10,
      });

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });

    it("should calculate pagination offset correctly", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [{ count: "50" }],
        })
        .mockResolvedValueOnce({
          rows: [],
        });

      await getConsents({
        page: 3,
        limit: 10,
      });

      expect(queryMock.mock.calls[1][1]).toEqual([
        10,
        20,
      ]);
    });

    it("should throw validation error for invalid pagination", async () => {
      await expect(
        getConsents({
          page: 0,
          limit: -1,
        })
      ).rejects.toThrow();

      expect(queryMock).not.toHaveBeenCalled();
    });
  });

  // ================= GET CONSENT BY ID =================

  describe("getConsentById", () => {
    it("should return consent when found", async () => {
      const mockConsent = {
        id: "consent-123",
        status: "pending",
      };

      queryMock.mockResolvedValue({
        rows: [mockConsent],
      });

      const result = await getConsentById("consent-123");

      expect(result).toEqual(mockConsent);
    });

    it("should return null when consent does not exist", async () => {
      queryMock.mockResolvedValue({
        rows: [],
      });

      const result = await getConsentById("non-existent");

      expect(result).toBeNull();
    });

    it("should propagate database error", async () => {
      queryMock.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        getConsentById("consent-123")
      ).rejects.toThrow("Database error");
    });
  });

  // ================= UPDATE CONSENT STATUS =================

  describe("updateConsentStatus", () => {
    it("should grant consent successfully", async () => {
      const existingConsent = {
        id: "consent-123",
        status: "pending",
      };

      const updatedConsent = {
        id: "consent-123",
        status: "granted",
        granted_at: "2026-11-27T10:00:00Z",
        withdrawn_at: null,
      };

      queryMock
        .mockResolvedValueOnce({
          rows: [existingConsent],
        })
        .mockResolvedValueOnce({
          rows: [updatedConsent],
        });

      const result = await updateConsentStatus(
        "consent-123",
        { status: "granted" }
      );

      expect(result).toEqual(updatedConsent);

      expect(queryMock.mock.calls[1][1]).toEqual([
        "consent-123",
        "granted",
      ]);
    });

    it("should withdraw consent successfully", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [
            {
              id: "consent-123",
              status: "granted",
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: "consent-123",
              status: "withdrawn",
            },
          ],
        });

      const result = await updateConsentStatus(
        "consent-123",
        { status: "withdrawn" }
      );

      expect(result.status).toBe("withdrawn");

      expect(queryMock.mock.calls[1][1]).toEqual([
        "consent-123",
        "withdrawn",
      ]);
    });

    it("should reset consent to pending", async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [
            {
              id: "consent-123",
              status: "granted",
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: "consent-123",
              status: "pending",
            },
          ],
        });

      const result = await updateConsentStatus(
        "consent-123",
        { status: "pending" }
      );

      expect(result.status).toBe("pending");

      expect(queryMock.mock.calls[1][1]).toEqual([
        "consent-123",
        "pending",
      ]);
    });

    it("should throw when consent does not exist", async () => {
      queryMock.mockResolvedValueOnce({
        rows: [],
      });

      await expect(
        updateConsentStatus("non-existent", {
          status: "granted",
        })
      ).rejects.toThrow("Consent not found");

      expect(queryMock).toHaveBeenCalledTimes(1);
    });

    it("should not modify withdrawn consent", async () => {
      queryMock.mockResolvedValueOnce({
        rows: [
          {
            id: "consent-123",
            status: "withdrawn",
          },
        ],
      });

      await expect(
        updateConsentStatus("consent-123", {
          status: "granted",
        })
      ).rejects.toThrow(
        "Withdrawn consent cannot be modified"
      );

      expect(queryMock).toHaveBeenCalledTimes(1);
    });

    it("should throw validation error for invalid status", async () => {
      await expect(
        updateConsentStatus("consent-123", {
          status: "invalid-status",
        })
      ).rejects.toThrow();

      expect(queryMock).not.toHaveBeenCalled();
    });

    it("should propagate database error", async () => {
      queryMock.mockRejectedValueOnce(
        new Error("Database error")
      );

      await expect(
        updateConsentStatus("consent-123", {
          status: "granted",
        })
      ).rejects.toThrow("Database error");
    });
  });
});