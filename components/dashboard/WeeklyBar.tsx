"use client"

import { useEffect, useMemo, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import axiosInstance from "@/hooks/axiosInstance"

// ===== Tipos mínimos del reporte =====
type Linea = { montoEfectivo?: number | null; montoTarjeta?: number | null }
export type ReporteDiario = {
  fecha: string
  ventas?: Linea[]
  apartados?: Linea[]
  hechuras?: Linea[]
  relojes?: Linea[]
  abonos?: Linea[]

  totalVentasEfectivo?: number
  totalVentasTarjeta?: number

  totalApartadosEfectivo?: number
  totalApartadosTarjeta?: number

  totalHechurasEfectivo?: number
  totalHechurasTarjeta?: number

  totalRelojesEfectivo?: number
  totalRelojesTarjeta?: number

  totalAbonosEfectivo?: number
  totalAbonosTarjeta?: number
}

const dayShort = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

const toLocalISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`

const mondayOfWeek = (d: Date) => {
  const x = new Date(d)
  const dow = (x.getDay() + 6) % 7 // 0 = lunes
  x.setDate(x.getDate() - dow)
  x.setHours(0,0,0,0)
  return x
}

const unwrap = (raw: any): ReporteDiario | null => {
  const looks = (o: any) =>
    o && typeof o === "object" &&
    ("ventas" in o || "apartados" in o || "hechuras" in o || "relojes" in o || "abonos" in o)
  if (looks(raw)) return raw
  if (raw?.data && looks(raw.data)) return raw.data
  if (raw?.reporte && looks(raw.reporte)) return raw.reporte
  if (raw && typeof raw === "object") {
    for (const k of Object.keys(raw)) if (looks(raw[k])) return raw[k]
  }
  return null
}

type Serie = { name: string; total: number }

export function WeeklyBar({
  pickTotal,
  color = "#3b82f6", // azul por defecto
}: {
  /** cómo obtener el total (solo EFECTIVO+TARJETA) para un día */
  pickTotal: (rep?: ReporteDiario | null) => number
  /** color de la barra */
  color?: string
}) {
  const [series, setSeries] = useState<Serie[]>(dayShort.map((n) => ({ name: n, total: 0 })))

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const monday = mondayOfWeek(new Date())
      const fechas = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday)
        d.setDate(monday.getDate() + i)
        return toLocalISO(d)
      })

      const results = await Promise.all(
        fechas.map((f) =>
          axiosInstance
            .get("/api/reporte-diario", { params: { fecha: f } })
            .then(r => unwrap(r.data))
            .catch(() => null)
        )
      )

      if (!cancelled) {
        setSeries(results.map((rep, i) => ({ name: dayShort[i], total: pickTotal(rep) })))
      }
    }
    load()
    return () => { cancelled = true }
  }, [pickTotal])

  const formatter = useMemo(
    () => (v: number) => [`$${Number(v).toLocaleString("es-MX")}`, "Total"],
    []
  )

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={series}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
        <Tooltip formatter={formatter} labelFormatter={(l) => `Día: ${l}`} />
        <Bar dataKey="total" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
