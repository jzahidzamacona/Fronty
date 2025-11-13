"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Plus, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

import axiosInstance from "@/hooks/axiosInstance"
import { ApartadosTable } from "@/components/apartados/apartados-table"
import type { ApartadoResumen, MetodoPagoDetalle } from "./apartados-type"

/* ========= Tipos mínimos del API ========= */
type PersonaAPI = {
  nombre: string
  apellidoPaterno: string
  apellidoMaterno?: string | null
  telefono?: string | null
}
type JoyaAPI = { id: number; nombre: string }
type DetalleAPI = { id: number; joya: JoyaAPI; cantidad: number; precioUnitario: number; subtotal: number }
type PagoAPI = { metodo?: string | null; monto?: number | null; idReferencia?: number | null }
type ApartadoAPI = {
  id: number
  cliente: PersonaAPI
  empleado: PersonaAPI
  detalles?: DetalleAPI[]
  totalApartado?: number | null
  formaPago?: string | null
  detallePago?: PagoAPI[]
  montoInicial?: number | null
  montoRestante?: number | null
  fechaApartado?: string | null
  fechaCreacion?: string | null
}

/* ========= Helpers ========= */
const fullName = (p: PersonaAPI) =>
  [p?.nombre, p?.apellidoPaterno, p?.apellidoMaterno].filter(Boolean).join(" ").trim()

/** Normaliza fecha del backend a ISO parseable (YYYY-MM-DDTHH:mm:ss.sssZ). */
function normalizeApiDateToISO(s?: string | null): string | null {
  if (!s) return null
  // 1) uniformar separador y recortar milisegundos > 3
  let t = s.replace(" ", "T").replace(/(\.\d{3})\d+$/, "$1")
  // 2) si ya incluye zona (Z o ±hh:mm) Date lo entiende
  if (/[zZ]|[+\-]\d{2}:\d{2}$/.test(t)) {
    const d = new Date(t)
    return isNaN(d.getTime()) ? null : d.toISOString()
  }
  // 3) sin zona -> construir en local y exportar a ISO (UTC)
  const m = t.match(/^(\d{4})-(\d{2})-(\d{2})[T ]?(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/)
  if (m) {
    const [, y, mo, da, hh, mm, ss, ms] = m
    const d = new Date(
      Number(y),
      Number(mo) - 1,
      Number(da),
      Number(hh),
      Number(mm),
      Number(ss),
      Number(ms || 0),
    )
    return isNaN(d.getTime()) ? null : d.toISOString()
  }
  // último intento
  const d = new Date(t)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

/** Pago válido tras filtrar. (Type guard *estricto*: string y number, no null) */
type PagoOk = { metodo: string; monto: number; idReferencia?: number | null }
const isPagoOk = (p: PagoAPI): p is PagoOk =>
  typeof p.metodo === "string" && typeof p.monto === "number"

const mapPagos = (arr?: PagoAPI[]): MetodoPagoDetalle[] =>
  (Array.isArray(arr) ? arr : [])
    .filter(isPagoOk)
    .map((p) => ({
      metodo: p.metodo,              // o p.metodo.toUpperCase()
      monto: p.monto,
      idReferencia: p.idReferencia ?? null,
    }))

/** Mapea API -> ApartadoResumen que consume tu tabla */
const mapApartadoToResumen = (a: ApartadoAPI): ApartadoResumen => {
  // Damos prioridad a fechaApartado y caemos a fechaCreacion
  const iso = normalizeApiDateToISO(a.fechaApartado) ?? normalizeApiDateToISO(a.fechaCreacion) ?? ""
  return {
    id: a.id,
    // OJO: tu tabla parece crear Date(valor). Dale ISO; si prefieres ver dd/mm/yyyy directo, cambia a:
    // new Date(iso).toLocaleDateString("es-MX")
    date: iso,
    cliente: fullName(a.cliente),
    telefono: a.cliente?.telefono ?? "",
    vendedor: fullName(a.empleado),
    items: (a.detalles ?? []).map((d) => d.joya?.nombre ?? "").filter(Boolean).join(", "),
    total: Number(a.totalApartado ?? 0),
    formaPago: a.formaPago ?? "",
    pagos: mapPagos(a.detallePago),
    restante: Number(a.montoRestante ?? 0),
    montoInicial: Number(a.montoInicial ?? 0),
    montoRestante: Number(a.montoRestante ?? 0),
  }
}

/* Base del endpoint (sin slash final) */
const BASE = (process.env.NEXT_PUBLIC_MSO_API_APARTADO || "/api/apartados").replace(/\/+$/, "")

export default function ApartadosPage() {
  const [base10, setBase10] = useState<ApartadoResumen[]>([]) // últimos 10
  const [vista, setVista] = useState<ApartadoResumen[]>([])
  const [search, setSearch] = useState("")
  const reqCounter = useRef(0) // evita condiciones de carrera

  // Carga inicial: últimos 10
  useEffect(() => {
    const run = async () => {
      try {
        const url = `${BASE}/ultimos?limite=10`
        const { data } = await axiosInstance.get<ApartadoAPI[]>(url)
        const arr = (Array.isArray(data) ? data : []).map(mapApartadoToResumen)
        setBase10(arr)
        setVista(arr)
      } catch (err) {
        console.error("[APARTADOS] Error ultimos:", err)
        setBase10([])
        setVista([])
      }
    }
    run()
  }, [])

  // Buscar por ID exacto; vacío => últimos 10
  useEffect(() => {
    const q = search.trim()

    if (q === "") {
      setVista(base10)
      return
    }
    if (!/^\d+$/.test(q)) {
      setVista([]) // sólo soportamos ID numérico
      return
    }

    const myReq = ++reqCounter.current
    const fetchById = async (id: number) => {
      try {
        const url = `${BASE}/${id}`
        const { data } = await axiosInstance.get<ApartadoAPI>(url)
        if (reqCounter.current !== myReq) return
        setVista([mapApartadoToResumen(data)])
      } catch {
        if (reqCounter.current !== myReq) return
        setVista([]) // no encontrado
      }
    }
    fetchById(Number(q))
  }, [search, base10])

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Apartados</h2>
        <Link href="/apartados/nuevo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Apartado
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Apartados</CardTitle>
          <CardDescription>Vacío: últimos 10 · Número: busca por ID exacto</CardDescription>

          <div className="mt-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Escribe un ID (p. ej. 4)…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-[260px] lg:w-[320px]"
            />
          </div>
        </CardHeader>

        <CardContent>
          <ApartadosTable data={vista} />
        </CardContent>
      </Card>
    </div>
  )
}
