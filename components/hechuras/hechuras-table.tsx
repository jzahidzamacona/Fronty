"use client"

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  // FileText,              // ❌ quita este import
  Printer,
  CreditCard,
  MoreHorizontal,
} from "lucide-react"
import Link from "next/link"
import { HechuraResumen } from "@/app/hechuras/hechuras-type"

interface Props {
  data: HechuraResumen[]
  filter?: "pending" | "completed"
}

export function HechurasTable({ data }: Props) {
  const filtered = data

  return (
    <div className="rounded-md border overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Folio</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Vendedor</TableHead>
            <TableHead>Descripción Recibida</TableHead>
            <TableHead>Trabajo a realizar</TableHead>
            <TableHead>Entrega</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Forma de Pago</TableHead>
            <TableHead className="text-right">Monto Inicial</TableHead>
            <TableHead className="text-right">Efectivo</TableHead>
            <TableHead className="text-right">Tarjeta</TableHead>
            <TableHead className="text-right">Nota Crédito</TableHead>
            <TableHead className="text-right">Restante</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={16} className="text-center py-4">
                No se encontraron hechuras.
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((h) => (
              <TableRow key={h.id}>
                <TableCell className="font-medium">{h.id}</TableCell>
                <TableCell>{new Date(h.date).toLocaleDateString("es-MX")}</TableCell>
                <TableCell>{h.customer}</TableCell>
                <TableCell>{h.telefono}</TableCell>
                <TableCell>{h.empleado}</TableCell>
                <TableCell>{h.descripcionPieza}</TableCell>
                <TableCell>{h.descripcionEspecial}</TableCell>
                <TableCell>{new Date(h.deliveryDate).toLocaleDateString("es-MX")}</TableCell>
                <TableCell className="text-right">${h.total.toFixed(2)}</TableCell>
                <TableCell>{h.formaPago}</TableCell>
                <TableCell className="text-right">${h.montoInicial.toFixed(2)}</TableCell>
                <TableCell className="text-right">${h.efectivo.toFixed(2)}</TableCell>
                <TableCell className="text-right">${h.tarjeta.toFixed(2)}</TableCell>
                <TableCell className="text-right">${h.notaCredito.toFixed(2)}</TableCell>
                <TableCell className="text-right">${h.restante.toFixed(2)}</TableCell>

                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>

                      {/* ✅ Ver PDF */}
                      <DropdownMenuItem
                        onClick={() => {
                          const url = `${process.env.NEXT_PUBLIC_REACT_BASE_LOCAL}/api/pdf/hechura/${h.id}`
                          window.open(url, "_blank")
                        }}
                        className="flex items-center cursor-pointer"
                      >
                        <Printer className="mr-2 h-4 w-4" /> Ver PDF
                      </DropdownMenuItem>

                      {/* ✅ Registrar abono con datos precargados */}
                      {h.restante > 0 && (
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/abonos/nuevo?tipo=HECHURA&id=${h.id}`}
                            className="flex items-center"
                          >
                            <CreditCard className="mr-2 h-4 w-4" /> Registrar abono
                          </Link>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
