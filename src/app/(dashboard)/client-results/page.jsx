"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { getClients } from "@/lib/clientService";

export default function ClientResultsPage() {
  const { user, loading: authLoading } = useAuth();

  const [clients, setClients] = useState([]);
  const [results, setResults] = useState([]);

  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingResults, setLoadingResults] = useState(true);
  const [saving, setSaving] = useState(false);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Form
  const [form, setForm] = useState({
    clientId: "",
    date: getTodayDate(),
    qualifiedLeads: "",
    orders: "",
    revenue: "",
    grossProfit: "",
    notes: "",
  });

  // History filters
  const [filterClientId, setFilterClientId] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  useEffect(() => {
    if (authLoading || !user) return;

    loadClients();
    loadResults();
  }, [user, authLoading]);

  async function loadClients() {
    try {
      setLoadingClients(true);

      const data = await getClients();

      setClients(data);

      if (data.length > 0) {
        setForm((prev) => ({
          ...prev,
          clientId: prev.clientId || data[0].id,
        }));
      }
    } catch (error) {
      console.error("CLIENT LOAD ERROR:", error);

      setError(error.message || "Failed to load clients");
    } finally {
      setLoadingClients(false);
    }
  }

  async function loadResults(filters = {}) {
    try {
      setLoadingResults(true);
      setError("");

      if (!user) return;

      const token = await user.getIdToken();

      const params = new URLSearchParams();

      if (filters.clientId) {
        params.set("clientId", filters.clientId);
      }

      if (filters.startDate) {
        params.set("startDate", filters.startDate);
      }

      if (filters.endDate) {
        params.set("endDate", filters.endDate);
      }

      const queryString = params.toString();

      const response = await fetch(
        `/api/client-results${queryString ? `?${queryString}` : ""}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load client results");
      }

      setResults(result.data || []);
    } catch (error) {
      console.error("CLIENT RESULTS LOAD ERROR:", error);

      setError(error.message || "Failed to load client results");
    } finally {
      setLoadingResults(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setSuccess("");
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setSuccess("");
      setError("");

      if (!user) {
        throw new Error("You must be logged in.");
      }

      if (!form.clientId) {
        throw new Error("Please select a client.");
      }

      if (!form.date) {
        throw new Error("Please select a date.");
      }

      const token = await user.getIdToken();

      const response = await fetch("/api/client-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientId: form.clientId,

          date: form.date,

          qualifiedLeads: Number(form.qualifiedLeads || 0),

          orders: Number(form.orders || 0),

          revenue: parseRupiah(form.revenue),

          grossProfit: parseRupiah(form.grossProfit),

          notes: form.notes.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save client result");
      }

      setSuccess(`Result saved successfully for ${form.date}.`);

      setForm((prev) => ({
        ...prev,
        qualifiedLeads: "",
        orders: "",
        revenue: "",
        grossProfit: "",
        notes: "",
      }));

      // Refresh history
      loadResults({
        clientId: filterClientId,
        startDate: filterStartDate,
        endDate: filterEndDate,
      });
    } catch (error) {
      console.error("CLIENT RESULT SAVE ERROR:", error);

      setError(error.message || "Failed to save client result");
    } finally {
      setSaving(false);
    }
  }

  function handleApplyFilter() {
    loadResults({
      clientId: filterClientId,
      startDate: filterStartDate,
      endDate: filterEndDate,
    });
  }

  function handleClearFilter() {
    setFilterClientId("");
    setFilterStartDate("");
    setFilterEndDate("");

    loadResults({});
  }

  const totalQualifiedLeads = results.reduce(
    (sum, item) => sum + Number(item.qualifiedLeads || 0),
    0,
  );

  const totalOrders = results.reduce(
    (sum, item) => sum + Number(item.orders || 0),
    0,
  );

  const totalRevenue = results.reduce(
    (sum, item) => sum + Number(item.revenue || 0),
    0,
  );

  const totalGrossProfit = results.reduce(
    (sum, item) => sum + Number(item.grossProfit || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex">
      <main className="flex-1 p-8 overflow-x-hidden">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Client Results</h1>

          <p className="text-zinc-500 mt-1">
            Record and track the business results generated from client
            campaigns.
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400">
            {success}
          </div>
        )}

        {/* Input */}
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Record Result</h2>

            <p className="text-sm text-zinc-500 mt-1">
              Add the actual business results reported by the client.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-[#27272A] bg-[#18181B] p-6 max-w-4xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Client */}
              <div>
                <label className="block text-xs text-zinc-500 mb-2">
                  Client
                </label>

                <select
                  name="clientId"
                  value={form.clientId}
                  onChange={handleChange}
                  disabled={loadingClients || saving}
                  className="w-full bg-[#0D0D0D] border border-[#27272A] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-zinc-500 disabled:opacity-50"
                >
                  {loadingClients ? (
                    <option>Loading clients...</option>
                  ) : clients.length === 0 ? (
                    <option value="">No clients available</option>
                  ) : (
                    clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.businessName}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs text-zinc-500 mb-2">Date</label>

                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  disabled={saving}
                  className="w-full bg-[#0D0D0D] border border-[#27272A] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-zinc-500 disabled:opacity-50"
                />
              </div>

              {/* Qualified Leads */}
              <NumberInput
                label="Qualified Leads"
                name="qualifiedLeads"
                value={form.qualifiedLeads}
                onChange={handleChange}
                disabled={saving}
                placeholder="0"
              />

              {/* Orders */}
              <NumberInput
                label="Orders"
                name="orders"
                value={form.orders}
                onChange={handleChange}
                disabled={saving}
                placeholder="0"
              />

              {/* Revenue */}
              <CurrencyInput
                label="Revenue"
                name="revenue"
                value={form.revenue}
                onChange={handleChange}
                disabled={saving}
                placeholder="0"
              />

              {/* Gross Profit */}
              <CurrencyInput
                label="Gross Profit"
                name="grossProfit"
                value={form.grossProfit}
                onChange={handleChange}
                disabled={saving}
                placeholder="0"
              />

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-xs text-zinc-500 mb-2">
                  Notes
                </label>

                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  disabled={saving}
                  rows={4}
                  placeholder="Example: 2 orders came from WhatsApp..."
                  className="w-full bg-[#0D0D0D] border border-[#27272A] rounded-xl px-3 py-3 text-sm outline-none focus:border-zinc-500 resize-none disabled:opacity-50"
                />
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-[#27272A] flex justify-end">
              <button
                type="submit"
                disabled={saving || loadingClients || clients.length === 0}
                className="rounded-xl bg-white text-black px-6 py-2.5 text-sm font-semibold hover:bg-zinc-200 transition disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Result"}
              </button>
            </div>
          </form>
        </section>

        {/* History */}
        <section className="mt-10">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Result History</h2>

              <p className="text-sm text-zinc-500 mt-1">
                Review previously recorded business results.
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="rounded-2xl border border-[#27272A] bg-[#18181B] p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Client */}
              <div>
                <label className="block text-xs text-zinc-500 mb-2">
                  Client
                </label>

                <select
                  value={filterClientId}
                  onChange={(e) => setFilterClientId(e.target.value)}
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

              {/* Start Date */}
              <div>
                <label className="block text-xs text-zinc-500 mb-2">
                  Start Date
                </label>

                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full bg-[#0D0D0D] border border-[#27272A] rounded-xl px-3 py-2.5 text-sm outline-none"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-xs text-zinc-500 mb-2">
                  End Date
                </label>

                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full bg-[#0D0D0D] border border-[#27272A] rounded-xl px-3 py-2.5 text-sm outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={handleApplyFilter}
                  disabled={loadingResults}
                  className="flex-1 rounded-xl bg-white text-black px-4 py-2.5 text-sm font-semibold hover:bg-zinc-200 transition disabled:opacity-50"
                >
                  {loadingResults ? "Loading..." : "Apply"}
                </button>

                <button
                  type="button"
                  onClick={handleClearFilter}
                  className="rounded-xl border border-[#27272A] text-zinc-400 px-4 py-2.5 text-sm hover:bg-[#27272A] hover:text-white transition"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
            <SummaryCard
              label="Qualified Leads"
              value={formatNumber(totalQualifiedLeads)}
            />

            <SummaryCard label="Orders" value={formatNumber(totalOrders)} />

            <SummaryCard label="Revenue" value={formatRupiah(totalRevenue)} />

            <SummaryCard
              label="Gross Profit"
              value={formatRupiah(totalGrossProfit)}
            />
          </div>

          {/* Table */}
          <div className="mt-5 overflow-x-auto rounded-2xl border border-[#27272A]">
            <table className="w-full text-sm">
              <thead className="bg-[#18181B]">
                <tr className="text-left text-zinc-500">
                  <th className="px-5 py-4">Date</th>

                  <th className="px-5 py-4">Client</th>

                  <th className="px-5 py-4">Qualified Leads</th>

                  <th className="px-5 py-4">Orders</th>

                  <th className="px-5 py-4">Revenue</th>

                  <th className="px-5 py-4">Gross Profit</th>

                  <th className="px-5 py-4">Notes</th>
                </tr>
              </thead>

              <tbody>
                {loadingResults ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-5 py-10 text-center text-zinc-500"
                    >
                      Loading results...
                    </td>
                  </tr>
                ) : results.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-5 py-10 text-center text-zinc-500"
                    >
                      No client results found.
                    </td>
                  </tr>
                ) : (
                  results.map((result) => (
                    <ResultRow
                      key={result.id}
                      result={result}
                      clients={clients}
                    />
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

function ResultRow({ result, clients }) {
  const client = clients.find((item) => item.id === result.clientId);

  return (
    <tr className="border-t border-[#27272A]">
      <td className="px-5 py-4 whitespace-nowrap">{result.date}</td>

      <td className="px-5 py-4 font-medium">
        {client?.businessName || result.clientId}
      </td>

      <td className="px-5 py-4">{formatNumber(result.qualifiedLeads)}</td>

      <td className="px-5 py-4">{formatNumber(result.orders)}</td>

      <td className="px-5 py-4">{formatRupiah(result.revenue)}</td>

      <td className="px-5 py-4">{formatRupiah(result.grossProfit)}</td>

      <td className="px-5 py-4 text-zinc-400 max-w-xs truncate">
        {result.notes || "-"}
      </td>
    </tr>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#27272A] bg-[#18181B] p-5">
      <p className="text-sm text-zinc-500">{label}</p>

      <p className="text-xl font-semibold mt-2">{value}</p>
    </div>
  );
}

function NumberInput({ label, name, value, onChange, disabled, placeholder }) {
  return (
    <div>
      <label className="block text-xs text-zinc-500 mb-2">{label}</label>

      <input
        type="number"
        name={name}
        value={value}
        onChange={onChange}
        min="0"
        step="1"
        disabled={disabled}
        placeholder={placeholder}
        className="w-full bg-[#0D0D0D] border border-[#27272A] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-zinc-500 disabled:opacity-50"
      />
    </div>
  );
}

function CurrencyInput({
  label,
  name,
  value,
  onChange,
  disabled,
  placeholder,
}) {
  function handleCurrencyChange(event) {
    const rawValue = event.target.value.replace(/\D/g, "");

    onChange({
      target: {
        name,
        value: rawValue,
      },
    });
  }

  return (
    <div>
      <label className="block text-xs text-zinc-500 mb-2">{label}</label>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
          Rp
        </span>

        <input
          type="text"
          name={name}
          value={formatInputRupiah(value)}
          onChange={handleCurrencyChange}
          disabled={disabled}
          placeholder={placeholder}
          inputMode="numeric"
          className="w-full bg-[#0D0D0D] border border-[#27272A] rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none focus:border-zinc-500 disabled:opacity-50"
        />
      </div>
    </div>
  );
}

function parseRupiah(value) {
  return Number(String(value || "").replace(/\D/g, ""));
}

function formatInputRupiah(value) {
  if (!value) return "";

  return Number(value).toLocaleString("id-ID");
}

function formatRupiah(value) {
  return `Rp${Number(value || 0).toLocaleString("id-ID", {
    maximumFractionDigits: 0,
  })}`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("id-ID");
}

function getTodayDate() {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(today.getMonth() + 1).padStart(2, "0");

  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
