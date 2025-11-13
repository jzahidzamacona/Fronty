"use client"

import { useEffect, useState } from "react"
import axiosInstance from "@/hooks/axiosInstance"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface ResponseListEmpleados {
  id: number
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  fechaCreacion: string
}

export function EmpleadosTable() {
  const [empleados, setEmpleados] = useState<ResponseListEmpleados[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchEmpleados = async () => {
      try {
        const { data } = await axiosInstance.get<ResponseListEmpleados[]>(
          `${process.env.NEXT_PUBLIC_MSO_API_EMPLEADO}`
        )
        setEmpleados(data)
      } catch (error) {
        console.error("Error al obtener empleados:", error)
      }
    }
    fetchEmpleados()
  }, [])

  const empleadosFiltrados = empleados.filter((empleado) =>
    `${empleado.id} ${empleado.nombre} ${empleado.apellidoPaterno} ${empleado.apellidoMaterno}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por ID, nombre o apellidos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-8 w-[250px] lg:w-[300px]"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Apellido Paterno</TableHead>
              <TableHead>Apellido Materno</TableHead>
              <TableHead>Fecha de Registro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {empleadosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            ) : (
              empleadosFiltrados.map((empleado) => (
                <TableRow key={empleado.id}>
                  <TableCell className="font-medium">{empleado.id}</TableCell>
                  <TableCell>{empleado.nombre}</TableCell>
                  <TableCell>{empleado.apellidoPaterno}</TableCell>
                  <TableCell>{empleado.apellidoMaterno}</TableCell>
                  <TableCell>
                    {new Date(empleado.fechaCreacion).toLocaleDateString("es-MX")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
