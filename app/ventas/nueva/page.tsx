"use client"

import type React from "react"
import axiosInstance from "@/hooks/axiosInstance"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { ProductSelector } from "@/components/ventas/product-selector"
import { ClienteSelector } from "@/components/ventas/cliente-selector"
import { useToast } from "@/components/ui/use-toast"

type ProductLine = {
  id: number
  code: string
  name: string
  kilataje: string
  price: number
  stock: number
  quantity: number
  barcodes: string[] // 👈 ya no es opcional
}

export default function NuevaVentaPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [selectedProducts, setSelectedProducts] = useState<ProductLine[]>([])
  const [paymentMethods, setPaymentMethods] = useState({
    cash: { used: false, amount: 0 },
    card: { used: false, amount: 0, lastDigits: "" },
    creditNote: { used: false, amount: 0, noteId: "" },
  })

  const [discount, setDiscount] = useState(0)
  const [employees, setEmployees] = useState<{ id: number; nombreCompleto: string }[]>([])
  const [selectedCreditNoteAmount, setSelectedCreditNoteAmount] = useState<number | null>(null)

  const currentDate = new Date().toLocaleDateString("es-MX")

  const fetchEmpleados = async () => {
    try {
      const response = await axiosInstance.get("/api/empleados")
      setEmployees(response.data)
    } catch (error) {
      console.error("Error al cargar empleados:", error)
    }
  }

  useEffect(() => {
    fetchEmpleados()
  }, [])

  const handleAddProduct = (p: {
    id: number
    code: string
    name: string
    kilataje: string
    price: number
    stock: number
    barcode?: string
  }) => {
    setSelectedProducts((prev) => {
      // 👇 Narrow explícito
      if (p.barcode) {
        const bc = p.barcode
        if (prev.some((line) => line.barcodes.includes(bc))) {
          toast({
            title: "Código repetido",
            description: `El código ${bc} ya fue agregado.`,
            variant: "destructive",
          })
          return prev
        }
      }

      const idx = prev.findIndex((line) => line.id === p.id)
      if (idx !== -1) {
        const next = [...prev]
        const line = { ...next[idx] }
        line.quantity += 1
        if (p.barcode) line.barcodes = [...line.barcodes, p.barcode]
        next[idx] = line
        return next
      }

      const nueva: ProductLine = {
        id: p.id,
        code: p.code,
        name: p.name,
        kilataje: p.kilataje,
        price: p.price,
        stock: p.stock,
        quantity: 1,
        barcodes: p.barcode ? [p.barcode] : [],
      }
      return [...prev, nueva]
    })
  }

  const handleRemoveProduct = (index: number) => {
    const newProducts = [...selectedProducts]
    newProducts.splice(index, 1)
    setSelectedProducts(newProducts)
  }

  const handleQuantityChange = (index: number, quantity: number) => {
    const newProducts = [...selectedProducts]
    newProducts[index].quantity = quantity
    setSelectedProducts(newProducts)
  }

  const calculateSubtotal = () =>
    selectedProducts.reduce((total, product) => total + product.price * product.quantity, 0)

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const descuentoEnPesos = discount > 0 ? subtotal * (discount / 100) : 0
    return subtotal - descuentoEnPesos
  }

  const getTotalPayment = () =>
    (paymentMethods.cash.used ? paymentMethods.cash.amount : 0) +
    (paymentMethods.card.used ? paymentMethods.card.amount : 0) +
    (paymentMethods.creditNote.used ? paymentMethods.creditNote.amount : 0)
  // ───────────────── VALIDADORES DERIVADOS (ANTES DEL return) ─────────────────
  const toMoney = (n: number) => Number((n ?? 0).toFixed(2))

  const hasBasics = selectedProducts.length > 0 && !!selectedCustomer && !!selectedEmployee

  const productsOk = selectedProducts.every((p) => {
    const qtyOk = Number(p.quantity) >= 1
    const codesOk = p.barcodes.length === 0 || p.barcodes.length === Number(p.quantity)
    return qtyOk && codesOk
  })

  const discountOk = discount >= 0 && discount <= 100

  const creditNoteOk = !paymentMethods.creditNote.used
    ? true
    : paymentMethods.creditNote.noteId.trim().length > 0 &&
      !isNaN(Number(paymentMethods.creditNote.noteId.replace("NC-", ""))) &&
      (selectedCreditNoteAmount == null || paymentMethods.creditNote.amount <= selectedCreditNoteAmount)

  const subtotal = toMoney(calculateSubtotal())
  const total = toMoney(calculateTotal())
  const paid = toMoney(getTotalPayment())
  const totalsOk = paid === total // igualdad exacta, como exige tu backend

  const hasAnyPayment =
    (paymentMethods.cash.used && paymentMethods.cash.amount > 0) ||
    (paymentMethods.card.used && paymentMethods.card.amount > 0) ||
    (paymentMethods.creditNote.used && paymentMethods.creditNote.amount > 0)

  const canSubmit = hasBasics && productsOk && hasAnyPayment && discountOk && creditNoteOk && totalsOk
  // ─────────────────────────────────────────────────────────────────────────────

  const handlePaymentMethodChange = (method: "cash" | "card" | "creditNote", used: boolean) => {
    setPaymentMethods({ ...paymentMethods, [method]: { ...paymentMethods[method], used } })
  }

  const handlePaymentAmountChange = (method: "cash" | "card" | "creditNote", amount: number) => {
    setPaymentMethods({ ...paymentMethods, [method]: { ...paymentMethods[method], amount } })
  }

  const handleCreditNoteChange = async (noteId: string) => {
    const id = Number(noteId.replace("NC-", ""))
    setPaymentMethods({
      ...paymentMethods,
      creditNote: {
        ...paymentMethods.creditNote,
        noteId,
        amount: 0,
      },
    })
    if (!isNaN(id)) {
      try {
        const res = await axiosInstance.get(`/api/notas-credito/${id}`)
        const disponible = res.data.creditoRestante
        setSelectedCreditNoteAmount(disponible)
        setPaymentMethods((prev) => ({
          ...prev,
          creditNote: {
            ...prev.creditNote,
            noteId,
            amount: disponible,
          },
        }))
      } catch (error) {
        toast({
          title: "Nota no encontrada",
          description: "No se encontró la nota de crédito.",
          variant: "destructive",
        })
        setSelectedCreditNoteAmount(null)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedCustomer || !selectedEmployee || selectedProducts.length === 0) {
      toast({
        title: "Datos incompletos",
        description: "Selecciona cliente, vendedor y al menos un producto.",
        variant: "destructive",
      })
      return
    }

    const activeMethods = Object.entries(paymentMethods).filter(([_, method]) => method.used)
    if (activeMethods.length === 0) {
      toast({
        title: "Forma de pago requerida",
        description: "Debes seleccionar al menos una forma de pago.",
        variant: "destructive",
      })
      return
    }
    for (const p of selectedProducts) {
      if (p.barcodes.length > 0 && p.barcodes.length !== p.quantity) {
        toast({
          title: "Revisa cantidades",
          description: `La joya ${p.code} tiene ${p.barcodes.length} códigos, pero cantidad ${p.quantity}.`,
          variant: "destructive",
        })
        return
      }
    }
    const { cash, card, creditNote } = paymentMethods
    const formaPago =
      cash.used && card.used && creditNote.used
        ? "COMBINADO"
        : (cash.used && card.used) || (cash.used && creditNote.used) || (card.used && creditNote.used)
          ? "MIXTO"
          : cash.used
            ? "EFECTIVO"
            : card.used
              ? "TARJETA"
              : creditNote.used
                ? "NOTA_CREDITO"
                : ""

    const payload = {
      clienteId: Number(selectedCustomer),
      empleadoId: Number(selectedEmployee),
      creadorId: Number(selectedEmployee),
      formaPago,
      ...(discount > 0 && { descuento: discount }),
      detallePago: [
        ...(cash.used ? [{ metodo: "EFECTIVO", monto: cash.amount }] : []),
        ...(card.used ? [{ metodo: "TARJETA", monto: card.amount }] : []),
        ...(creditNote.used
          ? [
              {
                metodo: "NOTA_CREDITO",
                monto: creditNote.amount,
                idReferencia: Number(creditNote.noteId.replace("NC-", "")),
              },
            ]
          : []),
      ],
      detalles: selectedProducts.map((p) => ({
        joyaId: p.id,
        cantidad: p.quantity,
        codigos: p.barcodes,
      })),
    }

    try {
      const res = await axiosInstance.post("/api/ventas", payload)
      const ventaId = res.data.id

      toast({
        title: "Venta registrada",
        description: "La venta se guardó exitosamente.",
      })

      // Abrir el PDF generado en una nueva pestaña
      window.open(`${process.env.NEXT_PUBLIC_REACT_BASE_LOCAL}/api/pdf/venta/${ventaId}`, "_blank")

      router.push("/ventas")
    } catch (error) {
      console.error("Error al registrar la venta:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar la venta.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center gap-4">
        <Link href="/ventas">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Nueva Venta</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="md:col-span-2 lg:col-span-2">
            <CardHeader>
              <CardTitle>Información de la Venta</CardTitle>
              <CardDescription>Ingresa los datos del cliente, vendedor y productos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha</Label>
                  <Input id="date" value={currentDate} disabled />
                </div>

                {/* 🟢 Vendedor a la izquierda */}
                <div className="space-y-2">
                  <Label htmlFor="employee">Vendedor</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger id="employee">
                      <SelectValue placeholder="Seleccionar vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
                          {employee.nombreCompleto}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 🟢 Cliente y botón al lado derecho */}
                <div className="space-y-2">
                  <Label htmlFor="customer">Cliente</Label>
                  <div className="flex gap-2">
                    <ClienteSelector
                      value={selectedCustomer}
                      onValueChange={setSelectedCustomer}
                      vendedorId={selectedEmployee}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Productos</Label>
                  <ProductSelector onSelectProduct={handleAddProduct} />
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            No hay productos seleccionados.
                          </TableCell>
                        </TableRow>
                      ) : (
                        selectedProducts.map((product, index) => (
                          <TableRow key={index}>
                            <TableCell>{product.code}</TableCell>
                            <TableCell>{product.name}</TableCell>
                            <TableCell>${product.price.toFixed(2)}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                value={product.quantity}
                                onChange={(e) => handleQuantityChange(index, Number(e.target.value) || 1)}
                                className="w-16"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              ${(product.price * product.quantity).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => handleRemoveProduct(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-2 bg-transparent"
                  onClick={() => document.getElementById("product-selector-trigger")?.click()}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar otra joya
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalle de Pago</CardTitle>
              <CardDescription>Selecciona las formas de pago</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 🟢 Mueve el descuento al principio */}
              <div>
                <Label>Descuento (%)</Label>
                <Input
                  type="number"
                  placeholder="Ej. 10"
                  value={discount === 0 ? "" : discount.toString()}
                  onChange={(e) => {
                    const value = e.target.value
                    const parsed = Number.parseFloat(value)
                    setDiscount(isNaN(parsed) ? 0 : parsed)
                  }}
                />
              </div>

              <Separator />

              {/* Métodos de pago */}
              <div className="space-y-4">
                <Label>
                  <input
                    type="checkbox"
                    checked={paymentMethods.cash.used}
                    onChange={(e) => handlePaymentMethodChange("cash", e.target.checked)}
                  />{" "}
                  Pago con efectivo
                </Label>
                {paymentMethods.cash.used && (
                  <Input
                    type="number"
                    value={paymentMethods.cash.amount === 0 ? "" : paymentMethods.cash.amount.toString()}
                    onChange={(e) => handlePaymentAmountChange("cash", Number.parseFloat(e.target.value) || 0)}
                  />
                )}
                <Separator />

                <Label>
                  <input
                    type="checkbox"
                    checked={paymentMethods.card.used}
                    onChange={(e) => handlePaymentMethodChange("card", e.target.checked)}
                  />{" "}
                  Pago con tarjeta
                </Label>
                {paymentMethods.card.used && (
                  <Input
                    type="number"
                    value={paymentMethods.card.amount === 0 ? "" : paymentMethods.card.amount.toString()}
                    onChange={(e) => handlePaymentAmountChange("card", Number.parseFloat(e.target.value) || 0)}
                  />
                )}

                <Separator />

                <Label>
                  <input
                    type="checkbox"
                    checked={paymentMethods.creditNote.used}
                    onChange={(e) => handlePaymentMethodChange("creditNote", e.target.checked)}
                  />{" "}
                  Pago con nota de crédito
                </Label>
                {paymentMethods.creditNote.used && (
                  <>
                    <Input
                      type="text"
                      placeholder="Ej. 8"
                      value={paymentMethods.creditNote.noteId}
                      onChange={(e) => handleCreditNoteChange(e.target.value)}
                    />
                    <Input
                      type="number"
                      value={paymentMethods.creditNote.amount === 0 ? "" : paymentMethods.creditNote.amount.toString()}
                      onChange={(e) => handlePaymentAmountChange("creditNote", Number.parseFloat(e.target.value) || 0)}
                    />
                  </>
                )}
              </div>

              <Separator />

              <div className="text-sm space-y-1">
                <div>Subtotal: ${calculateSubtotal().toFixed(2)}</div>
                {discount > 0 && (
                  <div className="text-green-600">
                    Descuento: -${(calculateSubtotal() * (discount / 100)).toFixed(2)}
                  </div>
                )}
                <div className="font-semibold">Total: ${calculateTotal().toFixed(2)}</div>
                <div>Total pagado: ${getTotalPayment().toFixed(2)}</div>
                {getTotalPayment() !== calculateTotal() && (
                  <div className="text-red-500">Diferencia: ${(calculateTotal() - getTotalPayment()).toFixed(2)}</div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={!canSubmit}>
                Completar Venta
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  )
}
