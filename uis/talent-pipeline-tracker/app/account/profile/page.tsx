"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { clearToken, CurrentUser, getCurrentUser, updateMyProfile } from "@/services/auth";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => { void getCurrentUser().then(setUser).catch(() => router.replace("/login")); }, [router]);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); try { const profile = await updateMyProfile({ name: String(form.get("name")), phone: String(form.get("phone")), address: String(form.get("address")) }); setUser((current) => current ? { ...current, profile } : current); setMessage("Perfil actualizado."); } catch (error) { setMessage(error instanceof Error ? error.message : "No fue posible actualizar el perfil."); } }
  if (!user) return <main className="grid min-h-screen place-items-center text-sm">Cargando perfil...</main>;
  return <main className="mx-auto w-full max-w-xl px-4 py-10"><div className="mb-6 flex items-center justify-between"><div><h1 className="text-2xl font-semibold">Mi perfil</h1><p className="text-sm text-slate-600">{user.email}</p></div><button onClick={() => { clearToken(); router.replace("/login"); }} className="text-sm font-semibold text-blue-700">Cerrar sesión</button></div><form onSubmit={submit} className="space-y-4 rounded-lg border border-slate-200 p-6"><label className="block text-sm font-medium">Nombre<input name="name" defaultValue={user.profile?.name ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label><label className="block text-sm font-medium">Teléfono<input name="phone" defaultValue={user.profile?.phone ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label><label className="block text-sm font-medium">Dirección<input name="address" defaultValue={user.profile?.address ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>{message && <p className="text-sm text-slate-700">{message}</p>}<button className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Guardar cambios</button></form></main>;
}