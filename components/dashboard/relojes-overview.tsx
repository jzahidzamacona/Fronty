"use client"

import { WeeklyBar, ReporteDiario } from "./WeeklyBar"

const totalRelojes = (rep?: ReporteDiario | null) => {
  if (!rep) return 0
  if (rep.relojes?.length) {
    return rep.relojes.reduce(
      (s, r) => s + Number(r.montoEfectivo || 0) + Number(r.montoTarjeta || 0),
      0
    )
  }
  return Number(rep.totalRelojesEfectivo || 0) + Number(rep.totalRelojesTarjeta || 0)
}

export function RelojesOverview() {
  return <WeeklyBar pickTotal={totalRelojes} color="#3b82f6" />
}
