import type { Metadata } from "next"
import { ReporteDiario } from "@/components/caja/reporte-diario"

export const metadata: Metadata = {
  title: "Reporte Diario de Caja | Joyería Sistema",
  description: "Reporte detallado de caja diaria",
}

export default function ReporteCajaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reporte Diario de Caja</h1>
        <p className="text-muted-foreground">Visualiza el reporte detallado de caja del día</p>
      </div>
      <ReporteDiario />
    </div>
  )
}
