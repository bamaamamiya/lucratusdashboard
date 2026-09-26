"use client";

import { useEffect, useMemo, useState } from "react";

import { Plus, Search, Megaphone, Trash2 } from "lucide-react";


import { getClients } from "@/lib/clientService";
import { getAdAccounts } from "@/lib/adAccountService";

import {
  getCampaigns,
  createCampaign,
  removeCampaign,
} from "@/lib/campaignService";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [clients, setClients] = useState([]);
  const [accounts, setAccounts] = useState([]);

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    clientId: "",
    adAccountId: "",
    metaCampaignId: "",
    campaignName: "",
    status: "ACTIVE",
  });

  async function loadData() {
    const [campaignData, clientData, accountData] = await Promise.all([
      getCampaigns(),
      getClients(),
      getAdAccounts(),
    ]);

    setCampaigns(campaignData);
    setClients(clientData);
    setAccounts(accountData);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.clientId || !form.adAccountId || !form.metaCampaignId) {
      return;
    }

    const client = clients.find((item) => item.id === form.clientId);

    const account = accounts.find((item) => item.id === form.adAccountId);

    await createCampaign({
      ...form,

      metaCampaignId: form.metaCampaignId.trim(),

      clientName: client?.businessName || "",

      adAccountName: account?.name || "",
    });

    setForm({
      clientId: "",
      adAccountId: "",
      metaCampaignId: "",
      campaignName: "",
      status: "ACTIVE",
    });

    setOpen(false);

    await loadData();
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("Delete campaign mapping?");

    if (!confirmed) return;

    await removeCampaign(id);
    await loadData();
  }

  const filtered = useMemo(() => {
    const term = search.toLowerCase();

    return campaigns.filter((campaign) =>
      [
        campaign.campaignName,
        campaign.clientName,
        campaign.adAccountName,
        campaign.metaCampaignId,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [campaigns, search]);

  return (
      <div className="flex min-h-screen bg-[#0D0D0D] text-white">

        <main className="flex-1 p-8">
          {/* HEADER */}

          <div className="flex justify-between items-center mb-8">
            <div>
              <p className="text-sm text-zinc-500">
                Client → Ad Account → Meta Campaign
              </p>

              <h1 className="text-3xl font-bold mt-1">Campaigns</h1>
            </div>

            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-xl font-semibold"
            >
              <Plus size={18} />
              Link Campaign
            </button>
          </div>

          {/* SEARCH */}

          <div className="flex items-center gap-3 bg-[#18181B] border border-[#27272A] rounded-xl px-4 mb-6">
            <Search size={18} className="text-zinc-500" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search campaign, client..."
              className="w-full bg-transparent py-3 outline-none"
            />
          </div>

          {/* TABLE */}

          <div className="bg-[#18181B] border border-[#27272A] rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1.2fr_80px] px-5 py-3 border-b border-[#27272A] text-xs text-zinc-500">
              <span>CAMPAIGN</span>
              <span>CLIENT</span>
              <span>AD ACCOUNT</span>
              <span>META ID</span>
              <span></span>
            </div>

            {filtered.map((campaign) => (
              <div
                key={campaign.id}
                className="grid grid-cols-[1.5fr_1fr_1fr_1.2fr_80px] px-5 py-4 border-b border-[#27272A] items-center"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center">
                    <Megaphone size={16} />
                  </div>

                  <div>
                    <p className="font-medium">
                      {campaign.campaignName || "Unnamed Campaign"}
                    </p>

                    <p className="text-xs text-zinc-500">{campaign.status}</p>
                  </div>
                </div>

                <span className="text-sm">{campaign.clientName}</span>

                <span className="text-sm text-zinc-400">
                  {campaign.adAccountName}
                </span>

                <span className="text-xs text-zinc-500">
                  {campaign.metaCampaignId}
                </span>

                <button
                  onClick={() => handleDelete(campaign.id)}
                  className="text-zinc-500 hover:text-red-400 transition"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="py-20 text-center text-zinc-500">
                No campaigns linked.
              </div>
            )}
          </div>

          {/* MODAL */}

          {open && (
            <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-5">
              <form
                onSubmit={handleSubmit}
                className="w-full max-w-lg bg-[#18181B] border border-[#27272A] rounded-2xl p-6"
              >
                <h2 className="text-xl font-bold">Link Meta Campaign</h2>

                <p className="text-sm text-zinc-500 mt-1 mb-6">
                  Connect an existing Meta campaign to a client.
                </p>

                <div className="space-y-4">
                  {/* CLIENT */}

                  <select
                    required
                    value={form.clientId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        clientId: e.target.value,
                      })
                    }
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 outline-none"
                  >
                    <option value="">Select client</option>

                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.businessName}
                      </option>
                    ))}
                  </select>

                  {/* ACCOUNT */}

                  <select
                    required
                    value={form.adAccountId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        adAccountId: e.target.value,
                      })
                    }
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 outline-none"
                  >
                    <option value="">Select ad account</option>

                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} — act_
                        {account.metaId}
                      </option>
                    ))}
                  </select>

                  {/* CAMPAIGN NAME */}

                  <input
                    required
                    value={form.campaignName}
                    placeholder="Campaign name"
                    onChange={(e) =>
                      setForm({
                        ...form,
                        campaignName: e.target.value,
                      })
                    }
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 outline-none"
                  />

                  {/* META ID */}

                  <input
                    required
                    value={form.metaCampaignId}
                    placeholder="Meta Campaign ID"
                    onChange={(e) =>
                      setForm({
                        ...form,
                        metaCampaignId: e.target.value,
                      })
                    }
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 outline-none"
                  />

                  {/* STATUS */}

                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value,
                      })
                    }
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 outline-none"
                  >
                    <option value="ACTIVE">ACTIVE</option>

                    <option value="PAUSED">PAUSED</option>

                    <option value="ARCHIVED">ARCHIVED</option>
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
                    Link Campaign
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
  );
}
