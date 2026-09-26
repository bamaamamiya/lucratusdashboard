"use client";

import { useEffect, useState } from "react";
import {
  Package,
  Plus,
  Save,
  Trash2,
  Edit3,
  X,
  Check,
  AlertCircle,
  Loader2,
  Star,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

const emptyProduct = {
  name: "",
  slug: "",
  price: 0,
  billing: "monthly",
  offerType: "retainer",
  featured: false,
  performanceFee: 0,
  minimumCommitment: 3,
  durationDays: null,
  adSpendIncluded: false,
  adSpendLabel: "Ditanggung client",
  minimumCommitmentLabel: "",
  performanceFeeLabel: "",
  status: "draft",
  description: "",
  features: [],
};

const defaultJson = {
  name: "",
  slug: "",
  price: 0,
  billing: "monthly",
  offerType: "retainer",
  featured: false,
  performanceFee: 0,
  performanceFeeLabel: "",
  minimumCommitment: 0,
  minimumCommitmentLabel: "",
  durationDays: null,
  adSpendIncluded: false,
  adSpendLabel: "Ditanggung client",
  status: "draft",
  description: "",
  features: [],
};

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function ProductsPage() {
  const { user, loading: authLoading } = useAuth();

  const [products, setProducts] = useState([]);

  const [jsonText, setJsonText] = useState(
    JSON.stringify(defaultJson, null, 2),
  );

  const [preview, setPreview] = useState(defaultJson);

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function getToken() {
    if (!user) {
      throw new Error("You are not logged in");
    }

    return user.getIdToken();
  }

  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const token = await getToken();

      const response = await fetch("/api/products", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load products");
      }

      setProducts(result.data || []);
    } catch (error) {
      console.error("LOAD_PRODUCTS_ERROR:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading || !user) return;

    loadProducts();
  }, [authLoading, user]);

  function handlePreview() {
    try {
      const parsed = JSON.parse(jsonText);

      setPreview(parsed);
      setError("");
      setSuccess("JSON valid");
    } catch (error) {
      setError(`Invalid JSON: ${error.message}`);
      setSuccess("");
    }
  }

  function handleNewProduct() {
    setEditingId(null);

    const newProduct = {
      ...emptyProduct,
    };

    setJsonText(JSON.stringify(newProduct, null, 2));
    setPreview(newProduct);

    setError("");
    setSuccess("");
  }

  function handleEdit(product) {
    setEditingId(product.id);

    const editableProduct = {
      name: product.name || "",
      slug: product.slug || "",
      price: Number(product.price || 0),
      billing: product.billing || "monthly",
      offerType: product.offerType || "retainer",

      featured: Boolean(product.featured),

      performanceFee: Number(product.performanceFee || 0),
      performanceFeeLabel: product.performanceFeeLabel || "",

      minimumCommitment:
        product.minimumCommitment !== undefined
          ? Number(product.minimumCommitment)
          : 0,

      minimumCommitmentLabel: product.minimumCommitmentLabel || "",

      durationDays:
        product.durationDays !== undefined
          ? Number(product.durationDays)
          : null,

      adSpendIncluded: Boolean(product.adSpendIncluded),

      adSpendLabel:
        product.adSpendLabel ||
        (product.adSpendIncluded ? "Included" : "Ditanggung client"),

      status: product.status || "draft",

      description: product.description || "",

      features: Array.isArray(product.features) ? product.features : [],
    };

    setJsonText(JSON.stringify(editableProduct, null, 2));

    setPreview(editableProduct);

    setError("");
    setSuccess("");
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const parsed = JSON.parse(jsonText);

      if (!parsed.name) {
        throw new Error("Product name wajib diisi");
      }

      if (!parsed.slug) {
        parsed.slug = slugify(parsed.name);
      }

      if (!Array.isArray(parsed.features)) {
        parsed.features = [];
      }

      const token = await getToken();

      const url = editingId ? `/api/products/${editingId}` : "/api/products";

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(parsed),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to save product");
      }

      setSuccess(
        editingId ? "Product berhasil diupdate" : "Product berhasil dibuat",
      );

      setPreview(parsed);

      await loadProducts();

      if (!editingId && result.id) {
        setEditingId(result.id);
      }
    } catch (error) {
      console.error("SAVE_PRODUCT_ERROR:", error);

      setError(
        error instanceof SyntaxError ? "JSON tidak valid" : error.message,
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Hapus product ini? Data yang sudah dihapus tidak bisa dikembalikan.",
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const token = await getToken();

      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to delete product");
      }

      setSuccess("Product berhasil dihapus");

      if (editingId === id) {
        handleNewProduct();
      }

      await loadProducts();
    } catch (error) {
      console.error("DELETE_PRODUCT_ERROR:", error);
      setError(error.message);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
        <Loader2 size={24} className="animate-spin text-zinc-500" />
      </div>
    );
  }

