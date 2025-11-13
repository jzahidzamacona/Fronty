"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { addDays, startOfMonth, startOfWeek } from "date-fns"
import type { DateRange } from "react-day-picker"
import axiosInstance from "@/hooks/axiosInstance"
import { VentasPorEmpleadoTable } from "@/components/ventas/ventas-por-empleado-table"
import type { VentaPorEmpleado, EstadisticasEmpleado } from "@/types/venta-por-empleados"
import dynamic from "next/dynamic"

const Chart = dynamic(() => import("@/components/ui/chart-bar"), { ssr: false })

export default function VentasPorEmpleadoPage() {
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<string>("")
  const [empleados, setEmpleados] = useState<{ id: string, nombre: string }[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [ventas, setVentas] = useState<VentaPorEmpleado[]>([])
  const [estadisticas, setEstadisticas] = useState<EstadisticasEmpleado | null>(null)
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  })

  useEffect(() => {
    axiosInstance.get("/api/empleados").then((r) => {
      const empleadosBackend = r.data.map((emp: any) => ({
        id: emp.id.toString(),
        nombre: `${emp.nombre} ${emp.apellidoPaterno} ${emp.apellidoMaterno}`,
      }))
      setEmpleados(empleadosBackend)
    })
  }, [])

  const buscarVentas = async () => {
    if (!empleadoSeleccionado || !date?.from || !date?.to) return
    setIsLoading(true)

    try {
      const desde = new Date(date.from).toISOString()
      const hasta = new Date(date.to).toISOString()

      const response = await axiosInstance.get<VentaPorEmpleado[]>(
        `/api/ventas/empleado/${empleadoSeleccionado}/rango`,
        { params: { desde, hasta } }
      )

      const ventasReal = response.data
      const totalVentas = ventasReal.length
      const montoTotal = ventasReal.reduce((sum, v) => sum + v.totalVenta, 0)
      const promedioVenta = totalVentas > 0 ? montoTotal / totalVentas : 0
      const mejorVenta = Math.max(...ventasReal.map((v) => v.totalVenta))

const diasSemana = [
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
  "domingo",
]

// Inicializar todos en cero
const ventasPorDia: Record<string, number> = {
  lunes: 0,
  martes: 0,
  miércoles: 0,
  jueves: 0,
  viernes: 0,
  sábado: 0,
  domingo: 0,
}

for (const venta of ventasReal) {
  const dia = new Date(venta.fechaVenta).toLocaleDateString("es-MX", {
    weekday: "long",
  }).toLowerCase()

  ventasPorDia[dia] = (ventasPorDia[dia] || 0) + 1
}


      setVentas(ventasReal)
      setEstadisticas({ totalVentas, montoTotal, promedioVenta, mejorVenta, ventasPorDia })
    } catch (error) {
      console.error("Error al buscar ventas:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const empleadoNombre = empleados.find((emp) => emp.id === empleadoSeleccionado)?.nombre || ""

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Ventas por Empleado</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar ventas por empleado</CardTitle>
          <CardDescription>
            Seleccione un empleado y un rango de fechas para ver sus ventas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="empleado">Empleado</Label>
              <Select value={empleadoSeleccionado} onValueChange={setEmpleadoSeleccionado}>
                <SelectTrigger id="empleado">
                  <SelectValue placeholder="Seleccionar empleado" />
                </SelectTrigger>
                <SelectContent>
                  {empleados.map((empleado) => (
                    <SelectItem key={empleado.id} value={empleado.id}>
                      {empleado.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rango de fechas</Label>
              <DatePickerWithRange date={date} setDate={setDate} />
              <div className="flex gap-2 mt-2">
                <Button
                  variant="secondary"
                  onClick={() =>
                    setDate({
                      from: startOfWeek(new Date(), { weekStartsOn: 1 }),
                      to: new Date(),
                    })
                  }
                >
                  Esta semana
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    setDate({
                      from: startOfMonth(new Date()),
                      to: new Date(),
                    })
                  }
                >
                  Este mes
                </Button>
              </div>
            </div>
          </div>
          <Button className="mt-6" onClick={buscarVentas} disabled={!empleadoSeleccionado}>
            Buscar ventas
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <Skeleton className="h-40 w-full rounded-md" />
      ) : ventas.length > 0 ? (
        <div className="space-y-4">
          <VentasPorEmpleadoTable ventas={ventas} empleadoNombre={empleadoNombre} />
          {estadisticas && (
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas de ventas</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-4 gap-4">
                <div>
                  <p className="text-muted-foreground">Total de ventas</p>
                  <p className="font-bold text-2xl">{estadisticas.totalVentas}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Monto total</p>
                  <p className="font-bold text-2xl">${estadisticas.montoTotal.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Promedio por venta</p>
                  <p className="font-bold text-2xl">${estadisticas.promedioVenta.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Mejor venta</p>
                  <p className="font-bold text-2xl">${estadisticas.mejorVenta.toFixed(2)}</p>
                </div>
              </CardContent>
              <CardContent>
                <Chart
                  title="Ventas por día"
                  data={Object.entries(estadisticas.ventasPorDia).map(([dia, total]) => ({
                    name: dia,
                    total,
                  }))}
                />
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground text-center mt-4">
          No hay ventas para este empleado en el rango seleccionado.
        </p>
      )}
    </div>
  )
}
