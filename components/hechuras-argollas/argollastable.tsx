// components/hechuras-argollas/argollas-table.tsx
"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { CreditCard, MoreHorizontal, Printer } from "lucide-react"
import Link from "next/link"
import type { ArgollaResumen } from "@/app/hechuras-argollas/types"

export function ArgollasTable({ data }: { data: ArgollaResumen[] }) {
  return (
    <div className="rounded-md border overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Folio</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Vendedor</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Entrega</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Forma de Pago</TableHead>
            <TableHead className="text-right">Inicial</TableHead>
            <TableHead className="text-right">Efectivo</TableHead>
            <TableHead className="text-right">Tarjeta</TableHead>
            <TableHead className="text-right">Nota Crédito</TableHead>
            <TableHead className="text-right">Restante</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.length === 0 ? (
            <TableRow><TableCell colSpan={16} className="text-center py-4">Sin registros.</TableCell></TableRow>
          ) : data.map(h => (
            <TableRow key={h.id}>
              <TableCell className="font-medium">{h.id}</TableCell>
              <TableCell>{h.tipo}</TableCell>
              <TableCell>{new Date(h.date).toLocaleDateString("es-MX")}</TableCell>
              <TableCell>{h.cliente}</TableCell>
              <TableCell>{h.telefono}</TableCell>
              <TableCell>{h.empleado}</TableCell>
              <TableCell>{h.descripcion}</TableCell>
              <TableCell>{new Date(h.deliveryDate).toLocaleDateString("es-MX")}</TableCell>
              <TableCell className="text-right">${h.total.toFixed(2)}</TableCell>
              <TableCell>{h.formaPago}</TableCell>
              <TableCell className="text-right">${h.inicial.toFixed(2)}</TableCell>
              <TableCell className="text-right">${h.efectivo.toFixed(2)}</TableCell>
              <TableCell className="text-right">${h.tarjeta.toFixed(2)}</TableCell>
              <TableCell className="text-right">${h.notaCredito.toFixed(2)}</TableCell>
              <TableCell className="text-right">${h.restante.toFixed(2)}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={()=>{
                        const url = `${process.env.NEXT_PUBLIC_REACT_BASE_LOCAL}/api/pdf/hechura-argolla/${h.id}`
                        window.open(url, "_blank")
                      }}
                      className="cursor-pointer"
                    ><Printer className="mr-2 h-4 w-4"/>Ver PDF</DropdownMenuItem>
                    {h.restante > 0 && (
                      <DropdownMenuItem asChild>
                        <Link href={`/abonos/nuevo?tipo=HECHURA_ARGOLLA&id=${h.id}`}><CreditCard className="mr-2 h-4 w-4"/>Registrar abono</Link>
                      </DropdownMenuItem>
                    )}
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
