"use client";

import { useState, useEffect } from "react";
import { login } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [user, loading]);

  async function handleLogin(e) {
    e.preventDefault();

    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      router.replace("/");
    } catch {
      setError("Email atau password salah");
    }

    setIsLoading(false);
  }

  if (loading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] p-6">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md bg-[#18181B] border border-[#27272A] rounded-3xl p-8 space-y-6"
      >
        <div>
          <p className="text-zinc-400 text-sm">Welcome back</p>
          <h1 className="text-3xl font-bold mt-2">LUCRATUS</h1>
        </div>

        <div className="space-y-4">
          <div className="flex items-center border border-zinc-700 rounded-xl px-4">
            <Mail size={18} className="text-zinc-500" />
            <input
              type="email"
              placeholder="Email"
              className="w-full bg-transparent p-3 outline-none"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex items-center border border-zinc-700 rounded-xl px-4">
            <Lock size={18} className="text-zinc-500" />
            <input
              type="password"
              placeholder="Password"
              className="w-full bg-transparent p-3 outline-none"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <button
          disabled={isLoading}
          className="w-full bg-white text-black rounded-xl py-3 font-semibold hover:opacity-90 transition flex justify-center items-center gap-2"
        >
          {isLoading && <Loader2 size={18} className="animate-spin" />}
          Login
        </button>
      </form>
    </div>
  );
}