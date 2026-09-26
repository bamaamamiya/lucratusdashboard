"use client";

import { useEffect, useMemo, useState } from "react";
import AddClientModal from "@/components/AddClientModal";
import EditClientModal from "@/components/EditClientModal";
import ClientCard from "@/components/ClientCard";
import { getClients } from "@/lib/clientService";
import { Plus, Search, Users, Activity } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function ClientsPage() {
	  const { user, loading: authLoading } = useAuth();

  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [search, setSearch] = useState("");

  async function load() {
    if (!user) return;

    try {
      const token = await user.getIdToken();

      const [clientData, productResponse] = await Promise.all([
        getClients(),
        fetch("/api/products", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const productResult = await productResponse.json();

      if (!productResponse.ok) {
        throw new Error(productResult.error);
      }

      setClients(clientData);
      setProducts(productResult.data || []);
    } catch (error) {
      console.error("Failed to load clients/products:", error);
    }
  }

  useEffect(() => {
    if (!authLoading && user) {
      load();
    }
  }, [authLoading, user]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return clients;

    return clients.filter((client) =>
      client.businessName?.toLowerCase().includes(query),
    );
  }, [clients, search]);

  return (
    <div className="min-h-screen">
      <main className="flex-1 p-6 md:p-8 lg:p-10">
        {/* Header */}
        <div
          className="
          flex flex-col gap-5
          md:flex-row
          md:items-center
          md:justify-between
          mb-8
        "
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />

              <span
                className="
                text-xs
                font-medium
                uppercase
                tracking-widest
                text-zinc-500
              "
              >
                Agency Management
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Clients
            </h1>

            <p className="text-sm text-zinc-500 mt-2">
              Manage your clients and services.
            </p>
          </div>

          <button
            onClick={() => setOpen(true)}
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              bg-white
              text-black
              px-4
              py-2.5
              rounded-xl
              text-sm
              font-medium
              hover:bg-zinc-200
              transition
            "
          >
            <Plus size={17} />
            Add Client
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search
            size={18}
            className="
              absolute
              left-4
              top-1/2
              -translate-y-1/2
              text-zinc-500
            "
          />

          <input
            value={search}
            placeholder="Search clients..."
            onChange={(e) => setSearch(e.target.value)}
            className="
              w-full
              bg-card
              border border-border
              rounded-2xl
              pl-11
              pr-4
              py-3.5
              text-sm
              placeholder:text-zinc-600
              outline-none
              focus:border-zinc-500
              transition
            "
          />
        </div>

        {/* Cards */}
        {filtered.length > 0 ? (
          <div
            className="
            grid
            grid-cols-1
            md:grid-cols-2
            xl:grid-cols-3
            gap-5
          "
          >
            {filtered.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onClick={setEditingClient}
              />
            ))}
          </div>
        ) : (
          <div
            className="
            border
            border-dashed
            border-border
            rounded-2xl
            py-16
            text-center
          "
          >
            <Users size={24} className="mx-auto text-zinc-600 mb-3" />

            <h3 className="font-medium">No clients found</h3>

            <p className="text-sm text-zinc-500 mt-1">
              Try searching for another client.
            </p>
          </div>
        )}

        <AddClientModal
          open={open}
          onClose={() => setOpen(false)}
          refresh={load}
          products={products}
        />

        <EditClientModal
          open={!!editingClient}
          client={editingClient}
          onClose={() => setEditingClient(null)}
          refresh={load}
          products={products}
        />
      </main>
    </div>
  );
}
