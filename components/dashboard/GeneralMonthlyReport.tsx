"use client"

import { useEffect, useState } from "react"
import axiosInstance from "@/hooks/axiosInstance"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"

interface Detalle {
  id?: number
  folio?: string
  cliente: string
  total?: number
  formaPago?: string
  metodoPago?: string
  montoEfectivo?: number | null
  montoTarjeta?: number | null
  montoNotaCredito?: number | null
}

interface Reporte {
  fecha: string
  totalVentas: number
  totalVentasEfectivo: number
  totalVentasTarjeta: number
  totalVentasCredito: number
  ventas: Detalle[]
  totalApartados: number
  totalApartadosEfectivo: number
  totalApartadosTarjeta: number
  totalPorCobrarApartados: number
  apartados: Detalle[]
  totalHechuras: number
  totalHechurasEfectivo: number
  totalHechurasTarjeta: number
  totalPorCobrarHechuras: number
  hechuras: Detalle[]
  totalRelojes: number
  totalRelojesEfectivo: number
  totalRelojesTarjeta: number
  totalPorCobrarRelojes: number
  relojes: Detalle[]
  totalAbonos: number
  abonos: Detalle[]
}

export function GeneralMonthlyReport() {
  const [data, setData] = useState<Reporte[]>([])
  const [loading, setLoading] = useState(true)

  const today = new Date()
  const primerDia = new Date(today.getFullYear(), today.getMonth(), 1)
  const ultimoDia = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  useEffect(() => {
    axiosInstance
      .get("/api/reporte-diario/rango", {
        params: {
          desde: format(primerDia, "yyyy-MM-dd"),
          hasta: format(ultimoDia, "yyyy-MM-dd"),
        },
      })
      .then((r) => setData(r.data.dias))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Cargando reporte mensual...</p>

  return (
    <div className="space-y-6">
      {data.map((reporte) => (
        <div key={reporte.fecha}>
          <h3 className="text-xl font-bold">
            {format(new Date(reporte.fecha), "EEEE dd MMMM yyyy", { locale: es })}
          </h3>
          <Separator className="my-4" />

          {/* Ventas */}
          <h4 className="text-lg font-semibold">Ventas</h4>
          <p>
            Total: ${(reporte.totalVentas ?? 0).toFixed(2)} — Efectivo: ${(reporte.totalVentasEfectivo ?? 0).toFixed(2)} — 
            Tarjeta: ${(reporte.totalVentasTarjeta ?? 0).toFixed(2)} — 
            Nota Crédito: ${(reporte.totalVentasCredito ?? 0).toFixed(2)}
          </p>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Folio</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Forma de Pago</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reporte.ventas.map((venta, index) => (
                <TableRow key={venta.id ?? `${venta.folio}-${index}`}>
                  <TableCell>{venta.folio}</TableCell>
                  <TableCell>{venta.cliente}</TableCell>
                  <TableCell>${(venta.total ?? 0).toFixed(2)}</TableCell>
                  <TableCell>{venta.formaPago}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Puedes repetir esto mismo para apartados, hechuras, etc. */}
        </div>
      ))}
    </div>
  )
}
