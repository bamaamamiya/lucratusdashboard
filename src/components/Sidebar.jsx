"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserRound,
  Wallet,
  Megaphone,
  ChartColumn,
  ClipboardList,
  FileText,
  LogOut,
  Loader2,
  Receipt,
  Package,
} from "lucide-react";
import { useState } from "react";

import { logout } from "@/lib/auth";

const menus = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/products",
    label: "Products",
    icon: Package,
  },
  {
    href: "/leads",
    label: "Leads",
    icon: UserRound,
  },
  {
    href: "/clients",
    label: "Clients",
    icon: Users,
  },
  {
    href: "/ad-accounts",
    label: "Ad Accounts",
    icon: Wallet,
  },
  {
    href: "/campaigns",
    label: "Campaigns",
    icon: Megaphone,
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: ChartColumn,
  },
  {
    href: "/client-results",
    label: "Client Results",
    icon: ClipboardList,
  },
  {
    href: "/client-billing",
    label: "Client Billing",
    icon: Receipt,
  },
  {
    href: "/reports",
    label: "Reports",
    icon: FileText,
  },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    try {
      setLoggingOut(true);

      await logout();

      router.replace("/login");
    } catch (error) {
      console.error("LOGOUT_ERROR:", error);

      alert(error.message || "Failed to logout");

      setLoggingOut(false);
    }
  }

  function isActive(href) {
    if (href === "/") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="w-64 min-h-screen shrink-0 bg-[#18181B] border-r border-[#27272A] p-5 flex flex-col">
      {/* LOGO */}
      <div className="px-3 py-4 mb-7">
        <h1 className="text-xl font-bold tracking-[0.08em]">
          LUCRATUS
        </h1>

        <p className="text-xs text-zinc-500 mt-1">
          Agency Analytics
        </p>
      </div>

      {/* MENU */}
      <nav className="space-y-1 flex-1">
        {menus.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group
                flex items-center gap-3
                px-3 py-2.5
                rounded-xl
                text-sm
                transition
                ${
                  active
                    ? "bg-[#2A2A2D] text-white"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }
              `}
            >
              <Icon
                size={18}
                strokeWidth={active ? 2.2 : 1.8}
                className={
                  active
                    ? "text-white"
                    : "text-zinc-500 group-hover:text-white"
                }
              />

              <span
                className={active ? "font-medium" : "font-normal"}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* LOGOUT */}
      <div className="pt-4 border-t border-[#27272A] flex justify-end">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title="Logout"
          aria-label="Logout"
          className="
            w-10 h-10
            flex items-center justify-center
            rounded-xl
            text-zinc-400
            hover:text-white
            hover:bg-zinc-800
            transition
            disabled:opacity-50
          "
        >
          {loggingOut ? (
            <Loader2
              size={18}
              className="animate-spin"
            />
          ) : (
            <LogOut size={18} />
          )}
        </button>
      </div>
    </aside>
  );
}