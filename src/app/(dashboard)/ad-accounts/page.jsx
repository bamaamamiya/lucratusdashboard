"use client";

import { useEffect, useState } from "react";
import { Plus, Search, MoreHorizontal, Wallet, RefreshCw } from "lucide-react";

import {
  getAdAccounts,
  createAdAccount,
  removeAdAccount,
} from "@/lib/adAccountService";

import { auth } from "@/lib/firebase";

export default function AdAccountsPage() {
  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [syncing, setSyncing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    metaId: "",
    currency: "IDR",
  });

  async function syncAccount(account) {
    try {
      setSyncing(account.id);

      console.log("========== META SYNC START ==========");
      console.log("ACCOUNT FROM FIRESTORE:", account);

      const user = auth.currentUser;

      console.log("CURRENT USER:", {
        uid: user?.uid,
        email: user?.email,
      });

      if (!user) {
        throw new Error("You must be logged in to sync.");
      }

      const token = await user.getIdToken();

      console.log("ID TOKEN EXISTS:", !!token);
      console.log("META ACCOUNT ID SENT:", account.id);

      const requestBody = {
        adAccountId: account.id,
        startDate,
        endDate,
      };

      console.log("REQUEST BODY:", requestBody);

      const response = await fetch("/api/meta/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log("HTTP STATUS:", response.status);
      console.log("HTTP OK:", response.ok);

      const data = await response.json();

      console.log("API RESPONSE:", data);
      console.log("SYNCED COUNT:", data.synced);
      console.log("RETURNED DATA:", data.data);

      if (!response.ok) {
        throw new Error(data.error || "Sync failed");
      }

      console.log("========== META SYNC END ==========");

      alert(`Synced ${data.synced} campaigns`);
    } catch (error) {
      console.error("SYNC_ACCOUNT_ERROR:", error);
      console.error("SYNC_ACCOUNT_ERROR_MESSAGE:", error.message);

      alert(error.message || "Sync failed");
    } finally {
      setSyncing(null);
    }
  }

  async function loadAccounts() {
    const data = await getAdAccounts();
    setAccounts(data);
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name || !form.metaId) return;

    await createAdAccount({
      ...form,
      metaId: form.metaId.replace("act_", ""),
      status: "active",
    });

    setForm({
      name: "",
      metaId: "",
      currency: "IDR",
    });

    setOpen(false);
    await loadAccounts();
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("Delete this ad account?");

    if (!confirmed) return;

    await removeAdAccount(id);
    await loadAccounts();
  }

  const filtered = accounts.filter((account) =>
    `${account.name} ${account.metaId}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="flex min-h-screen bg-[#0D0D0D] text-white">
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm text-zinc-500">Meta infrastructure</p>

            <h1 className="text-3xl font-bold mt-1">Ad Accounts</h1>
          </div>

          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-xl font-medium hover:bg-zinc-200 transition"
          >
            <Plus size={18} />
            Add Account
          </button>
        </div>

        <div className="flex items-center gap-3 bg-[#18181B] border border-[#27272A] rounded-xl px-4 mb-6">
          <Search size={18} className="text-zinc-500" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ad accounts..."
            className="w-full bg-transparent py-3 outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Start</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-500 block mb-1">End</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2"
            />
          </div>
        </div>

        <div className="grid gap-4">
          {filtered.map((account) => (
            <div
              key={account.id}
              className="bg-[#18181B] border border-[#27272A] rounded-2xl p-5 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center">
                  <Wallet size={20} />
                </div>

                <div>
                  <h3 className="font-semibold">{account.name}</h3>

                  <p className="text-sm text-zinc-500 mt-1">
                    act_{account.metaId}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
                  {account.status}
                </span>

                <span className="text-sm text-zinc-500">
                  {account.currency}
                </span>

                <button
                  onClick={() => syncAccount(account)}
                  disabled={syncing === account.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition disabled:opacity-50"
                >
                  <RefreshCw
                    size={16}
                    className={syncing === account.id ? "animate-spin" : ""}
                  />

                  {syncing === account.id ? "Syncing..." : "Sync"}
                </button>

                <button
                  onClick={() => handleDelete(account.id)}
                  className="text-zinc-500 hover:text-white"
                >
                  <MoreHorizontal size={20} />
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-20 text-zinc-500">
              No ad accounts found.
            </div>
          )}
        </div>

        {open && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-5">
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-md bg-[#18181B] border border-[#27272A] rounded-2xl p-6"
            >
              <h2 className="text-xl font-bold">Add Ad Account</h2>

              <p className="text-sm text-zinc-500 mt-1 mb-6">
                Connect a Meta ad account.
              </p>

              <div className="space-y-4">
                <input
                  required
                  value={form.name}
                  placeholder="Account name"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 outline-none"
                />

                <input
                  required
                  value={form.metaId}
                  placeholder="Ad Account ID — act_123456"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      metaId: e.target.value,
                    })
                  }
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 outline-none"
                />

                <select
                  value={form.currency}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      currency: e.target.value,
                    })
                  }
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 outline-none"
                >
                  <option value="IDR">IDR</option>

                  <option value="USD">USD</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 border border-zinc-700 rounded-xl py-3"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex-1 bg-white text-black rounded-xl py-3 font-semibold"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
