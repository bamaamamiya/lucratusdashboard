"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  MousePointerClick,
  RefreshCw,
  Target,
  TrendingUp,
  Users,
  Wallet,
  ShoppingBag,
  Copy,
  Check,
  Download,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { getClients } from "@/lib/clientService";
import { generateReportPdf } from "@/lib/generateReportPdf";
export default function ReportsPage() {
  const { user, loading: authLoading } = useAuth();

  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("");

  const [startDate, setStartDate] = useState(getFirstDayOfCurrentMonth());
  const [endDate, setEndDate] = useState(getToday());

  const [report, setReport] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function loadClients() {
    try {
      const data = await getClients();
      setClients(data || []);

      const savedClientId =
        typeof window !== "undefined"
          ? localStorage.getItem("reportsClientId")
          : "";

      if (savedClientId && data.some((client) => client.id === savedClientId)) {
        setClientId(savedClientId);
      }
    } catch (error) {
      console.error("REPORT CLIENT LOAD ERROR:", error);
    }
  }

  async function loadReport() {
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

      if (!response.ok) {
        throw new Error(result.error || "Failed to load report");
      }

      setReport(result.data || null);
    } catch (error) {
      console.error("REPORT LOAD ERROR:", error);

      setError(error.message || "Failed to load report");
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
  }, [user, authLoading]);

  useEffect(() => {
    if (authLoading || !user) return;

    loadReport();
  }, [user, authLoading, clientId]);

  const handleDownloadPdf = () => {
    if (!report) return;

    generateReportPdf({
      report,
      client: selectedClient,
      startDate,
      endDate,
    });
  };

  function handleClientChange(value) {
    setClientId(value);

    if (typeof window !== "undefined") {
      if (value) {
        localStorage.setItem("reportsClientId", value);
      } else {
        localStorage.removeItem("reportsClientId");
      }
    }
  }

  const selectedClient = useMemo(() => {
    return clients.find((client) => client.id === clientId);
  }, [clients, clientId]);

  const totals = report?.totals || {};

  const clientName =
    selectedClient?.businessName ||
    report?.clientResults?.[0]?.clientName ||
    "All Clients";

  const reportTitle = selectedClient
    ? `${clientName} Performance Report`
    : "Agency Performance Report";

  async function handleCopySummary() {
    const text = buildReportSummary({
      clientName,
      startDate,
      endDate,
      totals,
    });

    try {
      await navigator.clipboard.writeText(text);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("COPY ERROR:", error);
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <main className="mx-auto max-w-[1600px] px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#2A2A2D] bg-[#151517] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400">
              <BarChart3 size={13} />
              Reports
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight">
              Performance Reports
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
              Turn your campaign data into a clean performance report for
              internal review or client updates.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
            Data from stored campaign metrics
          </div>
        </header>

        {/* ================================================= */}
        {/* FILTER BAR */}
        {/* ================================================= */}

        <section className="mt-8">
          <div className="rounded-2xl border border-[#27272A] bg-[#151517] p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Report Configuration</h2>

                <p className="mt-1 text-xs text-zinc-500">
                  Select the client and reporting period.
                </p>
              </div>

              <CalendarDays size={18} className="text-zinc-600" />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_180px_180px_150px]">
              {/* CLIENT */}

              <div>
                <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-zinc-600">
                  Client
                </label>

                <div className="relative">
                  <select
                    value={clientId}
                    onChange={(e) => handleClientChange(e.target.value)}
                    className="dashboard-input appearance-none pr-10"
                  >
                    <option value="">All Clients</option>

                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.businessName}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600"
                  />
                </div>
              </div>

              {/* START DATE */}

              <ReportDateField
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
              />

              {/* END DATE */}

              <ReportDateField
                label="End Date"
                value={endDate}
                onChange={setEndDate}
              />

              {/* REFRESH */}

              <div className="flex items-end">
                <button
                  onClick={loadReport}
                  disabled={loading}
                  className="flex h-[43px] w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw
                    size={15}
                    className={loading ? "animate-spin" : ""}
                  />

                  {loading ? "Loading..." : "Generate"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {error && (
          <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* ================================================= */}
        {/* REPORT */}
        {/* ================================================= */}

        {report && (
          <>
            {/* REPORT HEADER */}

            <section className="mt-8 overflow-hidden rounded-2xl border border-[#27272A] bg-[#151517]">
              <div className="border-b border-[#27272A] px-6 py-6 sm:px-7">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-600">
                      Lucratusagency
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                      {reportTitle}
                    </h2>

                    <p className="mt-2 flex items-center gap-2 text-sm text-zinc-500">
                      <CalendarDays size={14} />
                      {formatDate(startDate)} — {formatDate(endDate)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      disabled={!report}
                      className="inline-flex h-[43px] items-center gap-2 rounded-xl border border-[#27272A] bg-[#18181B] px-4 text-sm font-medium text-white transition hover:bg-[#222225] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Download size={16} />
                      Download PDF
                    </button>
                  </div>
                </div>
              </div>

              {/* ================================================= */}
              {/* KPI */}
              {/* ================================================= */}

              <div className="grid grid-cols-2 divide-x divide-y divide-[#27272A] lg:grid-cols-4 lg:divide-y-0">
                <ReportKPI
                  label="Ad Spend"
                  value={formatRupiah(totals.spend)}
                  icon={CircleDollarSign}
                />

                <ReportKPI
                  label="Reach"
                  value={formatNumber(totals.reach)}
                  icon={Users}
                />

                <ReportKPI
                  label="Impressions"
                  value={formatNumber(totals.impressions)}
                  icon={BarChart3}
                />

                <ReportKPI
                  label="Clicks"
                  value={formatNumber(totals.clicks)}
                  icon={MousePointerClick}
                />
              </div>
            </section>

            {/* ================================================= */}
            {/* MARKETING PERFORMANCE */}
            {/* ================================================= */}

            <section className="mt-6">
              <SectionTitle
                title="Marketing Performance"
                description="Core Meta Ads performance metrics."
              />

              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <MetricBox
                  label="CTR"
                  value={`${formatNumber(totals.ctr, 2)}%`}
                  icon={Target}
                />

                <MetricBox
                  label="CPC"
                  value={formatRupiah(totals.cpc)}
                  icon={MousePointerClick}
                />

                <MetricBox
                  label="CPM"
                  value={formatRupiah(totals.cpm)}
                  icon={CircleDollarSign}
                />

                <MetricBox
                  label="Frequency"
                  value={formatNumber(totals.frequency, 2)}
                  icon={RefreshCw}
                />
              </div>
            </section>

            {/* ================================================= */}
            {/* CONVERSION */}
            {/* ================================================= */}

            <section className="mt-8">
              <SectionTitle
                title="Conversion Performance"
                description="Campaign actions and conversion metrics."
              />

              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                <MiniMetric
                  label="Link Clicks"
                  value={formatNumber(totals.linkClicks)}
                />

                <MiniMetric
                  label="LP Views"
                  value={formatNumber(totals.landingPageViews)}
                />

                <MiniMetric label="ATC" value={formatNumber(totals.atc)} />

                <MiniMetric label="Leads" value={formatNumber(totals.leads)} />

                <MiniMetric
                  label="Purchases"
                  value={formatNumber(totals.purchases)}
                />

                <MiniMetric
                  label="Conversations"
                  value={formatNumber(totals.messagingConversations)}
                />
              </div>
            </section>

            {/* ================================================= */}
            {/* BUSINESS RESULTS */}
            {/* ================================================= */}

            <section className="mt-8">
              <SectionTitle
                title="Business Results"
                description="Business outcomes reported by the client."
              />

              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                <BusinessMetric
                  label="Qualified Leads"
                  value={formatNumber(totals.qualifiedLeads)}
                  icon={Users}
                />

                <BusinessMetric
                  label="Orders"
                  value={formatNumber(totals.orders)}
                  icon={ShoppingBag}
                />

                <BusinessMetric
                  label="Revenue"
                  value={formatRupiah(totals.revenue)}
                  icon={Wallet}
                />

                <BusinessMetric
                  label="ROAS"
                  value={`${formatNumber(totals.roas, 2)}x`}
                  icon={TrendingUp}
                />

                <BusinessMetric
                  label="Profit After Ads"
                  value={formatRupiah(totals.profitAfterAds)}
                  icon={CircleDollarSign}
                />
              </div>
            </section>

            {/* ================================================= */}
            {/* CAMPAIGN PERFORMANCE */}
            {/* ================================================= */}

            <section className="mt-10">
              <SectionTitle
                title="Campaign Performance"
                description="Performance breakdown by campaign."
              />

              <div className="overflow-hidden rounded-2xl border border-[#27272A] bg-[#151517]">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[950px] text-sm">
                    <thead>
                      <tr className="border-b border-[#27272A] bg-[#121214] text-left text-[11px] font-medium uppercase tracking-wider text-zinc-600">
                        <th className="px-5 py-4">Campaign</th>

                        <th className="px-5 py-4">Spend</th>

                        <th className="px-5 py-4">Reach</th>

                        <th className="px-5 py-4">Clicks</th>

                        <th className="px-5 py-4">CTR</th>

                        <th className="px-5 py-4">CPC</th>

                        <th className="px-5 py-4">ATC</th>

                        <th className="px-5 py-4">Purchases</th>
                      </tr>
                    </thead>

                    <tbody>
                      {!report.campaigns?.length ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-5 py-12 text-center text-sm text-zinc-600"
                          >
                            No campaign data available for this period.
                          </td>
                        </tr>
                      ) : (
                        report.campaigns.map((campaign) => (
                          <tr
                            key={campaign.campaignId}
                            className="border-b border-[#27272A] last:border-0 transition hover:bg-[#19191C]"
                          >
                            <td className="max-w-[260px] px-5 py-4">
                              <div className="truncate font-medium text-white">
                                {campaign.campaignName}
                              </div>

                              <div className="mt-1 text-[10px] text-zinc-600">
                                {campaign.budgetShare
                                  ? `${formatNumber(
                                      campaign.budgetShare,
                                      1,
                                    )}% of spend`
                                  : "-"}
                              </div>
                            </td>

                            <td className="px-5 py-4 font-medium">
                              {formatRupiah(campaign.spend)}
                            </td>

                            <td className="px-5 py-4 text-zinc-400">
                              {formatNumber(campaign.reach)}
                            </td>

                            <td className="px-5 py-4 text-zinc-300">
                              {formatNumber(campaign.clicks)}
                            </td>

                            <td className="px-5 py-4">
                              {formatNumber(campaign.ctr, 2)}%
                            </td>

                            <td className="px-5 py-4 text-zinc-400">
                              {formatRupiah(campaign.cpc)}
                            </td>

                            <td className="px-5 py-4 text-zinc-300">
                              {formatNumber(campaign.atc)}
                            </td>

                            <td className="px-5 py-4 font-medium">
                              {formatNumber(campaign.purchases)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* ================================================= */}
            {/* DAILY PERFORMANCE */}
            {/* ================================================= */}

            <section className="mt-10">
              <SectionTitle
                title="Daily Performance"
                description="Daily spend and campaign activity."
              />

              <div className="overflow-hidden rounded-2xl border border-[#27272A] bg-[#151517]">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-sm">
                    <thead>
                      <tr className="border-b border-[#27272A] bg-[#121214] text-left text-[11px] font-medium uppercase tracking-wider text-zinc-600">
                        <th className="px-5 py-4">Date</th>

                        <th className="px-5 py-4">Spend</th>

                        <th className="px-5 py-4">Impressions</th>

                        <th className="px-5 py-4">Reach</th>

                        <th className="px-5 py-4">Clicks</th>

                        <th className="px-5 py-4">CTR</th>

                        <th className="px-5 py-4">ATC</th>
                      </tr>
                    </thead>

                    <tbody>
                      {!report.daily?.length ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-5 py-12 text-center text-sm text-zinc-600"
                          >
                            No daily data available.
                          </td>
                        </tr>
                      ) : (
                        report.daily.map((day) => (
                          <tr
                            key={day.date}
                            className="border-b border-[#27272A] last:border-0 hover:bg-[#19191C]"
                          >
                            <td className="px-5 py-4 font-medium text-white">
                              {formatDate(day.date)}
                            </td>

                            <td className="px-5 py-4">
                              {formatRupiah(day.spend)}
                            </td>

                            <td className="px-5 py-4 text-zinc-400">
                              {formatNumber(day.impressions)}
                            </td>

                            <td className="px-5 py-4 text-zinc-400">
                              {formatNumber(day.reach)}
                            </td>

                            <td className="px-5 py-4">
                              {formatNumber(day.clicks)}
                            </td>

                            <td className="px-5 py-4">
                              {formatNumber(day.ctr, 2)}%
                            </td>

                            <td className="px-5 py-4">
                              {formatNumber(day.atc)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* ================================================= */}
            {/* REPORT SUMMARY */}
            {/* ================================================= */}

            <section className="mt-10">
              <div className="rounded-2xl border border-[#27272A] bg-[#151517] p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-600">
                      Executive Summary
                    </p>

                    <h2 className="mt-2 text-lg font-semibold">
                      Performance Snapshot
                    </h2>

                    <p className="mt-1 text-xs text-zinc-500">
                      A quick summary of the selected reporting period.
                    </p>
                  </div>

                  <button
                    onClick={handleCopySummary}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#2A2A2D] bg-[#0D0D0D] px-4 py-2.5 text-xs font-medium text-zinc-300 transition hover:border-[#3A3A3D] hover:text-white"
                  >
                    {copied ? (
                      <>
                        <Check size={14} />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Copy Summary
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <SummaryLine
                    label="Total Ad Spend"
                    value={formatRupiah(totals.spend)}
                  />

                  <SummaryLine
                    label="Total Clicks"
                    value={formatNumber(totals.clicks)}
                  />

                  <SummaryLine
                    label="CTR"
                    value={`${formatNumber(totals.ctr, 2)}%`}
                  />

                  <SummaryLine
                    label="Leads"
                    value={formatNumber(totals.leads)}
                  />

                  <SummaryLine
                    label="Orders"
                    value={formatNumber(totals.orders)}
                  />

                  <SummaryLine
                    label="Revenue"
                    value={formatRupiah(totals.revenue)}
                  />
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

/* ============================================================= */
/* COMPONENTS */
/* ============================================================= */

function ReportDateField({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-zinc-600">
        {label}
      </label>

      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="dashboard-input"
      />
    </div>
  );
}

function ReportKPI({ label, value, icon: Icon }) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">{label}</p>

        <Icon size={16} className="text-zinc-700" />
      </div>

      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function MetricBox({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-[#27272A] bg-[#151517] p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">{label}</p>

        <Icon size={16} className="text-zinc-700" />
      </div>

      <p className="mt-3 text-xl font-semibold">{value}</p>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-xl border border-[#27272A] bg-[#151517] p-4">
      <p className="text-[11px] text-zinc-600">{label}</p>

      <p className="mt-2 text-base font-semibold">{value}</p>
    </div>
  );
}

function BusinessMetric({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-[#27272A] bg-[#151517] p-5">
      <div className="flex items-center gap-2">
        <Icon size={15} className="text-zinc-600" />

        <p className="text-xs text-zinc-500">{label}</p>
      </div>

      <p className="mt-3 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function SectionTitle({ title, description }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold">{title}</h2>

      <p className="mt-1 text-xs text-zinc-500">{description}</p>
    </div>
  );
}

function SummaryLine({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#27272A] bg-[#0D0D0D] px-4 py-3">
      <span className="text-xs text-zinc-500">{label}</span>

      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

/* ============================================================= */
/* HELPERS */
/* ============================================================= */

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getFirstDayOfCurrentMonth() {
  const date = new Date();

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-01`;
}

function formatNumber(value, decimals = 0) {
  return Number(value || 0).toLocaleString("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatRupiah(value) {
  return `Rp${Number(value || 0).toLocaleString("id-ID", {
    maximumFractionDigits: 0,
  })}`;
}

function formatDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function buildReportSummary({ clientName, startDate, endDate, totals }) {
  return `LUCRATUSAGENCY
Performance Report

Client: ${clientName}
Period: ${formatDate(startDate)} - ${formatDate(endDate)}

PERFORMANCE
Ad Spend: ${formatRupiah(totals.spend)}
Impressions: ${formatNumber(totals.impressions)}
Reach: ${formatNumber(totals.reach)}
Clicks: ${formatNumber(totals.clicks)}
CTR: ${formatNumber(totals.ctr, 2)}%
CPC: ${formatRupiah(totals.cpc)}
CPM: ${formatRupiah(totals.cpm)}

CONVERSIONS
Link Clicks: ${formatNumber(totals.linkClicks)}
Landing Page Views: ${formatNumber(totals.landingPageViews)}
ATC: ${formatNumber(totals.atc)}
Leads: ${formatNumber(totals.leads)}
Purchases: ${formatNumber(totals.purchases)}

BUSINESS RESULTS
Qualified Leads: ${formatNumber(totals.qualifiedLeads)}
Orders: ${formatNumber(totals.orders)}
Revenue: ${formatRupiah(totals.revenue)}
ROAS: ${formatNumber(totals.roas, 2)}x
Profit After Ads: ${formatRupiah(totals.profitAfterAds)}
`;
}
