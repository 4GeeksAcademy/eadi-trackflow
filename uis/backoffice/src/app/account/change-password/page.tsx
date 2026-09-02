"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { changePassword } from "@/services/auth";

export default function ChangePasswordPage() {
  const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const newPassword = String(form.get("newPassword")); const confirmPassword = String(form.get("confirmPassword")); if (newPassword !== confirmPassword) { setError("La nueva contraseña y la confirmación deben coincidir."); return; } setLoading(true); setError(""); setMessage(""); try { await changePassword(String(form.get("currentPassword")), newPassword); event.currentTarget.reset(); setMessage("Contraseña actualizada."); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "No fue posible cambiar la contraseña."); } finally { setLoading(false); } }
  return <main className="authPage"><form className="authCard" onSubmit={submit}><p className="eyebrow">Trackflow</p><h1>Cambiar contraseña</h1><label>Contraseña actual<input name="currentPassword" type="password" required autoComplete="current-password" /></label><label>Nueva contraseña<input name="newPassword" type="password" required minLength={8} autoComplete="new-password" /></label><label>Confirmar contraseña<input name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" /></label>{message && <p className="formSuccess" role="status">{message}</p>}{error && <p className="formError" role="alert">{error}</p>}<button disabled={loading}>{loading ? "Guardando..." : "Cambiar contraseña"}</button><p><Link href="/account/profile">Volver al perfil</Link></p></form></main>;
}