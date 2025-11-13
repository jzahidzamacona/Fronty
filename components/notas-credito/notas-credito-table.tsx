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
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Printer } from "lucide-react"
import Link from "next/link"
import type { NotaCreditoResumen } from "@/app/notas-credito/types"

type Props = {
  data: NotaCreditoResumen[]
  filter?: "available" | "used"
}

const fmtDate = (s?: string) => {
  if (!s) return ""
  const d = new Date(s)
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("es-MX")
}

export function NotasCreditoTable({ data, filter }: Props) {
  // Solo filtramos por estado si se solicita (disponibles / utilizadas)
  const filtered = data.filter((nota) => {
    if (filter === "available") return !nota.notaCancelada && nota.creditoRestante > 0
    if (filter === "used") return !nota.notaCancelada && nota.creditoRestante === 0
    return true
  })

  return (
    <div className="rounded-md border overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID Nota</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Tipo Origen</TableHead>
            <TableHead>ID Origen</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Empleado</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Usado</TableHead>
            <TableHead className="text-right">Restante</TableHead>
            <TableHead className="text-center">Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="text-center py-4">
                No se encontraron resultados.
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((nota) => (
              <TableRow key={nota.id}>
                <TableCell>NC-{nota.id.toString().padStart(4, "0")}</TableCell>
                <TableCell>{fmtDate(nota.fechaCreacion)}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      nota.origenTipo === "APARTADO"
                        ? "bg-green-100 text-green-800"
                        : nota.origenTipo === "HECHURA"
                          ? "bg-blue-100 text-blue-800"
                          : nota.origenTipo === "RELOJ"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-orange-100 text-orange-800"
                    }
                  >
                    {nota.origenTipo}
                  </Badge>
                </TableCell>
                <TableCell>{nota.origenNotaId}</TableCell>
                <TableCell>{nota.clienteId}</TableCell>
                <TableCell>{nota.empleadoId}</TableCell>
                <TableCell className="text-right">${nota.totalOriginal.toFixed(2)}</TableCell>
                <TableCell className="text-right">${nota.totalUsado.toFixed(2)}</TableCell>
                <TableCell className="text-right">${nota.creditoRestante.toFixed(2)}</TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant="outline"
                    className={
                      nota.notaCancelada
                        ? "bg-red-100 text-red-800"
                        : nota.creditoRestante === 0
                          ? "bg-gray-100 text-gray-800"
                          : "bg-green-100 text-green-800"
                    }
                  >
                    {nota.notaCancelada ? "Cancelada" : nota.creditoRestante === 0 ? "Utilizada" : "Disponible"}
                  </Badge>
                </TableCell>

                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem>
                        <Link
                          href={`${process.env.NEXT_PUBLIC_REACT_BASE_LOCAL}/api/pdf/nota-credito/${nota.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center"
                        >
                          <Printer className="mr-2 h-4 w-4" />
                          Imprimir PDF
                        </Link>
                      </DropdownMenuItem>
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
