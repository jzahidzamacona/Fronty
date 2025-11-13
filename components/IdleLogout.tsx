"use client";

import { useEffect, useRef, useState } from "react";
import { logout } from "@/app/api/auth";

// ⏱ tiempos (ajustados a 30 minutos)
const IDLE_MS = 30 * 60 * 1000 // 30 min total
const WARNING_MS = 2 * 60 * 1000 // 2 min antes

export default function IdleLogout() {
  const [warning, setWarning] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  const lastActivityRef = useRef<number>(Date.now());
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const onActivity = () => {
      lastActivityRef.current = Date.now();
      setWarning(false);
      setRemaining(null);
      scheduleTimers();
    };

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "visibilitychange", // volver a la pestaña = actividad
    ];
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));

    scheduleTimers();

    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clearTimers() {
    if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (tickerRef.current) clearInterval(tickerRef.current);
    warnTimerRef.current = null;
    logoutTimerRef.current = null;
    tickerRef.current = null;
  }

  function scheduleTimers() {
    clearTimers();

    const elapsed = Date.now() - lastActivityRef.current;
    const timeToWarning = Math.max(0, IDLE_MS - WARNING_MS - elapsed);
    const timeToLogout = Math.max(0, IDLE_MS - elapsed);

    // momento de mostrar aviso
    warnTimerRef.current = setTimeout(() => {
      setWarning(true);
      startCountdown();
    }, timeToWarning);

    // momento de cerrar sesión
    logoutTimerRef.current = setTimeout(() => {
      logout(); // limpia tokens y redirige a /login
    }, timeToLogout);
  }

  function startCountdown() {
    setRemaining(Math.ceil(WARNING_MS / 1000));
    const end = Date.now() + WARNING_MS;

    tickerRef.current = setInterval(() => {
      const secs = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setRemaining(secs);
      if (secs <= 0 && tickerRef.current) {
        clearInterval(tickerRef.current);
        tickerRef.current = null;
      }
    }, 1000);
  }

  if (!warning) return null;

  // Overlay simple de aviso
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/40">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl p-6 w-[90%] max-w-sm text-center">
        <h2 className="text-lg font-semibold mb-2">Sesión inactiva</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Por inactividad, tu sesión se cerrará en{" "}
          <span className="font-semibold">{remaining ?? 0}s</span>. <br />
          Mueve el mouse o presiona una tecla para continuar.
        </p>
        <button
          onClick={() => {
            lastActivityRef.current = Date.now();
            setWarning(false);
            setRemaining(null);
            scheduleTimers();
          }}
          className="rounded bg-blue-600 hover:bg-blue-700 text-white px-3 py-1"
        >
          Seguir trabajando
        </button>
      </div>
    </div>
  );
}
