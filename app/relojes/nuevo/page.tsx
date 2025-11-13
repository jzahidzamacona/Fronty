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

const OPT_MARCAS = [
  "Casio",
  "Timex",
  "Seiko",
  "Citizen",
  "Citizen (Eco-Drive)",
  "Orient",
  "Fossil",
  "Swatch",
  "Skagen",
  "Nixon",
  "Invicta",
  "Armitron",
  "Guess",
  "Diesel",
  "G-SHOCK",
  "Casio Edifice",
  "Timex Expedition",
  "Tissot",
  "Hamilton",
  "Bulova",
  "Certina",
  "Longines",
  "Rado",
  "Mido",
  "Oris",
  "Sinn",
  "Junghans",
  "Raymond Weil",
  "Maurice Lacroix",
  "Ball",
  "Glycine",
  "Rolex",
  "Omega",
  "TAG Heuer",
  "Breitling",
  "IWC Schaffhausen",
  "Cartier",
  "Panerai",
  "Grand Seiko",
  "Zenith",
  "Blancpain",
  "Breguet",
  "Ulysse Nardin",
  "Girard-Perregaux",
  "Chopard",
  "Piaget",
  "Jaquet Droz",
  "Baume & Mercier",
  "Audemars Piguet",
  "Patek Philippe",
  "Vacheron Constantin",
  "Jaeger-LeCoultre",
  "Richard Mille",
  "Hublot",
  "A. Lange & Söhne",
  "F.P. Journe",
  "Greubel Forsey",
  "Parmigiani Fleurier",
  "De Bethune",
  "Laurent Ferrier",
  "Gucci",
  "Armani",
  "Emporio Armani",
  "Giorgio Armani",
  "Hugo Boss",
  "Versace",
  "Michael Kors",
  "Dolce & Gabbana (D&G)",
  "Burberry",
  "Salvatore Ferragamo",
  "Tommy Hilfiger",
  "Calvin Klein",
  "DKNY",
  "Lacoste",
  "Marc Jacobs",
  "Kate Spade",
]

/* ======= catálogos ======= */
const OPT_TIPO = ["Cuarzo", "Automatico", "Digital", "Cuerda", "Pared", "Bolsillo", "Smartwatch", "Híbrido smart"]
const OPT_COLOR = ["Blanco", "Negro", "Plateado", "Dorado", "Azul", "Transparente"]
const OPT_CARATULA = ["Blanca", "Negra", "Azul", "Roja", "Amarilla", "Verde"]
const OPT_CRISTAL = ["Circular", "Ovalada", "Cuadrada", "Rectangular", "Triangular", "Iregular"]
const OPT_CORREA = ["Extensible metalico", "Extensible plastico", "Correa", "Piel", "Ternera", "Caucho", "Resorte"]
const OPT_INDICADORES = ["Plateados", "Dorados", "Negros", "Blancos"]
const OPT_SERVICIO = [
  "Realizar servcio",
  "Cambio de maquina",
  "Colocar pila",
  "Cambio de cristal",
  "Conseguir extensible",
  "Pulir extensible",
  "Cambio de corona",
  "Colocar corona",
  "Colocar manecilla",
  "Pegar numero",
  "Pegar fechador",
  "Acomodar caratula",
]
const OPT_CONDICION = [
  "Llega Reloj golpeado",
  "Llega reloj con cristal estrellado",
  "Llega reloj con cristal rasguñado",
  "Llega reloj sin tapa",
  "Llega reloj sin corona",
  "Llega reloj sin Cristal",
  "Llega reloj sin pila",
  "Llega reloj corroido",
]

