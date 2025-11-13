"use client"

import { useEffect, useState } from "react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import axiosInstance from "@/hooks/axiosInstance"

interface Empleado {
  id: string
  nombre: string
  apellidoPaterno: string
  apellidoMaterno?: string
}

interface EmpleadoSelectorProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function EmpleadoSelector({ value, onValueChange, placeholder = "Seleccionar empleado", className = "w-full" }: EmpleadoSelectorProps) {
  const [empleados, setEmpleados] = useState<Empleado[]>([])

  useEffect(() => {
    fetchEmpleados()
  }, [])

  const fetchEmpleados = async () => {
    try {
      const response = await axiosInstance.get("/api/empleados")
      if (Array.isArray(response.data)) {
        const empleadosFormateados = response.data.map((emp: any) => ({
          id: emp.id.toString(),
          nombre: emp.nombre,
          apellidoPaterno: emp.apellidoPaterno,
          apellidoMaterno: emp.apellidoMaterno || "",
        }))
        setEmpleados(empleadosFormateados)
      }
    } catch (error) {
      console.error("Error al obtener empleados:", error)
    }
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {empleados.map((empleado) => (
          <SelectItem key={empleado.id} value={empleado.id}>
            {`${empleado.nombre} ${empleado.apellidoPaterno} ${empleado.apellidoMaterno || ""}`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
