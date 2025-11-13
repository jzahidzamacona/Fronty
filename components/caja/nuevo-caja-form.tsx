// NuevoCajaForm.tsx
"use client"

import axiosInstance from "@/hooks/axiosInstance"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarSign } from "lucide-react"
import { format } from "date-fns"

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
  montoInicial: z.string().min(1, { message: "El monto inicial es requerido" }),
  motivoAdicional: z.string().optional(),
  empleadoId: z.string({ required_error: "El empleado es requerido" }),
})

const currency = (n: number) =>
  n.toLocaleString("es-MX", { style: "currency", currency: "MXN" })

export function NuevoCajaForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [empleados, setEmpleados] = useState<{ id: number; nombreCompleto: string }[]>([])
  const [aperturasHoy, setAperturasHoy] = useState<number | null>(null)
  const router = useRouter()

  // 🟢 Modal de confirmación
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmInfo, setConfirmInfo] = useState<{
    titulo: string
    monto: number
    empleado?: string
    folio?: string
  } | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { montoInicial: "", motivoAdicional: "", empleadoId: "" },
  })

  useEffect(() => {
    // Empleados
    axiosInstance
      .get(process.env.NEXT_PUBLIC_MSO_API_EMPLEADO || "/api/empleados")
      .then((res) => setEmpleados(res.data))
      .catch(() =>
        toast({
          title: "Error",
          description: "No se pudieron cargar los empleados.",
          variant: "destructive",
        })
      )

    // Estado de aperturas del día
    const fetchAperturas = async () => {
      try {
        const hoy = format(new Date(), "yyyy-MM-dd")
        const cajaApi = process.env.NEXT_PUBLIC_MSO_API_CAJA || "/api/caja"
        const { data } = await axiosInstance.get(`${cajaApi}/corte-diario/detallado?fecha=${hoy}`)
        const count = (data?.detalle ?? []).filter((m: any) =>
          String(m.tipo).toLowerCase().includes("apertura")
        ).length
        setAperturasHoy(count)
      } catch {
        setAperturasHoy(0)
      }
    }
    fetchAperturas()
  }, [])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    const cajaApi = process.env.NEXT_PUBLIC_MSO_API_CAJA || "/api/caja"

    try {
      // Revalida en el submit
      const hoy = format(new Date(), "yyyy-MM-dd")
      const res = await axiosInstance.get(`${cajaApi}/corte-diario/detallado?fecha=${hoy}`)
      const aperturas = (res.data?.detalle ?? []).filter((m: any) =>
        String(m.tipo).toLowerCase().includes("apertura")
      )

      if (aperturas.length >= 2) {
        toast({
          title: "Ya no es posible",
          description: "Ya se registraron dos aperturas hoy.",
          variant: "destructive",
        })
        return
      }

      const esSegunda = aperturas.length === 1
      const motivo = esSegunda
        ? `Apertura 2: ${values.motivoAdicional || ""}`.trim()
        : "Apertura"

      const payload = {
        montoEntrada: parseFloat(values.montoInicial),
        motivo,
        cajaId: null,
        creadoPor: parseInt(values.empleadoId),
      }

      const post = await axiosInstance.post(`${cajaApi}/abrir`, payload)

      // Prepara datos para el modal
      const empleadoName = empleados.find((e) => e.id === Number(values.empleadoId))?.nombreCompleto
      setConfirmInfo({
        titulo: esSegunda ? "Apertura 2 registrada" : "Apertura registrada",
        monto: parseFloat(values.montoInicial),
        empleado: empleadoName,
        folio: post?.data?.id ? `AP-${post.data.id}` : undefined,
      })
      setConfirmOpen(true)

      // Limpia y actualiza estado local
      form.reset()
      setAperturasHoy((prev) => (prev == null ? 1 : prev + 1))
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Ocurrió un error al registrar la apertura.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const habilitarMotivo = aperturasHoy === 1

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Registro de Apertura de Caja</CardTitle>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="montoInicial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto Inicial *</FormLabel>
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
                name="motivoAdicional"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo adicional (solo para Apertura 2)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={
                          habilitarMotivo
                            ? "Ej: Se olvidó la apertura anterior"
                            : "Se habilita en la 2ª apertura"
                        }
                        disabled={!habilitarMotivo}
                        title={
                          !habilitarMotivo
                            ? "Este campo solo se utiliza en la segunda apertura del día"
                            : ""
                        }
                      />
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
                        {empleados.map((e) => (
                          <SelectItem key={e.id} value={e.id.toString()}>
                            {e.nombreCompleto}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>

            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar Apertura"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {/* ✅ Modal de confirmación */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmInfo?.titulo ?? "Apertura registrada"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmInfo
                ? `Se registró una apertura por ${currency(confirmInfo.monto)}.`
                : "La apertura se registró correctamente."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {confirmInfo && (
            <div className="text-sm space-y-1">
              {confirmInfo.folio && (
                <div>
                  <span className="font-medium">Folio:</span> {confirmInfo.folio}
                </div>
              )}
              {confirmInfo.empleado && (
                <div>
                  <span className="font-medium">Empleado:</span> {confirmInfo.empleado}
                </div>
              )}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogAction
              autoFocus
              onClick={() => {
                // redirige al cerrar el modal
                router.push("/caja")
                router.refresh()
              }}
            >
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
