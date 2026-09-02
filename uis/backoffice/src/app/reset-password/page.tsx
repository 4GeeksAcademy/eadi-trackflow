"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { resetPassword } from "@/services/auth";

export default function ResetPasswordPage() {
  const router = useRouter(); const [token] = useState(() => typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("token") ?? "" : ""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const newPassword = String(form.get("newPassword")); const confirmPassword = String(form.get("confirmPassword")); if (newPassword !== confirmPassword) { setError("La nueva contraseña y la confirmación deben coincidir."); return; } setLoading(true); setError(""); try { await resetPassword(token, newPassword); router.replace("/login?reset=success"); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "El enlace expiró o no es válido."); } finally { setLoading(false); } }
  return <main className="authPage"><form className="authCard" onSubmit={submit}><p className="eyebrow">Trackflow</p><h1>Nueva contraseña</h1><label>Nueva contraseña<input name="newPassword" type="password" required minLength={8} autoComplete="new-password" /></label><label>Confirmar contraseña<input name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" /></label>{(!token || error) && <p className="formError" role="alert">{error || "El enlace expiró o no es válido."}</p>}<button disabled={loading || !token}>{loading ? "Guardando..." : "Guardar contraseña"}</button><p><Link href="/forgot-password">Solicitar un nuevo enlace</Link></p></form></main>;
}