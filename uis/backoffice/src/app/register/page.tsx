"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { register } from "@/services/auth";

export default function RegisterPage() {
  const router = useRouter(); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const email = String(form.get("email")).trim(); const password = String(form.get("password")); if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8) { setError("Introduce un email válido y una contraseña de al menos 8 caracteres."); return; } setLoading(true); setError(""); try { await register({ email, password, name: String(form.get("name")).trim() || undefined, phone: String(form.get("phone")).trim() || undefined, address: String(form.get("address")).trim() || undefined }); router.replace("/incidents"); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "No fue posible crear la cuenta."); } finally { setLoading(false); } }
  return <main className="authPage"><form className="authCard" onSubmit={submit}><p className="eyebrow">Trackflow</p><h1>Crear cuenta</h1><label>Email<input name="email" type="email" required /></label><label>Contraseña<input name="password" type="password" required /></label><label>Nombre<input name="name" /></label><label>Teléfono<input name="phone" type="tel" /></label><label>Dirección<input name="address" /></label>{error && <p className="formError" role="alert">{error}</p>}<button disabled={loading}>{loading ? "Creando..." : "Crear cuenta"}</button><p>¿Ya tienes cuenta? <Link href="/login">Accede</Link></p></form></main>;
}