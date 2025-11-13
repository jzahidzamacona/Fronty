"use client"

import { WeeklyBar, ReporteDiario } from "./WeeklyBar"

const totalAbonos = (rep?: ReporteDiario | null) => {
  if (!rep) return 0
  if (rep.abonos?.length) {
    return rep.abonos.reduce(
      (s, a) => s + Number(a.montoEfectivo || 0) + Number(a.montoTarjeta || 0),
      0
    )
  }
  return Number(rep.totalAbonosEfectivo || 0) + Number(rep.totalAbonosTarjeta || 0)
}

export function AbonosOverview() {
  return <WeeklyBar pickTotal={totalAbonos} color="#14b8a6" />
}
