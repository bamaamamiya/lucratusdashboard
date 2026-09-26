"use client";

import {
  Building2,
  Phone,
  Megaphone,
  ChevronRight,
} from "lucide-react";

export default function ClientCard({
  client,
  onClick,
}) {
  const isActive = client.status === "active";

  return (
    <button
      type="button"
      onClick={() => onClick(client)}
      className="
        group
        relative
        w-full
        text-left
        bg-card
        border border-border
        rounded-2xl
        p-5
        transition-all
        duration-200
        hover:border-zinc-600
        hover:bg-zinc-900/40
        focus:outline-none
        focus:border-zinc-500
      "
    >
      {/* Top */}
      <div className="flex items-start justify-between">
        <div className="
          w-11 h-11
          rounded-xl
          bg-zinc-800
          border border-zinc-700/50
          flex items-center justify-center
        ">
          <Building2
            size={19}
            className="text-zinc-300"
          />
        </div>

        <div
          className={`
            flex items-center gap-1.5
            px-2.5 py-1
            rounded-full
            text-[11px]
            font-medium
            border
            ${
              isActive
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-zinc-500/10 text-zinc-400 border-zinc-700"
            }
          `}
        >
          <span
            className={`
              w-1.5 h-1.5
              rounded-full
              ${
                isActive
                  ? "bg-emerald-400"
                  : "bg-zinc-500"
              }
            `}
          />

          {isActive ? "Active" : "Inactive"}
        </div>
      </div>

      {/* Business */}
      <div className="mt-5">
        <h3 className="text-base font-semibold text-white truncate">
          {client.businessName || "Unnamed Business"}
        </h3>

        <p className="text-sm text-zinc-500 mt-1 truncate">
          {client.owner || "No contact assigned"}
        </p>
      </div>

      {/* Details */}
      <div className="mt-5 space-y-3">
        {client.phone && (
          <div className="flex items-center gap-2.5 text-sm text-zinc-400">
            <Phone
              size={14}
              className="text-zinc-600 shrink-0"
            />

            <span className="truncate">
              {client.phone}
            </span>
          </div>
        )}

        {client.adAccountId && (
          <div className="flex items-center gap-2.5 text-sm text-zinc-400">
            <Megaphone
              size={14}
              className="text-zinc-600 shrink-0"
            />

            <span className="truncate">
              {client.adAccountId}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="
        mt-5
        pt-4
        border-t border-zinc-800
        flex items-center justify-between
      ">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-600">
            Service
          </p>

          <p className="text-xs font-medium text-zinc-300 mt-1">
            {client.productName || "No service"}
          </p>
        </div>

        <div className="
          w-8 h-8
          rounded-lg
          flex items-center justify-center
          text-zinc-600
          group-hover:text-white
          group-hover:bg-zinc-800
          transition
        ">
          <ChevronRight size={16} />
        </div>
      </div>
    </button>
  );
}