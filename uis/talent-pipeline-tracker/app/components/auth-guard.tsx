"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearToken, getCurrentUser, getToken } from "@/services/auth";

const PUBLIC_ROUTES = new Set(["/login", "/register"]);

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (PUBLIC_ROUTES.has(pathname)) {
    return <>{children}</>;
  }

  return <ProtectedRoute key={pathname}>{children}</ProtectedRoute>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    void getCurrentUser()
      .catch(() => {
        clearToken();
        router.replace("/login");
      })
      .finally(() => setIsChecking(false));
  }, [router]);

  useEffect(() => {
    const redirectToLogin = () => router.replace("/login");
    window.addEventListener("auth:unauthorized", redirectToLogin);
    return () => window.removeEventListener("auth:unauthorized", redirectToLogin);
  }, [router]);

  if (isChecking) {
    return <main className="grid min-h-screen place-items-center text-sm text-slate-600">Comprobando sesión...</main>;
  }
  return <>{children}</>;
}