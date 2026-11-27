"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:5000/api/v1";

      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Login failed");
      }

      localStorage.setItem("medicore_token", result.data.token);
      localStorage.setItem(
        "medicore_user",
        JSON.stringify(result.data.user),
      );

      router.push("/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the server",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl md:grid-cols-2">
        <section className="hidden flex-col justify-between bg-blue-700 p-10 text-white md:flex">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl text-blue-700">
                +
              </div>
              <div>
                <h1 className="text-2xl font-bold">MediCore</h1>
                <p className="text-sm text-blue-100">
                  Hospital Management System
                </p>
              </div>
            </div>

            <div className="mt-20">
              <h2 className="text-4xl font-bold leading-tight">
                Healthcare management,
                <br />
                made simpler.
              </h2>
              <p className="mt-5 max-w-sm leading-7 text-blue-100">
                A unified platform for patient care, appointments,
                clinical workflows, laboratory services and hospital operations.
              </p>
            </div>
          </div>

          <p className="text-sm text-blue-100">
            Secure access to your healthcare workspace.
          </p>
        </section>

        <section className="p-7 sm:p-10 md:p-12">
          <div className="mb-8 md:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-2xl text-white">
                +
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  MediCore
                </h1>
                <p className="text-xs text-slate-500">
                  Hospital Management
                </p>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to access your hospital workspace.
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@hospital.com"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <p className="text-xs leading-5 text-slate-500">
              Access is managed according to your assigned hospital role.
              If you cannot sign in, contact your administrator.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}