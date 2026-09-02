"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { login } from "@/services/auth";

export default function LoginPage() {
  const router = useRouter(); const [error, setError] = useState(""); const [notice] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("reset") === "success" ? "Contraseña actualizada. Ya puedes iniciar sesión." : ""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); setLoading(true); setError(""); try { await login(String(form.get("email")), String(form.get("password"))); router.replace("/incidents"); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "No fue posible iniciar sesión."); } finally { setLoading(false); } }
  return <main className="authPage"><form className="authCard" onSubmit={submit}><p className="eyebrow">Trackflow</p><h1>Iniciar sesión</h1><label>Email<input name="email" type="email" required autoComplete="email" /></label><label>Contraseña<input name="password" type="password" required autoComplete="current-password" /></label><Link className="authInlineLink" href="/forgot-password">¿Olvidaste tu contraseña?</Link>{notice && <p className="formSuccess" role="status">{notice}</p>}{error && <p className="formError" role="alert">{error}</p>}<button disabled={loading}>{loading ? "Accediendo..." : "Acceder"}</button><p>¿No tienes cuenta? <Link href="/register">Regístrate</Link></p></form></main>;
}