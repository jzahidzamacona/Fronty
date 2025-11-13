"use client"

import { useState, useEffect } from "react"
import axiosInstance from "./axiosInstance"

interface MonthSummary {
  hechurasTotalMes: number
  hechurasPendientesMes: number
  hechurasSaldadasMes: number
  relojesTotalMes: number
  relojesPendientesMes: number
  relojesSaldadosMes: number
}

export function useMonthSummary(year: number, month: number) {
  const [summary, setSummary] = useState<MonthSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await axiosInstance.get("/api/calendario/resumen-mes", {
          params: { year, month },
        })

        console.log("Month summary response:", response.data)
        setSummary(response.data)
      } catch (err: any) {
        console.error("Error fetching month summary:", err)
        setError(err.message || "Error al cargar el resumen mensual")
        setSummary(null)
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [year, month])

  return { summary, loading, error }
}
