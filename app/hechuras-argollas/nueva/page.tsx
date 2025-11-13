"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import axios from "axios"
import axiosInstance from "@/hooks/axiosInstance"
import { ClienteSelector } from "@/components/ventas/cliente-selector"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft } from "lucide-react"
import DetallePago from "@/components/pagos/detalle-pago"

import type { DetallePagoArgolla, CrearArgollaSobrepedidoRq, CrearArgollaStockRq, FormaPagoArgolla } from "../types"

const USE_PUBLIC_AXIOS = false

type PM = {
  cash: { used: boolean; amount: string }
  card: { used: boolean; amount: string }
  creditNote: { used: boolean; amount: string; noteId: string }
}

export default function NuevaArgollaPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [empleados, setEmpleados] = useState<any[]>([])
  const [clienteId, setClienteId] = useState("")
  const [empleadoId, setEmpleadoId] = useState("")
  const [fechaEntrega, setFechaEntrega] = useState("")

  useEffect(() => {
    axiosInstance
      .get("/api/empleados")
      .then((r) => setEmpleados(r.data))
      .catch(() => setEmpleados([]))
  }, [])

  const minDate = useMemo(() => {
    const d = new Date()
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 10)
  }, [])

  const [sp, setSp] = useState({
    modelo: "",
    kilataje: "",
    mm: "",
    tipoAcabado: "",
    tallaCaballero: "",
    tallaDama: "",
    grabadoCaballero: "",
    grabadoDama: "",
    descripcionEspecial: "",
    total: "",
    formaPago: "MIXTO" as FormaPagoArgolla,
  })

  const [paymentSP, setPaymentSP] = useState<PM>({
    cash: { used: false, amount: "" },
    card: { used: false, amount: "" },
    creditNote: { used: false, amount: "", noteId: "" },
  })

  const handlePaymentChangeSP = (method: keyof PM, field: "used" | "amount" | "noteId", value: boolean | string) =>
    setPaymentSP((p) => ({ ...p, [method]: { ...p[method], [field]: value } }))

  const buildPagoSP = (): DetallePagoArgolla[] => {
    const arr: DetallePagoArgolla[] = []
    if (paymentSP.cash.used) arr.push({ tipo: "EFECTIVO", monto: Number(paymentSP.cash.amount) || 0 })
    if (paymentSP.card.used) arr.push({ tipo: "TARJETA", monto: Number(paymentSP.card.amount) || 0 })
    if (paymentSP.creditNote.used) arr.push({ tipo: "NOTA_CREDITO", monto: Number(paymentSP.creditNote.amount) || 0 })
    return arr
  }

  const deriveFormaPago = (pm: PM): FormaPagoArgolla => {
    const used = [pm.cash.used, pm.card.used, pm.creditNote.used].filter(Boolean).length
    if (used === 0) return "SIN_PAGO"
    if (used === 1) {
      if (pm.cash.used) return "EFECTIVO"
      if (pm.card.used) return "TARJETA"
      return "MIXTO"
    }
    return "MIXTO"
  }

  const totalPagadoSP =
    (paymentSP.cash.used ? Number(paymentSP.cash.amount) || 0 : 0) +
    (paymentSP.card.used ? Number(paymentSP.card.amount) || 0 : 0) +
    (paymentSP.creditNote.used ? Number(paymentSP.creditNote.amount) || 0 : 0)

  const submitSobrepedido = async () => {
    if (!clienteId || !empleadoId || !fechaEntrega) {
      toast({ variant: "destructive", title: "Selecciona cliente, vendedor y fecha" })
      return
    }
    const oblig = [sp.modelo, sp.kilataje, sp.mm, sp.tipoAcabado, sp.total]
    if (oblig.some((v) => !String(v).trim())) {
      toast({ variant: "destructive", title: "Completa los campos de negocio y el total" })
      return
    }

    const payload: CrearArgollaSobrepedidoRq = {
      clienteId: Number(clienteId),
      empleadoId: Number(empleadoId),
      fechaEntrega: `${fechaEntrega}T18:00:00`,
      modelo: sp.modelo,
      kilataje: sp.kilataje,
      mm: sp.mm,
      tipoAcabado: sp.tipoAcabado,
      total: Number(sp.total),
      formaPago: deriveFormaPago(paymentSP),
      detallePago: buildPagoSP(),
      ...(sp.tallaCaballero?.trim() ? { tallaCaballero: sp.tallaCaballero } : {}),
      ...(sp.tallaDama?.trim() ? { tallaDama: sp.tallaDama } : {}),
      ...(sp.grabadoCaballero?.trim() ? { grabadoCaballero: sp.grabadoCaballero } : {}),
      ...(sp.grabadoDama?.trim() ? { grabadoDama: sp.grabadoDama } : {}),
      ...(sp.descripcionEspecial?.trim() ? { descripcionEspecial: sp.descripcionEspecial } : {}),
      notaCreditoIdUsada: paymentSP.creditNote.used
        ? Number((paymentSP.creditNote.noteId || "0").replace(/^NC-/i, "")) || null
        : null,
    }

    try {
      const url = `${process.env.NEXT_PUBLIC_REACT_BASE_LOCAL}${process.env.NEXT_PUBLIC_API_ARGOLLAS_PEDIDO}`
      const http = USE_PUBLIC_AXIOS ? axios : axiosInstance
      console.log("[v0] Submitting SOBREPEDIDO to:", url)
      const { data } = await http.post(url, payload)
      toast({ title: "Hechura Argolla registrada" })
      const id = data?.id
      if (id)
        window.open(
          `${process.env.NEXT_PUBLIC_REACT_BASE_LOCAL}${process.env.NEXT_PUBLIC_API_ARGOLLAS_PDF}/${id}`,
          "_blank",
        )
      router.push("/hechuras-argollas")
    } catch (e) {
      console.error("[v0] Error al registrar SOBREPEDIDO:", e)
      toast({ variant: "destructive", title: "Error al registrar" })
    }
  }

