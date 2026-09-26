"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex bg-[#0D0D0D] text-white">
        <Sidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </ProtectedRoute>
  );
}