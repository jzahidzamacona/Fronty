"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import axiosInstance from "@/hooks/axiosInstance"

import { ClienteSelector } from "@/components/ventas/cliente-selector"
import { Button } from "@/components/ui/button"
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"

type Origen = "venta" | "apartado" | "hechura" | "reloj" | "hechura-argolla"

export default function NuevaNotaCreditoPage() {
  const router = useRouter()

  // Estado base
  const [empleados, setEmpleados] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string>("")
  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const [noteType, setNoteType] = useState<Origen>("venta")
  const [noteIdInput, setNoteIdInput] = useState<string>("")
  const [amount, setAmount] = useState<number>(0)

  // Datos de la nota origen
  const [noteDetails, setNoteDetails] = useState<any>(null)
  const [loadingNote, setLoadingNote] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Fecha (solo display)
  const currentDate = useMemo(() => {
    const d = new Date()
    return d.toLocaleDateString("es-MX")
  }, [])

  const [clienteFromNote, setClienteFromNote] = useState<any>(null)

  // Cargar empleados
  useEffect(() => {
    axiosInstance.get("/api/empleados")
      .then(res => setEmpleados(res.data))
      .catch(() => setEmpleados([]))
  }, [])

  // Helpers para leer números aunque cambie el shape del backend
  const pickNumber = (obj: any, keys: string[], fallback = 0) => {
    if (!obj) return fallback
    for (const k of keys) {
      if (obj[k] != null && !Number.isNaN(Number(obj[k]))) {
        return Number(obj[k])
      }
    }
    return fallback
  }

// ---- mapeos para argollas ----
const backendType = (t: Origen) =>
  t === "hechura-argolla" ? "HECHURA_ARGOLLA" : t.toUpperCase()

const crearSlug = (t: Origen) =>
  t === "hechura-argolla" ? "hechura-argolla" : t

const dataKey = (t: Origen) =>
  t === "hechura-argolla" ? "hechuraArgolla" : t

  // Cargar detalle de la nota cuando cambie tipo o ID
useEffect(() => {
  const load = async () => {
    setFetchError(null)
    setNoteDetails(null)

    const id = Number(noteIdInput)
    if (!noteIdInput || Number.isNaN(id) || id <= 0) return

    setLoadingNote(true)
    try {
      // 🔥 Unificamos: siempre usamos el endpoint de Abonos
      const path = `/api/abonos/${backendType(noteType)}/${id}`
      const res = await axiosInstance.get(path)
      setNoteDetails(res.data ?? null)
// justo después de setNoteDetails(res.data ?? null)
const scoped = (res.data?.[dataKey(noteType)] ?? res.data) || {}

try {
  if (scoped?.cliente) {
    setClienteFromNote(scoped.cliente)
    if (!selectedCustomer && scoped.cliente?.id != null) {
      setSelectedCustomer(String(scoped.cliente.id))
    }
  } else if (scoped?.clienteId != null) {
    const c = await axiosInstance.get(`/api/clientes/${scoped.clienteId}`)
    setClienteFromNote(c.data) // { id, nombre, apellidoPaterno, ... }
    if (!selectedCustomer && c.data?.id != null) {
      setSelectedCustomer(String(c.data.id))
    }
  } else {
    setClienteFromNote(null)
  }
} catch {
  setClienteFromNote(null)
}


      // (Opcional) para depurar la forma que llega del back:
      // console.debug("Detalle de nota:", res.data)

    } catch (e: any) {
      const s = e?.response?.status
      if (s === 404) {
        setFetchError(`No encontramos la ${noteType} #${id}. Verifica el número.`)
      } else if (s === 409) {
        setFetchError("Esta nota ya tiene una nota de crédito registrada. No puedes generar otra.")
      } else if (s === 401) {
        setFetchError("Tu sesión expiró. Abre el login en otra pestaña, inicia sesión y vuelve a intentar.")
      } else {
        setFetchError("No se encontró la nota o no está disponible para generar nota de crédito.")
      }
      setNoteDetails(null)
    } finally {
      setLoadingNote(false)
    }
  }
  load()
}, [noteType, noteIdInput])
// --- cliente resuelto desde la nota, con fallback a clienteFromNote ---
const cliente = useMemo(() => {
  // si ya lo cargamos explícitamente (por clienteId) úsalo
  if (clienteFromNote) return clienteFromNote

  // si el back trae objeto embebido, tómalo
  const scoped = noteDetails?.[dataKey(noteType)] ?? noteDetails
  return (
    scoped?.cliente ??
    noteDetails?.cliente ??
    noteDetails?.apartado?.cliente ??
    noteDetails?.hechura?.cliente ??
    noteDetails?.reloj?.cliente ??
    noteDetails?.hechuraArgolla?.cliente ??
    null
  )
}, [noteDetails, noteType, clienteFromNote])

// Cliente de la nota (normalización según el shape que devuelva /api/abonos/{TIPO}/{id})
const clienteNombre = useMemo(() => {
  if (cliente) {
    return (
      cliente.nombreCompleto ||
      [cliente.nombre, cliente.apellidoPaterno, cliente.apellidoMaterno]
        .filter(Boolean)
        .join(" ")
        .trim() || "—"
    )
  }
  const scoped = noteDetails?.[dataKey(noteType)] ?? noteDetails
  return scoped?.nombreCliente || scoped?.clienteNombre || "—"
}, [cliente, noteDetails, noteType])


  const clienteIdOrigen = cliente?.id ? Number(cliente.id) : null

  const totals = useMemo(() => {
  if (!noteDetails) return { total: 0, pagado: 0, maxCredito: 0 }

  const a = noteDetails
  const scoped = a?.[dataKey(noteType)] ?? a


  // total de la nota (distintas llaves posibles)
  let total =
    pickNumber(a, ["total", "montoTotal", "totalVenta", "totalOriginal"], 0) ||
    pickNumber(scoped, ["total", "montoTotal", "totalVenta", "totalOriginal"], 0)

  // restante/saldo si viene
  const restante =
    pickNumber(a, ["restante", "saldo", "saldoPendiente"], 0) ||
    pickNumber(scoped, ["restante", "saldo", "saldoPendiente"], 0)

  // pagado directo si viene…
  let pagado =
    pickNumber(a, ["montoAbonado", "totalPagado", "abonado", "pagado", "montoPagado", "montoInicial"], 0) ||
    pickNumber(scoped, ["montoAbonado", "totalPagado", "abonado", "pagado", "montoPagado", "montoInicial"], 0)

  // …si no, lo calculamos desde total - restante
  if (!pagado && total) pagado = Math.max(0, total - (restante || 0))

  // por si “venta” no trae pagado explícito: asumimos que está liquidada
  if (noteType === "venta" && !pagado && total) pagado = total

  const maxCredito = Math.max(0, Math.min(pagado, total))
  return { total, pagado, maxCredito }
}, [noteDetails, noteType])


  // Validaciones
  const hasBasics =
    !!selectedEmployee &&
    !!selectedCustomer &&
    !!noteIdInput &&
    !!noteDetails

  const clientMatches =
    !clienteIdOrigen || Number(selectedCustomer) === clienteIdOrigen

  const amountOk = amount > 0 && amount <= (totals.maxCredito || 0)

  const canSubmit = hasBasics && clientMatches && amountOk

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    const payload = {
      clienteId: Number(selectedCustomer),
      creadoPor: Number(selectedEmployee),
      origenTipo: backendType(noteType),
      origenNotaId: Number(noteIdInput),
      monto: Number(amount.toFixed(2)),
    }

    try {
      const res = await axiosInstance.post(
  `/api/notas-credito/crear/${crearSlug(noteType)}`,
  payload
)

      const nuevaNotaId = res.data?.id
      if (nuevaNotaId) {
        // Ajusta la URL pública si usas otra base
        window.open(`${process.env.NEXT_PUBLIC_REACT_BASE_LOCAL || "http://localhost:8080"}/api/pdf/nota-credito/${nuevaNotaId}`, "_blank")
      }
      router.push("/notas-credito")
    } catch (err) {
      console.error("Error al generar nota de crédito:", err)
      alert("No se pudo generar la nota de crédito porque puede que ya se haya realizado una nota de credito con este id de nota, revisa la información o consulta el id Nota de origen en notas de credito")
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center gap-4">
        <Link href="/notas-credito">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Nueva Nota de Crédito</h2>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información de la Nota de Crédito</CardTitle>
            <CardDescription>Selecciona el origen y los detalles</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input value={currentDate} disabled />
            </div>

            <div className="space-y-2">
              <Label>Cliente</Label>
              <ClienteSelector
                value={selectedCustomer}
                onValueChange={setSelectedCustomer}
                vendedorId={selectedEmployee}
              />
              {noteDetails && clienteIdOrigen && Number(selectedCustomer) !== clienteIdOrigen && (
                <p className="text-xs text-red-500">
                  El cliente seleccionado no coincide con el de la nota ( {clienteNombre} ).
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Empleado</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar empleado" />
                </SelectTrigger>
                <SelectContent>
                  {empleados.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.nombreCompleto ?? `${e.nombre} ${e.apellidoPaterno ?? ""}`.trim()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Origen de Nota</Label>
<Select value={noteType} onValueChange={(v) => setNoteType(v as Origen)}>
  <SelectTrigger>
    <SelectValue placeholder="Seleccionar origen" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="venta">Venta</SelectItem>
    <SelectItem value="apartado">Apartado</SelectItem>
    <SelectItem value="hechura">Hechura</SelectItem>
    <SelectItem value="reloj">Reloj</SelectItem>
    <SelectItem value="hechura-argolla">Hechura Argolla</SelectItem> {/* NUEVO */}
  </SelectContent>
</Select>
            </div>

            <div className="space-y-2">
              <Label>Número de Nota</Label>
              <Input
                type="number"
                placeholder="Ej. 123"
                value={noteIdInput}
                onChange={(e) => setNoteIdInput(e.target.value)}
              />
              {loadingNote && <p className="text-xs text-muted-foreground">Buscando nota…</p>}
              {fetchError && <p className="text-xs text-red-500">{fetchError}</p>}
            </div>

            {noteDetails && (
              <div className="text-sm space-y-1 border rounded-md p-3">
                <div><strong>Cliente:</strong> {clienteNombre}</div>
                <div><strong>Total:</strong> ${totals.total.toFixed(2)}</div>
                <div><strong>Pagado/Gastado:</strong> ${totals.pagado.toFixed(2)}</div>
                <div className="font-semibold">
                  Máximo a tomar a cuenta: ${totals.maxCredito.toFixed(2)}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Monto a Tomar a Cuenta</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
              {!!amount && !amountOk && (
                <p className="text-xs text-red-500">
                  El monto debe ser mayor a 0 y menor o igual a lo pagado: ${totals.maxCredito.toFixed(2)}.
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter>
            <Button
              className="w-full"
              type="submit"
              disabled={!canSubmit}
            >
              Generar Nota de Crédito
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
