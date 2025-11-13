"use client"

import { useEffect, useState } from "react"
import axiosInstance from "@/hooks/axiosInstance"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card"
import { CorteDetalladoResponse } from "@/types/caja-type"

export function CajaTable() {
  const [data, setData] = useState<CorteDetalladoResponse | null>(null)
  const [loading, setLoading] = useState(true)

useEffect(() => {
  const fetchData = async () => {
    try {
      const today = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Mexico_City" }) // yyyy-MM-dd
      const url = `${process.env.NEXT_PUBLIC_MSO_API_CAJA}/corte-diario/detallado?fecha=${today}`

      const res = await axiosInstance.get(url)
      setData(res.data)
    } catch (error) {
      console.error("❌ Error al obtener los datos de caja:", error)
    } finally {
      setLoading(false)
    }
  }

  fetchData()
}, [])


  if (loading) {
    return <p className="text-center text-sm text-muted-foreground py-4">Cargando información de caja...</p>
  }

  if (!data) {
    return <p className="text-center text-sm text-destructive py-4">No hay datos de caja disponibles para hoy.</p>
  }

  return (
    <Card className="mb-6">
      <CardHeader>
<CardTitle>
  Resumen de Caja - {new Date().toLocaleDateString("es-MX", {
    timeZone: "America/Mexico_City",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  })}
</CardTitle>

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
                {data.detalle.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.tipo}</TableCell>
                    <TableCell>{item.metodoPago}</TableCell>
                    <TableCell className="font-medium">${item.monto.toFixed(2)}</TableCell>
                    <TableCell>{format(new Date(item.fechaHora), "dd/MM/yyyy HH:mm", { locale: es })}</TableCell>
                    <TableCell>{item.empleado}</TableCell>
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
