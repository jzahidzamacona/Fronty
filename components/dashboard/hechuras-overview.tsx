"use client"

import { WeeklyBar, ReporteDiario } from "./WeeklyBar"

const totalHechuras = (rep?: ReporteDiario | null) => {
  if (!rep) return 0
  if (rep.hechuras?.length) {
    return rep.hechuras.reduce(
      (s, h) => s + Number(h.montoEfectivo || 0) + Number(h.montoTarjeta || 0),
      0
    )
  }
  return Number(rep.totalHechurasEfectivo || 0) + Number(rep.totalHechurasTarjeta || 0)
}

export function HechurasOverview() {
  return <WeeklyBar pickTotal={totalHechuras} color="#8b5cf6" />
}
