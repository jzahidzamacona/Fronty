"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Download, Printer } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useState, useEffect } from "react"

interface SalidaCaja {
  id: string
  fecha: Date
  monto: number
  motivo: string
  autorizadoPor: string
  registradoPor: string
  descripcion?: string
}

interface VentaDiaria {
  id: string
  hora: Date
  cliente: string
  total: number
  metodoPago: string
}

interface ReporteDiario {
  fecha: Date
  montoInicial: number
  totalVentas: number
  totalSalidas: number
  saldoFinal: number
  salidas: SalidaCaja[]
  ventas: VentaDiaria[]
}

export function ReporteDiario() {
  const [reporte, setReporte] = useState<ReporteDiario | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Aquí iría la llamada a la API para obtener el reporte
    const fetchData = async () => {
      try {
        // Simulamos una llamada a la API
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Datos de ejemplo
        const data: ReporteDiario = {
          fecha: new Date(),
          montoInicial: 5000,
          totalVentas: 8500,
          totalSalidas: 2000,
          saldoFinal: 11500, // Inicial + Ventas - Salidas
          salidas: [
            {
              id: "1",
              fecha: new Date(new Date().setHours(10, 30)),
              monto: 1200,
              motivo: "Retiro para gastos personales",
              autorizadoPor: "Roberto Gómez (Dueño)",
              registradoPor: "Juan Pérez",
            },
            {
              id: "2",
              fecha: new Date(new Date().setHours(15, 45)),
              monto: 800,
              motivo: "Pago a proveedor",
              autorizadoPor: "Silvia Martínez (Dueña)",
              registradoPor: "María López",
              descripcion: "Pago en efectivo al proveedor de plata",
            },
          ],
          ventas: [
            {
              id: "V-2023-0145",
              hora: new Date(new Date().setHours(9, 15)),
              cliente: "María Rodríguez",
              total: 4999,
              metodoPago: "Tarjeta",
            },
            {
              id: "V-2023-0146",
              hora: new Date(new Date().setHours(12, 30)),
              cliente: "Juan López",
              total: 3889,
              metodoPago: "Efectivo",
            },
            {
              id: "V-2023-0147",
              hora: new Date(new Date().setHours(16, 45)),
              cliente: "Sofía Díaz",
              total: 1999,
              metodoPago: "Tarjeta",
            },
          ],
        }

        setReporte(data)
      } catch (error) {
        console.error("Error al cargar el reporte:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <p>Cargando reporte...</p>
        </CardContent>
      </Card>
    )
  }

  if (!reporte) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <p>No hay datos disponibles para el reporte</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="print:shadow-none">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Reporte Diario de Caja</CardTitle>
          <CardDescription>{format(reporte.fecha, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}</CardDescription>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Descargar PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Resumen */}
        <div className="rounded-md border p-4">
          <h3 className="mb-4 text-lg font-semibold">Resumen</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Monto Inicial</p>
              <p className="text-xl font-bold">${reporte.montoInicial.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Ventas</p>
              <p className="text-xl font-bold text-green-600">+${reporte.totalVentas.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Salidas</p>
              <p className="text-xl font-bold text-red-600">-${reporte.totalSalidas.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldo Final</p>
              <p className="text-xl font-bold">${reporte.saldoFinal.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Salidas de Efectivo */}
        <div>
          <h3 className="mb-4 text-lg font-semibold">Salidas de Efectivo</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hora</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Autorizado Por</TableHead>
                  <TableHead>Registrado Por</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reporte.salidas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No hay salidas registradas para este día
                    </TableCell>
                  </TableRow>
                ) : (
                  reporte.salidas.map((salida) => (
                    <TableRow key={salida.id}>
                      <TableCell>{format(salida.fecha, "HH:mm", { locale: es })}</TableCell>
                      <TableCell className="font-medium text-red-600">-${salida.monto.toFixed(2)}</TableCell>
                      <TableCell>{salida.motivo}</TableCell>
                      <TableCell>{salida.autorizadoPor}</TableCell>
                      <TableCell>{salida.registradoPor}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Ventas del Día */}
        <div>
          <h3 className="mb-4 text-lg font-semibold">Ventas del Día</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Folio</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Método de Pago</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reporte.ventas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No hay ventas registradas para este día
                    </TableCell>
                  </TableRow>
                ) : (
                  reporte.ventas.map((venta) => (
                    <TableRow key={venta.id}>
                      <TableCell>{venta.id}</TableCell>
                      <TableCell>{format(venta.hora, "HH:mm", { locale: es })}</TableCell>
                      <TableCell>{venta.cliente}</TableCell>
                      <TableCell className="font-medium text-green-600">+${venta.total.toFixed(2)}</TableCell>
                      <TableCell>{venta.metodoPago}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Firma */}
        <div className="mt-8 grid grid-cols-2 gap-8 border-t pt-8">
          <div className="flex flex-col items-center">
            <div className="h-0.5 w-48 border-b border-dashed border-gray-300 pt-16"></div>
            <p className="mt-2 text-sm font-medium">Firma del Cajero</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-0.5 w-48 border-b border-dashed border-gray-300 pt-16"></div>
            <p className="mt-2 text-sm font-medium">Firma del Supervisor</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
