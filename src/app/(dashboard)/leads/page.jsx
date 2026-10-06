"use client";

import { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Search,
  Users,
  UserCheck,
  UserPlus,
  CalendarCheck,
  ChevronRight,
} from "lucide-react";

import { getLeads } from "@/lib/leadService";

const FILTERS = [
  { key: "all", label: "All Leads" },
  { key: "qualified", label: "Qualified" },
  { key: "not_qualified", label: "Not Qualified" },
];

function formatDate(timestamp) {
  if (!timestamp) return "-";

  try {
    const date = timestamp.toDate
      ? timestamp.toDate()
      : new Date(timestamp);

    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

function QualificationBadge({ qualified }) {
  if (qualified === true) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
        Qualified
      </span>
    );
  }

  if (qualified === false) {
    return (
      <span className="inline-flex items-center rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-500">
        Not Qualified
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
      Review
    </span>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-[#27272A] bg-[#18181B] p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-500">{label}</p>

          <p className="mt-2 text-2xl font-bold tracking-tight">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 text-zinc-400">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadLeads(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getLeads();

      setLeads(data);
    } catch (error) {
      console.error("LOAD_LEADS_ERROR:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  const stats = useMemo(() => {
    const qualified = leads.filter(
      (lead) => lead.qualified === true
    ).length;

    const newLeads = leads.filter(
      (lead) => !lead.salesStage || lead.salesStage === "new"
    ).length;

    const booked = leads.filter(
      (lead) => lead.salesStage === "call_booked"
    ).length;

    return {
      all: leads.length,
      qualified,
      newLeads,
      booked,
    };
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return leads.filter((lead) => {
      const matchesSearch =
        !keyword ||
        `${lead.name || ""} ${lead.email || ""} ${
          lead.whatsapp || ""
        } ${lead.businessType || ""} ${lead.product || ""}`
          .toLowerCase()
          .includes(keyword);

      const matchesFilter =
        filter === "all" ||
        (filter === "qualified" && lead.qualified === true) ||
        (filter === "not_qualified" && lead.qualified === false);

      return matchesSearch && matchesFilter;
    });
  }, [leads, search, filter]);

  return (
    <div className="flex min-h-screen bg-[#0D0D0D] text-white">
      <main className="flex-1 p-8">
        {/* HEADER */}

        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-500">
              Growth Audit
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              Leads
            </h1>
          </div>

          <button
            onClick={() => loadLeads(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-[#27272A] bg-[#18181B] px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={refreshing ? "animate-spin" : ""}
            />

            Refresh
          </button>
        </div>

        {/* STATS */}

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Users}
            label="All Leads"
            value={stats.all}
          />

          <StatCard
            icon={UserCheck}
            label="Qualified"
            value={stats.qualified}
          />

          <StatCard
            icon={UserPlus}
            label="New"
            value={stats.newLeads}
          />

          <StatCard
            icon={CalendarCheck}
            label="Calls Booked"
            value={stats.booked}
          />
        </div>

        {/* SEARCH */}

        <div className="mb-5 flex items-center gap-3 rounded-xl border border-[#27272A] bg-[#18181B] px-4">
          <Search
            size={18}
            className="text-zinc-500"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads..."
            className="w-full bg-transparent py-3 outline-none placeholder:text-zinc-600"
          />
        </div>

        {/* FILTER */}

        <div className="mb-6 flex gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`rounded-xl px-4 py-2 text-sm transition ${
                filter === item.key
                  ? "bg-white text-black"
                  : "border border-[#27272A] bg-[#18181B] text-zinc-500 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* TABLE */}

        <div className="overflow-hidden rounded-2xl border border-[#27272A] bg-[#18181B]">
          <div className="hidden grid-cols-[1.4fr_1fr_1fr_1fr_0.8fr_40px] gap-4 border-b border-[#27272A] px-5 py-4 text-xs font-medium uppercase tracking-wider text-zinc-600 md:grid">
            <span>Lead</span>
            <span>Business</span>
            <span>Revenue</span>
            <span>Investment</span>
            <span>Fit</span>
            <span />
          </div>

          {loading ? (
            <div className="py-20 text-center text-sm text-zinc-600">
              Loading leads...
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-sm text-zinc-500">
                No leads found.
              </p>

              <p className="mt-1 text-xs text-zinc-700">
                New Growth Audit submissions will appear here.
              </p>
            </div>
          ) : (
            filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className="group border-b border-[#27272A] px-5 py-5 transition last:border-b-0 hover:bg-white/[0.02]"
              >
                <div className="grid items-center gap-4 md:grid-cols-[1.4fr_1fr_1fr_1fr_0.8fr_40px]">
                  {/* LEAD */}

                  <div>
                    <div className="font-medium">
                      {lead.name || "Unknown"}
                    </div>

                    <div className="mt-1 text-xs text-zinc-600">
                      {lead.email || lead.whatsapp || "-"}
                    </div>

                    <div className="mt-1 text-xs text-zinc-700">
                      {formatDate(lead.createdAt)}
                    </div>
                  </div>

                  {/* BUSINESS */}

                  <div>
                    <p className="text-sm text-zinc-300">
                      {lead.businessType || "-"}
                    </p>

                    <p className="mt-1 truncate text-xs text-zinc-600">
                      {lead.product || "-"}
                    </p>
                  </div>

                  {/* REVENUE */}

                  <div className="text-sm text-zinc-300">
                    {lead.monthlyRevenue || "-"}
                  </div>

                  {/* INVESTMENT */}

                  <div className="text-sm text-zinc-300">
                    {lead.investment || "-"}
                  </div>

                  {/* QUALIFICATION */}

                  <div>
                    <QualificationBadge
                      qualified={lead.qualified}
                    />

                    {typeof lead.qualificationScore ===
                      "number" && (
                      <p className="mt-2 text-xs text-zinc-600">
                        Score {lead.qualificationScore}
                      </p>
                    )}
                  </div>

                  {/* ACTION */}

                  <button
                    className="hidden text-zinc-600 transition hover:text-white md:block"
                    title="View lead"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}