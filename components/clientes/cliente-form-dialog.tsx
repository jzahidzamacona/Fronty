"use client"

import type React from "react"
import { useState, useEffect } from "react"
import axiosInstance from "@/hooks/axiosInstance"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Phone, UserPlus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Cliente {
  id: string
  name: string
}

interface Empleado {
  id: string
  nombre: string
  apellidoPaterno: string
}

interface ClienteFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onClienteCreated: (cliente: { id: string; nombre: string; apellidoPaterno: string; apellidoMaterno: string }) => void
  vendedorId?: string
}

export function ClienteFormDialog({ open, onOpenChange, onClienteCreated, vendedorId }: ClienteFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [formData, setFormData] = useState({
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    telefono: "",
    creadoPor: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    if (open) fetchEmpleados()
  }, [open])

  useEffect(() => {
    if (open && vendedorId) {
      setFormData((prev) => ({ ...prev, creadoPor: vendedorId }))
    }
  }, [open, vendedorId])

const fetchEmpleados = async () => {
  try {
    const endpoint = process.env.NEXT_PUBLIC_MSO_API_EMPLEADO!
    const response = await axiosInstance.get(endpoint)

    if (Array.isArray(response.data)) {
      const empleadosMapeados = response.data.map((emp: any) => ({
        id: emp.id.toString(),
        nombre: emp.nombre,
        apellidoPaterno: emp.apellidoPaterno,
      }))
      setEmpleados(empleadosMapeados)
    }
  } catch (error) {
    console.error("Error al cargar empleados desde la API:", error)
    toast({
      title: "Error",
      description: "No se pudieron cargar los empleados desde el servidor",
      variant: "destructive",
    })
  }
}


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre || !formData.apellidoPaterno || !formData.creadoPor) {
      toast({
        title: "Campos requeridos",
        description: "El nombre, apellido paterno y creado por son obligatorios",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const requestData = {
        nombre: formData.nombre,
        apellidoPaterno: formData.apellidoPaterno,
        apellidoMaterno: formData.apellidoMaterno || "",
        telefono: formData.telefono || "",
        creadoPor: Number(formData.creadoPor),
        modificadoPor: Number(formData.creadoPor),
      }

      const endpoint = process.env.NEXT_PUBLIC_MSO_API_CLIENTE!
      const response = await axiosInstance.post(endpoint, requestData)
      const data = response.data

      toast({
        title: "Cliente creado",
        description: "El cliente se ha creado correctamente",
      })

      const nombreCompleto = `${formData.nombre} ${formData.apellidoPaterno} ${formData.apellidoMaterno || ""}`.trim()
            onClienteCreated({
        id: data.id.toString(),
        nombre: formData.nombre,
        apellidoPaterno: formData.apellidoPaterno,
        apellidoMaterno: formData.apellidoMaterno || ""
      })
      
      onOpenChange(false)
      setFormData({
        nombre: "",
        apellidoPaterno: "",
        apellidoMaterno: "",
        telefono: "",
        creadoPor: "",
      })
    } catch (error) {
      console.error("Error al crear cliente:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el cliente. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Cliente</DialogTitle>
          <DialogDescription>Ingresa los datos del cliente para registrarlo en el sistema.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nombre" className="text-right">Nombre*</Label>
              <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="apellidoPaterno" className="text-right">Apellido Paterno*</Label>
              <Input id="apellidoPaterno" name="apellidoPaterno" value={formData.apellidoPaterno} onChange={handleChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="apellidoMaterno" className="text-right">Apellido Materno</Label>
              <Input id="apellidoMaterno" name="apellidoMaterno" value={formData.apellidoMaterno} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="telefono" className="text-right flex items-center gap-1">
                <Phone className="h-4 w-4" /> Teléfono
              </Label>
              <Input id="telefono" name="telefono" value={formData.telefono} onChange={handleChange} className="col-span-3" placeholder="555-123-4567" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="creadoPor" className="text-right flex items-center gap-1">
                <UserPlus className="h-4 w-4" /> Creado por*
              </Label>
              <Select value={formData.creadoPor} onValueChange={(value) => handleSelectChange("creadoPor", value)} required>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccionar empleado" />
                </SelectTrigger>
                <SelectContent>
                  {empleados.map((empleado) => (
                    <SelectItem key={empleado.id} value={empleado.id}>
                      {`${empleado.nombre} ${empleado.apellidoPaterno}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar Cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
