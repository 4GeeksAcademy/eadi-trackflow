export const AUTH_TOKEN_KEY = "trackflow_auth_token";

export type UserProfile = { name?: string | null; phone?: string | null; address?: string | null };
export type CurrentUser = { id: string; email: string; role: string; profile: UserProfile | null };

function baseUrl(): string {
  const value = process.env.NEXT_PUBLIC_AUTH_API_URL;
  if (!value) throw new Error("Falta NEXT_PUBLIC_AUTH_API_URL en el entorno.");
  return value;
}

function message(payload: unknown, fallback: string): string {
  return typeof payload === "object" && payload !== null && "detail" in payload && typeof payload.detail === "string" ? payload.detail : fallback;
}

export function getToken(): string | null { return window.localStorage.getItem(AUTH_TOKEN_KEY); }
export function clearToken(): void { window.localStorage.removeItem(AUTH_TOKEN_KEY); }

export async function authorizedFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(input, { ...init, headers });
  if (response.status === 401) { clearToken(); window.dispatchEvent(new Event("auth:unauthorized")); }
  return response;
}

export async function login(email: string, password: string): Promise<void> {
  const response = await fetch(`${baseUrl()}/auth/login`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ username: email, password }) });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok || typeof payload !== "object" || payload === null || !("access_token" in payload) || typeof payload.access_token !== "string") throw new Error(message(payload, "No fue posible iniciar sesión."));
  window.localStorage.setItem(AUTH_TOKEN_KEY, payload.access_token);
}

export async function register(data: { email: string; password: string; name?: string; phone?: string; address?: string }): Promise<void> {
  const response = await fetch(`${baseUrl()}/users`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(message(payload, "No fue posible crear la cuenta."));
  await login(data.email, data.password);
}

export async function requestPasswordReset(email: string): Promise<string> {
  const response = await fetch(`${baseUrl()}/auth/forgot-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(message(payload, "No fue posible solicitar el restablecimiento."));
  return message(payload, "Si esa dirección está registrada, recibirás un enlace en breve.");
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const response = await fetch(`${baseUrl()}/auth/reset-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, new_password: newPassword }) });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(message(payload, "El enlace expiró o no es válido."));
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const response = await authorizedFetch(`${baseUrl()}/auth/change-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }) });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(message(payload, "No fue posible cambiar la contraseña."));
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const response = await authorizedFetch(`${baseUrl()}/auth/me`);
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(message(payload, "No fue posible comprobar la sesión."));
  return payload as CurrentUser;
}

export async function updateMyProfile(profile: UserProfile): Promise<UserProfile> {
  const response = await authorizedFetch(`${baseUrl()}/profiles/me`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(message(payload, "No fue posible actualizar el perfil."));
  return payload as UserProfile;
}