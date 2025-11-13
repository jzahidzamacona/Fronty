// components/Navbar.tsx
"use client";

import { logout } from "@/app/api/auth";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const user = useAuth();

  return (
    <div className="w-full flex items-center justify-end gap-3 p-3 border-b">
      {user && (
        <div className="flex items-center gap-2 text-sm">
          {user.username && <span className="font-medium">{user.username}</span>}
          {user.roles.map((r) => (
            <span
              key={r}
              className="px-2 py-0.5 text-xs rounded-full uppercase
                         bg-zinc-200 text-zinc-800
                         dark:bg-zinc-700 dark:text-zinc-100"
            >
              {r}
            </span>
          ))}
        </div>
      )}

      <button
        onClick={logout}
        className="rounded bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
