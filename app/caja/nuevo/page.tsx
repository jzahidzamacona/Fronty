import type { Metadata } from "next"
import { NuevoCajaForm } from "@/components/caja/nuevo-caja-form"

export const metadata: Metadata = {
  title: "Nuevo Registro de Caja | Joyería Sistema",
  description: "Registrar monto inicial de caja",
}

export default function NuevoCajaPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nuevo Registro de Caja</h1>
        <p className="text-muted-foreground">Registra el monto inicial de caja para el día</p>
      </div>
      <NuevoCajaForm />
    </div>
  )
}
