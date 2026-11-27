import { describe, it, expect, vi, beforeEach } from "vitest";

const { queryMock, connectMock, clientQueryMock, releaseMock } =
  vi.hoisted(() => ({
    queryMock: vi.fn(),
    connectMock: vi.fn(),
    clientQueryMock: vi.fn(),
    releaseMock: vi.fn(),
  }));

vi.mock("../src/config/database", () => ({
  pool: {
    query: queryMock,
    connect: connectMock,
  },
}));

import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  createPayment,
  updateInvoiceStatus,
} from "../src/modules/billing/billing.service";

describe("Billing Service", () => {
  const patientId = "11111111-1111-4111-8111-111111111111";
  const encounterId = "22222222-2222-4222-8222-222222222222";
  const invoiceId = "33333333-3333-4333-8333-333333333333";
  const userId = "44444444-4444-4444-8444-444444444444";

  const mockClient = {
    query: clientQueryMock,
    release: releaseMock,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    connectMock.mockResolvedValue(mockClient);
  });

  // ============================================
  // CREATE INVOICE
  // ============================================

  describe("createInvoice", () => {
    const validInvoiceInput = {
      patient_id: patientId,
      items: [
        {
          description: "Consultation",
          quantity: 2,
          unit_price: 500,
        },
        {
          description: "Blood Test",
          quantity: 1,
          unit_price: 300,
        },
      ],
      tax_amount: 100,
      discount_amount: 50,
      created_by: userId,
    };

    const mockInvoice = {
      id: invoiceId,
      patient_id: patientId,
      subtotal: 1300,
      tax_amount: 100,
      discount_amount: 50,
      total_amount: 1350,
    };

    it("should create invoice successfully", async () => {
      clientQueryMock
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({
          rows: [{ id: patientId }],
        }) // Patient
        .mockResolvedValueOnce({
          rows: [mockInvoice],
        }) // Invoice insert
        .mockResolvedValueOnce({ rows: [] }) // Item 1
        .mockResolvedValueOnce({ rows: [] }) // Item 2
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      queryMock.mockResolvedValueOnce({
        rows: [mockInvoice],
      }); // getInvoiceById

      const result = await createInvoice(validInvoiceInput);

      expect(result).toEqual(mockInvoice);
      expect(connectMock).toHaveBeenCalledTimes(1);
      expect(clientQueryMock).toHaveBeenCalled();
      expect(releaseMock).toHaveBeenCalledTimes(1);
    });

    it("should begin transaction", async () => {
      clientQueryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{ id: patientId }],
        })
        .mockResolvedValueOnce({
          rows: [mockInvoice],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      queryMock.mockResolvedValueOnce({
        rows: [mockInvoice],
      });

      await createInvoice(validInvoiceInput);

      expect(clientQueryMock.mock.calls[0][0]).toBe("BEGIN");
    });

    it("should commit transaction after successful invoice creation", async () => {
      clientQueryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{ id: patientId }],
        })
        .mockResolvedValueOnce({
          rows: [mockInvoice],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      queryMock.mockResolvedValueOnce({
        rows: [mockInvoice],
      });

      await createInvoice(validInvoiceInput);

      expect(clientQueryMock).toHaveBeenCalledWith("COMMIT");
    });

    it("should release client after successful invoice creation", async () => {
      clientQueryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{ id: patientId }],
        })
        .mockResolvedValueOnce({
          rows: [mockInvoice],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      queryMock.mockResolvedValueOnce({
        rows: [mockInvoice],
      });

      await createInvoice(validInvoiceInput);

      expect(releaseMock).toHaveBeenCalledTimes(1);
    });

    it("should reject when patient does not exist or is inactive", async () => {
      clientQueryMock
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }); // Patient

      await expect(
        createInvoice(validInvoiceInput)
      ).rejects.toThrow("Patient not found or inactive");

      expect(clientQueryMock).toHaveBeenCalledWith(
        "ROLLBACK"
      );

      expect(releaseMock).toHaveBeenCalled();
    });

    it("should rollback when patient is not found", async () => {
      clientQueryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await expect(
        createInvoice(validInvoiceInput)
      ).rejects.toThrow();

      expect(clientQueryMock).toHaveBeenCalledWith(
        "ROLLBACK"
      );
    });

    it("should validate encounter when encounter_id is provided", async () => {
      const input = {
        ...validInvoiceInput,
        encounter_id: encounterId,
      };

      clientQueryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{ id: patientId }],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: encounterId,
              patient_id: patientId,
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [mockInvoice],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      queryMock.mockResolvedValueOnce({
        rows: [mockInvoice],
      });

      const result = await createInvoice(input);

      expect(result).toEqual(mockInvoice);
    });

    it("should reject when encounter does not exist", async () => {
      const input = {
        ...validInvoiceInput,
        encounter_id: encounterId,
      };

      clientQueryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{ id: patientId }],
        })
        .mockResolvedValueOnce({ rows: [] });

      await expect(
        createInvoice(input)
      ).rejects.toThrow("Encounter not found");

      expect(clientQueryMock).toHaveBeenCalledWith(
        "ROLLBACK"
      );
    });

    it("should reject encounter belonging to another patient", async () => {
      const input = {
        ...validInvoiceInput,
        encounter_id: encounterId,
      };

      clientQueryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{ id: patientId }],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: encounterId,
              patient_id: "99999999-9999-4999-8999-999999999999",
            },
          ],
        });

      await expect(
        createInvoice(input)
      ).rejects.toThrow("Encounter patient mismatch");

      expect(clientQueryMock).toHaveBeenCalledWith(
        "ROLLBACK"
      );
    });

    it("should calculate subtotal correctly", async () => {
      clientQueryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{ id: patientId }],
        })
        .mockResolvedValueOnce({
          rows: [mockInvoice],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      queryMock.mockResolvedValueOnce({
        rows: [mockInvoice],
      });

      await createInvoice(validInvoiceInput);

      const invoiceInsertCall =
        clientQueryMock.mock.calls.find((call) =>
          String(call[0]).includes("INSERT INTO invoices")
        );

      expect(invoiceInsertCall[1][3]).toBe(1300);
    });

    it("should calculate total with tax and discount", async () => {
      clientQueryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{ id: patientId }],
        })
        .mockResolvedValueOnce({
          rows: [mockInvoice],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      queryMock.mockResolvedValueOnce({
        rows: [mockInvoice],
      });

      await createInvoice(validInvoiceInput);

      const invoiceInsertCall =
        clientQueryMock.mock.calls.find((call) =>
          String(call[0]).includes("INSERT INTO invoices")
        );

      expect(invoiceInsertCall[1][6]).toBe(1350);
    });

    it("should reject when discount causes negative total", async () => {
      const input = {
        ...validInvoiceInput,
        discount_amount: 2000,
      };

      clientQueryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{ id: patientId }],
        });

      await expect(
        createInvoice(input)
      ).rejects.toThrow(
        "Discount cannot exceed subtotal plus tax"
      );

      expect(clientQueryMock).toHaveBeenCalledWith(
        "ROLLBACK"
      );
    });

    it("should calculate invoice item line totals", async () => {
      clientQueryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{ id: patientId }],
        })
        .mockResolvedValueOnce({
          rows: [mockInvoice],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      queryMock.mockResolvedValueOnce({
        rows: [mockInvoice],
      });

      await createInvoice(validInvoiceInput);

      const itemInsertCalls =
        clientQueryMock.mock.calls.filter((call) =>
          String(call[0]).includes("INSERT INTO invoice_items")
        );

      expect(itemInsertCalls).toHaveLength(2);

      expect(itemInsertCalls[0][1]).toEqual([
        invoiceId,
        "Consultation",
        2,
        500,
        1000,
      ]);

      expect(itemInsertCalls[1][1]).toEqual([
        invoiceId,
        "Blood Test",
        1,
        300,
        300,
      ]);
    });

    it("should create invoice with zero tax and discount", async () => {
      const input = {
        patient_id: patientId,
        items: [
          {
            description: "Consultation",
            quantity: 1,
            unit_price: 500,
          },
        ],
        tax_amount: 0,
        discount_amount: 0,
      };

      clientQueryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{ id: patientId }],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              ...mockInvoice,
              subtotal: 500,
              total_amount: 500,
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      queryMock.mockResolvedValueOnce({
        rows: [mockInvoice],
      });

      await createInvoice(input);

      const invoiceInsertCall =
  clientQueryMock.mock.calls.find((call) =>
    String(call[0]).includes("INSERT INTO invoices")
  )!;

      expect(invoiceInsertCall[1][3]).toBe(500);
      expect(invoiceInsertCall[1][4]).toBe(0);
      expect(invoiceInsertCall[1][5]).toBe(0);
      expect(invoiceInsertCall[1][6]).toBe(500);
    });

    it("should rollback when invoice insert fails", async () => {
      clientQueryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{ id: patientId }],
        })
        .mockRejectedValueOnce(
          new Error("Invoice insert failed")
        )
        .mockResolvedValueOnce({ rows: [] });

      await expect(
        createInvoice(validInvoiceInput)
      ).rejects.toThrow("Invoice insert failed");

      expect(clientQueryMock).toHaveBeenCalledWith(
        "ROLLBACK"
      );
    });

    it("should rollback when invoice item insert fails", async () => {
      clientQueryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{ id: patientId }],
        })
        .mockResolvedValueOnce({
          rows: [mockInvoice],
        })
        .mockRejectedValueOnce(
          new Error("Item insert failed")
        )
        .mockResolvedValueOnce({ rows: [] });

      await expect(
        createInvoice(validInvoiceInput)
      ).rejects.toThrow("Item insert failed");

      expect(clientQueryMock).toHaveBeenCalledWith(
        "ROLLBACK"
      );
    });

    it("should rollback when commit fails", async () => {
      clientQueryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{ id: patientId }],
        })
        .mockResolvedValueOnce({
          rows: [mockInvoice],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockRejectedValueOnce(
          new Error("Commit failed")
        )
        .mockResolvedValueOnce({ rows: [] });

      await expect(
        createInvoice(validInvoiceInput)
      ).rejects.toThrow("Commit failed");

      expect(clientQueryMock).toHaveBeenCalledWith(
        "ROLLBACK"
      );
    });

    it("should release client when invoice creation fails", async () => {
      clientQueryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await expect(
        createInvoice(validInvoiceInput)
      ).rejects.toThrow();

      expect(releaseMock).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================
  // GET INVOICES
  // ============================================

  describe("getInvoices", () => {
    it("should return invoices", async () => {
      const mockInvoices = [
        { id: invoiceId, total_amount: 1000 },
        { id: "55555555-5555-4555-8555-555555555555", total_amount: 500 },
      ];

      queryMock.mockResolvedValueOnce({
        rows: mockInvoices,
      });

      const result = await getInvoices({
        page: 1,
        limit: 20,
      });

      expect(result).toEqual(mockInvoices);
    });

    it("should filter by patient_id", async () => {
      queryMock.mockResolvedValueOnce({
        rows: [],
      });

      await getInvoices({
        patient_id: patientId,
        page: 1,
        limit: 20,
      });

      expect(queryMock.mock.calls[0][0]).toContain(
        "WHERE i.patient_id = $1"
      );

      expect(queryMock.mock.calls[0][1]).toEqual([
        patientId,
        20,
        0,
      ]);
    });

    it("should filter by status", async () => {
      queryMock.mockResolvedValueOnce({
        rows: [],
      });

      await getInvoices({
        status: "paid",
        page: 1,
        limit: 20,
      });

      expect(queryMock.mock.calls[0][0]).toContain(
        "WHERE i.status = $1"
      );

      expect(queryMock.mock.calls[0][1]).toEqual([
        "paid",
        20,
        0,
      ]);
    });

    it("should apply patient and status filters together", async () => {
      queryMock.mockResolvedValueOnce({
        rows: [],
      });

      await getInvoices({
        patient_id: patientId,
        status: "partially_paid",
        page: 2,
        limit: 10,
      });

      const sql = queryMock.mock.calls[0][0];
      const values = queryMock.mock.calls[0][1];

      expect(sql).toContain("i.patient_id = $1");
      expect(sql).toContain("i.status = $2");

      expect(values).toEqual([
        patientId,
        "partially_paid",
        10,
        10,
      ]);
    });

    it("should use default pagination values", async () => {
      queryMock.mockResolvedValueOnce({
        rows: [],
      });

      await getInvoices({
        page: 1,
        limit: 20,
      });

      const values = queryMock.mock.calls[0][1];

      expect(values).toEqual([20, 0]);
    });

    it("should calculate offset correctly", async () => {
      queryMock.mockResolvedValueOnce({
        rows: [],
      });

      await getInvoices({
        page: 3,
        limit: 10,
      });

      const values = queryMock.mock.calls[0][1];

      expect(values).toEqual([10, 20]);
    });

    it("should return empty array when no invoices exist", async () => {
      queryMock.mockResolvedValueOnce({
        rows: [],
      });

      const result = await getInvoices({
        page: 1,
        limit: 20,
      });

      expect(result).toEqual([]);
    });

    it("should propagate database errors", async () => {
      queryMock.mockRejectedValueOnce(
        new Error("Database error")
      );

      await expect(
        getInvoices({
          page: 1,
          limit: 20,
        })
      ).rejects.toThrow("Database error");
    });
  });

  // ============================================
  // GET INVOICE BY ID
  // ============================================

  describe("getInvoiceById", () => {
    it("should return invoice when found", async () => {
      const mockInvoice = {
        id: invoiceId,
        total_amount: 1000,
        items: [],
        payments: [],
      };

      queryMock.mockResolvedValueOnce({
        rows: [mockInvoice],
      });

      const result = await getInvoiceById(invoiceId);

      expect(result).toEqual(mockInvoice);
    });

    it("should return null when invoice does not exist", async () => {
      queryMock.mockResolvedValueOnce({
        rows: [],
      });

      const result = await getInvoiceById(invoiceId);

      expect(result).toBeNull();
    });

    it("should query using the invoice ID", async () => {
      queryMock.mockResolvedValueOnce({
        rows: [{ id: invoiceId }],
      });

      await getInvoiceById(invoiceId);

      expect(queryMock.mock.calls[0][1]).toEqual([
        invoiceId,
      ]);
    });

    it("should propagate database errors", async () => {
      queryMock.mockRejectedValueOnce(
        new Error("Database error")
      );

      await expect(
        getInvoiceById(invoiceId)
      ).rejects.toThrow("Database error");
    });
  });

  // ============================================
  // CREATE PAYMENT
  // ============================================

  describe("createPayment", () => {
    const validPaymentInput = {
      amount: 500,
      payment_method: "cash" as const,
      transaction_reference: "TXN-123",
      received_by: userId,
    };

    const mockInvoice = {
      id: invoiceId,
      patient_id: patientId,
      total_amount: 1000,
      status: "pending",
    };

    const mockPayment = {
      id: "66666666-6666-4666-8666-666666666666",
      invoice_id: invoiceId,
      patient_id: patientId,
      amount: 500,
      payment_method: "cash",
      status: "completed",
    };

    it("should create payment successfully", async () => {
      clientQueryMock
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({
          rows: [mockInvoice],
        }) // Invoice
        .mockResolvedValueOnce({
          rows: [{ paid: "0" }],
        }) // Payment sum
        .mockResolvedValueOnce({
          rows: [mockPayment],
        }) // Payment insert
        .mockResolvedValueOnce({ rows: [] }) // Update invoice
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const result = await createPayment(
        invoiceId,
        validPaymentInput
      );

      expect(result).toEqual(mockPayment);
      expect(releaseMock).toHaveBeenCalledTimes(1);
    });

    it("should begin payment transaction", async () => {
      clientQueryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [mockInvoice],
        })
        .mockResolvedValueOnce({
          rows: [{ paid: "0" }],
        })
        .mockResolvedValueOnce({
          rows: [mockPayment],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await createPayment(
        invoiceId,
        validPaymentInput
      );

      expect(clientQueryMock.mock.calls[0][0]).toBe(
        "BEGIN"
      );
    });

    it("should lock invoice using FOR UPDATE", async () => {
      clientQueryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [mockInvoice],
        })
        .mockResolvedValueOnce({
          rows: [{ paid: "0" }],
        })
        .mockResolvedValueOnce({
          rows: [mockPayment],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await createPayment(
        invoiceId,
        validPaymentInput
      );

      expect(clientQueryMock.mock.calls[1][0]).toContain(
        "FOR UPDATE"
      );
    });

    it("should reject when invoice does not exist", async () => {
      clientQueryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await expect(
        createPayment(invoiceId, validPaymentInput)
      ).rejects.toThrow("Invoice not found");

      expect(clientQueryMock).toHaveBeenCalledWith(
        "ROLLBACK"
      );
    });

    it("should reject payment for cancelled invoice", async () => {
      clientQueryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [
            {
              ...mockInvoice,
              status: "cancelled",
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] });

      await expect(
        createPayment(invoiceId, validPaymentInput)
      ).rejects.toThrow(
        "Payment not allowed for this invoice status"
      );
    });

    it("should reject payment for refunded invoice", async () => {
      clientQueryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [
            {
              ...mockInvoice,
              status: "refunded",
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] });

      await expect(
        createPayment(invoiceId, validPaymentInput)
      ).rejects.toThrow(
        "Payment not allowed for this invoice status"
      );
    });

    it("should reject payment exceeding outstanding balance", async () => {
      clientQueryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [mockInvoice],
        })
        .mockResolvedValueOnce({
          rows: [{ paid: "800" }],
        })
        .mockResolvedValueOnce({ rows: [] });

      await expect(
        createPayment(invoiceId, {
          ...validPaymentInput,
          amount: 300,
        })
      ).rejects.toThrow(
        "Payment exceeds outstanding balance: 200"
      );

      expect(clientQueryMock).toHaveBeenCalledWith(
        "ROLLBACK"
      );
    });

    it("should allow payment equal to outstanding balance", async () => {
      clientQueryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [mockInvoice],
        })
        .mockResolvedValueOnce({
          rows: [{ paid: "500" }],
        })
        .mockResolvedValueOnce({
          rows: [mockPayment],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await createPayment(
        invoiceId,
        {
          ...validPaymentInput,
          amount: 500,
        }
      );

      expect(result).toEqual(mockPayment);
    });

    it("should update invoice status to partially_paid", async () => {
      clientQueryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [mockInvoice],
        })
        .mockResolvedValueOnce({
          rows: [{ paid: "0" }],
        })
        .mockResolvedValueOnce({
          rows: [mockPayment],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await createPayment(invoiceId, {
        ...validPaymentInput,
        amount: 500,
      });

     const updateCall =
  clientQueryMock.mock.calls.find((call) =>
    String(call[0]).includes("UPDATE invoices")
  )!;

      expect(updateCall[1]).toEqual([
        invoiceId,
        "partially_paid",
      ]);
    });

    it("should update invoice status to paid when fully paid", async () => {
      clientQueryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [mockInvoice],
        })
        .mockResolvedValueOnce({
          rows: [{ paid: "500" }],
        })
        .mockResolvedValueOnce({
          rows: [mockPayment],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await createPayment(invoiceId, {
        ...validPaymentInput,
        amount: 500,
      });

      const updateCall =
  clientQueryMock.mock.calls.find((call) =>
    String(call[0]).includes("UPDATE invoices")
  )!;

      expect(updateCall[1]).toEqual([
        invoiceId,
        "paid",
      ]);
    });

    it("should calculate new paid amount correctly", async () => {
      clientQueryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [mockInvoice],
        })
        .mockResolvedValueOnce({
          rows: [{ paid: "250" }],
        })
        .mockResolvedValueOnce({
          rows: [mockPayment],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await createPayment(invoiceId, {
        ...validPaymentInput,
        amount: 750,
      });

      const updateCall =
  clientQueryMock.mock.calls.find((call) =>
    String(call[0]).includes("UPDATE invoices")
  );

expect(updateCall).toBeDefined();
expect(updateCall![1][1]).toBe("paid");
    });

    it("should insert payment with correct values", async () => {
      clientQueryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [mockInvoice],
        })
        .mockResolvedValueOnce({
          rows: [{ paid: "0" }],
        })
        .mockResolvedValueOnce({
          rows: [mockPayment],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await createPayment(invoiceId, validPaymentInput);

      const insertCall =
  clientQueryMock.mock.calls.find((call) =>
    String(call[0]).includes("INSERT INTO payments")
  )!;

      expect(insertCall[1][1]).toBe(invoiceId);
      expect(insertCall[1][2]).toBe(patientId);
      expect(insertCall[1][3]).toBe(500);
      expect(insertCall[1][4]).toBe("cash");
      expect(insertCall[1][5]).toBe("TXN-123");
      expect(insertCall[1][6]).toBe(userId);
    });

    it("should handle optional payment fields", async () => {
      clientQueryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [mockInvoice],
        })
        .mockResolvedValueOnce({
          rows: [{ paid: "0" }],
        })
        .mockResolvedValueOnce({
          rows: [mockPayment],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await createPayment(invoiceId, {
        amount: 500,
        payment_method: "upi",
      });

      const insertCall =
  clientQueryMock.mock.calls.find((call) =>
    String(call[0]).includes("INSERT INTO payments")
  )!;

      expect(insertCall[1][5]).toBeNull();
      expect(insertCall[1][6]).toBeNull();
    });

    it("should commit successful payment", async () => {
      clientQueryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [mockInvoice],
        })
        .mockResolvedValueOnce({
          rows: [{ paid: "0" }],
        })
        .mockResolvedValueOnce({
          rows: [mockPayment],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await createPayment(invoiceId, validPaymentInput);

      expect(clientQueryMock).toHaveBeenCalledWith(
        "COMMIT"
      );
    });

    it("should rollback when payment insert fails", async () => {
      clientQueryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [mockInvoice],
        })
        .mockResolvedValueOnce({
          rows: [{ paid: "0" }],
        })
        .mockRejectedValueOnce(
          new Error("Payment insert failed")
        )
        .mockResolvedValueOnce({ rows: [] });

      await expect(
        createPayment(invoiceId, validPaymentInput)
      ).rejects.toThrow("Payment insert failed");

      expect(clientQueryMock).toHaveBeenCalledWith(
        "ROLLBACK"
      );
    });

    it("should rollback when invoice status update fails", async () => {
      clientQueryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [mockInvoice],
        })
        .mockResolvedValueOnce({
          rows: [{ paid: "0" }],
        })
        .mockResolvedValueOnce({
          rows: [mockPayment],
        })
        .mockRejectedValueOnce(
          new Error("Invoice update failed")
        )
        .mockResolvedValueOnce({ rows: [] });

      await expect(
        createPayment(invoiceId, validPaymentInput)
      ).rejects.toThrow("Invoice update failed");

      expect(clientQueryMock).toHaveBeenCalledWith(
        "ROLLBACK"
      );
    });

    it("should release client after payment", async () => {
      clientQueryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [mockInvoice],
        })
        .mockResolvedValueOnce({
          rows: [{ paid: "0" }],
        })
        .mockResolvedValueOnce({
          rows: [mockPayment],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await createPayment(invoiceId, validPaymentInput);

      expect(releaseMock).toHaveBeenCalledTimes(1);
    });

    it("should release client after failed payment", async () => {
      clientQueryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await expect(
        createPayment(invoiceId, validPaymentInput)
      ).rejects.toThrow();

      expect(releaseMock).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================
  // UPDATE INVOICE STATUS
  // ============================================

  describe("updateInvoiceStatus", () => {
    it("should update invoice status successfully", async () => {
      const mockUpdatedInvoice = {
        id: invoiceId,
        status: "paid",
      };

      queryMock.mockResolvedValueOnce({
        rows: [mockUpdatedInvoice],
      });

      const result = await updateInvoiceStatus(
        invoiceId,
        "paid"
      );

      expect(result).toEqual(mockUpdatedInvoice);
    });

    it("should update status to cancelled", async () => {
      queryMock.mockResolvedValueOnce({
        rows: [{ id: invoiceId, status: "cancelled" }],
      });

      const result = await updateInvoiceStatus(
        invoiceId,
        "cancelled"
      );

      expect(result.status).toBe("cancelled");
    });

    it("should update status to refunded", async () => {
      queryMock.mockResolvedValueOnce({
        rows: [{ id: invoiceId, status: "refunded" }],
      });

      const result = await updateInvoiceStatus(
        invoiceId,
        "refunded"
      );

      expect(result.status).toBe("refunded");
    });

    it("should return null when invoice does not exist", async () => {
      queryMock.mockResolvedValueOnce({
        rows: [],
      });

      const result = await updateInvoiceStatus(
        invoiceId,
        "paid"
      );

      expect(result).toBeNull();
    });

    it("should use correct invoice ID and status", async () => {
      queryMock.mockResolvedValueOnce({
        rows: [{ id: invoiceId, status: "paid" }],
      });

      await updateInvoiceStatus(
        invoiceId,
        "paid"
      );

      expect(queryMock.mock.calls[0][1]).toEqual([
        invoiceId,
        "paid",
      ]);
    });

    it("should propagate database errors", async () => {
      queryMock.mockRejectedValueOnce(
        new Error("Database error")
      );

      await expect(
        updateInvoiceStatus(invoiceId, "paid")
      ).rejects.toThrow("Database error");
    });
  });
});