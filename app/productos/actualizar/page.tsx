// app/productos/actualizar/page.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import axiosInstance from "@/hooks/axiosInstance"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ArrowLeft, RefreshCw } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import AsignarCodigosBarra from "@/components/productos/AsignarCodigosBarra"

/* ─────────── Tipos ─────────── */
interface Joya {
  id: number
  nombre: string
  kilataje: string
  cantidad: number
  precio: number
}

interface Empleado {
  id: number
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
}

export default function ActualizarInventarioPage() {
  const [joyaId, setJoyaId] = useState("")
  const [joya, setJoya] = useState<Joya | null>(null)

  // 👇 ahora es “piezas a agregar”
  const [piezasAgregar, setPiezasAgregar] = useState<string>("")

  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<string>("")
  const [cargando, setCargando] = useState(false)

  const searchParams = useSearchParams()

  const buscarJoya = async (idPersonalizado?: string) => {
    const id = idPersonalizado ?? joyaId
    if (!id) return
    try {
      setCargando(true)
      const res = await axiosInstance.get(`/api/joyas/${id}`)
      setJoya(res.data)
      setPiezasAgregar("") // limpiar campo al cambiar de producto
    } catch (error) {
      console.error("Error al buscar joya:", error)
      setJoya(null)
    } finally {
      setCargando(false)
    }
  }

  // 🧮 cálculo del total que quedará (solo sumas; back no acepta negativos)
  const quedaraEn = useMemo(() => {
    if (!joya) return null
    const n = Number(piezasAgregar)
    if (!Number.isFinite(n)) return null
    const enteroNoNegativo = Math.max(0, Math.floor(n))
    return joya.cantidad + enteroNoNegativo
  }, [joya, piezasAgregar])

  const actualizarJoya = async () => {
    if (!joya || !empleadoSeleccionado) return

    const n = Number(piezasAgregar)
    // Validaciones: solo enteros >= 1 (si quieres permitir 0, cambia a >= 0)
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) {
      alert("Ingresa un número entero de piezas a agregar (1 o más).")
      return
    }

    const nuevaCantidad = joya.cantidad + n

    try {
      setCargando(true)
      await axiosInstance.put(`/api/joyas/${joya.id}`, {
        // si tu back requiere estos campos, se envían sin cambios:
        nombre: joya.nombre,
        kilataje: joya.kilataje,
        precio: joya.precio,
        // 👉 al back le mandamos el total calculado
        cantidad: nuevaCantidad,
        modificadoPor: parseInt(empleadoSeleccionado, 10),
      })
      alert("Producto actualizado correctamente")
      // refrescamos el detalle para ver la nueva cantidad
      await buscarJoya(joya.id.toString())
      setPiezasAgregar("")
    } catch (error) {
      console.error("Error al actualizar:", error)
      alert("No se pudo actualizar el inventario.")
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    axiosInstance.get("/api/empleados").then((res) => setEmpleados(res.data))
  }, [])

  // Cargar por ?id= en la URL
  useEffect(() => {
    const idFromUrl = searchParams.get("id")
    if (idFromUrl) {
      setJoyaId(idFromUrl)
      buscarJoya(idFromUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/productos">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Actualizar Inventario</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actualizar Cantidad de Producto</CardTitle>
          <p className="text-sm text-muted-foreground">
            Busca un producto y agrega piezas al inventario. El sistema calcula el total automáticamente.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-center gap-2">
            <Input
              placeholder="ID"
              value={joyaId}
              onChange={(e) => setJoyaId(e.target.value)}
              className="w-32"
            />
            <Button onClick={() => buscarJoya()} disabled={!joyaId || cargando}>
              {cargando ? "Buscando..." : "Buscar"}
            </Button>
          </div>

          {joya && (
            <>
              <div className="space-y-4 border rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <strong>Código:</strong> <span>P-{joya.id.toString().padStart(4, "0")}</span>
                  </div>
                  <div>
                    <strong>Nombre:</strong> <span>{joya.nombre}</span>
                  </div>
                  <div>
                    <strong>Kilataje:</strong> <span>{joya.kilataje}</span>
                  </div>
                  <div>
                    <strong>Precio:</strong> <span>${joya.precio.toFixed(2)}</span>
                  </div>
                  <div>
                    <strong>Cantidad actual:</strong> <span>{joya.cantidad}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Piezas a agregar *</Label>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      value={piezasAgregar}
                      onChange={(e) => setPiezasAgregar(e.target.value)}
                      placeholder="Ej. 3"
                    />
                    <div className="mt-1 text-sm text-muted-foreground">
                      Quedará en: <b>{quedaraEn ?? "—"}</b>
                    </div>
                  </div>

                  <div>
                    <Label>Actualizado por *</Label>
                    <Select value={empleadoSeleccionado} onValueChange={setEmpleadoSeleccionado}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar empleado" />
                      </SelectTrigger>
                      <SelectContent>
                        {empleados.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id.toString()}>
                            {emp.nombre} {emp.apellidoPaterno} {emp.apellidoMaterno}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setJoya(null)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={actualizarJoya}
                    disabled={
                      cargando ||
                      !empleadoSeleccionado ||
                      !piezasAgregar ||
                      Number(piezasAgregar) < 1 ||
                      !Number.isInteger(Number(piezasAgregar))
                    }
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {cargando ? "Actualizando..." : "Actualizar Producto"}
                  </Button>
                </div>
              </div>

              <hr className="my-4" />
              <AsignarCodigosBarra joyaIdInicial={joya.id} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
