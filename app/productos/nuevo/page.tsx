"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import { TipoProductoSelector } from "@/components/productos/tipo-producto-selector"
import AsignarCodigosBarra from "@/components/productos/AsignarCodigosBarra"

type EmpleadoItem = { id: number; nombreCompleto: string }

export default function NuevoProductoPage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    nombre: "",
    kilataje: "",
    cantidad: 0,
    precio: 0,
    empleadoId: "",
  })

  const [empleados, setEmpleados] = useState<EmpleadoItem[]>([])
  const [error, setError] = useState("")
  const [enviando, setEnviando] = useState(false)

  // id de la joya creada; cuando exista se bloquea el form y se muestra el asignador
  const [joyaCreadaId, setJoyaCreadaId] = useState<number | null>(null)

  useEffect(() => {
    const cargarEmpleados = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/empleados")
        if (!res.ok) throw new Error("Error al obtener empleados")
        const data = await res.json()
        setEmpleados(
          data.map((emp: any) => ({
            id: emp.id,
            nombreCompleto: `${emp.nombre ?? ""} ${emp.apellidoPaterno ?? ""} ${emp.apellidoMaterno ?? ""}`.trim(),
          })),
        )
      } catch (e) {
        console.error("❌ Error cargando empleados:", e)
        setError("No se pudieron cargar los empleados")
      }
    }
    cargarEmpleados()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === "cantidad" || name === "precio" ? Number(value) : value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

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

    try {
      setEnviando(true)
      const payload = {
        nombre: formData.nombre,
        kilataje: formData.kilataje,
        cantidad: formData.cantidad,
        precio: formData.precio,
        creadoPor: parseInt(formData.empleadoId, 10),
      }

      const resp = await fetch("http://localhost:8080/api/joyas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!resp.ok) throw new Error("Error al guardar el producto.")

      const data = await resp.json()
      setJoyaCreadaId(data.id as number)

      // hacer scroll al asignador
      setTimeout(() => {
        document.getElementById("asignador-codigos")?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 0)
    } catch (err) {
      console.error(err)
      setError("No se pudo guardar el producto. Intenta nuevamente.")
    } finally {
      setEnviando(false)
    }
  }

  const formDisabled = !!joyaCreadaId || enviando

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <div className="flex items-center gap-4">
        <Link href="/productos">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Gestión de Productos</h2>
      </div>

      {/* Alta de producto */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Información del Producto</CardTitle>
            <CardDescription>
              Ingresa los detalles del nuevo producto{joyaCreadaId ? " (guardado)" : ""}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}

            {joyaCreadaId && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                ✅ Producto creado con ID <b>P-{String(joyaCreadaId).padStart(4, "0")}</b>. Abajo puedes asignar los
                códigos de barras.
              </div>
            )}

            {/* Deshabilita todo el bloque cuando ya se guardó */}
            <fieldset disabled={formDisabled} className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                  min="1"
                  value={formData.cantidad || ""}
                  onChange={handleChange}
                  required
                />
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
                <Label htmlFor="empleado">Creado por *</Label>
                <select
                  id="empleado"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.empleadoId}
                  onChange={(e) => handleSelectChange("empleadoId", e.target.value)}
                  required
                >
                  <option value="">Seleccionar empleado</option>
                  {empleados.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombreCompleto}
                    </option>
                  ))}
                </select>
              </div>
            </fieldset>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.push("/productos")}>
              {joyaCreadaId ? "Terminar" : "Cancelar"}
            </Button>

            {!joyaCreadaId && (
              <Button type="submit" disabled={enviando}>
                {enviando ? "Guardando..." : "Guardar Producto"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </form>

      {/* Asignación de Códigos: se muestra SOLO cuando ya hay id */}
      {joyaCreadaId && (
        <div id="asignador-codigos">
          <AsignarCodigosBarra joyaIdInicial={joyaCreadaId} />
        </div>
      )}
    </div>
  )
}
