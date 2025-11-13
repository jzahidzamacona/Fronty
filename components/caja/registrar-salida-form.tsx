"use client"

import axiosInstance from "@/hooks/axiosInstance"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { DollarSign } from "lucide-react"

// ✅ Modal (shadcn)
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const formSchema = z.object({
  monto: z.string().min(1, { message: "El monto es requerido" }),
  motivo: z.string().min(3, { message: "El motivo debe tener al menos 3 caracteres" }),
  empleadoId: z.string().min(1, { message: "Selecciona un empleado" }),
})

const currency = (n: number) =>
  n.toLocaleString("es-MX", { style: "currency", currency: "MXN" })

export function RegistrarSalidaForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [empleados, setEmpleados] = useState<{ id: number; nombreCompleto: string }[]>([])

  // 🔔 Modal de confirmación
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmInfo, setConfirmInfo] = useState<{
    monto: number
    motivo: string
    empleado?: string
    folio?: string
  } | null>(null)

  useEffect(() => {
    axiosInstance.get("/api/empleados")
      .then((res) => setEmpleados(res.data))
      .catch((err) => {
        console.error("Error al obtener empleados", err)
        toast({
          title: "Error",
          description: "No se pudieron cargar los empleados",
          variant: "destructive",
        })
      })
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { monto: "", motivo: "", empleadoId: "" },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      const payload = {
        montoSalida: parseFloat(values.monto),
        motivo: values.motivo,
        creadoPor: parseInt(values.empleadoId),
      }

      const res = await axiosInstance.post("/api/caja/salida", payload)

      // Busca el nombre del empleado para el modal
      const empleadoName = empleados.find(e => e.id === Number(values.empleadoId))?.nombreCompleto

      // Guarda datos para el modal de confirmación
      setConfirmInfo({
        monto: parseFloat(values.monto),
        motivo: values.motivo,
        empleado: empleadoName,
        folio: res?.data?.id ? `SAL-${res.data.id}` : undefined, // opcional si tu API regresa id
      })
      setConfirmOpen(true)

      // Limpia el formulario
      form.reset()
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "No se pudo registrar la salida de efectivo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="monto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="0.00"
                      className="pl-10"
                      {...field}
                      type="number"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="motivo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Motivo *</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Compra de material" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="empleadoId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empleado *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar empleado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {empleados.map((empleado) => (
                      <SelectItem key={empleado.id} value={empleado.id.toString()}>
                        {empleado.nombreCompleto}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Registrando..." : "Registrar Salida"}
          </Button>
        </form>
      </Form>

      {/* ✅ Modal de confirmación */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Salida registrada</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmInfo
                ? `Se realizó la salida por ${currency(confirmInfo.monto)}.`
                : "La salida se registró correctamente."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {confirmInfo && (
            <div className="text-sm space-y-1">
              {confirmInfo.folio && <div><span className="font-medium">Folio:</span> {confirmInfo.folio}</div>}
              <div><span className="font-medium">Motivo:</span> {confirmInfo.motivo}</div>
              {confirmInfo.empleado && (
                <div><span className="font-medium">Empleado:</span> {confirmInfo.empleado}</div>
              )}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogAction autoFocus>Entendido</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
