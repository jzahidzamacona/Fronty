// app/utils/roles.ts

export function getRolesFromToken(): string[] {
  if (typeof window === "undefined") return [];
  const t = localStorage.getItem("accessToken");
  if (!t) return [];
  try {
    const base64 = t.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/") ?? "";
    const json = atob(base64);
    const payload = json ? JSON.parse(json) : {};
    const raw = payload?.authorities ?? payload?.roles ?? [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") return raw.split(",").map((s: string) => s.trim());
    return [];
  } catch {
    return [];
  }
}

export const isAdmin = () => getRolesFromToken().includes("ROLE_ADMIN");
