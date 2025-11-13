// app/apartados/ApartadosTable.tsx
"use client";

function formatFecha(fechaStr: string) {
  const fecha = new Date(fechaStr);
  return isNaN(fecha.getTime()) ? "Fecha inválida" : fecha.toLocaleDateString("es-MX");
}

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MoreHorizontal, Printer, CreditCard, FileText } from "lucide-react";
import { ApartadoResumen } from "@/app/apartados/apartados-type";

// si ya tienes util de blobs autenticados:
import { openBlob } from "@/app/utils/openBlob";

// o si prefieres abrir con window.open, deja la línea que uso abajo.

interface Props {
  data: ApartadoResumen[];
}

export function ApartadosTable({ data }: Props) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Folio</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Vendedor</TableHead>
            <TableHead>Productos</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Monto inicial</TableHead>
            <TableHead className="text-right">Monto restante</TableHead>
            <TableHead className="text-center">Forma de Pago</TableHead>
            <TableHead className="text-right">Efectivo</TableHead>
            <TableHead className="text-right">Tarjeta</TableHead>
            <TableHead className="text-right">Nota Crédito</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={14} className="text-center h-24">
                No se encontraron apartados.
              </TableCell>
            </TableRow>
          ) : (
            data.map((apartado) => {
              const efectivo = apartado.pagos.find((p) => p.metodo === "EFECTIVO")?.monto || 0;
              const tarjeta = apartado.pagos.find((p) => p.metodo === "TARJETA")?.monto || 0;
              const notaCredito = apartado.pagos.find((p) => p.metodo === "NOTA_CREDITO")?.monto || 0;

              return (
                <TableRow key={apartado.id}>
                  <TableCell>{apartado.id}</TableCell>
                  <TableCell>{formatFecha(apartado.date)}</TableCell>
                  <TableCell>{apartado.cliente}</TableCell>
                  <TableCell>{apartado.telefono}</TableCell>
                  <TableCell>{apartado.vendedor}</TableCell>
                  <TableCell>{apartado.items}</TableCell>
                  <TableCell className="text-right">${apartado.total.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${apartado.montoInicial.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${apartado.montoRestante.toFixed(2)}</TableCell>
                  <TableCell className="text-center">{apartado.formaPago}</TableCell>
                  <TableCell className="text-right">${efectivo.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${tarjeta.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${notaCredito.toFixed(2)}</TableCell>
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

                        {/* ✅ PDF del APARTADO (documento principal) */}
                        <DropdownMenuItem
                          onClick={() => {
                            const url = `${process.env.NEXT_PUBLIC_REACT_BASE_LOCAL}/api/pdf/apartado/${apartado.id}`;
                            // Si usas util con auth:
                            // openBlob(`/api/pdf/apartado/${apartado.id}`, `apartado-${apartado.id}`);
                            // Si prefieres abrir directo:
                            window.open(url, "_blank", "noopener,noreferrer");
                          }}
                          className="flex items-center cursor-pointer"
                        >
                          <Printer className="mr-2 h-4 w-4" />
                          Ver PDF
                        </DropdownMenuItem>

                        {/* (Opcional) Ticket de abono del apartado */}
                        {/* 
                        <DropdownMenuItem
                          onClick={() => {
                            const url = `${process.env.NEXT_PUBLIC_REACT_BASE_LOCAL}/api/abonos/ticket/APARTADO/${apartado.id}`;
                            window.open(url, "_blank", "noopener,noreferrer");
                          }}
                          className="flex items-center cursor-pointer"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Ticket de abonos
                        </DropdownMenuItem>
                        */}

                        {apartado.montoRestante > 0 && (
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
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
