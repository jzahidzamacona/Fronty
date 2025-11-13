"use client"

import axios, { type AxiosError, type AxiosRequestConfig } from "axios"

/* ===========================================
   BASE URL NORMALIZADA
   =========================================== */
const baseLocal = (process.env.NEXT_PUBLIC_REACT_BASE_LOCAL ?? "http://localhost:8080").replace(/\/$/, "")

/* ===========================================
   INSTANCIA PRINCIPAL
   =========================================== */
const api = axios.create({
  baseURL: baseLocal,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
})

/* ===========================================
   MANEJO DE TOKENS (helpers)
   =========================================== */

// 👉 añade esto junto a los helpers
export function isAuthExpiredError(err: any) {
  return !!(err && (err as any).__authExpired)
}

export function setAuthTokens(tokens: { accessToken: string; refreshToken?: string }) {
  if (typeof window === "undefined") return
  localStorage.setItem("accessToken", tokens.accessToken)
  if (tokens.refreshToken) localStorage.setItem("refreshToken", tokens.refreshToken)

  // ✅ NUEVO: Guardar timestamp cuando se obtiene el token
  localStorage.setItem("tokenTimestamp", Date.now().toString())

  api.defaults.headers.common["Authorization"] = `Bearer ${tokens.accessToken}`

  window.dispatchEvent(new CustomEvent("authChanged"))
  // ✅ NUEVO: Evento para renovación de token
  window.dispatchEvent(new CustomEvent("tokenRefreshed"))
}

export function clearAuthTokens() {
  if (typeof window === "undefined") return
  localStorage.removeItem("accessToken")
  localStorage.removeItem("refreshToken")
  localStorage.removeItem("tokenTimestamp") // ✅ NUEVO
  delete api.defaults.headers.common["Authorization"]

  window.dispatchEvent(new CustomEvent("authChanged"))
}

// ✅ NUEVO: Función para obtener tiempo restante de sesión
export function getSessionTimeLeft() {
  if (typeof window === "undefined") return { hours: 0, minutes: 0, expired: true }

  const timestamp = localStorage.getItem("tokenTimestamp")
  if (!timestamp) return { hours: 0, minutes: 0, expired: true }

  const tokenAge = Date.now() - Number.parseInt(timestamp)
  const NINE_HOURS = 9 * 60 * 60 * 1000 // 9 horas en milisegundos
  const remaining = NINE_HOURS - tokenAge

  if (remaining <= 0) return { hours: 0, minutes: 0, expired: true }

  const hours = Math.floor(remaining / (60 * 60 * 1000))
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000))

  return { hours, minutes, expired: false }
}

// ✅ NUEVO: Función para renovar token proactivamente
async function renewTokenProactively() {
  if (typeof window === "undefined") return false

  const refreshToken = localStorage.getItem("refreshToken")
  if (!refreshToken) return false

  if (isRefreshing) return false // No hacer múltiples renovaciones simultáneas

  isRefreshing = true

  try {
    console.log("🔄 Renovando token proactivamente...")
    const { data } = await bare.post<{ accessToken: string; refreshToken?: string }>("/api/auth/refresh", {
      refreshToken,
    })

    const newAccess = data?.accessToken
    if (!newAccess) throw new Error("Refresh sin accessToken")

    setAuthTokens({
      accessToken: newAccess,
      refreshToken: data?.refreshToken ?? refreshToken,
    })

    console.log("✅ Token renovado proactivamente - válido por 9 horas más")
    return true
  } catch (error) {
    console.error("❌ Error renovando token proactivamente:", error)
    return false
  } finally {
    isRefreshing = false
  }
}

// ✅ NUEVO: Verificar y renovar token si es necesario
async function checkAndRenewToken() {
  if (typeof window === "undefined") return

  const timestamp = localStorage.getItem("tokenTimestamp")
  if (!timestamp) return

  const tokenAge = Date.now() - Number.parseInt(timestamp)
  const SEVEN_HOURS = 7 * 60 * 60 * 1000 // 7 horas en milisegundos

  // Si el token tiene más de 7 horas, renovarlo proactivamente
  if (tokenAge > SEVEN_HOURS) {
    await renewTokenProactively()
  }
}

/* ===========================================
   REQUEST: ADJUNTAR ACCESS TOKEN
   =========================================== */
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken")
    if (token) {
      config.headers = config.headers ?? {}
      ;(config.headers as any)["Authorization"] = `Bearer ${token}`
    }
  }
  return config
})

/* ===========================================
   REFRESH FLOW (control de cola)
   =========================================== */
let isRefreshing = false
let isLoggingOut = false // ✅ NUEVO: evita múltiples redirecciones simultáneas

