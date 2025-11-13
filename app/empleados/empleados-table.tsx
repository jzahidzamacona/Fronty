"use client"

import { useEffect, useState } from "react"
import axiosInstance from "@/hooks/axiosInstance"
import { ResponseListEmpleados } from "@/app/empleados/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"

export function EmpleadosTable() {
  const [empleados, setEmpleados] = useState<ResponseListEmpleados[]>([])
  const [busqueda, setBusqueda] = useState("")

  useEffect(() => {
    const fetchEmpleados = async () => {
      try {
        const url = `${process.env.NEXT_PUBLIC_MSO_API_EMPLEADO}`
        const { data } = await axiosInstance.get<ResponseListEmpleados[]>(url)
        setEmpleados(data)
      } catch (err) {
        console.error("Error al obtener empleados:", err)
      }
    }
    fetchEmpleados()
  }, [])

  const empleadosFiltrados = empleados.filter((e) =>
    `${e.id} ${e.nombre} ${e.apellidoPaterno} ${e.apellidoMaterno}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <Input
        placeholder="Buscar por ID, nombre o apellidos..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="max-w-sm"
      />

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
            {empleadosFiltrados.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">E-{e.id.toString().padStart(3, "0")}</TableCell>
                <TableCell>{e.nombre}</TableCell>
                <TableCell>{e.apellidoPaterno}</TableCell>
                <TableCell>{e.apellidoMaterno}</TableCell>
                <TableCell>{new Date(e.fechaCreacion).toLocaleDateString("es-MX")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
