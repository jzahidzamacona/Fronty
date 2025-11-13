"use client"

import { useEffect, useState } from "react"
import { jwtDecode } from "jwt-decode"

type User = {
  username: string
  roles: string[]
  empleadoId?: number
  exp?: number
}

export function useAuth(): User | null {
  const [user, setUser] = useState<User | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    const checkAuth = () => {
      console.log("[v0] useAuth - checkAuth ejecutándose")
      const token = localStorage.getItem("accessToken")
      console.log("[v0] useAuth - token encontrado:", !!token)

      if (!token) {
        console.log("[v0] useAuth - No hay token, estableciendo user a null")
        setUser(null)
        return
      }

      try {
        const decoded = jwtDecode<any>(token)

        // Verificar si el token ha expirado
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          console.log("[v0] useAuth - Token expirado")
          localStorage.removeItem("accessToken")
          localStorage.removeItem("refreshToken")
          setUser(null)
          return
        }

        const userData = {
          username: decoded.sub || decoded.username || "Usuario",
          roles: decoded.roles || [],
          empleadoId: decoded.empleadoId,
          exp: decoded.exp,
        }
        console.log("[v0] useAuth - Usuario establecido:", userData.username)
        setUser(userData)
      } catch (error) {
        console.error("[v0] useAuth - Error decodificando token:", error)
        localStorage.removeItem("accessToken")
        localStorage.removeItem("refreshToken")
        setUser(null)
      }
    }

    checkAuth()

    const handleAuthChange = () => {
      console.log("[v0] useAuth - Evento authChanged recibido")
      checkAuth()
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "accessToken") {
        setRefreshTrigger((prev) => prev + 1)
      }
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("authChanged", handleAuthChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("authChanged", handleAuthChange)
    }
  }, [refreshTrigger])

  useEffect(() => {
    ;(window as any).refreshAuth = () => setRefreshTrigger((prev) => prev + 1)
  }, [])

  return user
}
