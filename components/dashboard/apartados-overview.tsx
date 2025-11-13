"use client"

import { WeeklyBar, ReporteDiario } from "./WeeklyBar"

const totalApartados = (rep?: ReporteDiario | null) => {
  if (!rep) return 0
  if (rep.apartados?.length) {
    return rep.apartados.reduce(
      (s, a) => s + Number(a.montoEfectivo || 0) + Number(a.montoTarjeta || 0),
      0
    )
  }
  return Number(rep.totalApartadosEfectivo || 0) + Number(rep.totalApartadosTarjeta || 0)
}

export function ApartadosOverview() {
  return <WeeklyBar pickTotal={totalApartados} color="#ff9800" />
}
