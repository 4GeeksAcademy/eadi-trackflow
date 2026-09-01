"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { login } from "@/services/auth";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    setError("");
    try {
      await login(String(form.get("email")), String(form.get("password")));
      router.replace("/");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No fue posible iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="grid min-h-screen place-items-center bg-slate-50 px-4"><form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"><div><p className="text-sm font-semibold text-blue-700">Trackflow</p><h1 className="mt-1 text-2xl font-semibold text-slate-900">Iniciar sesión</h1></div><label className="block text-sm font-medium text-slate-700">Email<input name="email" type="email" required autoComplete="email" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label><label className="block text-sm font-medium text-slate-700">Contraseña<input name="password" type="password" required autoComplete="current-password" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>{error && <p role="alert" className="text-sm text-rose-700">{error}</p>}<button disabled={loading} className="w-full rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{loading ? "Accediendo..." : "Acceder"}</button><p className="text-center text-sm text-slate-600">¿No tienes cuenta? <Link className="font-semibold text-blue-700" href="/register">Regístrate</Link></p></form></main>;
}