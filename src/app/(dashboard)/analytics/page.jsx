"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { getClients } from "@/lib/clientService";
import { getDateRange } from "@/lib/dateUtils";
export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();

  const [data, setData] = useState(null);
  const [clients, setClients] = useState([]);

  const [clientId, setClientId] = useState(() => {
    if (typeof window === "undefined") return "";

    return localStorage.getItem("analyticsClientId") || "";
  });
  const [datePreset, setDatePreset] = useState("this_week");
  const initialRange = getDateRange("this_week");
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);

  const [syncing, setSyncing] = useState(false);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError("");

      if (!user) return;

      const token = await user.getIdToken();

      const params = new URLSearchParams({
        startDate,
        endDate,
      });

      if (clientId) {
        params.set("clientId", clientId);
      }

      const response = await fetch(`/api/analytics?${params.toString()}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      console.log("ANALYTICS RESPONSE:", result);

      if (!response.ok) {
        throw new Error(result.error || "Failed to load analytics");
      }

      setData(result.data);
    } catch (error) {
      console.error("ANALYTICS ERROR:", error);

      setError(error.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  async function loadClients() {
    try {
      const data = await getClients();

      setClients(data);
    } catch (error) {
      console.error("CLIENT LOAD ERROR:", error);
    }
  }

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      return;
    }

    loadClients();
  }, [user, authLoading]);

  useEffect(() => {
    if (authLoading || !user) return;

    if (!clientId) {
      setData(null);
      return;
    }

    loadAnalytics();
  }, [clientId, user, authLoading]);

  function handleApply() {
    loadAnalytics();
  }

  async function handleSync() {
    try {
      setSyncing(true);
      setError("");

      if (!user) return;

      if (!clientId) {
        throw new Error("Pilih client terlebih dahulu sebelum sync Meta.");
      }

      const selectedClient = clients.find((client) => client.id === clientId);

      if (!selectedClient) {
        throw new Error("Client tidak ditemukan.");
      }

      if (!selectedClient.adAccountId) {
        throw new Error("Client ini belum memiliki Meta Ad Account.");
      }

      const token = await user.getIdToken();

      const response = await fetch("/api/meta/sync", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adAccountId: selectedClient.adAccountId,
          startDate,
          endDate,
        }),
      });

      const result = await response.json();

      console.log("META SYNC RESPONSE:", result);

      if (!response.ok) {
        throw new Error(result.error || "Failed to sync Meta data");
      }

      // Setelah Meta berhasil disimpan ke Firestore,
      // baca ulang analytics dari Firestore.
      await loadAnalytics();
    } catch (error) {
      console.error("META SYNC ERROR:", error);

      setError(error.message || "Failed to sync Meta data");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex">
      <main className="flex-1 p-8 overflow-x-hidden">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>

          <p className="text-zinc-500 mt-1">
            Track where ad spend goes and what it produces.
          </p>
        </div>

        {/* Filters */}
        <div className="mt-8 rounded-2xl border border-[#27272A] bg-[#18181B] p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-2">Client</label>

              <select
                value={datePreset}
                onChange={(e) => {
                  const preset = e.target.value;

                  setDatePreset(preset);

                  if (preset === "custom") {
                    return;
                  }
                  const range = getDateRange(preset);
                  setStartDate(range.startDate);
                  setEndDate(range.endDate);
                }}
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
              <label className="block text-xs text-zinc-500 mb-2">
                Start Date
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#0D0D0D] border border-[#27272A] rounded-xl px-3 py-2.5 text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-2">
                End Date
              </label>

              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#0D0D0D] border border-[#27272A] rounded-xl px-3 py-2.5 text-sm outline-none"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={handleApply}
                disabled={loading || syncing}
                className="flex-1 rounded-xl bg-white text-black px-4 py-2.5 text-sm font-semibold hover:bg-zinc-200 transition disabled:opacity-50"
              >
                {loading ? "Loading..." : "Apply"}
              </button>

              <button
                onClick={handleSync}
                disabled={syncing || loading || !clientId}
                className="flex-1 rounded-xl border border-[#27272A] bg-[#0D0D0D] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#18181B] transition disabled:opacity-50"
              >
                {syncing ? "Syncing..." : "Sync Meta"}
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mt-8 text-zinc-500">Loading analytics...</div>
        )}

        {data && !loading && (
          <div className="mt-8 space-y-10">
            {/* ================================================= */}
            {/* MARKETING PERFORMANCE */}
            {/* ================================================= */}

            <section>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Marketing Performance</h2>

                <p className="text-sm text-zinc-500 mt-1">
                  Traffic, engagement, and conversion data from Meta Ads.
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Spend */}
                <MetricCard
                  label="Ad Spend"
                  value={formatRupiah(data.totals.spend)}
                />

                {/* Impressions */}
                <MetricCard
                  label="Impressions"
                  value={formatNumber(data.totals.impressions)}
                />

                {/* Reach */}
                <MetricCard
                  label="Reach"
                  value={formatNumber(data.totals.reach)}
                />

                {/* Frequency */}
                <MetricCard
                  label="Frequency"
                  value={Number(data.totals.frequency || 0).toFixed(2)}
                />

                {/* Link Clicks */}
                <MetricCard
                  label="Link Clicks"
                  value={formatNumber(data.totals.linkClicks)}
                />

                {/* CTR */}
                <MetricCard
                  label="CTR"
                  value={`${Number(data.totals.ctr || 0).toFixed(2)}%`}
                />

                {/* CPC */}
                <MetricCard label="CPC" value={formatRupiah(data.totals.cpc)} />

                {/* CPM */}
                <MetricCard label="CPM" value={formatRupiah(data.totals.cpm)} />

                {/* Landing Page Views */}
                <MetricCard
                  label="Landing Page Views"
                  value={formatNumber(data.totals.landingPageViews)}
                />

                {/* Add To Cart */}
                <MetricCard
                  label="Add to Cart"
                  value={formatNumber(data.totals.atc)}
                />

                {/* Cost / ATC */}
                <MetricCard
                  label="Cost / ATC"
                  value={formatRupiah(data.totals.costPerAtc)}
                />

                {/* Initiate Checkout */}
                <MetricCard
                  label="Initiate Checkout"
                  value={formatNumber(data.totals.initiateCheckout)}
                />

                {/* Add Payment Info */}
                <MetricCard
                  label="Add Payment Info"
                  value={formatNumber(data.totals.addPaymentInfo)}
                />

                {/* Purchases */}
                <MetricCard
                  label="Purchases"
                  value={formatNumber(data.totals.purchases)}
                />

                {/* Cost / Purchase */}
                <MetricCard
                  label="Cost / Purchase"
                  value={formatRupiah(data.totals.costPerPurchase)}
                />

                {/* Leads */}
                <MetricCard
                  label="Leads"
                  value={formatNumber(data.totals.leads)}
                />

                {/* Messaging */}
                <MetricCard
                  label="Messaging Conversations"
                  value={formatNumber(data.totals.messagingConversations)}
                />
              </div>
            </section>

            {/* ================================================= */}
            {/* BUSINESS PERFORMANCE */}
            {/* ================================================= */}

            <section>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Business Performance</h2>

                <p className="text-sm text-zinc-500 mt-1">
                  Business results reported from the client.
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  label="Revenue"
                  value={formatRupiah(data.totals.revenue)}
                />

                <MetricCard
                  label="Orders"
                  value={formatNumber(data.totals.orders)}
                />

                <MetricCard label="CAC" value={formatRupiah(data.totals.cac)} />

                <MetricCard
                  label="ROAS"
                  value={`${Number(data.totals.roas || 0).toFixed(2)}x`}
                />

                <MetricCard
                  label="Qualified Leads"
                  value={formatNumber(data.totals.qualifiedLeads)}
                />

                <MetricCard
                  label="Order Rate"
                  value={`${Number(data.totals.orderRate || 0).toFixed(2)}%`}
                />

                <MetricCard
                  label="Revenue / Order"
                  value={formatRupiah(data.totals.revenuePerOrder)}
                />

                <MetricCard
                  label="Gross Profit"
                  value={formatRupiah(data.totals.grossProfit)}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                <MetricCard
                  label="Profit After Ads"
                  value={formatRupiah(data.totals.profitAfterAds)}
                  highlight={data.totals.profitAfterAds < 0}
                />
              </div>
            </section>

            {/* ================================================= */}
            {/* FUNNEL */}
            {/* ================================================= */}

            <section>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Funnel</h2>

                <p className="text-sm text-zinc-500 mt-1">
                  Marketing activity versus reported business results.
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <FunnelCard label="Clicks" value={data.totals.clicks} />

                <FunnelCard label="ATC" value={data.totals.atc} />

                <FunnelCard
                  label="Qualified Leads"
                  value={data.totals.qualifiedLeads}
                />

                <FunnelCard label="Orders" value={data.totals.orders} />
              </div>
            </section>

            {/* ================================================= */}
            {/* DAILY SPEND */}
            {/* ================================================= */}

            <section>
              <h2 className="text-lg font-semibold mb-4">Daily Spend</h2>

              <div className="rounded-2xl border border-[#27272A] bg-[#18181B] p-6">
                {data.daily.length === 0 ? (
                  <p className="text-zinc-500 text-sm">No data available.</p>
                ) : (
                  <div className="space-y-4">
                    {data.daily.map((day) => {
                      const maxSpend = Math.max(
                        ...data.daily.map((item) => item.spend),
                        1,
                      );

                      return (
                        <div key={day.date}>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-zinc-400">{day.date}</span>

                            <span className="font-medium">
                              {formatRupiah(day.spend)}
                            </span>
                          </div>

                          <div className="h-2 bg-[#27272A] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-white rounded-full"
                              style={{
                                width: `${Math.min(
                                  (day.spend / maxSpend) * 100,
                                  100,
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* ================================================= */}
            {/* BUDGET ALLOCATION */}
            {/* ================================================= */}

            <section>
              <h2 className="text-lg font-semibold mb-4">Budget Allocation</h2>

              <div className="rounded-2xl border border-[#27272A] bg-[#18181B] overflow-hidden">
                {data.campaigns.length === 0 ? (
                  <div className="p-6 text-sm text-zinc-500">
                    No campaign data available.
                  </div>
                ) : (
                  data.campaigns.map((campaign) => (
                    <div
                      key={campaign.campaignId}
                      className="px-6 py-5 border-b border-[#27272A] last:border-b-0"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <p className="font-medium">{campaign.campaignName}</p>

                          <p className="text-xs text-zinc-500 mt-1">
                            {formatRupiah(campaign.spend)}
                          </p>
                        </div>

                        <span className="text-sm font-semibold">
                          {Number(campaign.budgetShare || 0).toFixed(1)}%
                        </span>
                      </div>

                      <div className="h-2 bg-[#27272A] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white rounded-full"
                          style={{
                            width: `${Math.min(
                              campaign.budgetShare || 0,
                              100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* ================================================= */}
            {/* CAMPAIGN PERFORMANCE */}
            {/* ================================================= */}

            <section>
              <h2 className="text-lg font-semibold mb-4">
                Campaign Performance
              </h2>

              <div className="overflow-x-auto rounded-2xl border border-[#27272A]">
                <table className="w-full text-sm">
                  <thead className="bg-[#18181B]">
                    <tr className="text-left text-zinc-500">
                      <th className="px-5 py-4">Campaign</th>

                      <th className="px-5 py-4">Spend</th>

                      <th className="px-5 py-4">Budget %</th>

                      <th className="px-5 py-4">ATC</th>

                      <th className="px-5 py-4">Cost / ATC</th>

                      <th className="px-5 py-4">CTR</th>

                      <th className="px-5 py-4">CPM</th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.campaigns.map((campaign) => (
                      <tr
                        key={campaign.campaignId}
                        className="border-t border-[#27272A]"
                      >
                        <td className="px-5 py-4 font-medium">
                          {campaign.campaignName}
                        </td>

                        <td className="px-5 py-4">
                          {formatRupiah(campaign.spend)}
                        </td>

                        <td className="px-5 py-4">
                          {Number(campaign.budgetShare || 0).toFixed(1)}%
                        </td>

                        <td className="px-5 py-4">
                          {formatNumber(campaign.atc)}
                        </td>

                        <td className="px-5 py-4">
                          {formatRupiah(campaign.costPerAtc)}
                        </td>

                        <td className="px-5 py-4">
                          {Number(campaign.ctr || 0).toFixed(2)}%
                        </td>

                        <td className="px-5 py-4">
                          {formatRupiah(campaign.cpm)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function MetricCard({ label, value, highlight = false }) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        highlight
          ? "border-red-500/20 bg-red-500/5"
          : "border-[#27272A] bg-[#18181B]"
      }`}
    >
      <p className="text-sm text-zinc-500">{label}</p>

      <p
        className={`text-xl font-semibold mt-2 ${
          highlight ? "text-red-400" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function FunnelCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#27272A] bg-[#18181B] p-5">
      <p className="text-sm text-zinc-500">{label}</p>

      <p className="text-2xl font-semibold mt-2">{formatNumber(value)}</p>
    </div>
  );
}

function formatRupiah(value) {
  return `Rp${Number(value || 0).toLocaleString("id-ID", {
    maximumFractionDigits: 0,
  })}`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("id-ID");
}
