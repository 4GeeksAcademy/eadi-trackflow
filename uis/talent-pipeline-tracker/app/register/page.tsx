"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { register } from "@/services/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim();
    const password = String(form.get("password"));
    const errors: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "Introduce un email válido.";
    if (password.length < 8) errors.password = "La contraseña debe tener al menos 8 caracteres.";
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    setLoading(true); setError("");
    try {
      await register({ email, password, name: String(form.get("name")).trim() || undefined, phone: String(form.get("phone")).trim() || undefined, address: String(form.get("address")).trim() || undefined });
      router.replace("/");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No fue posible crear la cuenta.");
    } finally { setLoading(false); }
  }

  const inputClass = "mt-1 w-full rounded-md border border-slate-300 px-3 py-2";
  return <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-8"><form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"><div><p className="text-sm font-semibold text-blue-700">Trackflow</p><h1 className="mt-1 text-2xl font-semibold text-slate-900">Crear cuenta</h1></div><label className="block text-sm font-medium text-slate-700">Email<input name="email" type="email" required className={inputClass} />{fieldErrors.email && <span className="text-xs text-rose-700">{fieldErrors.email}</span>}</label><label className="block text-sm font-medium text-slate-700">Contraseña<input name="password" type="password" required className={inputClass} />{fieldErrors.password && <span className="text-xs text-rose-700">{fieldErrors.password}</span>}</label><label className="block text-sm font-medium text-slate-700">Nombre<input name="name" className={inputClass} /></label><label className="block text-sm font-medium text-slate-700">Teléfono<input name="phone" type="tel" className={inputClass} /></label><label className="block text-sm font-medium text-slate-700">Dirección<input name="address" className={inputClass} /></label>{error && <p role="alert" className="text-sm text-rose-700">{error}</p>}<button disabled={loading} className="w-full rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{loading ? "Creando..." : "Crear cuenta"}</button><p className="text-center text-sm text-slate-600">¿Ya tienes cuenta? <Link className="font-semibold text-blue-700" href="/login">Accede</Link></p></form></main>;
}