"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Printer, CreditCard, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import type { RelojResumen } from "@/app/relojes/type-relojes"

interface Props {
  data: RelojResumen[]
}

const money = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 }).format(n ?? 0)

export function RelojesTable({ data }: Props) {
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
            <TableHead>Condición recibida</TableHead>
            <TableHead>Trabajo a realizar</TableHead>
            <TableHead>Fecha entrega</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Forma de pago</TableHead>
            <TableHead className="text-right">Monto inicial</TableHead>
            <TableHead className="text-right">Efectivo</TableHead>
            <TableHead className="text-right">Tarjeta</TableHead>
            <TableHead className="text-right">Nota de crédito</TableHead>
            <TableHead className="text-right">Restante</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={16} className="text-center py-4">
                No se encontraron resultados.
              </TableCell>
            </TableRow>
          ) : (
            data.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.id}</TableCell>
                <TableCell>{r.date || ""}</TableCell>
                <TableCell>{r.cliente}</TableCell>
                <TableCell>{r.telefono}</TableCell>
                <TableCell>{r.vendedor}</TableCell>
                <TableCell>{r.condiciones}</TableCell>
                <TableCell>{r.observaciones}</TableCell>
                <TableCell>{r.entrega || ""}</TableCell>
                <TableCell className="text-right">{money(r.total)}</TableCell>
                <TableCell>{r.formaPago}</TableCell>
                <TableCell className="text-right">{money(r.montoInicial)}</TableCell>
                <TableCell className="text-right">{money(r.efectivo)}</TableCell>
                <TableCell className="text-right">{money(r.tarjeta)}</TableCell>
                <TableCell className="text-right">{money(r.notaCredito)}</TableCell>
                <TableCell className="text-right">{money(r.restante)}</TableCell>

                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>

                      <DropdownMenuItem
                        onClick={() => {
                          const url = `${process.env.NEXT_PUBLIC_REACT_BASE_LOCAL}/api/pdf/reloj/${r.id}`
                          window.open(url, "_blank")
                        }}
                        className="flex items-center cursor-pointer"
                      >
                        <Printer className="mr-2 h-4 w-4" />
                        Ver PDF
                      </DropdownMenuItem>

                      {r.restante > 0 && (
                        <DropdownMenuItem asChild>
                          <Link href="/abonos/nuevo" className="flex items-center">
                            <CreditCard className="mr-2 h-4 w-4" />
                            Registrar abono
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