const [stk, setStk] = useState({
  argollaStockId: "",
  cantidad: "1",
  descripcionEspecial: "",
  total: "",                           // 👈 NUEVO
  formaPago: "EFECTIVO" as FormaPagoArgolla,
})


  const [paymentST, setPaymentST] = useState<PM>({
    cash: { used: false, amount: "" },
    card: { used: false, amount: "" },
    creditNote: { used: false, amount: "", noteId: "" },
  })

  const handlePaymentChangeST = (method: keyof PM, field: "used" | "amount" | "noteId", value: boolean | string) =>
    setPaymentST((p) => ({ ...p, [method]: { ...p[method], [field]: value } }))

  const buildPagoSTK = (): DetallePagoArgolla[] => {
    const arr: DetallePagoArgolla[] = []
    if (paymentST.cash.used) arr.push({ tipo: "EFECTIVO", monto: Number(paymentST.cash.amount) || 0 })
    if (paymentST.card.used) arr.push({ tipo: "TARJETA", monto: Number(paymentST.card.amount) || 0 })
    if (paymentST.creditNote.used) arr.push({ tipo: "NOTA_CREDITO", monto: Number(paymentST.creditNote.amount) || 0 })
    return arr
  }

  const totalPagadoST =
    (paymentST.cash.used ? Number(paymentST.cash.amount) || 0 : 0) +
    (paymentST.card.used ? Number(paymentST.card.amount) || 0 : 0) +
    (paymentST.creditNote.used ? Number(paymentST.creditNote.amount) || 0 : 0)

  const totalCostoST = Number(stk.total) || 0  // 👈 lo que se espera cobrar

  const submitStock = async () => {
    if (!clienteId || !empleadoId || !fechaEntrega) {
      toast({ variant: "destructive", title: "Selecciona cliente, vendedor y fecha" })
      return
    }
    if (!stk.argollaStockId) {
      toast({ variant: "destructive", title: "Indica el ID de la argolla en stock" })
      return
    }

    const total = Number(stk.total)
    if (!total || total <= 0) {
      toast({ variant: "destructive", title: "Indica el total de la venta" })
      return
    }

    if (buildPagoSTK().length === 0) {
      toast({
        variant: "destructive",
        title: "Debes seleccionar al menos una forma de pago",
      })
      return
    }

    // Opcional: que lo pagado cuadre con el total
    if (totalPagadoST !== total) {
      toast({
        variant: "destructive",
        title: "El total pagado no coincide con el total de la venta",
      })
      return
    }

    const payload: CrearArgollaStockRq = {
      clienteId: Number(clienteId),
      empleadoId: Number(empleadoId),
      fechaEntrega: `${fechaEntrega}T19:00:00`,
      argollaStockId: Number(stk.argollaStockId),
      cantidad: Number(stk.cantidad || 1),
      total,                                  // 👈 AQUÍ VA EL TOTAL
      formaPago: deriveFormaPago(paymentST),
      detallePago: buildPagoSTK(),
      ...(stk.descripcionEspecial?.trim() ? { descripcionEspecial: stk.descripcionEspecial } : {}),
      notaCreditoIdUsada: paymentST.creditNote.used
        ? Number((paymentST.creditNote.noteId || "0").replace(/^NC-/i, "")) || null
        : null,
    }

    try {
      const url = `${process.env.NEXT_PUBLIC_REACT_BASE_LOCAL}${process.env.NEXT_PUBLIC_API_ARGOLLAS_STOCK}`
      const http = USE_PUBLIC_AXIOS ? axios : axiosInstance
      console.log("[v0] Submitting STOCK to:", url)
      const { data } = await http.post(url, payload)
      toast({ title: "Venta de Argolla de stock registrada" })
      const id = data?.id
      if (id)
        window.open(
          `${process.env.NEXT_PUBLIC_REACT_BASE_LOCAL}${process.env.NEXT_PUBLIC_API_ARGOLLAS_PDF}/${id}`,
          "_blank",
        )
      router.push("/hechuras-argollas")
    } catch (e) {
      console.error("[v0] Error al registrar STOCK:", e)
      toast({ variant: "destructive", title: "Error al registrar" })
    }
  }
  
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center gap-4">
        <Link href="/hechuras-argollas">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Nueva Hechura Argolla / Stock</h2>
      </div>

      <Tabs defaultValue="sp">
        <TabsList>
          <TabsTrigger value="sp">Hechura Argolla (SOBREPEDIDO)</TabsTrigger>
          <TabsTrigger value="st">Argolla de Stock (VENTA)</TabsTrigger>
        </TabsList>

        <TabsContent value="sp" className="mt-4 grid gap-4 md:grid-cols-2">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Datos & Pago</CardTitle>
              <CardDescription>Campos alineados a tu JSON</CardDescription>
            </CardHeader>

            <CardContent className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Fecha entrega</Label>
                <Input
                  type="date"
                  min={minDate}
                  value={fechaEntrega}
                  onChange={(e) => setFechaEntrega(e.target.value)}
                />
              </div>
              <div>
                <Label>Vendedor</Label>
                <Select value={empleadoId} onValueChange={setEmpleadoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {empleados.map((e: any) => (
                      <SelectItem key={e.id} value={String(e.id)}>
                        {e.nombreCompleto ?? e.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cliente</Label>
                <ClienteSelector value={clienteId} onValueChange={setClienteId} vendedorId={empleadoId} />
              </div>

              <Separator className="md:col-span-3" />

              {[
                ["Modelo", "modelo"],
                ["Kilataje", "kilataje"],
                ["Milímetros (mm)", "mm"],
                ["Tipo de acabado", "tipoAcabado"],
                ["Talla Caballero", "tallaCaballero"],
                ["Talla Dama", "tallaDama"],
                ["Grabado Caballero", "grabadoCaballero"],
                ["Grabado Dama", "grabadoDama"],
              ].map(([label, key]) => (
                <div key={key as string}>
                  <Label>{label}</Label>
                  <Input
                    value={(sp as any)[key as string]}
                    onChange={(e) => setSp((s) => ({ ...s, [key as string]: e.target.value }))}
                  />
                </div>
              ))}

              <div className="md:col-span-3">
                <Label>Descripción especial</Label>
                <Input
                  value={sp.descripcionEspecial}
                  onChange={(e) => setSp((s) => ({ ...s, descripcionEspecial: e.target.value }))}
                />
              </div>

              <div>
                <Label>Total</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={sp.total}
                  onChange={(e) => setSp((s) => ({ ...s, total: e.target.value }))}
                />
              </div>

              <div className="md:col-span-3">
                <Card className="mt-2">
                  <CardHeader>
                    <CardTitle className="text-base">Detalle de Pago</CardTitle>
                    <CardDescription>Selecciona las formas de pago</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DetallePago
                      paymentMethods={paymentSP}
                      totalCosto={totalCostoST}  
                      totalPago={totalPagadoSP}
                      onChange={handlePaymentChangeSP}
                      validationChecks={[]}
                    />
                  </CardContent>
                </Card>
              </div>
            </CardContent>

            <CardFooter>
              <Button className="w-full" onClick={submitSobrepedido}>
                Registrar Sobrepedido
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="st" className="mt-4 grid gap-4 md:grid-cols-2">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Venta de Argolla de Stock</CardTitle>
              <CardDescription>El total lo calcula el sistema con el stock</CardDescription>
            </CardHeader>

            <CardContent className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Fecha entrega</Label>
                <Input
                  type="date"
                  min={minDate}
                  value={fechaEntrega}
                  onChange={(e) => setFechaEntrega(e.target.value)}
                />
              </div>
              <div>
                <Label>Vendedor</Label>
                <Select value={empleadoId} onValueChange={setEmpleadoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {empleados.map((e: any) => (
                      <SelectItem key={e.id} value={String(e.id)}>
                        {e.nombreCompleto ?? e.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cliente</Label>
                <ClienteSelector value={clienteId} onValueChange={setClienteId} vendedorId={empleadoId} />
              </div>

              <Separator className="md:col-span-3" />

              <div>
                <Label>ID Argolla en stock</Label>
                <Input
                  value={stk.argollaStockId}
                  onChange={(e) => setStk((s) => ({ ...s, argollaStockId: e.target.value }))}
                />
              </div>
              <div>
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  value={stk.cantidad}
                  onChange={(e) => setStk((s) => ({ ...s, cantidad: e.target.value }))}
                />
              </div>
              <div>
                <Label>Total</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={stk.total}
                  onChange={(e) => setStk((s) => ({ ...s, total: e.target.value }))}
                />
              </div>

              <div className="md:col-span-3">
                <Label>Descripción especial</Label>
                <Input
                  value={stk.descripcionEspecial}
                  onChange={(e) => setStk((s) => ({ ...s, descripcionEspecial: e.target.value }))}
                />
              </div>

              <div className="md:col-span-3">
                <Card className="mt-2">
                  <CardHeader>
                    <CardTitle className="text-base">Detalle de Pago</CardTitle>
                    <CardDescription>El total final lo valida el backend</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DetallePago
                      paymentMethods={paymentST}
                      totalCosto={0}
                      totalPago={totalPagadoST}
                      onChange={handlePaymentChangeST}
                      validationChecks={[]}
                    />
                  </CardContent>
                </Card>
              </div>
            </CardContent>

            <CardFooter>
              <Button className="w-full" onClick={submitStock}>
                Registrar Venta de Stock
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
