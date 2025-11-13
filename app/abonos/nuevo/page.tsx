"use client"

import React, { useEffect, useMemo, useState } from "react"
import axiosInstance from "@/hooks/axiosInstance"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem
} from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"

// 🔧 NEW: tipo extendido
type NoteType = "apartado" | "hechura" | "reloj" | "hechuraArgolla"

// 🔧 NEW: mapeo a constantes del backend
const NOTE_TYPE_TO_API: Record<NoteType, string> = {
  apartado: "APARTADO",
  hechura: "HECHURA",
  reloj: "RELOJ",
  hechuraArgolla: "HECHURA_ARGOLLA", // ✅ TO API
}

export default function NuevoAbonoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [empleados, setEmpleados] = useState<any[]>([])
  const [noteIdInput, setNoteIdInput] = useState("")

  const [selectedEmployee, setSelectedEmployee] = useState("")
  // 🔧 NEW: default lo dejas si quieres en "apartado"
  const [noteType, setNoteType] = useState<NoteType>("apartado")
  const [selectedNote, setSelectedNote] = useState("")
  const [amount, setAmount] = useState<number>(0)
  const [noteDetails, setNoteDetails] = useState<any>(null)

  const [paymentMethods, setPaymentMethods] = useState({
    cash:       { used: false, amount: 0 },
    card:       { used: false, amount: 0, lastDigits: "" },
    creditNote: { used: false, amount: 0, noteId: "" },
  })

  // Empleados
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eRes] = await Promise.all([axiosInstance.get("/api/empleados")])
        setEmpleados(eRes.data)
      } catch (err) {
        console.error("Error al cargar empleados:", err)
      }
    }
    fetchData()
  }, [])

  // 🔧 NEW: lee ?hechuraArgolla=ID además de los demás
  useEffect(() => {
    const apartadoId       = searchParams.get("apartado")
    const hechuraId        = searchParams.get("hechura")
    const relojId          = searchParams.get("reloj")
    const hechuraArgollaId = searchParams.get("hechuraArgolla") // 🔧 NEW

    if (apartadoId) {
      setNoteType("apartado"); setSelectedNote(apartadoId); setNoteIdInput(apartadoId)
    } else if (hechuraId) {
      setNoteType("hechura");  setSelectedNote(hechuraId);  setNoteIdInput(hechuraId)
    } else if (relojId) {
      setNoteType("reloj");    setSelectedNote(relojId);    setNoteIdInput(relojId)
    } else if (hechuraArgollaId) { // 🔧 NEW
      setNoteType("hechuraArgolla"); setSelectedNote(hechuraArgollaId); setNoteIdInput(hechuraArgollaId)
    }
  }, [searchParams])

  // Cargar detalle de la nota (usa NOTE_TYPE_TO_API para la ruta)
  useEffect(() => {
    const fetchNoteById = async () => {
      if (!noteIdInput || isNaN(Number(noteIdInput))) {
        setNoteDetails(null); setSelectedNote(""); return
      }
      try {
        const apiType = NOTE_TYPE_TO_API[noteType] // 🔧 NEW
        const res = await axiosInstance.get(`/api/abonos/${apiType}/${noteIdInput}`) // ✅ TO API
        setNoteDetails(res.data); setSelectedNote(noteIdInput)
      } catch (error) {
        console.error("No se encontró la nota:", error)
        setNoteDetails(null); setSelectedNote("")
      }
    }
    fetchNoteById()
  }, [noteIdInput, noteType])

  // Nombre cliente tolerante: contempla hechuraArgolla
  const clienteNombre = useMemo(() => {
    const scoped = noteDetails?.[noteType] // 🔧 NEW: ya accesas por el nombre de la key actual
    const c =
      scoped?.cliente ||
      noteDetails?.apartado?.cliente ||
      noteDetails?.hechura?.cliente ||
      noteDetails?.hechuraArgolla?.cliente || // 🔧 NEW
      noteDetails?.reloj?.cliente ||
      noteDetails?.cliente
    if (!c) return "—"
    return [c.nombre, c.apellidoPaterno, c.apellidoMaterno].filter(Boolean).join(" ")
  }, [noteDetails, noteType])

  // Totales con fallback (incluye hechuraArgolla)
  const totals = useMemo(() => {
    const base = noteDetails || {}
    const scoped = base?.[noteType] || {}
    const total =
      base.total ??
      scoped.total ??
      base.apartado?.total ??
      base.hechura?.total ??
      base.hechuraArgolla?.total ??  // 🔧 NEW
      base.reloj?.total ??
      0
    const abonado =
      base.montoAbonado ??
      scoped.montoAbonado ??
      0
    const restante =
      base.restante ??
      scoped.restante ??
      Math.max(Number(total) - Number(abonado), 0)

    return { total: Number(total), abonado: Number(abonado), restante: Number(restante) }
  }, [noteDetails, noteType])

  // =========================
  // ✅ Validaciones (como Ventas)
  // =========================
  const sumCaptured = (
    (paymentMethods.cash.used ? paymentMethods.cash.amount : 0) +
    (paymentMethods.card.used ? paymentMethods.card.amount : 0) +
    (paymentMethods.creditNote.used ? paymentMethods.creditNote.amount : 0)
  )

  const hasBasics =
    !!selectedEmployee &&
    !!selectedNote &&
    !!noteDetails &&
    Number(selectedNote) > 0

  const amountOk =
    amount > 0 && amount <= (totals?.restante ?? 0)

  const hasAnyPayment =
    (paymentMethods.cash.used && paymentMethods.cash.amount > 0) ||
    (paymentMethods.card.used && paymentMethods.card.amount > 0) ||
    (paymentMethods.creditNote.used && paymentMethods.creditNote.amount > 0)

  const paymentsMatch = Number(sumCaptured.toFixed(2)) === Number((amount || 0).toFixed(2))

  const creditNoteOk = !paymentMethods.creditNote.used
    ? true
    : !!paymentMethods.creditNote.noteId && !isNaN(Number(paymentMethods.creditNote.noteId))

  const canSubmit = hasBasics && amountOk && hasAnyPayment && paymentsMatch && creditNoteOk

  // Handlers
  const handlePaymentMethodChange = (method: "cash" | "card" | "creditNote", used: boolean) => {
    setPaymentMethods(prev => ({ ...prev, [method]: { ...prev[method], used } }))
  }

  const handlePaymentAmountChange = (method: "cash" | "card" | "creditNote", value: number) => {
    setPaymentMethods(prev => ({ ...prev, [method]: { ...prev[method], amount: value } }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!hasBasics)        return alert("Selecciona empleado, tipo e ID de nota válidos.")
    if (!amountOk)         return alert(`El monto debe ser > 0 y no exceder el pendiente ($${(totals?.restante ?? 0).toFixed(2)}).`)
    if (!hasAnyPayment)    return alert("Activa al menos un método de pago y captura su monto.")
    if (!paymentsMatch)    return alert(`La suma de métodos ($${sumCaptured.toFixed(2)}) debe igualar el monto del abono ($${(amount||0).toFixed(2)}).`)
    if (!creditNoteOk)     return alert("ID de nota de crédito inválido.")

    const apiType = NOTE_TYPE_TO_API[noteType] // 🔧 NEW
    const pdfUrl = `${process.env.NEXT_PUBLIC_REACT_BASE_LOCAL}/api/abonos/ticket/${apiType}/${selectedNote}` // ✅ TO API
    const win = window.open("", "_blank")

    const payload = {
      tipoNota:   apiType,                  // ✅ TO API
      notaId:     Number(selectedNote),
      monto:      Number(amount.toFixed(2)),
      empleadoId: Number(selectedEmployee),
      detallePago: [
        ...(paymentMethods.cash.used ? [{ metodo: "EFECTIVO",     monto: Number(paymentMethods.cash.amount.toFixed(2)) }] : []),
        ...(paymentMethods.card.used ? [{ metodo: "TARJETA",      monto: Number(paymentMethods.card.amount.toFixed(2)) }] : []),
        ...(paymentMethods.creditNote.used ? [{
          metodo: "NOTA_CREDITO",
          monto:  Number(paymentMethods.creditNote.amount.toFixed(2)),
          idReferencia: Number(paymentMethods.creditNote.noteId)
        }] : [])
      ]
    }

    try {
      await axiosInstance.post("/api/abonos", payload)
      if (win) win.location.href = pdfUrl
      setTimeout(() => router.push("/abonos"), 1200)
    } catch (err) {
      console.error("Error al crear abono:", err)
      if (win) win.close()
      alert("No se pudo guardar el abono. Revisa tu conexión o permisos.")
    }
  }

  return (
    <div className="flex flex-col space-y-6 p-6">
      <div className="flex items-center space-x-4">
        <Link href="/abonos">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Nuevo Abono</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información</CardTitle>
            <CardDescription>Datos generales del abono</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label>Empleado</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {empleados.map(emp => (
                  <SelectItem key={emp.id} value={emp.id.toString()}>
                    {emp.nombreCompleto ?? emp.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Label>Tipo de nota</Label>
            <Select value={noteType} onValueChange={(val: NoteType) => setNoteType(val)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="apartado">Apartado</SelectItem>
                <SelectItem value="hechura">Hechura</SelectItem>
                <SelectItem value="hechuraArgolla">Hechura Argolla</SelectItem> {/* 🔧 NEW */}
                <SelectItem value="reloj">Reloj</SelectItem>
              </SelectContent>
            </Select>

            <Label>ID de la Nota</Label>
            <Input
              type="number"
              placeholder="Ej. 61"
              value={noteIdInput}
              onChange={(e) => setNoteIdInput(e.target.value)}
            />

            {noteDetails && (
              <div className="text-sm space-y-1 border rounded-md p-3 mt-2">
                <div><strong>Cliente:</strong> {clienteNombre}</div>
                <div><strong>Total:</strong> ${totals.total.toFixed(2)}</div>
                <div><strong>Pagado:</strong> ${totals.abonado.toFixed(2)}</div>
                <div><strong>Pendiente:</strong> ${totals.restante.toFixed(2)}</div>
              </div>
            )}

            <Label className="mt-2">Monto a abonar</Label>
            <Input
              type="number"
              step="0.01"
              value={amount === 0 ? "" : amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            />
            {!amountOk && amount > 0 && (
              <p className="text-xs text-red-500">
                El monto no puede exceder el pendiente (${(totals?.restante ?? 0).toFixed(2)}).
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pago</CardTitle>
            <CardDescription>Métodos de pago</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <input
                type="checkbox"
                checked={paymentMethods.cash.used}
                onChange={(e) => handlePaymentMethodChange("cash", e.target.checked)}
              />
              <Label className="ml-2">Efectivo</Label>
              {paymentMethods.cash.used && (
                <Input
                  type="number" step="0.01"
                  placeholder="Monto"
                  value={paymentMethods.cash.amount === 0 ? "" : paymentMethods.cash.amount}
                  onChange={(e) => handlePaymentAmountChange("cash", parseFloat(e.target.value) || 0)}
                  className="mt-2"
                />
              )}
            </div>

            <div>
              <input
                type="checkbox"
                checked={paymentMethods.card.used}
                onChange={(e) => handlePaymentMethodChange("card", e.target.checked)}
              />
              <Label className="ml-2">Tarjeta</Label>
              {paymentMethods.card.used && (
                <Input
                  type="number" step="0.01"
                  placeholder="Monto"
                  value={paymentMethods.card.amount === 0 ? "" : paymentMethods.card.amount}
                  onChange={(e) => handlePaymentAmountChange("card", parseFloat(e.target.value) || 0)}
                  className="mt-2"
                />
              )}
            </div>

            <div>
              <input
                type="checkbox"
                checked={paymentMethods.creditNote.used}
                onChange={(e) => handlePaymentMethodChange("creditNote", e.target.checked)}
              />
              <Label className="ml-2">Nota de crédito</Label>
              {paymentMethods.creditNote.used && (
                <>
                  <Input
                    type="text"
                    placeholder="ID Nota Crédito"
                    value={paymentMethods.creditNote.noteId}
                    onChange={(e) =>
                      setPaymentMethods((p) => ({ ...p, creditNote: { ...p.creditNote, noteId: e.target.value } }))
                    }
                    className="mt-2"
                  />
                  <Input
                    type="number" step="0.01"
                    placeholder="Monto"
                    value={paymentMethods.creditNote.amount === 0 ? "" : paymentMethods.creditNote.amount}
                    onChange={(e) => handlePaymentAmountChange("creditNote", parseFloat(e.target.value) || 0)}
                    className="mt-2"
                  />
                </>
              )}
            </div>

            {/* Resumen y reglas */}
            <div className="text-sm pt-2">
              <div>Monto del abono: ${Number((amount || 0).toFixed(2)).toFixed(2)}</div>
              <div>Pagos capturados: ${Number(sumCaptured.toFixed(2)).toFixed(2)}</div>
              {!paymentsMatch && hasAnyPayment && (
                <div className="text-red-500">La suma de métodos debe coincidir con el monto del abono.</div>
              )}
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" disabled={!canSubmit}>
              Registrar abono
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
