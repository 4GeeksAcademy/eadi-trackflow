"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { clearToken, CurrentUser, getCurrentUser, updateMyProfile } from "@/services/auth";

export default function ProfilePage() {
  const router = useRouter(); const [user, setUser] = useState<CurrentUser | null>(null); const [message, setMessage] = useState("");
  useEffect(() => { void getCurrentUser().then(setUser).catch(() => router.replace("/login")); }, [router]);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); try { const profile = await updateMyProfile({ name: String(form.get("name")), phone: String(form.get("phone")), address: String(form.get("address")) }); setUser((current) => current ? { ...current, profile } : current); setMessage("Perfil actualizado."); } catch (error) { setMessage(error instanceof Error ? error.message : "No fue posible actualizar el perfil."); } }
  if (!user) return <main className="authPage">Cargando perfil...</main>;
  return <main className="authPage"><form className="authCard" onSubmit={submit}><h1>Mi perfil</h1><p>{user.email}</p><label>Nombre<input name="name" defaultValue={user.profile?.name ?? ""} /></label><label>Teléfono<input name="phone" defaultValue={user.profile?.phone ?? ""} /></label><label>Dirección<input name="address" defaultValue={user.profile?.address ?? ""} /></label>{message && <p>{message}</p>}<button>Guardar cambios</button><Link className="authInlineLink" href="/account/change-password">Cambiar contraseña</Link><button type="button" className="logoutButton" onClick={() => { clearToken(); router.replace("/login"); }}>Cerrar sesión</button></form></main>;
}