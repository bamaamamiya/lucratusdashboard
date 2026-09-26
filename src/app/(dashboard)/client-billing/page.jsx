"use client";

import { useEffect, useState } from "react";
import { Plus, RefreshCw, ExternalLink, Pencil, Trash2, X } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { getClients } from "@/lib/clientService";

export default function ClientBillingPage() {
  const { user, loading: authLoading } = useAuth();

  const [clients, setClients] = useState([]);
  const [billings, setBillings] = useState([]);

  const [clientId, setClientId] = useState("");
  const [period, setPeriod] = useState("");

  const [editingBilling, setEditingBilling] = useState(null);
  const [deletingBillingId, setDeletingBillingId] = useState(null);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const [form, setForm] = useState({
    clientId: "",
    clientName: "",
    period: currentMonth,
    serviceFee: "",
    adSpend: "",
    dueDate: "",
    notes: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadClients() {
    try {
      const data = await getClients();
      setClients(data);
    } catch (error) {
      console.error("CLIENT LOAD ERROR:", error);
    }
  }

  async function loadBillings() {
    try {
      setLoading(true);
      setError("");

      if (!user) return;

      const token = await user.getIdToken();

      const params = new URLSearchParams();

      if (clientId) {
        params.set("clientId", clientId);
      }

      if (period) {
        params.set("period", period);
      }

      const response = await fetch(`/api/client-billing?${params.toString()}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load billing");
      }

      setBillings(result.data || []);
    } catch (error) {
      console.error("BILLING LOAD ERROR:", error);
      setError(error.message || "Failed to load billing");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      return;
    }

    loadClients();
    loadBillings();
  }, [user, authLoading]);

  useEffect(() => {
    if (!clientId && !period) return;

    setForm((prev) => {
      const client = clients.find((item) => item.id === clientId);

      return {
        ...prev,

        ...(clientId
          ? {
              clientId,
              clientName: client?.businessName || "",
            }
          : {}),

        ...(period
          ? {
              period,
            }
          : {}),
      };
    });
  }, [clientId, period, clients]);

  function handleFormChange(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleClientChange(value) {
    const client = clients.find((item) => item.id === value);

    setForm((prev) => ({
      ...prev,
      clientId: value,
      clientName: client?.businessName || "",
    }));

    setClientId(value);
  }

  function handleEditBilling(billing) {
    if (billing.invoiceId) {
      setError("Billing yang sudah memiliki invoice tidak dapat diedit.");
      return;
    }

    setError("");
    setSuccess("");

    setEditingBilling(billing.id);

    setForm({
      clientId: billing.clientId || "",
      clientName: billing.clientName || "",
      period: billing.period || currentMonth,
      serviceFee: billing.serviceFee || "",
      adSpend: billing.adSpend || "",
      dueDate: billing.dueDate || "",
      notes: billing.notes || "",
    });

    setClientId(billing.clientId || "");
    setPeriod(billing.period || "");
  }

  function cancelEditBilling() {
    setEditingBilling(null);

    setForm({
      clientId: "",
      clientName: "",
      period: currentMonth,
      serviceFee: "",
      adSpend: "",
      dueDate: "",
      notes: "",
    });

    setClientId("");
    setPeriod("");
    setError("");
  }

  async function handleDeleteBilling(billing) {
    if (billing.invoiceId) {
      setError("Billing yang sudah memiliki invoice tidak dapat dihapus.");
      return;
    }

    const confirmed = window.confirm(
      `Delete billing ${billing.clientName} - ${billing.period}?`,
    );

    if (!confirmed) return;

    try {
      setDeletingBillingId(billing.id);
      setError("");
      setSuccess("");

      if (!user) {
        throw new Error("You are not authenticated");
      }

      const token = await user.getIdToken();

      const response = await fetch(
        `/api/client-billing?billingId=${encodeURIComponent(billing.id)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete billing");
      }

      if (editingBilling === billing.id) {
        cancelEditBilling();
      }

      setSuccess("Billing deleted successfully.");

      await loadBillings();
    } catch (error) {
      console.error("BILLING DELETE ERROR:", error);

      setError(error.message || "Failed to delete billing");
    } finally {
      setDeletingBillingId(null);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!user) {
        throw new Error("You are not authenticated");
      }

      if (!form.clientId || !form.period) {
        throw new Error("Client and period are required");
      }

      if (Number(form.serviceFee || 0) <= 0 && Number(form.adSpend || 0) <= 0) {
        throw new Error("Service Fee or Ad Spend must be greater than 0");
      }

      const token = await user.getIdToken();

      const payload = {
        clientId: form.clientId,
        clientName: form.clientName,
        period: form.period,
        serviceFee: Number(form.serviceFee || 0),
        adSpend: Number(form.adSpend || 0),
        dueDate: form.dueDate,
        notes: form.notes,
      };

      let response;

      if (editingBilling) {
        response = await fetch(
          `/api/client-billing?billingId=${encodeURIComponent(editingBilling)}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          },
        );
      } else {
        response = await fetch("/api/client-billing", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            `Failed to ${editingBilling ? "update" : "save"} billing`,
        );
      }

      setSuccess(
        editingBilling
          ? "Billing updated successfully."
          : "Billing saved successfully.",
      );

      setEditingBilling(null);

      setForm({
        clientId: "",
        clientName: "",
        period: currentMonth,
        serviceFee: "",
        adSpend: "",
        dueDate: "",
        notes: "",
      });

      await loadBillings();
    } catch (error) {
      console.error("BILLING SAVE ERROR:", error);

      setError(error.message || "Failed to save billing");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateInvoice(billingId) {
    try {
      setError("");
      setSuccess("");

      if (!user) {
        throw new Error("You are not authenticated");
      }

      const token = await user.getIdToken();

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          billingId,
        }),
      });

      const raw = await response.text();

      console.log("INVOICE STATUS:", response.status);
      console.log("INVOICE RESPONSE:", raw);

      let result;

      try {
        result = JSON.parse(raw);
      } catch {
        throw new Error(
          `Invoice API returned invalid JSON (${response.status})`,
        );
      }

      if (!response.ok) {
        throw new Error(result.error || "Failed to create invoice");
      }

      setSuccess(
        `Invoice ${
          result.data?.invoiceNumber || "created"
        } created successfully.`,
      );

      await loadBillings();
    } catch (error) {
      console.error("INVOICE CREATE ERROR:", error);
      setError(error.message || "Failed to create invoice");
    }
  }

  const summary = billings.reduce(
    (acc, item) => {
      const total = Number(item.totalBilled || 0);
      const paid = Number(item.amountPaid || 0);
      const outstanding = Number(item.outstanding || 0);
      const serviceFee = Number(item.serviceFee || 0);

      acc.totalBilled += total;
      acc.amountPaid += paid;
      acc.outstanding += outstanding;

      if (item.paymentStatus === "paid") {
        acc.agencyRevenue += serviceFee;
      }

      return acc;
    },
    {
      totalBilled: 0,
      amountPaid: 0,
      outstanding: 0,
      agencyRevenue: 0,
    },
  );

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex">
      <main className="flex-1 p-8 overflow-x-hidden">
        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-bold">Client Billing</h1>

          <p className="text-zinc-500 mt-1">
            Track client billing, payments and agency revenue.
          </p>
        </div>

        {/* FILTERS */}
        <div className="mt-8 rounded-2xl border border-[#27272A] bg-[#18181B] p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-2">Client</label>

              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-[#0D0D0D] border border-[#27272A] rounded-xl px-3 py-2.5 text-sm outline-none"
              >
                <option value="">All Clients</option>

                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.businessName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-2">Period</label>

              <input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full bg-[#0D0D0D] border border-[#27272A] rounded-xl px-3 py-2.5 text-sm outline-none"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={loadBillings}
                disabled={loading}
                className="w-full rounded-xl bg-white text-black px-4 py-2.5 text-sm font-semibold hover:bg-zinc-200 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />

                {loading ? "Loading..." : "Apply Filter"}
              </button>
            </div>
          </div>
        </div>

        {/* MESSAGE */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-400">
            {success}
          </div>
        )}

        {/* SUMMARY */}
        <section className="mt-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Total Billed"
              value={formatRupiah(summary.totalBilled)}
            />

            <MetricCard label="Paid" value={formatRupiah(summary.amountPaid)} />

            <MetricCard
              label="Outstanding"
              value={formatRupiah(summary.outstanding)}
            />

            <MetricCard
              label="Agency Revenue"
              value={formatRupiah(summary.agencyRevenue)}
            />
          </div>
        </section>

        {/* FORM */}
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            {editingBilling ? <Pencil size={18} /> : <Plus size={18} />}

            <h2 className="text-lg font-semibold">
              {editingBilling ? "Edit Billing" : "Add Billing"}
            </h2>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-[#27272A] bg-[#18181B] p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CLIENT */}
              <Field label="Client">
                <select
                  value={form.clientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className="input"
                >
                  <option value="">Select Client</option>

                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.businessName}
                    </option>
                  ))}
                </select>
              </Field>

              {/* PERIOD */}
              <Field label="Period">
                <input
                  type="month"
                  value={form.period}
                  onChange={(e) => {
                    const value = e.target.value;

                    handleFormChange("period", value);

                    setPeriod(value);
                  }}
                  className="input"
                />
              </Field>

              {/* SERVICE FEE */}
              <Field label="Service Fee">
                <input
                  type="number"
                  min="0"
                  value={form.serviceFee}
                  onChange={(e) =>
                    handleFormChange("serviceFee", e.target.value)
                  }
                  placeholder="1500000"
                  className="input"
                />
              </Field>

              {/* AD SPEND */}
              <Field label="Ad Spend">
                <input
                  type="number"
                  min="0"
                  value={form.adSpend}
                  onChange={(e) => handleFormChange("adSpend", e.target.value)}
                  placeholder="500000"
                  className="input"
                />
              </Field>

              {/* DUE DATE */}
              <Field label="Due Date">
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => handleFormChange("dueDate", e.target.value)}
                  className="input"
                />
              </Field>

              {/* NOTES */}
              <div className="md:col-span-2">
                <Field label="Notes">
                  <textarea
                    value={form.notes}
                    onChange={(e) => handleFormChange("notes", e.target.value)}
                    rows={3}
                    placeholder="Optional notes..."
                    className="input resize-none"
                  />
                </Field>
              </div>
            </div>

            {/* PREVIEW */}
            <div className="mt-6 rounded-xl border border-[#27272A] bg-[#0D0D0D] p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <PreviewItem
                  label="Total Billed"
                  value={formatRupiah(
                    Number(form.serviceFee || 0) + Number(form.adSpend || 0),
                  )}
                />

                <PreviewItem label="Amount Paid" value="Rp0" />

                <PreviewItem
                  label="Outstanding"
                  value={formatRupiah(
                    Number(form.serviceFee || 0) + Number(form.adSpend || 0),
                  )}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              {editingBilling && (
                <button
                  type="button"
                  onClick={cancelEditBilling}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#27272A] bg-[#0D0D0D] px-5 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-[#222225] disabled:opacity-50"
                >
                  <X size={16} />
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-white text-black px-5 py-2.5 text-sm font-semibold hover:bg-zinc-200 transition disabled:opacity-50"
              >
                {saving
                  ? editingBilling
                    ? "Updating..."
                    : "Saving..."
                  : editingBilling
                    ? "Update Billing"
                    : "Save Billing"}
              </button>
            </div>
          </form>
        </section>

        {/* HISTORY */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold mb-4">Billing History</h2>

          <div className="overflow-x-auto rounded-2xl border border-[#27272A]">
            <table className="w-full text-sm">
              <thead className="bg-[#18181B]">
                <tr className="text-left text-zinc-500">
                  <th className="px-5 py-4">Client</th>
                  <th className="px-5 py-4">Period</th>
                  <th className="px-5 py-4">Service Fee</th>
                  <th className="px-5 py-4">Ad Spend</th>
                  <th className="px-5 py-4">Total</th>
                  <th className="px-5 py-4">Paid</th>
                  <th className="px-5 py-4">Outstanding</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Invoice</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {billings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-5 py-10 text-center text-zinc-500"
                    >
                      No billing data available.
                    </td>
                  </tr>
                ) : (
                  billings.map((billing) => (
                    <tr key={billing.id} className="border-t border-[#27272A]">
                      <td className="px-5 py-4 font-medium">
                        {billing.clientName}
                      </td>

                      <td className="px-5 py-4 text-zinc-400">
                        {billing.period}
                      </td>

                      <td className="px-5 py-4">
                        {formatRupiah(billing.serviceFee)}
                      </td>

                      <td className="px-5 py-4">
                        {formatRupiah(billing.adSpend)}
                      </td>

                      <td className="px-5 py-4 font-medium">
                        {formatRupiah(billing.totalBilled)}
                      </td>

                      <td className="px-5 py-4">
                        {formatRupiah(billing.amountPaid)}
                      </td>

                      <td className="px-5 py-4">
                        {formatRupiah(billing.outstanding)}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge
                          status={billing.paymentStatus}
                          dueDate={billing.dueDate}
                          outstanding={billing.outstanding}
                        />
                      </td>

                      <td className="px-5 py-4">
                        {billing.invoiceId ? (
                          <button
                            type="button"
                            onClick={() =>
                              (window.location.href = `/invoices/${billing.invoiceId}`)
                            }
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-white transition hover:text-zinc-300"
                          >
                            {billing.invoiceNumber || "View Invoice"}

                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleCreateInvoice(billing.id)}
                            className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-zinc-200"
                          >
                            Create Invoice
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {billing.invoiceId ? (
                          <span className="text-xs text-zinc-600">Locked</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditBilling(billing)}
                              className="inline-flex items-center justify-center rounded-lg border border-[#27272A] bg-[#18181B] p-2 text-zinc-400 transition hover:bg-[#27272A] hover:text-white"
                              title="Edit billing"
                            >
                              <Pencil size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteBilling(billing)}
                              disabled={deletingBillingId === billing.id}
                              className="inline-flex items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5 p-2 text-red-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                              title="Delete billing"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs text-zinc-500 mb-2">{label}</label>

      {children}
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#27272A] bg-[#18181B] p-5">
      <p className="text-sm text-zinc-500">{label}</p>

      <p className="text-xl font-semibold mt-2">{value}</p>
    </div>
  );
}

function PreviewItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-zinc-500">{label}</p>

      <p className="font-semibold mt-1">{value}</p>
    </div>
  );
}

function StatusBadge({ status, dueDate, outstanding }) {
  let currentStatus = status || "unpaid";

  if (outstanding > 0 && dueDate && new Date(dueDate) < new Date()) {
    currentStatus = "overdue";
  }

  const styles = {
    paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",

    partial: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",

    unpaid: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",

    overdue: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <span
      className={`
        inline-flex
        items-center
        px-2.5
        py-1
        rounded-lg
        border
        text-xs
        font-medium
        ${styles[currentStatus] || styles.unpaid}
      `}
    >
      {currentStatus}
    </span>
  );
}

function formatRupiah(value) {
  return `Rp${Number(value || 0).toLocaleString("id-ID", {
    maximumFractionDigits: 0,
  })}`;
}
