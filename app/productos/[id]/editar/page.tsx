"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import { TipoProductoSelector } from "@/components/productos/tipo-producto-selector"

// Datos de ejemplo
const empleados = [
  { id: "E-001", nombre: "Ana Gómez" },
  { id: "E-002", nombre: "Luis Torres" },
  { id: "E-003", nombre: "Elena Martínez" },
]

// Producto de ejemplo para editar
const productoEjemplo = {
  id: "P-0123",
  nombre: "Anillo de oro 14k",
  kilataje: "Oro 14k",
  cantidad: 5,
  cantidadOriginal: 5, // Para validación
  precio: 4999.0,
  creadoPor: {
    id: "E-001",
    nombre: "Ana Gómez",
  },
  actualizadoPor: {
    id: "E-002",
    nombre: "Luis Torres",
  },
  fechaCreacion: "2023-05-10",
  fechaActualizacion: "2023-06-15",
}

export default function EditarProductoPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    id: "",
    nombre: "",
    kilataje: "",
    cantidad: 0,
    cantidadOriginal: 0,
    precio: 0,
    empleadoId: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Aquí normalmente cargaríamos los datos del producto desde el backend
    // Simulamos una carga de datos
    setTimeout(() => {
      setFormData({
        id: productoEjemplo.id,
        nombre: productoEjemplo.nombre,
        kilataje: productoEjemplo.kilataje,
        cantidad: productoEjemplo.cantidad,
        cantidadOriginal: productoEjemplo.cantidad,
        precio: productoEjemplo.precio,
        empleadoId: "",
      })
      setLoading(false)
    }, 500)
  }, [params.id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: name === "cantidad" || name === "precio" ? Number(value) : value,
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validaciones
    if (!formData.nombre || !formData.kilataje || !formData.empleadoId) {
      setError("Por favor completa todos los campos obligatorios.")
      return
    }

    if (formData.cantidad <= 0) {
      setError("La cantidad debe ser mayor a 0.")
      return
    }

    if (formData.precio <= 0) {
      setError("El precio debe ser mayor a 0.")
      return
    }

    // Validación específica: no permitir reducir el stock por debajo del actual
    if (formData.cantidad < formData.cantidadOriginal) {
      setError("No se puede reducir el stock por debajo del valor actual. Utiliza una venta para reducir el stock.")
      return
    }

    // Aquí iría la lógica para enviar los datos al backend
    console.log("Datos actualizados del producto:", {
      id: formData.id,
      nombre: formData.nombre,
      kilataje: formData.kilataje,
      cantidad: formData.cantidad,
      precio: formData.precio,
      actualizadoPor: formData.empleadoId,
    })

    // Redirigir a la página de productos después de guardar
    router.push("/productos")
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center gap-4">
          <Link href="/productos">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h2 className="text-3xl font-bold tracking-tight">Cargando...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center gap-4">
        <Link href="/productos">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Editar Producto</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Información del Producto</CardTitle>
            <CardDescription>Actualiza los detalles del producto {formData.id}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 flex items-start">
                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Artículo *</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Anillo de oro 14k"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="kilataje">Kilataje *</Label>
                <TipoProductoSelector
                  value={formData.kilataje}
                  onChange={(value) => handleSelectChange("kilataje", value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cantidad">Cantidad *</Label>
                <Input
                  id="cantidad"
                  name="cantidad"
                  type="number"
                  min={formData.cantidadOriginal}
                  value={formData.cantidad || ""}
                  onChange={handleChange}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Stock actual: {formData.cantidadOriginal}. Solo puedes aumentar el stock.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="precio">Precio *</Label>
                <Input
                  id="precio"
                  name="precio"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.precio || ""}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="empleado">Actualizado por *</Label>
                <select
                  id="empleado"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.empleadoId}
                  onChange={(e) => handleSelectChange("empleadoId", e.target.value)}
                  required
                >
                  <option value="">Seleccionar empleado</option>
                  {empleados.map((empleado) => (
                    <option key={empleado.id} value={empleado.id}>
                      {empleado.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.push("/productos")}>
              Cancelar
            </Button>
            <Button type="submit">Actualizar Producto</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
