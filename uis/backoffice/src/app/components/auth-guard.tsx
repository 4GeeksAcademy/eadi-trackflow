"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearToken, getCurrentUser, getToken } from "@/services/auth";

const PUBLIC_ROUTES = new Set(["/login", "/register", "/forgot-password", "/reset-password"]);

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (PUBLIC_ROUTES.has(pathname)) return <>{children}</>;
  return <ProtectedRoute key={pathname}>{children}</ProtectedRoute>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    void getCurrentUser().catch(() => { clearToken(); router.replace("/login"); }).finally(() => setChecking(false));
  }, [router]);

  useEffect(() => {
    const redirectToLogin = () => router.replace("/login");
    window.addEventListener("auth:unauthorized", redirectToLogin);
    return () => window.removeEventListener("auth:unauthorized", redirectToLogin);
  }, [router]);

  return checking ? <main className="authPage">Comprobando sesión...</main> : <>{children}</>;
}