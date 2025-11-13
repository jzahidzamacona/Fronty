"use client"

import { useEffect, useState } from "react"
import axiosInstance from "@/hooks/axiosInstance"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import {
  Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DetalleMovimientoCaja {
  tipo: string
  metodoPago: string
  monto: number
  fechaHora: string
  empleado: string
}

interface CorteDetalladoResponse {
  fecha: string
  montoApertura: number
  totalEntradasEfectivo: number
  totalEntradasTarjeta: number
  totalNotasCreditoUsadas: number
  totalSalidas: number
  totalEnCaja: number
  detalle: DetalleMovimientoCaja[]
}

export function CorteCajaResumen() {
  const [data, setData] = useState<CorteDetalladoResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10)
      const url = `${process.env.NEXT_PUBLIC_MSO_API_CAJA}/corte-diario/detallado?fecha=${today}`
      const res = await axiosInstance.get<CorteDetalladoResponse>(url)
      setData(res.data)
    } catch (error) {
      console.error("❌ Error al obtener el resumen de caja:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return <p className="text-center text-sm text-muted-foreground py-4">Cargando resumen de caja...</p>
  }

  if (!data) {
    return <p className="text-center text-sm text-destructive py-4">No hay datos de caja para hoy.</p>
  }

  const fechaFormateada = format(new Date(data.fecha), "dd/MM/yyyy", { locale: es })

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          Resumen de Caja - {fechaFormateada}
        </CardTitle>
        <Button variant="outline" size="icon" onClick={fetchData}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-2 text-sm">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div><strong>Apertura:</strong> ${data.montoApertura.toFixed(2)}</div>
          <div><strong>Entradas Efectivo:</strong> ${data.totalEntradasEfectivo.toFixed(2)}</div>
          <div><strong>Entradas Tarjeta:</strong> ${data.totalEntradasTarjeta.toFixed(2)}</div>
          <div><strong>Notas de Crédito:</strong> ${data.totalNotasCreditoUsadas.toFixed(2)}</div>
          <div><strong>Total Salidas:</strong> <span className="text-red-600">-${data.totalSalidas.toFixed(2)}</span></div>
          <div><strong>Total en Caja:</strong> <span className="font-bold text-green-700">${data.totalEnCaja.toFixed(2)}</span></div>
        </div>

        <div className="mt-6">
          <h4 className="font-semibold mb-2">Movimientos</h4>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead>Empleado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.detalle.map((mov, index) => (
                  <TableRow key={index}>
                    <TableCell>{mov.tipo}</TableCell>
                    <TableCell>{mov.metodoPago}</TableCell>
                    <TableCell>${mov.monto.toFixed(2)}</TableCell>
                    <TableCell>{format(new Date(mov.fechaHora), "dd/MM/yyyy HH:mm", { locale: es })}</TableCell>
                    <TableCell>{mov.empleado}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
