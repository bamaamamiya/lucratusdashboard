"use client";

import { useEffect, useState } from "react";
import {
  X,
  Building2,
  User,
  Phone,
  Megaphone,
  Target,
  Package,
  Save,
  ArrowUpRight,
} from "lucide-react";

import { updateClient } from "@/lib/clientService";

export default function EditClientModal({
  open,
  client,
  onClose,
  refresh,
  products = [],
}) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    businessName: "",
    owner: "",
    phone: "",
    adAccountId: "",
    pixelId: "",
    productId: "",
    status: "active",
  });

  useEffect(() => {
    if (!open || !client) return;

    setForm({
      businessName: client.businessName || "",
      owner: client.owner || "",
      phone: client.phone || "",
      adAccountId: client.adAccountId || "",
      pixelId: client.pixelId || "",
      productId: client.productId || "",
      status: client.status || "active",
    });
  }, [open, client]);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);

      const selectedProduct = products.find(
        (product) => product.id === form.productId,
      );

      await updateClient(client.id, {
        businessName: form.businessName,
        owner: form.owner,
        phone: form.phone,
        adAccountId: form.adAccountId,
        pixelId: form.pixelId,
        productId: form.productId || null,
        productName: selectedProduct?.name || null,
        status: form.status,
      });

      await refresh();

      onClose();
    } catch (error) {
      console.error("Failed to update client:", error);
    } finally {
      setLoading(false);
    }
  }

  if (!open || !client) return null;

  const selectedProduct = products.find(
    (product) => product.id === form.productId,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <form
        onSubmit={handleSubmit}
        className="
          relative
          w-full
          max-w-2xl
          max-h-[90vh]
          overflow-y-auto
          bg-[#18181B]
          border border-zinc-800
          rounded-3xl
          shadow-2xl
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-600 mb-1">
              Client Management
            </p>

            <h2 className="text-xl font-semibold">Edit Client</h2>

            <p className="text-sm text-zinc-500 mt-1">
              Update client information and service.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              w-9 h-9
              rounded-xl
              flex items-center justify-center
              text-zinc-500
              hover:text-white
              hover:bg-zinc-800
              transition
            "
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-7">
          {/* Business */}
          <section>
            <SectionTitle
              title="Business Information"
              description="Basic client information."
            />

            <div className="grid md:grid-cols-2 gap-4">
              <InputField
                label="Business Name"
                name="businessName"
                value={form.businessName}
                onChange={handleChange}
                placeholder="Business name"
                icon={Building2}
              />

              <InputField
                label="Owner / Contact"
                name="owner"
                value={form.owner}
                onChange={handleChange}
                placeholder="Owner name"
                icon={User}
              />

              <InputField
                label="Phone / WhatsApp"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="08123456789"
                icon={Phone}
              />
            </div>
          </section>

          {/* Meta */}
          <section>
            <SectionTitle
              title="Meta Ads"
              description="Advertising account information."
            />

            <div className="grid md:grid-cols-2 gap-4">
              <InputField
                label="Ad Account ID"
                name="adAccountId"
                value={form.adAccountId}
                onChange={handleChange}
                placeholder="act_123456789"
                icon={Megaphone}
              />

              <InputField
                label="Pixel ID"
                name="pixelId"
                value={form.pixelId}
                onChange={handleChange}
                placeholder="Pixel ID"
                icon={Target}
              />
            </div>
          </section>

          {/* Service */}
          <section>
            <SectionTitle
              title="Service"
              description="Assign a service from your products."
            />

            <div className="space-y-3">
              <label className="block text-xs font-medium text-zinc-400">
                Current Service
              </label>

              <div className="relative">
                <Package
                  size={17}
                  className="
                    absolute
                    left-3.5
                    top-1/2
                    -translate-y-1/2
                    text-zinc-500
                    pointer-events-none
                  "
                />

                <select
                  name="productId"
                  value={form.productId}
                  onChange={handleChange}
                  className="
    w-full
    bg-zinc-900
    border border-zinc-800
    rounded-xl
    pl-11
    pr-4
    py-3
    text-sm
    outline-none
    appearance-none
    focus:border-zinc-600
    transition
  "
                >
                  <option value="">No service</option>

                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected product preview */}
              {selectedProduct && (
                <div
                  className="
                  flex items-center justify-between
                  p-4
                  rounded-xl
                  bg-zinc-900
                  border border-zinc-800
                "
                >
                  <div>
                    <p className="text-sm font-medium">
                      {selectedProduct.name}
                    </p>

                    {selectedProduct.description && (
                      <p className="text-xs text-zinc-500 mt-1">
                        {selectedProduct.description}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    {selectedProduct.price !== undefined && (
                      <p className="text-sm font-semibold">
                        Rp{" "}
                        {Number(selectedProduct.price).toLocaleString("id-ID")}
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-400 mt-1">
                      <ArrowUpRight size={11} />
                      Service
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Status */}
          <section>
            <SectionTitle
              title="Client Status"
              description="Control whether this client is active."
            />

            <div className="grid grid-cols-2 gap-3">
              <StatusButton
                active={form.status === "active"}
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    status: "active",
                  }))
                }
                title="Active"
                description="Client is currently active"
              />

              <StatusButton
                active={form.status === "inactive"}
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    status: "inactive",
                  }))
                }
                title="Inactive"
                description="Client is not active"
              />
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="
              px-4 py-2.5
              rounded-xl
              text-sm
              text-zinc-400
              hover:text-white
              hover:bg-zinc-800
              transition
            "
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="
              flex items-center gap-2
              bg-white
              text-black
              px-5 py-2.5
              rounded-xl
              text-sm
              font-semibold
              hover:bg-zinc-200
              disabled:opacity-50
              transition
            "
          >
            <Save size={16} />

            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function SectionTitle({ title, description }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium">{title}</h3>

      <p className="text-xs text-zinc-500 mt-1">{description}</p>
    </div>
  );
}

function InputField({ label, name, value, onChange, placeholder, icon: Icon }) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-2">
        {label}
      </label>

      <div className="relative">
        <Icon
          size={16}
          className="
            absolute
            left-3.5
            top-1/2
            -translate-y-1/2
            text-zinc-600
            pointer-events-none
          "
        />

        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="
            w-full
            bg-zinc-900
            border border-zinc-800
            rounded-xl
            pl-10
            pr-4
            py-3
            text-sm
            placeholder:text-zinc-700
            outline-none
            focus:border-zinc-600
            transition
          "
        />
      </div>
    </div>
  );
}

function StatusButton({ active, onClick, title, description }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        text-left
        p-4
        rounded-xl
        border
        transition
        ${
          active
            ? "border-zinc-500 bg-zinc-800"
            : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
        }
      `}
    >
      <div className="flex items-center gap-2">
        <span
          className={`
            w-2
            h-2
            rounded-full
            ${title === "Active" ? "bg-emerald-400" : "bg-zinc-500"}
          `}
        />

        <span className="text-sm font-medium">{title}</span>
      </div>

      <p className="text-xs text-zinc-500 mt-1">{description}</p>
    </button>
  );
}
