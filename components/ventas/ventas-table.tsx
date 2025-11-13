"use client";

import { ColumnDef } from "@tanstack/react-table";
import { VentaResumen } from "@/app/ventas/ventas-type";
import DataTable from "../ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, FileText } from "lucide-react";

export const columns: ColumnDef<VentaResumen>[] = [
  { accessorKey: "id", header: "Folio" },
  { accessorKey: "fecha", header: "Fecha" },
  { accessorKey: "cliente", header: "Cliente" },
  { accessorKey: "empleado", header: "Vendedor" },
  { accessorKey: "productos", header: "Productos" },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => `$${row.original.total.toFixed(2)}`,
  },
  { accessorKey: "formaPago", header: "Forma de Pago" },
  {
    accessorKey: "efectivo",
    header: "Efectivo",
    cell: ({ row }) => `$${row.original.efectivo.toFixed(2)}`,
  },
  {
    accessorKey: "tarjeta",
    header: "Tarjeta",
    cell: ({ row }) => `$${row.original.tarjeta.toFixed(2)}`,
  },
  {
    accessorKey: "notaCredito",
    header: "Nota Crédito",
    cell: ({ row }) => `$${row.original.notaCredito.toFixed(2)}`,
  },
  {
    id: "acciones",
    header: "Acciones",
    cell: ({ row }) => {
      const ventaId = row.original.id;
      const url = `${process.env.NEXT_PUBLIC_REACT_BASE_LOCAL}/api/pdf/venta/${ventaId}`;

      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                className="flex items-center cursor-pointer"
              >
                <FileText className="mr-2 h-4 w-4" />
                Mostrar en PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

interface Props {
  data: VentaResumen[];
}

export default function VentasTable({ data }: Props) {
  return <DataTable columns={columns} data={data} />;
}
