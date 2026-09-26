"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Download, RefreshCw } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { generateInvoicePdf } from "@/lib/generateInvoicePdf";

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(date) {
  if (!date) return "-";

  return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function StatusBadge({ status }) {
  const normalized = String(status || "unpaid").toLowerCase();

  const config = {
    paid: {
      label: "Paid",
      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },

    partial: {
      label: "Partially Paid",
      className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },

    unpaid: {
      label: "Unpaid",
      className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    },

    overdue: {
      label: "Overdue",
      className: "bg-red-500/10 text-red-400 border-red-500/20",
    },
  };

  const current = config[normalized] || config.unpaid;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${current.className}`}
    >
      {current.label}
    </span>
  );
}

export default function InvoiceDetailPage() {
  const { user, loading: authLoading } = useAuth();

  const params = useParams();
  const router = useRouter();

  const invoiceId = params?.invoiceId;

  const [invoice, setInvoice] = useState(null);

  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadInvoice() {
    try {
      setLoading(true);
      setError("");

      if (!user) {
        throw new Error("You are not authenticated");
      }

      if (!invoiceId) {
        throw new Error("Invoice ID is missing");
      }

      const token = await user.getIdToken();

      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const raw = await response.text();

      console.log("INVOICE DETAIL STATUS:", response.status);

      console.log("INVOICE DETAIL RESPONSE:", raw);

      let result;

      try {
        result = JSON.parse(raw);
      } catch {
        throw new Error(
          `Invoice detail API returned invalid JSON (${response.status})`,
        );
      }

      if (!response.ok) {
        throw new Error(result.error || "Failed to load invoice");
      }

      if (!result.data) {
        throw new Error("Invoice data is empty");
      }

      console.log("INVOICE DATA:", result.data);

      setInvoice(result.data);
    } catch (error) {
      console.error("INVOICE DETAIL LOAD ERROR:", error);

      setError(error.message || "Failed to load invoice");
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsPaid() {
    try {
      setMarkingPaid(true);
      setError("");
      setSuccess("");

      if (!user) {
        throw new Error("You are not authenticated");
      }

      if (!invoiceId) {
        throw new Error("Invoice ID is missing");
      }

      if (!invoice) {
        throw new Error("Invoice data is missing");
      }

      if (invoice.status === "paid") {
        throw new Error("Invoice is already paid");
      }

      const confirmed = window.confirm(
        `Mark invoice ${
          invoice.invoiceNumber || ""
        } as PAID?\n\nAmount: ${formatRupiah(
          invoice.total,
        )}\n\nThis will also mark the related billing as paid.`,
      );

      if (!confirmed) {
        return;
      }

      const token = await user.getIdToken();

      const response = await fetch(`/api/invoices/${invoiceId}/pay`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      const raw = await response.text();

      console.log("MARK PAID STATUS:", response.status);

      console.log("MARK PAID RESPONSE:", raw);

      let result;

      try {
        result = JSON.parse(raw);
      } catch {
        throw new Error(
          `Payment API returned invalid JSON (${response.status})`,
        );
      }

      if (!response.ok) {
        throw new Error(result.error || "Failed to mark invoice as paid");
      }

      setSuccess(
        `Invoice ${invoice.invoiceNumber || ""} marked as paid successfully.`,
      );

      await loadInvoice();
    } catch (error) {
      console.error("MARK INVOICE PAID ERROR:", error);

      setError(error.message || "Failed to mark invoice as paid");
    } finally {
      setMarkingPaid(false);
    }
  }

  async function handleDownloadPdf() {
    try {
      setDownloading(true);
      setError("");

      await generateInvoicePdf({
        invoice,
        client: null,
      });
    } catch (error) {
      console.error("INVOICE PDF ERROR:", error);

      setError(error.message || "Failed to generate invoice PDF");
    } finally {
      setDownloading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && user && invoiceId) {
      loadInvoice();
    }
  }, [authLoading, user, invoiceId]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-zinc-400">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading invoice...
          </div>
        </div>
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-8 flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white">
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-zinc-500">Invoice not found.</p>
        </div>
      </div>
    );
  }

  const isPaid = String(invoice.status || "").toLowerCase() === "paid";

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* TOP BAR */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex w-fit items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex flex-col gap-3 sm:flex-row">
            {!isPaid && (
              <button
                type="button"
                onClick={handleMarkAsPaid}
                disabled={markingPaid}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {markingPaid ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}

                {markingPaid ? "Processing..." : "Mark as Paid"}
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}

              {downloading ? "Generating..." : "Download PDF"}
            </button>
          </div>
        </div>

        {/* SUCCESS */}

        {success && (
          <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />

              <p className="text-sm text-emerald-400">{success}</p>
            </div>
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* INVOICE */}

        <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-[#18181B]">
          {/* HEADER */}

          <div className="border-b border-zinc-800 bg-[#0D0D0D] px-8 py-7">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-xs font-black text-black">
                    L
                  </div>

                  <div>
                    <p className="text-sm font-semibold">Lucratus Agency</p>

                    <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                      Meta Ads Management
                    </p>
                  </div>
                </div>

                <h1 className="text-3xl font-bold tracking-tight">Invoice</h1>
              </div>

              <div className="sm:text-right">
                <p className="text-sm font-semibold text-white">
                  {invoice.invoiceNumber || "-"}
                </p>

                <div className="mt-2">
                  <StatusBadge status={invoice.status} />
                </div>
              </div>
            </div>
          </div>

          {/* META */}

          <div className="grid gap-6 border-b border-zinc-800 px-8 py-7 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                Issue Date
              </p>

              <p className="mt-2 text-sm font-medium text-white">
                {formatDate(invoice.issueDate)}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                Due Date
              </p>

              <p className="mt-2 text-sm font-medium text-white">
                {formatDate(invoice.dueDate)}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                Billing Period
              </p>

              <p className="mt-2 text-sm font-medium text-white">
                {invoice.period || "-"}
              </p>
            </div>
          </div>

          {/* BILL TO */}

          <div className="px-8 py-7">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Bill To
            </p>

            <p className="text-lg font-semibold text-white">
              {invoice.clientName || "Client"}
            </p>
          </div>

          {/* ITEMS */}

          <div className="px-8 pb-8">
            <div className="overflow-hidden rounded-2xl border border-zinc-800">
              <div className="grid grid-cols-[1fr_auto] border-b border-zinc-800 bg-[#0D0D0D] px-5 py-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
                <span>Description</span>

                <span>Amount</span>
              </div>

              {(invoice.items || []).map((item, index) => (
                <div
                  key={`${item.type || "item"}-${index}`}
                  className="grid grid-cols-[1fr_auto] border-b border-zinc-800 px-5 py-5 last:border-b-0"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {item.description || "-"}
                    </p>

                    {item.type === "service" && (
                      <p className="mt-1 text-xs text-zinc-500">
                        Agency service fee
                      </p>
                    )}

                    {item.type === "ad_spend" && (
                      <p className="mt-1 text-xs text-zinc-500">
                        Advertising budget
                      </p>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-white">
                    {formatRupiah(item.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* TOTALS */}

          <div className="border-t border-zinc-800 bg-[#111113] px-8 py-7">
            <div className="ml-auto max-w-sm space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Subtotal</span>

                <span className="font-medium text-white">
                  {formatRupiah(invoice.subtotal)}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                <span className="text-base font-semibold text-white">
                  Total
                </span>

                <span className="text-xl font-bold text-white">
                  {formatRupiah(invoice.total)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Amount Paid</span>

                <span className="font-medium text-emerald-400">
                  {formatRupiah(invoice.amountPaid)}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                <span className="text-sm font-medium text-zinc-400">
                  Outstanding
                </span>

                <span className="text-lg font-bold text-white">
                  {formatRupiah(invoice.outstanding)}
                </span>
              </div>
            </div>
          </div>

          {/* PAYMENT STATUS */}

          <div className="border-t border-zinc-800 px-8 py-6">
            {isPaid ? (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-emerald-400">
                    Payment received
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    This invoice has been fully paid.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-[#111113] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Payment pending
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    Mark this invoice as paid after the client payment has been
                    received.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleMarkAsPaid}
                  disabled={markingPaid}
                  className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {markingPaid ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}

                  {markingPaid ? "Processing..." : "Mark as Paid"}
                </button>
              </div>
            )}
          </div>

          {/* NOTES */}

          {invoice.notes && (
            <div className="border-t border-zinc-800 px-8 py-7">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Notes
              </p>

              <p className="max-w-2xl whitespace-pre-wrap text-sm leading-6 text-zinc-400">
                {invoice.notes}
              </p>
            </div>
          )}

          {/* FOOTER */}

          <div className="border-t border-zinc-800 bg-[#0D0D0D] px-8 py-6">
            <p className="text-xs font-medium text-zinc-300">
              Prepared by lucratusagency
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              Meta Ads performance management & advertising services
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
