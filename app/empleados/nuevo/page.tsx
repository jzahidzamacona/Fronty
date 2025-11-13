// app/empleados/nuevo/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { ArrowLeft, Loader2 } from "lucide-react"
import axiosInstance from "@/hooks/axiosInstance"
import AsignarCredencialesModal from "@/components/AsignarCredencialesModal"

type EmpleadoAPI = {
  id: number
  nombre: string
  apellidoPaterno: string
  apellidoMaterno?: string | null
}

const EMP_BASE = (process.env.NEXT_PUBLIC_MSO_API_EMPLEADO ?? "/api/empleados").replace(/\/$/, "")

export default function NuevoEmpleadoPage() {
  const router = useRouter()

  const [empleados, setEmpleados] = useState<EmpleadoAPI[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const [formData, setFormData] = useState({
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    fechaContratacion: "",
    creadoPor: "",
  })

  // ===== estado para el modal de credenciales =====
  const [empleadoCreadoId, setEmpleadoCreadoId] = useState<number | null>(null)
  const [abrirAsignar, setAbrirAsignar] = useState(false)

  // Cargar catálogo de empleados (para "creadoPor")
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axiosInstance.get<EmpleadoAPI[]>(`${EMP_BASE}`)
        setEmpleados(data ?? [])
      } catch (err) {
        console.error("Error al cargar empleados", err)
      }
    }
    load()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, creadoPor: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const nombre = formData.nombre.trim()
    const apellidoPaterno = formData.apellidoPaterno.trim()
    const apellidoMaterno = formData.apellidoMaterno.trim()

    if (!nombre || !apellidoPaterno || !formData.creadoPor) {
      setError("Por favor completa los campos obligatorios.")
      return
    }

    const payload: Record<string, any> = {
      nombre,
      apellidoPaterno,
      apellidoMaterno: apellidoMaterno || null,
      creadoPor: Number(formData.creadoPor),
      modificadoPor: Number(formData.creadoPor),
    }
    if (formData.fechaContratacion) payload.fechaContratacion = formData.fechaContratacion

    try {
      setLoading(true)
      const resp = await axiosInstance.post(`${EMP_BASE}`, payload)

      const id =
        resp?.data?.id ??
        Number((resp?.headers?.location ?? "").toString().split("/").pop()) ??
        null

      if (id) {
        setEmpleadoCreadoId(id)
        setAbrirAsignar(true) // ← abrir modal para asignar credenciales
      } else {
        router.push("/empleados")
      }
    } catch (err: any) {
      console.error(err)
      setError(err?.response?.data?.message || "Ocurrió un error al registrar el empleado.")
    } finally {
      setLoading(false)
    }
  }

  const disabled =
    loading || !formData.nombre.trim() || !formData.apellidoPaterno.trim() || !formData.creadoPor

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center gap-4">
        <Link href="/empleados">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Nuevo Empleado</h2>
      </div>

      <form onSubmit={handleSubmit} autoComplete="off">
        <Card>
          <CardHeader>
            <CardTitle>Información del Empleado</CardTitle>
            <CardDescription>Ingresa los datos del nuevo empleado</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apellidoPaterno">Apellido Paterno *</Label>
                <Input
                  id="apellidoPaterno"
                  name="apellidoPaterno"
                  value={formData.apellidoPaterno}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apellidoMaterno">Apellido Materno</Label>
                <Input
                  id="apellidoMaterno"
                  name="apellidoMaterno"
                  value={formData.apellidoMaterno}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaContratacion">Fecha de Contratación</Label>
                <Input
                  id="fechaContratacion"
                  name="fechaContratacion"
                  type="date"
                  value={formData.fechaContratacion}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="creadoPor">Creado por *</Label>
                <Select value={formData.creadoPor} onValueChange={handleSelectChange}>
                  <SelectTrigger id="creadoPor">
                    <SelectValue placeholder="Seleccionar empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    {empleados.map(emp => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {`${emp.nombre} ${emp.apellidoPaterno}${emp.apellidoMaterno ? ` ${emp.apellidoMaterno}` : ""}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.push("/empleados")}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={disabled}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Empleado
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* Modal para asignar credenciales después de crear */}
      <AsignarCredencialesModal
        open={abrirAsignar}
        onClose={() => {
          setAbrirAsignar(false)
          // tras asignar (o cerrar), llevar a la lista
          setTimeout(() => router.push("/empleados"), 0)
        }}
        empleadoId={empleadoCreadoId}
      />
    </div>
  )
}
