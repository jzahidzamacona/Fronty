"use client"

import { WeeklyBar, ReporteDiario } from "./WeeklyBar"

const totalVentas = (rep?: ReporteDiario | null) => {
  if (!rep) return 0
  if (rep.ventas?.length) {
    return rep.ventas.reduce(
      (s, v) => s + Number(v.montoEfectivo || 0) + Number(v.montoTarjeta || 0),
      0
    )
  }
  return Number(rep.totalVentasEfectivo || 0) + Number(rep.totalVentasTarjeta || 0)
}

export function SalesOverview() {
  // verde lima como tenías antes
  return <WeeklyBar pickTotal={totalVentas} color="#b6ff2e" />
}
