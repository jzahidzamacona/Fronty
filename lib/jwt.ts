// lib/jwt.ts
export type JwtPayload = {
  sub?: string;
  username?: string;
  preferred_username?: string;
  roles?: string[];          // p.ej: ["ADMIN", "EMPLEADO"]
  authorities?: any;         // p.ej: ["ROLE_ADMIN", "ROLE_USER"] o [{authority:"ROLE_ADMIN"}]
  scope?: string;            // p.ej: "ROLE_ADMIN ROLE_USER"
  [k: string]: any;
};

function b64UrlDecode(str: string): string {
  try {
    const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(b64);
    return decodeURIComponent(
      Array.from(json, c => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`).join("")
    );
  } catch {
    return "";
  }
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(b64UrlDecode(payload));
  } catch {
    return null;
  }
}

export function getUsername(p: JwtPayload | null): string | undefined {
  return p?.username ?? p?.preferred_username ?? p?.sub;
}

export function getRoles(p: JwtPayload | null): string[] {
  if (!p) return [];

  // roles directos
  if (Array.isArray(p.roles)) return p.roles;

  // authorities como array de strings u objetos {authority:"..."}
  if (Array.isArray(p.authorities)) {
    const vals = p.authorities.map((a: any) => (typeof a === "string" ? a : a?.authority)).filter(Boolean);
    return vals.map((r: string) => r.replace(/^ROLE_/, "")); // quita prefijo ROLE_
  }

  // scope como string
  if (typeof p.scope === "string") {
    return p.scope.split(" ").filter(Boolean).map(r => r.replace(/^ROLE_/, ""));
  }

  return [];
}
