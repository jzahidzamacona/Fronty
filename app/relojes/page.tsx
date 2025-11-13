"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Plus } from "lucide-react"
import axiosInstance from "@/hooks/axiosInstance"
import { RelojesTable } from "@/components/relojes/relojes-table"
import type { RelojResumen, MetodoPagoDetalle } from "@/app/relojes/type-relojes"

/* ========= Tipos mínimos del API ========= */
type PersonaAPI = {
  nombre: string
  apellidoPaterno: string
  apellidoMaterno?: string | null
  telefono?: string | null
}
type DetalleAPI = {
  id: number
  condicionRecibida?: string | null
  observaciones?: string | null
}
type PagoAPI = { metodo?: string | null; monto?: number | null; idReferencia?: number | null }
type RelojAPI = {
  id: number
  cliente: PersonaAPI
  empleado: PersonaAPI
  detalles?: DetalleAPI[]
  fechaRecibida?: string | null
  fechaDeEntrega?: string | null
  fechaCreacion?: string | null
  total?: number | null
  montoInicial?: number | null
  montoRestante?: number | null
  formaPago?: string | null
  detallePago?: PagoAPI[]
}

/* ========= Helpers sin errores ========= */
const fullName = (p: PersonaAPI) =>
  [p?.nombre, p?.apellidoPaterno, p?.apellidoMaterno].filter(Boolean).join(" ").trim()

function toMXDate(s?: string | null, fallback?: string | null): string {
  const tryOne = (raw?: string | null): string => {
    if (!raw) return ""
    const clean = raw.replace(" ", "T").replace(/(\.\d{3})\d+$/, "$1")
    let d = new Date(clean)
    if (!isNaN(d.getTime())) return d.toLocaleDateString("es-MX")
    const m = clean.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/)
    if (m) {
      const [_, y, mo, da, hh, mm, ss] = m.map(Number)
      d = new Date(y, mo - 1, da, hh, mm, ss)
      if (!isNaN(d.getTime())) return d.toLocaleDateString("es-MX")
    }
    return ""
  }
  return tryOne(s) || tryOne(fallback) || ""
}

/* ---- Type guard + helpers de pagos (sin rojos) ---- */
type PagoOk = { metodo: string; monto: number; idReferencia?: number | null }

const isPagoOk = (p: PagoAPI): p is PagoOk =>
  typeof p.metodo === "string" && typeof p.monto === "number"

const sumPagos = (arr?: PagoAPI[], match?: (m: string) => boolean): number => {
  const base: PagoOk[] = (Array.isArray(arr) ? arr : []).filter(isPagoOk)
  const lista = match ? base.filter((p) => match(p.metodo.toUpperCase())) : base
  return lista.reduce<number>((acc, p) => acc + p.monto, 0)
}

const mapPagos = (arr?: PagoAPI[]): MetodoPagoDetalle[] =>
  (Array.isArray(arr) ? arr : [])
    .filter(isPagoOk)
    .map((p) => ({ metodo: p.metodo, monto: p.monto, idReferencia: p.idReferencia ?? null }))

/* Mapea RelojAPI -> RelojResumen */
const mapReloj = (r: RelojAPI): RelojResumen => {
  const efectivo = sumPagos(r.detallePago, (m) => m === "EFECTIVO")
  const tarjeta  = sumPagos(r.detallePago, (m) => m === "TARJETA")
  const nota     = sumPagos(r.detallePago, (m) => m === "NOTA_CREDITO")

  return {
    id: String(r.id),
    date: toMXDate(r.fechaRecibida, r.fechaCreacion),
    entrega: toMXDate(r.fechaDeEntrega, null),
    cliente: fullName(r.cliente),
    telefono: r.cliente?.telefono ?? "",
    vendedor: fullName(r.empleado),
    condiciones: (r.detalles ?? []).map(d => d.condicionRecibida ?? "").filter(Boolean).join(" / "),
    observaciones: (r.detalles ?? []).map(d => d.observaciones ?? "").filter(Boolean).join(" / "),
    total: Number(r.total ?? 0),
    formaPago: r.formaPago ?? "",
    montoInicial: Number(r.montoInicial ?? 0),
    efectivo,
    tarjeta,
    notaCredito: nota,
    restante: Number(r.montoRestante ?? 0),
  }
}

/* Base de endpoint */
const BASE = (process.env.NEXT_PUBLIC_API_RELOJES || "/api/relojes").replace(/\/+$/, "")

export default function RelojesPage() {
  const [base10, setBase10] = useState<RelojResumen[]>([]) // últimos 10
  const [vista, setVista] = useState<RelojResumen[]>([])
  const [search, setSearch] = useState("")
  const reqCounter = useRef(0)

  // cargar últimos 10
useEffect(() => {
  const run = async () => {
    try {
      // intentamos primero con ?limite=10 y caemos a /ultimos si no
      const candidates = [
        `${BASE}/ultimos?limite=10`,
        `${BASE}/ultimos`,
      ]

      let arr: RelojResumen[] = []
      for (const url of candidates) {
        try {
          const { data } = await axiosInstance.get<RelojAPI[] | RelojAPI>(url)
          if (Array.isArray(data)) {
            arr = data.map(mapReloj).slice(0, 10)
            break
          }
        } catch {
          /* probamos el siguiente candidato */
        }
      }

      setBase10(arr)
      setVista(arr)
    } catch (e) {
      console.error("[RELOJES] Error ultimos:", e)
      setBase10([])
      setVista([])
    }
  }
  run()
}, [])


  // búsqueda SOLO por ID numérico
  useEffect(() => {
    const q = search.trim()
    if (q === "") {
      setVista(base10)
      return
    }
    if (!/^\d+$/.test(q)) {
      setVista([]) // solo soportamos ID exacto
      return
    }

    const myReq = ++reqCounter.current
    const fetchById = async (id: number) => {
      try {
        const { data } = await axiosInstance.get<RelojAPI>(`${BASE}/${id}`)
        if (reqCounter.current !== myReq) return
        setVista([mapReloj(data)])
      } catch {
        if (reqCounter.current !== myReq) return
        setVista([])
      }
    }
    fetchById(Number(q))
  }, [search, base10])

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Relojes</h2>
        <Link href="/relojes/nuevo">
          <Button><Plus className="mr-2 h-4 w-4" />Nuevo Servicio</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Relojes</CardTitle>
          <CardDescription>Vacío: últimos 10 · Número: busca por ID exacto</CardDescription>

          <div className="mt-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Escribe ID (p. ej. 39)…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-[260px] lg:w-[320px]"
            />
          </div>
        </CardHeader>

        <CardContent>
          {/* Ocultamos el buscador interno de la tabla */}
          <RelojesTable data={vista} showSearch={false} />
        </CardContent>
      </Card>
    </div>
  )
}
