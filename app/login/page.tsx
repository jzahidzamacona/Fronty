"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image" 
import { login } from "@/app/api/auth"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const passwordRef = useRef<HTMLInputElement>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setLoading(true)
    try {
      await login(username, password)
      window.location.href = "/"
    } catch {
      setErr("Credenciales erróneas")
    } finally {
      setLoading(false)
    }
  }

  function handleUsernameKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault()
      passwordRef.current?.focus()
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-muted/30 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-xl border border-zinc-200 dark:border-zinc-800">
        {/* ⬇️ NUEVO: logo centrado */}
       <div className="flex justify-center mb-4">
  <Image
    src="/logo-diamante.png"
    alt="Joyería Diamante"
    width={260}
    height={260}
    priority
    // más grande y nítido; se adapta por breakpoint
    className="w-36 md:w-48 lg:w-56 h-auto drop-shadow-sm"
  />
</div>


        <h1 className="text-xl font-semibold text-center mb-6">Iniciar sesión</h1>

        {err && (
          <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-2 text-sm">
            {err}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Usuario</label>
            <input
              className="w-full rounded-md border px-3 py-2 focus:ring-2 ring-blue-500 bg-background"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleUsernameKeyDown}
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Contraseña</label>
            <input
              ref={passwordRef}
              type="password"
              className="w-full rounded-md border px-3 py-2 focus:ring-2 ring-blue-500 bg-background"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            disabled={loading}
           className="w-full rounded-md bg-black hover:bg-black/90 text-white py-2 font-medium
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30
disabled:opacity-60 disabled:cursor-not-allowed"

          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  )
}
