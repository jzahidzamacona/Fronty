import api, { setAuthTokens, clearAuthTokens } from "@/hooks/axiosInstance"
import { jwtDecode } from "jwt-decode"

type LoginResponse = {
  accessToken: string
  refreshToken: string
}

export async function login(username: string, password: string) {
  const { data } = await api.post<LoginResponse>("/api/auth/login", {
    username,
    password,
  })

  // Guardar tokens en localStorage y configurar axios
  setAuthTokens({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  })

  if (typeof window !== "undefined") {
    console.log("[v0] Login exitoso, disparando eventos de auth")
    window.dispatchEvent(new Event("authChanged"))
    if ((window as any).refreshAuth) {
      ;(window as any).refreshAuth()
    }

    // Pequeño delay para permitir que useAuth procese los tokens
    await new Promise((resolve) => setTimeout(resolve, 100))
    console.log("[v0] Delay completado, tokens deberían estar procesados")
  }

  return data
}

export function logout() {
  clearAuthTokens()

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("authChanged"))
    if ((window as any).refreshAuth) {
      ;(window as any).refreshAuth()
    }
  }

  window.location.href = "/login"
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false

  const token = localStorage.getItem("accessToken")
  if (!token) return false

  try {
    const decoded = jwtDecode<any>(token)
    // Check if token is expired
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      // Token expired, clean up
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
      return false
    }
    return true
  } catch (error) {
    // Invalid token, clean up
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    return false
  }
}
