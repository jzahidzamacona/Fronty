"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Eye, FileText, Printer } from "lucide-react"

interface Venta {
  id: number
  fechaVenta: string
  cliente: {
    nombre: string
    apellidoPaterno: string
    apellidoMaterno: string
  }
  detalles: {
    joya: {
      nombre: string
      kilataje: string
    }
    cantidad: number
    subtotal: number
  }[]
  totalVenta: number
  formaPago: string
  detallePago: {
    metodo: string
    monto: number
  }[]
}

interface VentasPorEmpleadoTableProps {
  ventas: Venta[]
}

export function VentasPorEmpleadoTable({ ventas }: VentasPorEmpleadoTableProps) {
  const formatearFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

  const obtenerProductos = (detalles: Venta["detalles"]) =>
    detalles.map((d) => `${d.cantidad} x ${d.joya.nombre} (${d.joya.kilataje})`).join(", ")

  const obtenerMonto = (metodo: string, detallePago: Venta["detallePago"]) => {
    const metodoPago = detallePago.find((d) => d.metodo === metodo)
    return metodoPago ? `$${metodoPago.monto.toFixed(2)}` : "$0.00"
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Productos</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Forma de pago</TableHead>
            <TableHead className="text-right">Efectivo</TableHead>
            <TableHead className="text-right">Tarjeta</TableHead>
            <TableHead className="text-right">Nota Crédito</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ventas.map((venta) => (
            <TableRow key={venta.id}>
              <TableCell className="font-medium">{formatearFecha(venta.fechaVenta)}</TableCell>
              <TableCell>
                {venta.cliente.nombre} {venta.cliente.apellidoPaterno} {venta.cliente.apellidoMaterno}
              </TableCell>
              <TableCell>{obtenerProductos(venta.detalles)}</TableCell>
              <TableCell className="text-right">
                ${venta.totalVenta.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700">
                  {venta.formaPago}
                </Badge>
              </TableCell>
              <TableCell className="text-right">{obtenerMonto("EFECTIVO", venta.detallePago)}</TableCell>
              <TableCell className="text-right">{obtenerMonto("TARJETA", venta.detallePago)}</TableCell>
              <TableCell className="text-right">{obtenerMonto("NOTA_CREDITO", venta.detallePago)}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menú</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      <span>Ver detalles</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Ver factura</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Printer className="mr-2 h-4 w-4" />
                      <span>Imprimir ticket</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
