"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { requestPasswordReset } from "@/services/auth";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [sent, setSent] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); setError(""); try { const responseMessage = await requestPasswordReset(String(form.get("email"))); setMessage(responseMessage); setSent(true); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "No fue posible solicitar el restablecimiento."); } }
  return <main className="authPage"><form className="authCard" onSubmit={submit}><p className="eyebrow">Trackflow</p><h1>Restablecer contraseña</h1><label>Email<input name="email" type="email" required autoComplete="email" disabled={sent} /></label>{message && <p className="formSuccess" role="status">{message}</p>}{error && <p className="formError" role="alert">{error}</p>}<button disabled={sent}>{sent ? "Enlace enviado" : "Enviar enlace"}</button><p><Link href="/login">Volver a iniciar sesión</Link></p></form></main>;
}