"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, UserPlus, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { ClienteFormDialog } from "@/components/clientes/cliente-form-dialog"
import axiosInstance from "@/hooks/axiosInstance"
import { ResponseListClientes } from "./types"

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ResponseListClientes[]>([])
  const [error, setError] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const loadClientes = async () => {
    setError("")
    setIsLoading(true)
    const endpoint = `${process.env.NEXT_PUBLIC_MSO_API_CLIENTE}/ultimos`
    try {
      const { data } = await axiosInstance.get<Array<ResponseListClientes>>(endpoint)
      if (Array.isArray(data) && data.length > 0) setClientes(data)
    } catch (err) {
      setError(`Error al obtener clientes: ${err}`)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadClientes()
  }, [])

  const handleClienteCreated = () => {
    loadClientes()
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
        </div>

        {/* 🔹 Acciones a la derecha */}
        <div className="flex items-center gap-2">
          {/* Botón para ir a la pestaña de búsqueda de notas */}
          <Link href="/clientes/notas">
            <Button variant="secondary">
              <FileText className="mr-2 h-4 w-4" />
              Notas de clientes
            </Button>
          </Link>

          <Button onClick={() => setDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>Administra los clientes registrados en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Apellido Paterno</TableHead>
                <TableHead>Apellido Materno</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Cargando clientes...
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && !error && clientes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No hay clientes registrados.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                !error &&
                clientes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.id}</TableCell>
                    <TableCell>{c.nombre}</TableCell>
                    <TableCell>{c.apellidoPaterno}</TableCell>
                    <TableCell>{c.apellidoMaterno}</TableCell>
                    <TableCell>{c.telefono}</TableCell>
                    <TableCell className="text-right">
                      {/* 🔹 Enlace directo a la vista de notas, prefiltrada por id */}
                      <Link href={`/clientes/notas?id=${c.id}`}>
                        <Button variant="ghost" size="sm">
                          <FileText className="mr-2 h-4 w-4" />
                          Ver notas
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}

              {error && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    {error}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ClienteFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onClienteCreated={handleClienteCreated}
      />
    </div>
  )
}
