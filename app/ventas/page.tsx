"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import axiosInstance from "@/hooks/axiosInstance"

import VentasTable from "@/components/ventas/ventas-table"
import type { VentaResumen } from "./ventas-type"

/* ========= Tipos de la API ========= */
type PersonaAPI = { nombre: string; apellidoPaterno: string; apellidoMaterno: string }
type JoyaAPI = { id: number; nombre: string }
type DetalleAPI = { id: number; joya: JoyaAPI; cantidad: number; precioUnitario: number; subtotal: number }
type PagoAPI = { metodo?: string | null; monto?: number | null; idReferencia?: number | null }

type VentaAPI = {
  id: number
  cliente: PersonaAPI
  empleado: PersonaAPI
  detalles: DetalleAPI[]
  totalVenta: number
  formaPago: string
  fechaVenta: string
  detallePago?: PagoAPI[]
}

/* ========= Helpers ========= */
const fullName = (p: PersonaAPI) => `${p.nombre} ${p.apellidoPaterno} ${p.apellidoMaterno}`.trim()

type PagoOk = { metodo: string; monto: number }
const isPagoOk = (p: PagoAPI): p is PagoOk =>
  typeof p.metodo === "string" && typeof p.monto === "number"

const sumPagos = (pagos: PagoAPI[] | undefined, match: (metodo: string) => boolean): number => {
  const arr = Array.isArray(pagos) ? pagos : []
  return arr
    .filter(isPagoOk)
    .filter(p => match(p.metodo.toUpperCase()))
    .reduce((acc, p) => acc + p.monto, 0)
}

const mapVentaToResumen = (venta: VentaAPI): VentaResumen => {
  const efectivo = sumPagos(venta.detallePago, m => m.includes("EFECTIVO"))
  const tarjeta  = sumPagos(venta.detallePago, m => m.includes("TARJETA"))
  const nota     = sumPagos(venta.detallePago, m => m.includes("NOTA"))
  return {
    id: venta.id,
    fecha: new Date(venta.fechaVenta).toLocaleDateString("es-MX"),
    cliente: fullName(venta.cliente),
    empleado: fullName(venta.empleado),
    productos: (venta.detalles ?? [])
      .map(d => d.joya?.nombre ?? "")
      .filter(Boolean)
      .join(", "),
    total: Number(venta.totalVenta ?? 0),
    formaPago: venta.formaPago,
    efectivo,
    tarjeta,
    notaCredito: nota,
  }
}

/* ========= Página ========= */
export default function VentasPage() {
  const [baseVentas, setBaseVentas] = useState<VentaResumen[]>([]) // últimas 10
  const [vista, setVista] = useState<VentaResumen[]>([])           // lo que se muestra
  const [search, setSearch] = useState("")

  // Cargar últimas 10 al entrar
  useEffect(() => {
    const fetchUltimas = async () => {
      try {
        const url = `${process.env.NEXT_PUBLIC_MSO_API_VENTA}/ultimas?limite=10`
        const { data } = await axiosInstance.get<VentaAPI[]>(url)
        const mapeadas = (Array.isArray(data) ? data : []).map(mapVentaToResumen)
        setBaseVentas(mapeadas)
        setVista(mapeadas)
      } catch {
        setBaseVentas([])
        setVista([])
      }
    }
    fetchUltimas()
  }, [])

  // Búsqueda: ID numérico -> API /{id}; texto -> filtra base; vacío -> vuelve a últimas 10
  useEffect(() => {
    const q = search.trim()
    if (!q) {                      // input vacío
      setVista(baseVentas)
      return
    }
    if (/^\d+$/.test(q)) {         // solo dígitos => buscar por ID
      const fetchById = async (id: number) => {
        try {
          const url = `${process.env.NEXT_PUBLIC_MSO_API_VENTA}/${id}`
          const { data } = await axiosInstance.get<VentaAPI>(url)
          setVista([mapVentaToResumen(data)])
        } catch {
          setVista([]) // 404 u error
        }
      }
      fetchById(Number(q))
      return
    }
    // Texto => filtro local sobre las últimas 10
    const lower = q.toLowerCase()
    setVista(
      baseVentas.filter(v =>
        v.cliente.toLowerCase().includes(lower) ||
        v.productos.toLowerCase().includes(lower) ||
        v.empleado.toLowerCase().includes(lower) ||
        String(v.id).includes(q)
      )
    )
  }, [search, baseVentas])

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Ventas</h2>
        <Link href="/ventas/nueva">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Venta
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar venta</CardTitle>
          <CardDescription>
            Vacío: muestra las últimas 10 · Número: busca por ID · Texto: filtra localmente
          </CardDescription>
          <div className="mt-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ej. 135 o 'Héctor'"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-[240px] lg:w-[320px]"
            />
          </div>
        </CardHeader>
        <CardContent>
          <VentasTable data={vista} />
        </CardContent>
      </Card>
    </div>
  )
}
