export const AUTH_TOKEN_KEY = "trackflow_auth_token";

export type UserProfile = {
  name?: string | null;
  phone?: string | null;
  address?: string | null;
};

export type CurrentUser = {
  id: string;
  email: string;
  role: string;
  profile: UserProfile | null;
};

function getBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_AUTH_API_URL;

  if (!baseUrl) {
    throw new Error("Falta NEXT_PUBLIC_AUTH_API_URL en el entorno.");
  }

  return baseUrl;
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "object" && payload !== null && "detail" in payload) {
    const detail = payload.detail;
    if (typeof detail === "string") return detail;
  }

  return fallback;
}

export function getToken(): string | null {
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function clearToken(): void {
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

async function request(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${getBaseUrl()}${path}`, { ...options, headers });

  if (response.status === 401) {
    clearToken();
    window.dispatchEvent(new Event("auth:unauthorized"));
  }

  return response;
}

export async function login(email: string, password: string): Promise<void> {
  const response = await fetch(`${getBaseUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username: email, password }),
  });
  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok || typeof payload !== "object" || payload === null || !("access_token" in payload)) {
    throw new Error(getErrorMessage(payload, "No fue posible iniciar sesión."));
  }

  const token = payload.access_token;
  if (typeof token !== "string") {
    throw new Error("La respuesta de inicio de sesión no contiene un token válido.");
  }

  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export async function register(data: { email: string; password: string; name?: string; phone?: string; address?: string }): Promise<void> {
  const response = await fetch(`${getBaseUrl()}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, "No fue posible crear la cuenta."));
  }

  await login(data.email, data.password);
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const response = await request("/auth/me");
  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, "No fue posible comprobar la sesión."));
  }

  return payload as CurrentUser;
}

export async function updateMyProfile(profile: UserProfile): Promise<UserProfile> {
  const response = await request("/profiles/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, "No fue posible actualizar el perfil."));
  }

  return payload as UserProfile;
}