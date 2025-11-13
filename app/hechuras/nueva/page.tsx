"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import axiosInstance from "@/hooks/axiosInstance"
import { ClienteSelector } from "@/components/ventas/cliente-selector"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { ArrowLeft, Plus, Trash2, Check, X, AlertTriangle } from "lucide-react"

const KILATAJES_SUGERIDOS = [
  "8K",
  "10K",
  "14K",
  "oro blanco 8K",
  "oro blanco 10K",
  "oro blanco 14K",
  "oro rosa 10K",
  "oro rosa 14K",
  "Plata 925",
  "Acero inoxidable",
]

export default function NuevaHechuraPage() {
  const router = useRouter()
  const { toast } = useToast()

  // --------- Estado ---------
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [fechaEntrega, setFechaEntrega] = useState("")

  const [detallePiezas, setDetallePiezas] = useState<any[]>([
    {
      tipoDePieza: "",
      kilataje: "",
      peso: "",
      numeroDeAnillo: "",
      largo: "",
      ancho: "",
      tejido: "",
      costo: "",
      descripcionEspecial: "",
      descripcionPiezaRecibida: "",
    },
  ])

  const [paymentMethods, setPaymentMethods] = useState({
    cash: { used: false, amount: "" },
    card: { used: false, amount: "" },
    creditNote: { used: false, amount: "", noteId: "" },
  })

  const [employees, setEmployees] = useState<{ id: number; nombreCompleto: string }[]>([])

  // ✅ NUEVO: Estado para el diálogo de confirmación
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState(false)

  // --------- Efectos ---------
  useEffect(() => {
    axiosInstance
      .get("/api/empleados")
      .then((res) => setEmployees(res.data))
      .catch(console.error)
  }, [])

  // --------- Helpers visuales para requeridos ---------
  const ReqBadge = () => (
    <span className="ml-2 text-xs rounded-md px-2 py-0.5 bg-red-100 text-red-800">obligatorio</span>
  )

  // --------- Utils ---------
  // Fecha mínima = hoy (corrigiendo zona horaria para evitar off-by-one)
  const minDate = (() => {
    const d = new Date()
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 10) // "YYYY-MM-DD"
  })()

  const to2 = (n: number) => Number((n ?? 0).toFixed(2))

  const getTotalPago = () =>
    (paymentMethods.cash.used ? Number(paymentMethods.cash.amount) || 0 : 0) +
    (paymentMethods.card.used ? Number(paymentMethods.card.amount) || 0 : 0) +
    (paymentMethods.creditNote.used ? Number(paymentMethods.creditNote.amount) || 0 : 0)

  const getTotalCosto = () => detallePiezas.reduce((acc, p) => acc + (Number.parseFloat(p.costo) || 0), 0)

  // --------- Validaciones ACTUALIZADAS ---------
  const hasBasics = !!selectedCustomer && !!selectedEmployee && !!fechaEntrega

  const piezasOk = useMemo(() => {
    if (detallePiezas.length === 0) return false
    // al menos una pieza completa:
    return detallePiezas.some((p) => {
      const tipoOK = (p.tipoDePieza?.trim() || "").length > 0
      const kilaOK = (p.kilataje?.trim() || "").length > 0
      const trabajoOK = (p.descripcionEspecial?.trim() || "").length > 0
      const costoOK = (Number.parseFloat(p.costo) || 0) > 0
      return tipoOK && kilaOK && trabajoOK && costoOK
    })
  }, [detallePiezas])

  // ✅ CAMBIO: Solo requiere que al menos un método esté seleccionado (no importa el monto)
  const anyPaymentSelected = paymentMethods.cash.used || paymentMethods.card.used || paymentMethods.creditNote.used

  const creditNoteOk = !paymentMethods.creditNote.used
    ? true
    : !!paymentMethods.creditNote.noteId &&
      (paymentMethods.creditNote.noteId.toUpperCase().startsWith("NC-") ||
        !isNaN(Number(paymentMethods.creditNote.noteId)))

  const totalPago = to2(getTotalPago())
  const totalCosto = to2(getTotalCosto())

  // ✅ CAMBIO: Permite pagos >= 0 (incluyendo $0)
  const totalPagoOk = totalPago >= 0 && totalPago <= totalCosto

  // ✅ NUEVO: Validaciones para advertencias
  const isZeroPayment = totalPago === 0 && anyPaymentSelected

  // ✅ CAMBIO: Usa anyPaymentSelected en lugar de anyPayment
  const canSubmit = hasBasics && piezasOk && anyPaymentSelected && creditNoteOk && totalPagoOk

  // --------- Validaciones para checklist ACTUALIZADAS ---------
  const validationChecks = [
    { id: "fecha", label: "Selecciona fecha de entrega", completed: !!fechaEntrega },
    { id: "vendedor", label: "Selecciona un vendedor", completed: !!selectedEmployee },
    { id: "cliente", label: "Selecciona un cliente", completed: !!selectedCustomer },
    { id: "pieza", label: "Completa al menos una pieza", completed: piezasOk },
    { id: "pago", label: "Selecciona al menos un método de pago", completed: anyPaymentSelected }, // ✅ CAMBIO
  ]

  // --------- Handlers ---------
  const handleAddPieza = () => {
    setDetallePiezas((prev) => [
      ...prev,
      {
        tipoDePieza: "",
        kilataje: "",
        peso: "",
        numeroDeAnillo: "",
        largo: "",
        ancho: "",
        tejido: "",
        costo: "",
        descripcionEspecial: "",
        descripcionPiezaRecibida: "",
      },
    ])
  }

  const handleRemovePieza = (idx: number) => {
    setDetallePiezas((prev) => prev.filter((_, i) => i !== idx))
  }

  const handlePaymentChange = (
    method: "cash" | "card" | "creditNote",
    field: "used" | "amount" | "noteId",
    value: boolean | string,
  ) => {
    setPaymentMethods((prev) => ({
      ...prev,
      [method]: { ...prev[method], [field]: value },
    }))
  }

  // ✅ NUEVO: Función para procesar la hechura
  const processHechura = async () => {
    const detallePago = [
      ...(paymentMethods.cash.used
        ? [{ metodo: "EFECTIVO", monto: to2(Number(paymentMethods.cash.amount) || 0) }]
        : []),
      ...(paymentMethods.card.used ? [{ metodo: "TARJETA", monto: to2(Number(paymentMethods.card.amount) || 0) }] : []),
      ...(paymentMethods.creditNote.used
        ? [
            {
              metodo: "NOTA_CREDITO",
              monto: to2(Number(paymentMethods.creditNote.amount) || 0),
              idReferencia: Number((paymentMethods.creditNote.noteId || "").replace(/^NC-/i, "")) || undefined,
            },
          ]
        : []),
    ]

    const payload = {
      clienteId: Number(selectedCustomer),
      empleadoId: Number(selectedEmployee),
      descripcionEspecial: detallePiezas[0]?.descripcionEspecial,
      descripcionPiezaRecibida: detallePiezas[0]?.descripcionPiezaRecibida,
      fechaDeEntrega: `${fechaEntrega}T17:00:00`,
      montoInicial: totalPago,
      detallePago,
      creadoPor: Number(selectedEmployee),
      modificadoPor: Number(selectedEmployee),
      detalles: detallePiezas.map((p) => ({
        tipoDePieza: p.tipoDePieza,
        kilataje: p.kilataje?.trim() || "",
        peso: Number.parseFloat(p.peso) || 0,
        numeroDeAnillo: p.numeroDeAnillo || null,
        largo: p.largo || null,
        ancho: p.ancho || null,
        tejido: p.tejido || null,
        costo: to2(Number.parseFloat(p.costo) || 0),
        descripcionEspecial: p.descripcionEspecial,
        descripcionPiezaRecibida: p.descripcionPiezaRecibida,
      })),
    }

    try {
      setPendingSubmit(true)
      const response = await axiosInstance.post("/api/hechuras", payload)
      toast({ title: "Hechura registrada", description: "Éxito" })

      const hechuraId = response.data?.id
      if (hechuraId) {
        const url = `${process.env.NEXT_PUBLIC_REACT_BASE_LOCAL}/api/pdf/hechura/${hechuraId}`
        window.open(url, "_blank")
      }
      router.push("/hechuras")
    } catch (err) {
      console.error("ERROR AL ENVIAR:", err)
      toast({ title: "Error", description: "No se pudo registrar", variant: "destructive" })
    } finally {
      setPendingSubmit(false)
      setShowConfirmDialog(false)
    }
  }

  // --------- Submit ACTUALIZADO ---------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!hasBasics) {
      toast({
        title: "Datos incompletos",
        description: "Selecciona cliente, vendedor y fecha de entrega.",
        variant: "destructive",
      })
      return
    }
    if (!piezasOk) {
      toast({
        title: "Detalle incompleto",
        description: "Agrega al menos una pieza con tipo, kilataje, costo > 0 y trabajo a realizar.",
        variant: "destructive",
      })
      return
    }
    // ✅ CAMBIO: Mensaje actualizado
    if (!anyPaymentSelected) {
      toast({
        title: "Método de pago requerido",
        description: "Selecciona al menos un método de pago (puede ser $0).",
        variant: "destructive",
      })
      return
    }
    if (!creditNoteOk) {
      toast({
        title: "Nota de crédito inválida",
        description: "Usa formato NC-# o un ID numérico.",
        variant: "destructive",
      })
      return
    }
    // ✅ CAMBIO: Mensaje actualizado para permitir $0
    if (!totalPagoOk) {
      toast({
        title: "Montos inválidos",
        description: `La suma de pagos ($${totalPago.toFixed(2)}) no puede exceder el total ($${totalCosto.toFixed(2)}).`,
        variant: "destructive",
      })
      return
    }

    // ✅ NUEVO: Verificar si necesita confirmación
    if (isZeroPayment) {
      setShowConfirmDialog(true)
      return
    }

    // Si no necesita confirmación, procesar directamente
    await processHechura()
  }

  // --------- Render ---------
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center gap-4">
        <Link href="/hechuras">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Nueva Hechura</h2>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* ------- Información ------- */}
        <Card className="md:col-span-2 lg:col-span-2">
          <CardHeader>
            <CardTitle>Información de la Hechura</CardTitle>
            <CardDescription>Ingresa los datos del cliente, vendedor y detalles de la pieza</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="flex items-center">
                  Fecha de entrega <ReqBadge />
                </Label>
                <Input
                  type="date"
                  min={minDate}
                  value={fechaEntrega}
                  onChange={(e) => setFechaEntrega(e.target.value)}
                  className={!fechaEntrega ? "bg-red-50 border-red-200 text-red-900 placeholder:text-red-400" : ""}
                />
              </div>

              <div>
                <Label className="flex items-center">
                  Vendedor <ReqBadge />
                </Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger
                    className={
                      !selectedEmployee ? "bg-red-50 border-red-200 text-red-900 placeholder:text-red-400" : ""
                    }
                  >
                    <SelectValue placeholder="Seleccionar vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.nombreCompleto}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="flex items-center">
                  Cliente <ReqBadge />
                </Label>
                <div className={!selectedCustomer ? "bg-red-50 border border-red-200 rounded-md" : ""}>
                  <ClienteSelector
                    value={selectedCustomer}
                    onValueChange={setSelectedCustomer}
                    vendedorId={selectedEmployee}
                  />
                </div>
                {!selectedEmployee && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Selecciona un vendedor para habilitar la selección de cliente
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {detallePiezas.map((pieza, idx) => (
              <div key={idx} className="border rounded-md p-4 space-y-2 relative">
                {detallePiezas.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => handleRemovePieza(idx)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}

                <h3 className="font-medium text-lg">Pieza {idx + 1}</h3>

                {/* ===== Tipo de Pieza (OBLIGATORIO) ===== */}
                <Label className="flex items-center">
                  Tipo de Pieza <ReqBadge />
                </Label>
                <Input
                  placeholder="Ej: Anillo, Pulsera, Collar..."
                  className={
                    !pieza.tipoDePieza?.trim() ? "bg-red-50 border-red-200 text-red-900 placeholder:text-red-400" : ""
                  }
                  value={pieza.tipoDePieza}
                  onChange={(e) => {
                    const n = [...detallePiezas]
                    n[idx].tipoDePieza = e.target.value
                    setDetallePiezas(n)
                  }}
                />

                {/* ===== Kilataje (OBLIGATORIO) ===== */}
                <Label className="flex items-center">
                  Kilataje <ReqBadge />
                </Label>
                <Input
                  list={`kilataje-list-${idx}`}
                  placeholder="Ej. 14K, oro blanco 10K, etc."
                  className={
                    !pieza.kilataje?.trim() ? "bg-red-50 border-red-200 text-red-900 placeholder:text-red-400" : ""
                  }
                  value={pieza.kilataje}
                  onChange={(e) => {
                    const n = [...detallePiezas]
                    n[idx].kilataje = e.target.value
                    setDetallePiezas(n)
                  }}
                  onBlur={(e) => {
                    const n = [...detallePiezas]
                    n[idx].kilataje = e.target.value.trim()
                    setDetallePiezas(n)
                  }}
                />
                <datalist id={`kilataje-list-${idx}`}>
                  {KILATAJES_SUGERIDOS.map((k) => (
                    <option key={k} value={k} />
                  ))}
                </datalist>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Peso (gr)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={pieza.peso}
                      onChange={(e) => {
                        const n = [...detallePiezas]
                        n[idx].peso = e.target.value
                        setDetallePiezas(n)
                      }}
                    />
                  </div>

                  <div>
                    <Label>Número de Anillo</Label>
                    <Input
                      placeholder="Ej: 7, 8.5"
                      value={pieza.numeroDeAnillo}
                      onChange={(e) => {
                        const n = [...detallePiezas]
                        n[idx].numeroDeAnillo = e.target.value
                        setDetallePiezas(n)
                      }}
                    />
                  </div>

                  <div>
                    <Label>Largo (cm)</Label>
                    <Input
                      placeholder="0"
                      value={pieza.largo}
                      onChange={(e) => {
                        const n = [...detallePiezas]
                        n[idx].largo = e.target.value
                        setDetallePiezas(n)
                      }}
                    />
                  </div>

                  <div>
                    <Label>Ancho (cm)</Label>
                    <Input
                      placeholder="0"
                      value={pieza.ancho}
                      onChange={(e) => {
                        const n = [...detallePiezas]
                        n[idx].ancho = e.target.value
                        setDetallePiezas(n)
                      }}
                    />
                  </div>
                </div>

                <div>
                  <Label>Tejido</Label>
                  <Input
                    placeholder="Ej: Cadena, Malla, Sólido..."
                    value={pieza.tejido}
                    onChange={(e) => {
                      const n = [...detallePiezas]
                      n[idx].tejido = e.target.value
                      setDetallePiezas(n)
                    }}
                  />
                </div>

                {/* ===== Costo (OBLIGATORIO) ===== */}
                <Label className="flex items-center">
                  Costo <ReqBadge />
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className={
                    !((Number.parseFloat(pieza.costo) || 0) > 0)
                      ? "bg-red-50 border-red-200 text-red-900 placeholder:text-red-400"
                      : ""
                  }
                  value={pieza.costo}
                  onChange={(e) => {
                    const n = [...detallePiezas]
                    n[idx].costo = e.target.value
                    setDetallePiezas(n)
                  }}
                />

                {/* ===== Trabajo a Realizar (OBLIGATORIO) ===== */}
                <Label className="flex items-center">
                  Trabajo a Realizar <ReqBadge />
                </Label>
                <Input
                  placeholder="Describe el trabajo que se realizará..."
                  className={
                    !pieza.descripcionEspecial?.trim()
                      ? "bg-red-50 border-red-200 text-red-900 placeholder:text-red-400"
                      : ""
                  }
                  value={pieza.descripcionEspecial}
                  onChange={(e) => {
                    const n = [...detallePiezas]
                    n[idx].descripcionEspecial = e.target.value
                    setDetallePiezas(n)
                  }}
                />

                <Label>Descripción de Pieza Recibida</Label>
                <Input
                  placeholder="Estado actual de la pieza..."
                  value={pieza.descripcionPiezaRecibida}
                  onChange={(e) => {
                    const n = [...detallePiezas]
                    n[idx].descripcionPiezaRecibida = e.target.value
                    setDetallePiezas(n)
                  }}
                />
              </div>
            ))}

            <Button type="button" variant="outline" className="w-full bg-transparent" onClick={handleAddPieza}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar otra pieza
            </Button>
          </CardContent>
        </Card>

        {/* ------- Pago ------- */}
        <Card>
          <CardHeader>
            <CardTitle>Detalle de Pago</CardTitle>
            <CardDescription>Selecciona las formas de pago (puede ser $0)</CardDescription> {/* ✅ CAMBIO */}
          </CardHeader>
          <CardContent className="space-y-4">
            {(["cash", "card", "creditNote"] as const).map((method) => (
              <div key={method}>
                <Label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={paymentMethods[method].used as unknown as boolean}
                    onChange={(e) => handlePaymentChange(method, "used", e.target.checked)}
                  />
                  Pago con {method === "cash" ? "efectivo" : method === "card" ? "tarjeta" : "nota de crédito"}
                </Label>

                {paymentMethods[method].used && (
                  <>
                    {method === "creditNote" && (
                      <Input
                        placeholder="Ej. NC-8 o 8"
                        value={paymentMethods.creditNote.noteId}
                        onChange={(e) => handlePaymentChange("creditNote", "noteId", e.target.value)}
                        className="mt-2"
                      />
                    )}
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={paymentMethods[method].amount}
                      onChange={(e) => handlePaymentChange(method, "amount", e.target.value)}
                      className="mt-2"
                    />
                  </>
                )}
                <Separator className="my-3" />
              </div>
            ))}

            <div className="text-sm space-y-1">
              <div>Total: ${totalCosto.toFixed(2)}</div>
              <div>Total pagado: ${totalPago.toFixed(2)}</div>
              <div className="font-semibold">Saldo pendiente: ${(totalCosto - totalPago).toFixed(2)}</div>
              {/* ✅ CAMBIO: Mensaje actualizado */}
              {!totalPagoOk && anyPaymentSelected && (
                <div className="text-red-500">La suma de pagos no puede exceder el total.</div>
              )}

              {/* ✅ NUEVO: Advertencia visual para pago $0 */}
              {isZeroPayment && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded-md mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs">Se registrará la hechura sin pago inicial</span>
                </div>
              )}
            </div>

            {/* Checklist de validaciones */}
            <div className="space-y-2 pt-4 border-t">
              {validationChecks.map((check) => (
                <div key={check.id} className="flex items-center gap-2 text-sm">
                  {check.completed ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  <span className={check.completed ? "text-green-700" : "text-red-600"}>{check.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={!canSubmit || pendingSubmit}>
              {pendingSubmit ? "Procesando..." : canSubmit ? "Registrar Hechura" : "Completa los campos requeridos"}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* ✅ NUEVO: Diálogo de confirmación */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmar Hechura
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <p>¿Estás seguro de que quieres registrar la hechura sin pago inicial?</p>
              <p className="text-sm text-muted-foreground">
                El cliente no está pagando nada por adelantado. El trabajo se realizará a cuenta.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} className="w-full sm:w-auto">
              Cancelar y Revisar
            </Button>
            <Button
              onClick={processHechura}
              disabled={pendingSubmit}
              className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700"
            >
              {pendingSubmit ? "Procesando..." : "Sí, Continuar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
