"use client";

import { useState } from "react";
import {
  X,
  Building2,
  User,
  Phone,
  Megaphone,
  Target,
  Package,
  Save,
} from "lucide-react";
import { createClient } from "@/lib/clientService";

export default function AddClientModal({
  open,
  onClose,
  refresh,
  products = [],
}) {
  const [form, setForm] = useState({
    businessName: "",
    owner: "",
    phone: "",
    adAccountId: "",
    pixelId: "",
    productId: "",
    status: "active",
  });

  const [loading, setLoading] = useState(false);

  if (!open) return null;

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

      const selectedProduct = products.find((p) => p.id === form.productId);

      await createClient({
        ...form,
        productId: form.productId || null,
        productName: selectedProduct?.name || null,
      });

      await refresh();
      onClose();

      setForm({
        businessName: "",
        owner: "",
        phone: "",
        adAccountId: "",
        pixelId: "",
        productId: "",
        status: "active",
      });
    } finally {
      setLoading(false);
    }
  }

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
          w-full max-w-2xl
          max-h-[90vh]
          overflow-y-auto
          bg-[#18181B]
          border border-zinc-800
          rounded-3xl
          shadow-2xl
        "
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                <Building2 size={19} className="text-zinc-300" />
              </div>

              <div>
                <h2 className="text-lg font-semibold">Add New Client</h2>

                <p className="text-xs text-zinc-500 mt-0.5">
                  Create a client workspace
                </p>
              </div>
            </div>
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
        <div className="p-6 space-y-6">
          {/* Business Information */}
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-medium">Business Information</h3>

              <p className="text-xs text-zinc-500 mt-1">
                Basic information about your client.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Business Name"
                name="businessName"
                placeholder="e.g. ABC Property"
                value={form.businessName}
                onChange={handleChange}
                icon={Building2}
                required
              />

              <InputField
                label="Owner / Contact"
                name="owner"
                placeholder="e.g. John Doe"
                value={form.owner}
                onChange={handleChange}
                icon={User}
                required
              />

              <InputField
                label="Phone / WhatsApp"
                name="phone"
                placeholder="e.g. 08123456789"
                value={form.phone}
                onChange={handleChange}
                icon={Phone}
                required
              />
            </div>
          </div>

          {/* Meta Ads */}
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-medium">Meta Ads</h3>

              <p className="text-xs text-zinc-500 mt-1">
                Connect the client's advertising assets.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Ad Account ID"
                name="adAccountId"
                placeholder="act_123456789"
                value={form.adAccountId}
                onChange={handleChange}
                icon={Megaphone}
              />

              <InputField
                label="Pixel ID"
                name="pixelId"
                placeholder="Optional"
                value={form.pixelId}
                onChange={handleChange}
                icon={Target}
              />
            </div>
          </div>

          {/* Package */}
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-medium">Service Package</h3>

              <p className="text-xs text-zinc-500 mt-1">
                Select the package assigned to this client.
              </p>
            </div>

            <div className="relative">
              <Package
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
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
    pl-11 pr-4
    py-3
    text-sm
    text-white
    outline-none
    appearance-none
    focus:border-zinc-600
    transition
  "
              >
                <option value="">Select Package</option>

                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800">
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
              inline-flex items-center gap-2
              bg-white
              text-black
              px-5 py-2.5
              rounded-xl
              text-sm
              font-semibold
              hover:bg-zinc-200
              disabled:opacity-50
              disabled:cursor-not-allowed
              transition
            "
          >
            <Save size={16} />

            {loading ? "Saving..." : "Save Client"}
          </button>
        </div>
      </form>
    </div>
  );
}

function InputField({
  label,
  name,
  placeholder,
  value,
  onChange,
  icon: Icon,
  required = false,
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-2">
        {label}
        {required && <span className="text-zinc-600 ml-1">*</span>}
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
          placeholder={placeholder}
          onChange={onChange}
          required={required}
          className="
            w-full
            bg-zinc-900
            border border-zinc-800
            rounded-xl
            pl-10 pr-4
            py-3
            text-sm
            text-white
            placeholder:text-zinc-700
            outline-none
            focus:border-zinc-600
            focus:bg-zinc-900
            transition
          "
        />
      </div>
    </div>
  );
}