return (
  <div className="min-h-screen bg-[#0D0D0D] text-white p-6 lg:p-8">
    <div className="max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <Package size={24} />

            <h1 className="text-2xl font-bold">Products</h1>
          </div>

          <p className="text-zinc-500 text-sm mt-1">
            Manage offers yang digunakan oleh landing page.
          </p>
        </div>

        <button
          onClick={handleNewProduct}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition"
        >
          <Plus size={17} />
          New Product
        </button>
      </div>

      {/* ALERT */}
      {error && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          <AlertCircle size={17} />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-300">
          <Check size={17} />
          {success}
        </div>
      )}

      {/* MAIN LAYOUT */}
      <div className="grid xl:grid-cols-[280px_1fr] gap-6">

        {/* PRODUCT LIST */}
        <section className="bg-[#18181B] border border-[#27272A] rounded-2xl p-4 h-fit">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Products</h2>

            <span className="text-xs text-zinc-500">
              {products.length}
            </span>
          </div>

          <div className="space-y-2">
            {products.length === 0 ? (
              <div className="text-sm text-zinc-500 py-6 text-center">
                Belum ada product.
              </div>
            ) : (
              products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleEdit(product)}
                  className={`
                    w-full text-left p-3 rounded-xl border transition
                    ${
                      editingId === product.id
                        ? "bg-[#2A2A2D] border-zinc-600"
                        : "bg-transparent border-transparent hover:bg-[#222225]"
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {product.name}
                      </p>

                      <p className="text-xs text-zinc-500 mt-1">
                        {formatRupiah(product.price)}
                        {" / "}
                        {product.billing || "bulan"}
                      </p>
                    </div>

                    {product.featured && (
                      <Star
                        size={14}
                        className="shrink-0 text-zinc-300 fill-current"
                      />
                    )}
                  </div>

                  <div className="mt-2">
                    <span
                      className={`
                        text-[10px] px-2 py-1 rounded-full
                        ${
                          product.status === "active"
                            ? "bg-zinc-700 text-zinc-200"
                            : "bg-zinc-800 text-zinc-500"
                        }
                      `}
                    >
                      {product.status || "draft"}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        {/* RIGHT CONTENT */}
        <div className="space-y-6">

          {/* PREVIEW */}
          <section className="bg-[#18181B] border border-[#27272A] rounded-2xl p-6">

            <div className="flex items-center justify-between mb-5">
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                Offer Preview
              </p>

              {preview.featured && (
                <span className="flex items-center gap-1 text-xs bg-white text-black px-2.5 py-1 rounded-full font-semibold">
                  <Star size={12} className="fill-current" />
                  Featured
                </span>
              )}
            </div>

            <h2 className="text-2xl font-bold">
              {preview.name || "Product Name"}
            </h2>

            {preview.description && (
              <p className="text-sm text-zinc-400 mt-4 leading-6">
                {preview.description}
              </p>
            )}

            <div className="mt-6">
              <span className="text-3xl font-bold">
                {formatRupiah(preview.price)}
              </span>

              <span className="text-zinc-500 text-sm ml-1">
                {preview.billing === "monthly"
                  ? "/ month"
                  : preview.billing === "one-time"
                    ? "one-time"
                    : `/${preview.billing}`}
              </span>
            </div>

            <div className="mt-6 space-y-4">

              {/* DESCRIPTION */}
              {preview.description && (
                <p className="text-sm text-zinc-400 leading-6">
                  {preview.description}
                </p>
              )}

              {/* OFFER TYPE */}
              {preview.offerType && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">
                    Offer Type
                  </span>

                  <span className="capitalize">
                    {preview.offerType === "attraction"
                      ? "Attraction Offer"
                      : "Monthly Retainer"}
                  </span>
                </div>
              )}

              {/* BILLING */}
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">
                  Billing
                </span>

                <span className="capitalize">
                  {preview.billing === "one-time"
                    ? "One-time"
                    : preview.billing}
                </span>
              </div>

              {/* PERFORMANCE FEE */}
              {(preview.performanceFee > 0 ||
                preview.performanceFeeLabel) && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">
                    Performance Fee
                  </span>

                  <span>
                    {preview.performanceFeeLabel ||
                      `${preview.performanceFee}%`}
                  </span>
                </div>
              )}

              {/* DURATION */}
              {preview.durationDays && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">
                    Duration
                  </span>

                  <span>
                    {preview.durationDays} Days
                  </span>
                </div>
              )}

              {/* COMMITMENT */}
              {(preview.minimumCommitment > 0 ||
                preview.minimumCommitmentLabel) && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">
                    Minimum Commitment
                  </span>

                  <span>
                    {preview.minimumCommitmentLabel ||
                      `${preview.minimumCommitment} Months`}
                  </span>
                </div>
              )}

              {/* AD SPEND */}
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">
                  Ad Spend
                </span>

                <span>
                  {preview.adSpendLabel ||
                    (preview.adSpendIncluded
                      ? "Included"
                      : "Ditanggung client")}
                </span>
              </div>

              {/* STATUS */}
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">
                  Status
                </span>

                <span className="capitalize">
                  {preview.status || "draft"}
                </span>
              </div>
            </div>

            <div className="border-t border-[#27272A] my-6" />

            <h3 className="font-semibold mb-4">
              What's Included
            </h3>

            <div className="space-y-3">
              {(preview.features || []).map((feature, index) => (
                <div
                  key={index}
                  className="flex gap-3 text-sm"
                >
                  <Check
                    size={17}
                    className="shrink-0 mt-0.5 text-zinc-400"
                  />

                  <span className="text-zinc-300">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {editingId && (
              <>
                <div className="border-t border-[#27272A] my-6" />

                <button
                  onClick={() => handleDelete(editingId)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-900/50 text-red-400 text-sm hover:bg-red-950/30 transition"
                >
                  <Trash2 size={16} />
                  Delete Product
                </button>
              </>
            )}
          </section>

          {/* JSON EDITOR */}
          <section className="bg-[#18181B] border border-[#27272A] rounded-2xl p-5">

            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold">
                  {editingId
                    ? "Edit Product"
                    : "Create Product"}
                </h2>

                {editingId && (
                  <p className="text-xs text-zinc-500 mt-1 font-mono">
                    ID: {editingId}
                  </p>
                )}
              </div>

              {editingId && (
                <button
                  onClick={handleNewProduct}
                  className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800"
                  title="New product"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              spellCheck={false}
              className="
                w-full
                min-h-150
                resize-y
                rounded-xl
                border border-[#27272A]
                bg-[#0D0D0D]
                p-4
                text-sm
                text-zinc-200
                font-mono
                leading-6
                outline-none
                focus:border-zinc-600
              "
            />

            <div className="flex gap-3 mt-4">

              <button
                onClick={handlePreview}
                className="flex-1 py-3 rounded-xl border border-zinc-700 text-sm hover:bg-zinc-800 transition"
              >
                Preview JSON
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="
                  flex-1
                  py-3
                  rounded-xl
                  bg-white
                  text-black
                  text-sm
                  font-semibold
                  hover:bg-zinc-200
                  disabled:opacity-50
                  transition
                  flex
                  items-center
                  justify-center
                  gap-2
                "
              >
                {saving ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={17} />
                )}

                {editingId
                  ? "Update Product"
                  : "Create Product"}
              </button>

            </div>
          </section>

        </div>
      </div>
    </div>
  </div>
);

}
