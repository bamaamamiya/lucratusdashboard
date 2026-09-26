"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Megaphone,
  Wallet,
  Receipt,
  ArrowUpRight,
  AlertCircle,
  Activity,
  RefreshCw,
  CalendarDays,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatNumber(value) {
  return new Intl.NumberFormat("id-ID").format(Number(value || 0));
}

function getCurrentPeriod() {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatPeriod(period) {
  if (!period) return "-";

  const [year, month] = period.split("-");

  const date = new Date(Number(year), Number(month) - 1, 1);

  return date.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
}

function getClientStatus(client) {
  if (client.status !== "active") {
    return {
      label: "Paused",
      className: "bg-zinc-800 text-zinc-400 border-zinc-700",
    };
  }

  if (client.outstanding > 0) {
    return {
      label: "Attention",
      className: "bg-zinc-800 text-zinc-300 border-zinc-600",
    };
  }

  if (client.runningCampaigns > 0) {
    return {
      label: "Running",
      className: "bg-zinc-800 text-white border-zinc-600",
    };
  }

  return {
    label: "Active",
    className: "bg-zinc-800 text-zinc-400 border-zinc-700",
  };
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();

  const [period, setPeriod] = useState(getCurrentPeriod());

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadDashboard(selectedPeriod = period, isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      if (!user) {
        throw new Error("You are not logged in");
      }

      const token = await user.getIdToken();

      const response = await fetch(`/api/dashboard?period=${selectedPeriod}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load dashboard");
      }

      setData(result.data);
    } catch (error) {
      console.error("DASHBOARD_LOAD_ERROR:", error);

      setError(error.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
  if (authLoading) return;

  if (!user) {
    setError("You are not logged in");
    setLoading(false);
    return;
  }

  loadDashboard(period);
}, [authLoading, user, period]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0D0D0D] text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-[#2A2A2D] rounded-lg" />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-32 bg-[#18181B] border border-[#27272A] rounded-2xl"
                />
              ))}
            </div>

            <div className="h-96 bg-[#18181B] border border-[#27272A] rounded-2xl" />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#0D0D0D] text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="border border-[#27272A] bg-[#18181B] rounded-2xl p-8 text-center">
            <AlertCircle size={32} className="mx-auto mb-3 text-zinc-500" />

            <h2 className="text-lg font-semibold">Failed to load dashboard</h2>

            <p className="text-sm text-zinc-500 mt-2">{error}</p>

            <button
              onClick={() => loadDashboard(period, true)}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black text-sm font-medium hover:bg-zinc-200 transition"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="border border-[#27272A] bg-[#18181B] rounded-2xl p-8 text-center">
          <Activity
            size={32}
            className="mx-auto mb-3 text-zinc-500"
          />

          <h2 className="text-lg font-semibold">
            No dashboard data
          </h2>

          <p className="text-sm text-zinc-500 mt-2">
            Dashboard data is not available yet.
          </p>

          <button
            onClick={() => loadDashboard(period, true)}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black text-sm font-medium hover:bg-zinc-200 transition"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    </main>
  );
}

  const { clients, marketing, business, finance } = data;

  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              Agency Command Center
            </p>

            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">
              Dashboard
            </h1>

            <p className="text-sm text-zinc-500 mt-1">
              Overview of Lucratus agency performance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-[#18181B] border border-[#27272A] rounded-xl px-3">
              <CalendarDays size={16} className="text-zinc-500" />

              <input
                type="month"
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
                className="bg-transparent text-sm text-white outline-none py-2.5"
              />
            </div>

            <button
              onClick={() => loadDashboard(period, true)}
              disabled={refreshing}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-[#27272A] bg-[#18181B] hover:bg-[#222225] transition disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>
          </div>
        </header>

        {/* PERIOD */}
        <div className="text-sm text-zinc-500">
          Showing data for{" "}
          <span className="text-zinc-300">{formatPeriod(period)}</span>
        </div>

        {/* TOP CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard
            icon={Users}
            label="Active Clients"
            value={clients.active}
            secondary={`of ${clients.total} total`}
          />

          <MetricCard
            icon={Megaphone}
            label="Meta Ad Spend"
            value={formatRupiah(marketing.metaAdSpend)}
            secondary={`${marketing.activeCampaigns} active campaigns`}
          />

          <MetricCard
            icon={Receipt}
            label="Service Revenue"
            value={formatRupiah(finance.serviceRevenue)}
            secondary="Agency service fees"
          />

          <MetricCard
            icon={Wallet}
            label="Outstanding"
            value={formatRupiah(finance.outstanding)}
            secondary={`${formatRupiah(finance.amountPaid)} paid`}
            attention={finance.outstanding > 0}
          />
        </section>

        {/* MARKETING + FINANCE */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* MARKETING */}
          <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-500">
                  Marketing
                </p>

                <h2 className="text-lg font-semibold mt-1">
                  Campaign Activity
                </h2>
              </div>

              <div className="w-9 h-9 rounded-xl bg-[#2A2A2D] flex items-center justify-center">
                <Activity size={17} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <MiniMetric
                label="Ad Spend"
                value={formatRupiah(marketing.metaAdSpend)}
              />

              <MiniMetric
                label="Active Campaigns"
                value={formatNumber(marketing.activeCampaigns)}
              />

              <MiniMetric
                label="Impressions"
                value={formatNumber(marketing.impressions)}
              />

              <MiniMetric
                label="Clicks"
                value={formatNumber(marketing.clicks)}
              />

              <MiniMetric label="Reach" value={formatNumber(marketing.reach)} />
            </div>
          </div>

          {/* FINANCE */}
          <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-500">
                  Finance
                </p>

                <h2 className="text-lg font-semibold mt-1">Billing Overview</h2>
              </div>

              <div className="w-9 h-9 rounded-xl bg-[#2A2A2D] flex items-center justify-center">
                <Wallet size={17} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <MiniMetric
                label="Service Revenue"
                value={formatRupiah(finance.serviceRevenue)}
              />

              <MiniMetric
                label="Total Billed"
                value={formatRupiah(finance.totalBilled)}
              />

              <MiniMetric
                label="Paid"
                value={formatRupiah(finance.amountPaid)}
              />

              <MiniMetric
                label="Outstanding"
                value={formatRupiah(finance.outstanding)}
              />
            </div>
          </div>
        </section>

        {/* BUSINESS PERFORMANCE */}
        <section className="bg-[#18181B] border border-[#27272A] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                Business Results
              </p>

              <h2 className="text-lg font-semibold mt-1">Client Performance</h2>
            </div>

            <span className="text-xs text-zinc-500">Reported by clients</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MiniMetric
              label="Revenue Generated"
              value={formatRupiah(business.revenue)}
            />

            <MiniMetric label="Orders" value={formatNumber(business.orders)} />

            <MiniMetric
              label="Gross Profit"
              value={formatRupiah(business.grossProfit)}
            />
          </div>
        </section>

        {/* CLIENT OVERVIEW */}
        <section className="bg-[#18181B] border border-[#27272A] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[#27272A] flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                Clients
              </p>

              <h2 className="text-lg font-semibold mt-1">Client Overview</h2>
            </div>

            <span className="text-xs text-zinc-500">
              {data.clientOverview.length} clients
            </span>
          </div>

          {data.clientOverview.length === 0 ? (
            <div className="p-10 text-center text-sm text-zinc-500">
              No clients found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-zinc-500 border-b border-[#27272A]">
                    <th className="px-5 py-3 font-medium">Client</th>

                    <th className="px-5 py-3 font-medium">Campaigns</th>

                    <th className="px-5 py-3 font-medium">Ad Spend</th>

                    <th className="px-5 py-3 font-medium">Revenue</th>

                    <th className="px-5 py-3 font-medium">Orders</th>

                    <th className="px-5 py-3 font-medium">Outstanding</th>

                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {data.clientOverview.map((client) => {
                    const status = getClientStatus(client);

                    return (
                      <tr
                        key={client.id}
                        className="border-b border-[#27272A] last:border-0 hover:bg-[#202023] transition"
                      >
                        <td className="px-5 py-4">
                          <div className="font-medium text-white">
                            {client.name}
                          </div>

                          <div className="text-xs text-zinc-500 mt-0.5">
                            {client.status}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-zinc-300">
                          {client.runningCampaigns}
                        </td>

                        <td className="px-5 py-4 text-zinc-300">
                          {formatRupiah(client.spend)}
                        </td>

                        <td className="px-5 py-4 text-zinc-300">
                          {formatRupiah(client.revenue)}
                        </td>

                        <td className="px-5 py-4 text-zinc-300">
                          {formatNumber(client.orders)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={
                              client.outstanding > 0
                                ? "text-zinc-200"
                                : "text-zinc-500"
                            }
                          >
                            {formatRupiah(client.outstanding)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ATTENTION */}
        <section className="bg-[#18181B] border border-[#27272A] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[#27272A] flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                Attention
              </p>

              <h2 className="text-lg font-semibold mt-1">
                Needs Your Attention
              </h2>
            </div>

            {data.alerts?.length > 0 && (
              <span className="text-xs text-zinc-400">
                {data.alerts.length} issue
                {data.alerts.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {!data.alerts || data.alerts.length === 0 ? (
            <div className="p-6 flex items-center gap-3 text-sm text-zinc-500">
              <Activity size={17} />
              No immediate issues detected.
            </div>
          ) : (
            <div className="divide-y divide-[#27272A]">
              {data.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-5 flex items-center justify-between gap-4 hover:bg-[#202023] transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#2A2A2D] flex items-center justify-center">
                      <AlertCircle size={17} className="text-zinc-400" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">
                          {alert.title}
                        </p>

                        <span
                          className={`
                    text-[10px]
                    uppercase
                    tracking-wider
                    px-2
                    py-0.5
                    rounded-md
                    border
                    ${
                      alert.priority === "high"
                        ? "border-zinc-500 text-zinc-200"
                        : "border-zinc-700 text-zinc-500"
                    }
                  `}
                        >
                          {alert.priority}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-500 mt-1">
                        {alert.description}
                      </p>
                    </div>
                  </div>

                  <ArrowUpRight size={17} className="text-zinc-600 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  secondary,
  attention = false,
}) {
  return (
    <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl bg-[#2A2A2D] flex items-center justify-center">
          <Icon size={17} />
        </div>

        {attention && <span className="text-xs text-zinc-400">Attention</span>}
      </div>

      <p className="text-xs text-zinc-500 mt-5">{label}</p>

      <p className="text-2xl font-semibold tracking-tight mt-1">{value}</p>

      <p className="text-xs text-zinc-600 mt-1">{secondary}</p>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="bg-[#202023] border border-[#2A2A2D] rounded-xl p-4">
      <p className="text-xs text-zinc-500">{label}</p>

      <p className="text-base font-semibold text-white mt-1">{value}</p>
    </div>
  );
}