type QueueItem = {
  resolve: (value: unknown) => void
  reject: (reason?: any) => void
  config: AxiosRequestConfig
}

let failedQueue: QueueItem[] = []

function processQueue(error: any, newToken: string | null) {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (error) reject(error)
    else if (newToken) {
      config.headers = config.headers ?? {}
      ;(config.headers as any).Authorization = `Bearer ${newToken}`
      resolve(api(config))
    }
  })
  failedQueue = []
}

const bare = axios.create({ baseURL: baseLocal })

/* ===========================================
   UTILIDADES PARA FILTRAR CUÁNDO REFRESCAR
   =========================================== */
// ✅ NUEVO: sólo refrescamos si es un endpoint protegido "normal"
function shouldTryRefresh(original?: AxiosRequestConfig): boolean {
  if (!original?.url) return false
  const url = original.url.toString()

  // Normalizamos (por si llega con baseURL incluida)
  const path = url.startsWith("http") ? new URL(url).pathname : url

  // No refrescar para:
  if (
    path.startsWith("/api/auth/") || // auth endpoints
    path.startsWith("/api/pdf/") || // PDFs abiertos al público
    path.startsWith("/api/abonos/ticket/") || // tickets PDF públicos
    path === "/error" // error handler de Spring
  ) {
    return false
  }

  // Sólo si es API y el request llevaba Authorization (o tenemos token local)
  const hadAuthHeader = !!original.headers && "Authorization" in (original.headers as any)
  const hasLocalToken = typeof window !== "undefined" && !!localStorage.getItem("accessToken")

  return path.startsWith("/api/") && (hadAuthHeader || hasLocalToken)
}

// ✅ NUEVO: cerrar sesión con protección contra bucles
function safeLogout() {
  if (typeof window === "undefined") return
  if (isLoggingOut) return
  isLoggingOut = true

  // ✅ NUEVO: Avisar al usuario antes de redirigir
  alert("Tu sesión ha expirado. Serás redirigido al login.")

  clearAuthTokens()
  // Usa replace para no permitir "Atrás" volver a un estado inválido
  window.location.replace("/login")
}

/* ===========================================
   RESPONSE: REFRESH SÓLO EN 401 VÁLIDOS
   =========================================== */
api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError<any>) => {
    const status = err?.response?.status
    const original = err.config as AxiosRequestConfig & { _retry?: boolean }

    // Cualquier cosa que NO sea 401 => NO tocar sesión
    if (status !== 401) {
      // Log útil para depurar
      console.error("API error:", status, err?.response?.data)
      return Promise.reject(err)
    }

    // 401 sin config o ya reintentado => no forzamos logout, sólo devolvemos
    if (!original || original._retry) {
      return Promise.reject(err)
    }

    // Filtramos: sólo refrescar si de verdad aplica
    if (!shouldTryRefresh(original)) {
      // No refrescamos, tampoco borramos sesión
      return Promise.reject(err)
    }

    original._retry = true

    const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null

    if (!refreshToken) {
      // No hay refresh => no hacemos logout automático aquí para no botarte
      // de la pantalla por cualquier 401 "inofensivo".
      return Promise.reject(err)
    }

    // Cola si ya estamos refrescando
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject, config: original })
      })
    }

    isRefreshing = true

    try {
      const { data } = await bare.post<{ accessToken: string; refreshToken?: string }>("/api/auth/refresh", {
        refreshToken,
      })

      const newAccess = data?.accessToken
      if (!newAccess) throw new Error("Refresh sin accessToken")

      setAuthTokens({
        accessToken: newAccess,
        refreshToken: data?.refreshToken ?? refreshToken,
      })

      processQueue(null, newAccess)
      isRefreshing = false

      original.headers = original.headers ?? {}
      ;(original.headers as any).Authorization = `Bearer ${newAccess}`
      return api(original)
    } catch (refreshErr: any) {
      processQueue(refreshErr, null)
      isRefreshing = false

      // 🔇 Logout suave: NO redirigimos ni borramos tokens aquí.
      // Marcamos el error para que la UI lo maneje sin sacarte de la pantalla.
      ;(refreshErr as any).__authExpired = true
      return Promise.reject(refreshErr)
    }
  },
)

// ✅ NUEVO: Verificación automática cada 15 minutos
if (typeof window !== "undefined") {
  setInterval(checkAndRenewToken, 15 * 60 * 1000) // Cada 15 minutos

  // ✅ NUEVO: Verificar cuando el usuario regresa a la pestaña
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      console.log("👁️ Usuario regresó - verificando token...")
      checkAndRenewToken()
    }
  })
}

export default api