/* ======= Input con datalist (sugerencias + texto libre) ======= */
function ComboInput({
  id,
  value,
  onChange,
  options,
  placeholder,
  invalid = false,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
  invalid?: boolean
}) {
  return (
    <div className="space-y-1">
      <Input
        list={id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={invalid ? "bg-red-50 border-red-200 text-red-900 placeholder:text-red-400" : ""}
      />
      <datalist id={id}>
        {options.map((op) => (
          <option key={op} value={op} />
        ))}
      </datalist>
      <p className="text-[11px] text-muted-foreground">Escribe o elige de la lista.</p>
    </div>
  )
}

function MultiSuggestInput({
  value,
  onChange,
  options,
  placeholder,
  invalid = false,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
  invalid?: boolean
}) {
  const [input, setInput] = useState("")
  const [focused, setFocused] = useState(false)

  // edición por chip
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editText, setEditText] = useState("")

  const tokens = useMemo(
    () =>
      (value || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    [value],
  )

  const normalize = (s: string) =>
    s
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()

  const hasToken = (t: string, skipIndex: number | null = null) =>
    tokens.some((x, i) => (skipIndex !== null && i === skipIndex ? false : normalize(x) === normalize(t)))

  // opciones disponibles (evita duplicados; si estás editando, permite la propia)
  const baseFilter = editingIndex !== null ? editText : input
  const filtered = options
    .filter((op) => !hasToken(op, editingIndex))
    .filter((op) => normalize(op).includes(normalize(baseFilter)))
    .slice(0, 8)

  const join = (arr: string[]) => arr.join(", ")

  // crear nueva chip
  const commitNew = (text: string) => {
    const v = text.trim()
    if (!v) return // Permitir cualquier texto, no solo los de la lista
    onChange(join([...tokens, v]))
    setInput("")
  }

  // guardar edición de chip
  const commitEdit = (text: string) => {
    if (editingIndex === null) return
    const v = text.trim()
    const clone = [...tokens]
    if (v) {
      // Permitir cualquier texto en la edición
      clone[editingIndex] = v
    } else {
      // Si está vacío, eliminar el token
      clone.splice(editingIndex, 1)
    }
    setEditingIndex(null)
    setEditText("")
    onChange(join(clone))
  }

  const remove = (idx: number) => {
    const next = tokens.filter((_, i) => i !== idx)
    onChange(join(next))
  }

  // teclado en input general (nuevo token)
  const handleKeyDownNew = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === "Tab" || e.key === ",") && input.trim()) {
      e.preventDefault()
      commitNew(input)
    } else if (e.key === "Backspace" && !input && tokens.length) {
      e.preventDefault()
      remove(tokens.length - 1)
    }
  }

  // teclado en chip en edición
  const handleKeyDownEdit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault()
      setEditingIndex(null)
      setEditText("")
      return
    }
    if (e.key === "Enter" || e.key === "Tab" || e.key === ",") {
      e.preventDefault()
      commitEdit(editText)
    }
  }

  // pegar coma en el input general divide en varios tokens
  const handleChangeNew = (raw: string) => {
    if (raw.includes(",")) {
      const parts = raw.split(",")
      const last = parts.pop() ?? ""
      parts.forEach((p) => commitNew(p))
      setInput(last)
    } else {
      setInput(raw)
    }
  }

  // Permitir agregar texto libre al perder el foco
  const handleBlur = () => {
    setTimeout(() => {
      setFocused(false)
      // Si hay texto en el input y no estamos editando, agregarlo como token
      if (input.trim() && editingIndex === null) {
        commitNew(input)
      }
    }, 120)
  }

  const open = focused && filtered.length > 0

  return (
    <div className="space-y-1">
      <div
        className={`relative min-h-10 w-full rounded-md border px-2 py-1 flex flex-wrap gap-1 focus-within:ring-2 focus-within:ring-ring ${
          invalid ? "bg-red-50 border-red-200" : ""
        }`}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
      >
        {tokens.map((t, i) => (
          <span key={`${t}-${i}`} className="flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs">
            {editingIndex === i ? (
              <input
                className="bg-transparent outline-none border-b border-dashed min-w-[60px]"
                autoFocus
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={handleKeyDownEdit}
                onBlur={() => commitEdit(editText)}
                placeholder="Editar…"
              />
            ) : (
              <>
                <button
                  type="button"
                  className="cursor-text hover:bg-muted-foreground/10 rounded px-1"
                  onClick={() => {
                    setEditingIndex(i)
                    setEditText(t)
                  }}
                  title="Clic para editar"
                >
                  {t}
                </button>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground hover:bg-red-100 rounded px-1"
                  onClick={() => remove(i)}
                  aria-label={`Quitar ${t}`}
                  title="Quitar"
                >
                  ×
                </button>
              </>
            )}
          </span>
        ))}

        {/* input para NUEVO token */}
        {editingIndex === null && (
          <input
            className={`flex-1 min-w-[120px] outline-none bg-transparent py-1 ${
              invalid ? "text-red-900 placeholder:text-red-400" : ""
            }`}
            value={input}
            onChange={(e) => handleChangeNew(e.target.value)}
            onKeyDown={handleKeyDownNew}
            placeholder={tokens.length ? "Agregar más..." : placeholder || ""}
          />
        )}

        {open && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-auto rounded-md border bg-popover text-popover-foreground shadow">
            {filtered.map((op) => (
              <button
                key={op}
                type="button"
                className="block w-full px-3 py-1.5 text-left hover:bg-accent"
                onMouseDown={(e) => {
                  e.preventDefault()
                  if (editingIndex !== null) {
                    setEditText(op)
                    commitEdit(op)
                  } else {
                    commitNew(op)
                  }
                }}
              >
                {op}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Escribe texto libre o elige de la lista. Presiona <kbd>,</kbd>/<kbd>Enter</kbd>/<kbd>Tab</kbd> para agregar.
        Clic en una etiqueta para editarla.
      </p>
    </div>
  )
}

export default function NuevoRelojPage() {
  const router = useRouter()
  const { toast } = useToast()

  // --------- Estado ---------
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [fechaEntrega, setFechaEntrega] = useState("")

  const [detalleRelojes, setDetalleRelojes] = useState<any[]>([
    {
      marca: "",
      tipoDeReloj: "",
      color: "",
      colorDeCaratula: "",
      tipoDeCristal: "",
      tipoCorrea: "",
      indicadores: "",
      costo: "",
      condicionRecibida: "",
      servicio: "",
    },
  ])

  const [paymentMethods, setPaymentMethods] = useState({
    cash: { used: false, amount: "" },
    card: { used: false, amount: "" },
    creditNote: { used: false, amount: "", noteId: "" },
  })

  const [empleados, setEmpleados] = useState<any[]>([])

  // ✅ NUEVO: Estado para el diálogo de confirmación
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState(false)

  // --------- Helpers visuales ---------
  const ReqBadge = () => (
    <span className="ml-2 text-xs rounded-md px-2 py-0.5 bg-red-100 text-red-800">obligatorio</span>
  )

  // minDate = hoy (corrige tz)
  const minDate = (() => {
    const d = new Date()
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 10)
  })()

  useEffect(() => {
    axiosInstance
      .get("/api/empleados")
      .then((res) => setEmpleados(res.data))
      .catch(() => setEmpleados([]))
  }, [])

  // --------- Utils ---------
  const to2 = (n: number) => Number((n ?? 0).toFixed(2))
  const getTotalPago = () =>
    (paymentMethods.cash.used ? Number(paymentMethods.cash.amount) || 0 : 0) +
    (paymentMethods.card.used ? Number(paymentMethods.card.amount) || 0 : 0) +
    (paymentMethods.creditNote.used ? Number(paymentMethods.creditNote.amount) || 0 : 0)

  const getTotalCosto = () => detalleRelojes.reduce((acc, r) => acc + (Number.parseFloat(r.costo) || 0), 0)

  // --------- Validaciones ---------
  const hasBasics = !!selectedCustomer && !!selectedEmployee && !!fechaEntrega

  const relojOk = useMemo(() => {
    if (detalleRelojes.length === 0) return false
    return detalleRelojes.some(
      (r) =>
        (r.marca?.trim() || "").length > 0 &&
        (r.tipoDeReloj?.trim() || "").length > 0 &&
        (r.servicio?.trim() || "").length > 0 &&
        (Number.parseFloat(r.costo) || 0) > 0,
    )
  }, [detalleRelojes])

  // ✅ CAMBIO: Solo requiere que al menos un método esté seleccionado (sin importar el monto)
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

  const canSubmit = hasBasics && relojOk && anyPaymentSelected && creditNoteOk && totalPagoOk

  // --------- Validaciones para checklist ---------
  const validationChecks = [
    { id: "cliente", label: "Selecciona un cliente", completed: !!selectedCustomer },
    { id: "vendedor", label: "Selecciona un vendedor", completed: !!selectedEmployee },
    { id: "fecha", label: "Selecciona fecha de entrega", completed: !!fechaEntrega },
    { id: "reloj", label: "Completa al menos un reloj", completed: relojOk },
    // ✅ CAMBIO: Mensaje actualizado
    { id: "pago", label: "Selecciona al menos un método de pago", completed: anyPaymentSelected },
  ]

  // --------- Handlers ---------
  const handleAddReloj = () => {
    setDetalleRelojes((prev) => [
      ...prev,
      {
        marca: "",
        tipoDeReloj: "",
        color: "",
        colorDeCaratula: "",
        tipoDeCristal: "",
        tipoCorrea: "",
        indicadores: "",
        costo: "",
        condicionRecibida: "",
        servicio: "",
      },
    ])
  }

  const handleRemoveReloj = (idx: number) => {
    setDetalleRelojes((prev) => prev.filter((_, i) => i !== idx))
  }

  // ✅ NUEVO: Función para procesar el reloj
  const processReloj = async () => {
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

    // Mapeo a nombres del backend - INCLUYE TODO EL TEXTO (opciones + texto libre)
    const detalles = detalleRelojes.map((r) => {
      const out: Record<string, any> = {}
      if (r.marca?.trim()) out.marca = r.marca.trim()
      if (r.tipoDeReloj?.trim()) out.tipoDeReloj = r.tipoDeReloj.trim()
      if (r.color?.trim()) out.color = r.color.trim()
      if (r.colorDeCaratula?.trim()) out.colorDeCaratula = r.colorDeCaratula.trim()
      if (r.tipoDeCristal?.trim()) out.tipoDeCristal = r.tipoDeCristal.trim()
      if (r.tipoCorrea?.trim()) out.tipoCorrea = r.tipoCorrea.trim()
      if (r.indicadores?.trim()) out.indicadores = r.indicadores.trim()

      // IMPORTANTE: Envía TODO el contenido del campo servicio (opciones + texto libre)
      if (r.servicio?.trim()) out.observaciones = r.servicio.trim()

      // IMPORTANTE: Envía TODO el contenido del campo condición (opciones + texto libre)
      if (r.condicionRecibida?.trim()) out.condicionRecibida = r.condicionRecibida.trim()

      const c = Number.parseFloat(r.costo)
      if (!Number.isNaN(c) && c > 0) out.costo = Number(c.toFixed(2))
      return out
    })

    const payload = {
      clienteId: Number(selectedCustomer),
      empleadoId: Number(selectedEmployee),
      fechaDeEntrega: `${fechaEntrega}T17:00:00`,
      montoInicial: totalPago,
      detallePago,
      creadoPor: Number(selectedEmployee),
      modificadoPor: Number(selectedEmployee),
      detalles,
    }

    try {
      setPendingSubmit(true)
      const res = await axiosInstance.post("/api/relojes", payload)
      toast({ title: "Reloj registrado", description: "Éxito" })
      const id = res.data?.id
      if (id) window.open(`${process.env.NEXT_PUBLIC_REACT_BASE_LOCAL}/api/pdf/reloj/${id}`, "_blank")
      router.push("/relojes")
    } catch (error) {
      console.error("Error al enviar:", error)
      toast({ title: "Error", description: "No se pudo registrar", variant: "destructive" })
    } finally {
      setPendingSubmit(false)
      setShowConfirmDialog(false)
    }
  }

  // --------- Submit ---------
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
    if (!relojOk) {
      toast({
        title: "Detalle incompleto",
        description: "Agrega al menos un reloj con Marca, Tipo, Servicio y Costo > 0.",
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
    await processReloj()
  }

  // --------- Render ---------
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center gap-4">
        <Link href="/relojes">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Nuevo Reloj</h2>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="md:col-span-2 lg:col-span-2">
          <CardHeader>
            <CardTitle>Información del Reloj</CardTitle>
            <CardDescription>Ingresa los datos del cliente, vendedor y detalles del reloj</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Fecha de entrega (OBLIGATORIA, min=hoy) */}
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
                    {empleados.map((e) => (
                      <SelectItem key={e.id} value={e.id.toString()}>
                        {e.nombreCompleto}
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
              </div>
            </div>

            <Separator />

            {detalleRelojes.map((r, idx) => (
              <div key={idx} className="border rounded-md p-4 space-y-3 relative">
                {detalleRelojes.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => handleRemoveReloj(idx)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}

                {/* Marca (OBLIGATORIA) */}
                <Label className="flex items-center">
                  Marca <ReqBadge />
                </Label>
                <ComboInput
                  id={`marca-${idx}`}
                  options={OPT_MARCAS}
                  value={r.marca}
                  onChange={(v) => {
                    const n = [...detalleRelojes]
                    n[idx].marca = v
                    setDetalleRelojes(n)
                  }}
                  placeholder="Casio, Seiko, Timex…"
                  invalid={!r.marca?.trim()}
                />

                {/* Tipo (OBLIGATORIA) */}
                <Label className="flex items-center">
                  Tipo <ReqBadge />
                </Label>
                <ComboInput
                  id={`tipo-${idx}`}
                  options={OPT_TIPO}
                  value={r.tipoDeReloj}
                  onChange={(v) => {
                    const n = [...detalleRelojes]
                    n[idx].tipoDeReloj = v
                    setDetalleRelojes(n)
                  }}
                  placeholder="Cuarzo, Cuerda, Pared…"
                  invalid={!r.tipoDeReloj}
                />

                <Label>Color</Label>
                <ComboInput
                  id={`color-${idx}`}
                  options={OPT_COLOR}
                  value={r.color}
                  onChange={(v) => {
                    const n = [...detalleRelojes]
                    n[idx].color = v
                    setDetalleRelojes(n)
                  }}
                  placeholder="Blanco, Negro, Azul…"
                />

                <Label>Color de Carátula</Label>
                <ComboInput
                  id={`caratula-${idx}`}
                  options={OPT_CARATULA}
                  value={r.colorDeCaratula}
                  onChange={(v) => {
                    const n = [...detalleRelojes]
                    n[idx].colorDeCaratula = v
                    setDetalleRelojes(n)
                  }}
                  placeholder="Blanca, Negra, Azul…"
                />

                <Label>Tipo de Cristal</Label>
                <ComboInput
                  id={`cristal-${idx}`}
                  options={OPT_CRISTAL}
                  value={r.tipoDeCristal}
                  onChange={(v) => {
                    const n = [...detalleRelojes]
                    n[idx].tipoDeCristal = v
                    setDetalleRelojes(n)
                  }}
                  placeholder="Circular, Ovalada, Cuadrada…"
                />

                <Label>Tipo de Correa</Label>
                <ComboInput
                  id={`correa-${idx}`}
                  options={OPT_CORREA}
                  value={r.tipoCorrea}
                  onChange={(v) => {
                    const n = [...detalleRelojes]
                    n[idx].tipoCorrea = v
                    setDetalleRelojes(n)
                  }}
                  placeholder="Extensible metálico, Piel…"
                />

                <Label>Indicadores</Label>
                <ComboInput
                  id={`indicadores-${idx}`}
                  options={OPT_INDICADORES}
                  value={r.indicadores}
                  onChange={(v) => {
                    const n = [...detalleRelojes]
                    n[idx].indicadores = v
                    setDetalleRelojes(n)
                  }}
                  placeholder="Plateados, Dorados…"
                />

                {/* Costo (OBLIGATORIO) */}
                <Label className="flex items-center">
                  Costo <ReqBadge />
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  className={
                    !((Number.parseFloat(r.costo) || 0) > 0)
                      ? "bg-red-50 border-red-200 text-red-900 placeholder:text-red-400"
                      : ""
                  }
                  value={r.costo}
                  onChange={(e) => {
                    const n = [...detalleRelojes]
                    n[idx].costo = e.target.value
                    setDetalleRelojes(n)
                  }}
                />

                {/* Servicio a Realizar (OBLIGATORIO) */}
                <Label className="flex items-center">
                  Servicio a Realizar <ReqBadge />
                </Label>
                <MultiSuggestInput
                  options={OPT_SERVICIO}
                  value={r.servicio}
                  onChange={(v) => {
                    const n = [...detalleRelojes]
                    n[idx].servicio = v
                    setDetalleRelojes(n)
                  }}
                  placeholder="Cambio de máquina, colocar pila…"
                  invalid={!r.servicio?.trim()}
                />

                <Label>Condición Recibida</Label>
                <MultiSuggestInput
                  options={OPT_CONDICION}
                  value={r.condicionRecibida}
                  onChange={(v) => {
                    const n = [...detalleRelojes]
                    n[idx].condicionRecibida = v
                    setDetalleRelojes(n)
                  }}
                  placeholder="Llega reloj con…"
                />
              </div>
            ))}

            <Button type="button" variant="outline" className="w-full bg-transparent" onClick={handleAddReloj}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar otro reloj
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalle de Pago</CardTitle>
            {/* ✅ CAMBIO: Descripción actualizada */}
            <CardDescription>Selecciona las formas de pago (puede ser $0)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(["cash", "card", "creditNote"] as const).map((method) => (
              <div key={method}>
                <Label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={paymentMethods[method].used as unknown as boolean}
                    onChange={(e) =>
                      setPaymentMethods((prev) => ({
                        ...prev,
                        [method]: { ...prev[method], used: e.target.checked },
                      }))
                    }
                  />
                  Pago con {method === "cash" ? "efectivo" : method === "card" ? "tarjeta" : "nota de crédito"}
                </Label>

                {paymentMethods[method].used && (
                  <>
                    {method === "creditNote" && (
                      <Input
                        placeholder="Ej. NC-8 o 8"
                        value={paymentMethods.creditNote.noteId}
                        onChange={(e) =>
                          setPaymentMethods((prev) => ({
                            ...prev,
                            creditNote: { ...prev.creditNote, noteId: e.target.value },
                          }))
                        }
                        className="mt-2"
                      />
                    )}
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={paymentMethods[method].amount}
                      onChange={(e) =>
                        setPaymentMethods((prev) => ({
                          ...prev,
                          [method]: { ...prev[method], amount: e.target.value },
                        }))
                      }
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
              {!totalPagoOk && anyPaymentSelected && (
                <div className="text-red-500">La suma de pagos no puede exceder el total.</div>
              )}

              {/* ✅ NUEVO: Advertencia visual para pago $0 */}
              {isZeroPayment && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded-md mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs">Se registrará el reloj sin pago inicial</span>
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
              {pendingSubmit ? "Procesando..." : canSubmit ? "Registrar Reloj" : "Completa los campos requeridos"}
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
              Confirmar Reloj
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <p>¿Estás seguro de que quieres registrar el reloj sin pago inicial?</p>
              <p className="text-sm text-muted-foreground">
                El cliente no está pagando nada por adelantado. El servicio se realizará a cuenta.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} className="w-full sm:w-auto">
              Cancelar y Revisar
            </Button>
            <Button
              onClick={processReloj}
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
