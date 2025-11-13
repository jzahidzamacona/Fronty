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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, Plus, Trash2, AlertTriangle } from "lucide-react"
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
  barcodes: string[]
}

export default function NuevoApartadoPage() {
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
  const [employees, setEmployees] = useState<{ id: number; nombreCompleto: string }[]>([])
  const [selectedCreditNoteAmount, setSelectedCreditNoteAmount] = useState<number | null>(null)

  // Estado para el diálogo de confirmación
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState(false)

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
      if (p.barcode) {
        const bc = p.barcode
        if (prev.some((line) => line.barcodes.includes(bc))) {
          toast({ title: "Código repetido", description: `El código ${bc} ya fue agregado.`, variant: "destructive" })
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

  const calculateTotal = () => calculateSubtotal()
  const abonoMinimo = calculateTotal() * 0.1

  const getTotalPayment = () =>
    (paymentMethods.cash.used ? paymentMethods.cash.amount : 0) +
    (paymentMethods.card.used ? paymentMethods.card.amount : 0) +
    (paymentMethods.creditNote.used ? paymentMethods.creditNote.amount : 0)

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
      creditNote: { ...paymentMethods.creditNote, noteId, amount: 0 },
    })
    if (!isNaN(id)) {
      try {
        const res = await axiosInstance.get(`/api/notas-credito/${id}`)
        const disponible = res.data.creditoRestante
        setSelectedCreditNoteAmount(disponible)
        setPaymentMethods((prev) => ({
          ...prev,
          creditNote: { ...prev.creditNote, noteId, amount: disponible },
        }))
      } catch {
        toast({
          title: "Nota no encontrada",
          description: "No se encontró la nota de crédito.",
          variant: "destructive",
        })
        setSelectedCreditNoteAmount(null)
      }
    }
  }

  // Validaciones
  const anyPaymentSelected = paymentMethods.cash.used || paymentMethods.card.used || paymentMethods.creditNote.used
  const basicDataComplete = selectedCustomer && selectedEmployee && selectedProducts.length > 0
  const totalPayment = getTotalPayment()
  const isUnderMinimum = totalPayment < abonoMinimo && totalPayment >= 0

  const processSubmit = async () => {
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
      abonoInicial: getTotalPayment(),
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
      detalles: selectedProducts.map((p) => ({ joyaId: p.id, cantidad: p.quantity })),
    }

    try {
      setPendingSubmit(true)
      const response = await axiosInstance.post("/api/apartados", payload)
      toast({ title: "Apartado registrado", description: "El apartado se guardó exitosamente." })
      const nuevoId = response.data.id
      window.open(`${process.env.NEXT_PUBLIC_REACT_BASE_LOCAL}/api/pdf/apartado/${nuevoId}`, "_blank")
      router.push("/apartados")
    } catch (error) {
      console.error("Error al registrar el apartado:", error)
      toast({ title: "Error", description: "Ocurrió un error al guardar el apartado.", variant: "destructive" })
    } finally {
      setPendingSubmit(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones básicas
    if (!basicDataComplete) {
      toast({
        title: "Datos incompletos",
        description: "Selecciona cliente, vendedor y al menos un producto.",
        variant: "destructive",
      })
      return
    }

    if (!anyPaymentSelected) {
      toast({
        title: "Forma de pago requerida",
        description: "Debes seleccionar al menos una forma de pago.",
        variant: "destructive",
      })
      return
    }

    // Si el pago es menor al mínimo, mostrar confirmación
    if (isUnderMinimum && totalPayment > 0) {
      setShowConfirmDialog(true)
      return
    }

    // Si el pago es 0, mostrar confirmación especial
    if (totalPayment === 0) {
      setShowConfirmDialog(true)
      return
    }

    // Si el pago cumple con el mínimo, proceder directamente
    await processSubmit()
  }

  const handleConfirmSubmit = async () => {
    setShowConfirmDialog(false)
    await processSubmit()
  }

  const getConfirmationMessage = () => {
    if (totalPayment === 0) {
      return "¿Estás seguro de que quieres crear el apartado sin abono inicial? El cliente no está pagando nada por adelantado."
    }
    return `¿Estás seguro de que quieres continuar con el apartado? El cliente abonará $${totalPayment.toFixed(2)} que es menos del 10% mínimo recomendado ($${abonoMinimo.toFixed(2)}).`
  }

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 p-4 pt-6 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/apartados">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Nuevo Apartado</h2>
      </div>

      <form onSubmit={handleSubmit}>
        {/* grilla más holgada y con columnas reales */}
        <div className="grid gap-6 md:grid-cols-12">
          {/* Col principal */}
          <Card className="md:col-span-7 lg:col-span-8">
            <CardHeader className="space-y-2">
              <CardTitle>Información del Apartado</CardTitle>
              <CardDescription>Ingresa los datos del cliente, vendedor y productos</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Cabecera */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha</Label>
                  <Input id="date" value={currentDate} disabled />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employee">Vendedor</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger id="employee">
                      <SelectValue placeholder="Seleccionar vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((e) => (
                        <SelectItem key={e.id} value={e.id.toString()}>
                          {e.nombreCompleto}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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

              {/* Productos */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Productos</Label>
                  <ProductSelector onSelectProduct={handleAddProduct} />
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="*:[&>th]:py-3">
                        <TableHead>ID</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead />
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
                          <TableRow key={index} className="*:[&>td]:py-3">
                            <TableCell>{product.code}</TableCell>
                            <TableCell className="max-w-[320px] truncate">{product.name}</TableCell>
                            <TableCell>${product.price.toFixed(2)}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                value={product.quantity}
                                onChange={(e) => handleQuantityChange(index, Number(e.target.value) || 1)}
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              ${(product.price * product.quantity).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
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
                  className="w-full bg-transparent"
                  onClick={() => document.getElementById("product-selector-trigger")?.click()}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar otra joya
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Aside (sticky para que no "brinque") */}
          <Card className="md:col-span-5 lg:col-span-4 lg:sticky lg:top-20 h-fit">
            <CardHeader className="space-y-1">
              <CardTitle>Detalle de Abono</CardTitle>
              <CardDescription>Selecciona las formas de pago (puede ser $0)</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">
                Abono mínimo recomendado (10%): ${abonoMinimo.toFixed(2)}
              </div>

              {/* Métodos de pago */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={paymentMethods.cash.used}
                      onChange={(e) => handlePaymentMethodChange("cash", e.target.checked)}
                    />
                    Pago con efectivo (puede ser $0)
                  </label>
                  {paymentMethods.cash.used && (
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Monto en efectivo"
                      value={paymentMethods.cash.amount === 0 ? "" : paymentMethods.cash.amount.toString()}
                      onChange={(e) => handlePaymentAmountChange("cash", Number.parseFloat(e.target.value) || 0)}
                    />
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={paymentMethods.card.used}
                      onChange={(e) => handlePaymentMethodChange("card", e.target.checked)}
                    />
                    Pago con tarjeta (puede ser $0)
                  </label>
                  {paymentMethods.card.used && (
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Monto con tarjeta"
                      value={paymentMethods.card.amount === 0 ? "" : paymentMethods.card.amount.toString()}
                      onChange={(e) => handlePaymentAmountChange("card", Number.parseFloat(e.target.value) || 0)}
                    />
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={paymentMethods.creditNote.used}
                      onChange={(e) => handlePaymentMethodChange("creditNote", e.target.checked)}
                    />
                    Pago con nota de crédito (puede ser $0)
                  </label>
                  {paymentMethods.creditNote.used && (
                    <div className="space-y-2">
                      <Input
                        type="text"
                        placeholder="Ej. NC-8"
                        value={paymentMethods.creditNote.noteId}
                        onChange={(e) => handleCreditNoteChange(e.target.value)}
                      />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Monto a usar"
                        value={
                          paymentMethods.creditNote.amount === 0 ? "" : paymentMethods.creditNote.amount.toString()
                        }
                        onChange={(e) =>
                          handlePaymentAmountChange("creditNote", Number.parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="rounded-md bg-muted/30 p-3 text-sm space-y-1">
                <div>Total del apartado: ${calculateTotal().toFixed(2)}</div>
                <div>Abono mínimo recomendado (10%): ${abonoMinimo.toFixed(2)}</div>
                <div>Total abonado: ${getTotalPayment().toFixed(2)}</div>
                <div className="font-semibold">
                  Saldo pendiente: ${(calculateTotal() - getTotalPayment()).toFixed(2)}
                </div>
                {isUnderMinimum && totalPayment > 0 && (
                  <div className="text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Abono menor al 10% recomendado
                  </div>
                )}
                {totalPayment === 0 && anyPaymentSelected && (
                  <div className="text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Sin abono inicial
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={!basicDataComplete || !anyPaymentSelected || pendingSubmit}
              >
                {pendingSubmit ? "Procesando..." : "Completar Apartado"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>

      {/* Diálogo de confirmación */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmar Apartado
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">{getConfirmationMessage()}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar y Revisar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit} className="bg-amber-600 hover:bg-amber-700">
              Sí, Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
