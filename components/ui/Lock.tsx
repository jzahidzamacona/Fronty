"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type LockProps = {
  children: React.ReactNode;
  storageKey: string;       // clave en localStorage (p.ej. "unlock_reporte_semanal")
  title?: string;           // título del panel/candado
  password?: string;        // si quieres pedir contraseña; si no se pasa, solo botón "Desbloquear"
  rememberHours?: number;   // cuántas horas recordar el desbloqueo (default 8h). Usa 0 para no recordar.
  autoLockOnUnmount?: boolean; // si true, al desmontar/browse-out re-bloquea
};

export default function Lock({
  children,
  storageKey,
  title = "Contenido protegido",
  password,
  rememberHours = 8,
  autoLockOnUnmount = false,
}: LockProps) {
  const [input, setInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  // Checa si hay un desbloqueo vigente en localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;

      const saved = JSON.parse(raw) as { expiresAt?: number };
      if (saved?.expiresAt && Date.now() < saved.expiresAt) {
        setUnlocked(true);
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch {
      /* noop */
    }
  }, [storageKey]);

  // función para guardar la sesión de desbloqueo
  const persistUnlock = () => {
    if (rememberHours && rememberHours > 0) {
      const expiresAt = Date.now() + rememberHours * 60 * 60 * 1000;
      localStorage.setItem(storageKey, JSON.stringify({ expiresAt }));
    }
  };

  // auto re-lock si se solicita al desmontar
  useEffect(() => {
    return () => {
      if (autoLockOnUnmount) {
        try {
          localStorage.removeItem(storageKey);
        } catch {
          /* noop */
        }
      }
    };
  }, [autoLockOnUnmount, storageKey]);

  const canUnlock = useMemo(() => {
    // Si no se definió password -> basta dar clic
    if (!password) return true;
    return input === password;
  }, [password, input]);

  if (unlocked) return <>{children}</>;

  return (
    <div className="rounded-xl border p-6 bg-card">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>

      {password ? (
        <>
          <p className="text-sm text-muted-foreground mb-3">
            Esta sección requiere contraseña para visualizarse.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Contraseña"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <Button
              onClick={() => {
                if (!canUnlock) return;
                setUnlocked(true);
                persistUnlock();
              }}
              disabled={!canUnlock}
            >
              Desbloquear
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-3">
            Contenido sensible. Pulsa para desbloquear.
          </p>
          <Button
            onClick={() => {
              setUnlocked(true);
              persistUnlock();
            }}
          >
            Desbloquear
          </Button>
        </>
      )}
    </div>
  );
}
