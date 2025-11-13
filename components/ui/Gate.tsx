"use client";

import { ReactNode, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";

type GateProps = {
  children: ReactNode;
  anyRole?: string[];
  allRoles?: string[];
  notRoles?: string[];
  fallback?: ReactNode;
};

export default function Gate({
  children,
  anyRole,
  allRoles,
  notRoles,
  fallback = null,
}: GateProps) {
  const user = useAuth();

  // normaliza: quita prefijo ROLE_ y pasa a MAYÚSCULAS
  const normalize = (arr?: string[]) =>
    (arr ?? []).map((r) => r.replace(/^ROLE_/i, "").toUpperCase());

  const roles = normalize(user?.roles);                // del token
  const anyN = normalize(anyRole);
  const allN = normalize(allRoles);
  const notN = normalize(notRoles);

  const allowed = useMemo(() => {
    if (notN.length && notN.some((r) => roles.includes(r))) return false;
    if (allN.length && !allN.every((r) => roles.includes(r))) return false;
    if (anyN.length && !anyN.some((r) => roles.includes(r))) return false;
    return true;
  }, [roles, anyN, allN, notN]);

  return <>{allowed ? children : fallback}</>;
}
