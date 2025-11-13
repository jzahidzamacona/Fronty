"use client"

import { useState, useEffect } from "react"
import axiosInstance from "./axiosInstance"

export interface DeliveryItem {
  id: string
  folio: string
  cliente: string
  descripcion: string
  fechaEntrega: string
  tipo: "hechura" | "reloj"
  estado: string
  total: number
  montoInicial?: number
  montoRestante?: number
  telefono?: string
  observaciones?: string
  tipoDePieza?: string
  marca?: string
  tiposDePieza?: string[]
  marcas?: string[]
}

interface CalendarData {
  hechuras: DeliveryItem[]
  relojes: DeliveryItem[]
  loading: boolean
  error: string | null
}

export function useCalendarData(selectedMonth: Date) {
  const [data, setData] = useState<CalendarData>({
    hechuras: [],
    relojes: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    const fetchCalendarData = async () => {
      setData((prev) => ({ ...prev, loading: true, error: null }))

      try {
        const year = selectedMonth.getFullYear()
        const month = selectedMonth.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)

        const inicio = `${firstDay.toISOString().split("T")[0]}T00:00:00`
        const fin = `${lastDay.toISOString().split("T")[0]}T23:59:59`

        const baseUrl = process.env.NEXT_PUBLIC_REACT_BASE_LOCAL || ""
        const urlHechuras = `${baseUrl}${process.env.NEXT_PUBLIC_MSO_API_HECHURA || "/api/hechuras"}`
        const urlRelojes = `${baseUrl}${process.env.NEXT_PUBLIC_API_RELOJES || "/api/relojes"}`

        console.log("Fetching hechuras from:", urlHechuras)
        console.log("Fetching relojes from:", urlRelojes)
        console.log("Date range:", { inicio, fin })

        let hechuras: DeliveryItem[] = []
        let relojes: DeliveryItem[] = []

        // ---------- HECHURAS ----------
        try {
          const res = await axiosInstance.get(urlHechuras, {
            params: urlHechuras.endsWith("/rango") ? { inicio, fin } : {},
          })

          console.log("Hechuras raw response:", res.data)

          let items: any[] = []
          if (Array.isArray(res.data)) items = res.data
          else if (res.data?.items) items = res.data.items
          else if (res.data?.content) items = res.data.content
          else if (res.data?.data) items = res.data.data
          else if (res.data?.hechuras) items = res.data.hechuras

          console.log(`Found ${items.length} hechuras total`)

          const itemsWithDate = items.filter(
            (it) => it.fechaDeEntrega || it.fechaEntrega || it.fechaPromesa || it.fechaPrometida,
          )
          console.log(`Found ${itemsWithDate.length} hechuras with delivery dates`)

          hechuras = itemsWithDate.map((it) => {
            const clienteNombre = it.cliente?.nombre
              ? `${it.cliente.nombre} ${it.cliente.apellidoPaterno ?? ""} ${it.cliente.apellidoMaterno ?? ""}`.trim()
              : (it.nombreCliente ?? "Cliente no especificado")

            const tiposArr: string[] = Array.isArray(it.detalles)
              ? it.detalles.map((d: any) => d?.tipoDePieza).filter(Boolean)
              : []

            const descArr: string[] = Array.isArray(it.detalles)
              ? it.detalles
                  .map((d: any) => d?.descripcionEspecial || d?.descripcionPiezaRecibida)
                  .filter((v: any) => !!v && String(v).trim() !== "")
              : []
            const descripcion = descArr.join(", ")

            const fechaEntrega = it.fechaDeEntrega || it.fechaEntrega || it.fechaPromesa || it.fechaPrometida

            const total = Number(it.total ?? it.precio ?? it.monto ?? 0)
            const montoInicial = Number(it.montoInicial ?? 0)
            const montoRestante = Number(it.montoRestante ?? total - montoInicial)

            const telefono =
              (it.cliente?.telefono ?? it.telefono ?? it.clienteTelefono ?? "").toString().trim() || undefined

            return {
              id: (it.id ?? it.idHechura ?? Math.random()).toString(),
              folio: it.folio || `H-${it.id ?? it.idHechura}`,
              cliente: clienteNombre,
              descripcion,
              fechaEntrega,
              tipo: "hechura" as const,
              estado: it.estado || it.estatus || "Pendiente",
              total,
              montoInicial,
              montoRestante,
              telefono,
              observaciones: it.observaciones ?? it.notas,
              tipoDePieza: tiposArr[0],
              tiposDePieza: tiposArr,
            }
          })
        } catch (e) {
          console.error("Error fetching hechuras:", e)
        }

        // ---------- RELOJES ----------
        try {
          const res = await axiosInstance.get(urlRelojes, {
            params: urlRelojes.endsWith("/rango") ? { inicio, fin } : {},
          })

          console.log("Relojes raw response:", res.data)

          let items: any[] = []
          if (Array.isArray(res.data)) items = res.data
          else if (res.data?.items) items = res.data.items
          else if (res.data?.content) items = res.data.content
          else if (res.data?.data) items = res.data.data
          else if (res.data?.relojes) items = res.data.relojes

          console.log(`Found ${items.length} relojes total`)

          const itemsWithDate = items.filter(
            (it) => it.fechaDeEntrega || it.fechaEntrega || it.fechaPromesa || it.fechaPrometida,
          )
          console.log(`Found ${itemsWithDate.length} relojes with delivery dates`)

          relojes = itemsWithDate.map((it) => {
            const clienteNombre = it.cliente?.nombre
              ? `${it.cliente.nombre} ${it.cliente.apellidoPaterno ?? ""} ${it.cliente.apellidoMaterno ?? ""}`.trim()
              : (it.nombreCliente ?? "Cliente no especificado")

            const marcasArr: string[] = Array.isArray(it.detalles)
              ? it.detalles.map((d: any) => d?.marca).filter(Boolean)
              : []

            const descArr: string[] = Array.isArray(it.detalles)
              ? it.detalles
                  .map((d: any) => d?.observaciones || d?.condicionRecibida)
                  .filter((v: any) => !!v && String(v).trim() !== "")
              : []
            const descripcion = descArr.join(", ")

            const fechaEntrega = it.fechaDeEntrega || it.fechaEntrega || it.fechaPromesa || it.fechaPrometida

            const total = Number(it.total ?? it.precio ?? it.monto ?? 0)
            const montoInicial = Number(it.montoInicial ?? 0)
            const montoRestante = Number(it.montoRestante ?? total - montoInicial)

            const telefono =
              (it.cliente?.telefono ?? it.telefono ?? it.clienteTelefono ?? "").toString().trim() || undefined

            return {
              id: (it.id ?? it.idReloj ?? Math.random()).toString(),
              folio: it.folio || `R-${it.id ?? it.idReloj}`,
              cliente: clienteNombre,
              descripcion,
              fechaEntrega,
              tipo: "reloj" as const,
              estado: it.estado || it.estatus || "Pendiente",
              total,
              montoInicial,
              montoRestante,
              telefono,
              observaciones: it.observaciones ?? it.notas,
              marca: marcasArr[0],
              marcas: marcasArr,
            }
          })
        } catch (e) {
          console.error("Error fetching relojes:", e)
        }

        console.log(`Final results: ${hechuras.length} hechuras, ${relojes.length} relojes`)

        setData({ hechuras, relojes, loading: false, error: null })
      } catch (err: any) {
        console.error("Error in fetchCalendarData:", err)
        setData((prev) => ({
          ...prev,
          loading: false,
          error: err.response?.data?.message || err.message || "Error al cargar el calendario",
        }))
      }
    }

    fetchCalendarData()
  }, [selectedMonth])

  return data
}

export async function getRestanteFromAbonos(
  tipo: "HECHURA" | "RELOJ",
  notaId: string | number,
): Promise<number | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_REACT_BASE_LOCAL || ""
    const endpoint = `${baseUrl}/api/abonos/${tipo}/${notaId}`

    console.log(`Fetching restante from: ${endpoint}`)

    const response = await axiosInstance.get(endpoint)

    console.log(`Restante response for ${tipo} ${notaId}:`, response.data)

    // El campo restante está en la raíz de la respuesta
    return Number(response.data?.restante ?? null)
  } catch (error: any) {
    console.error(`Error fetching restante for ${tipo} ${notaId}:`, error)
    if (error?.response?.status === 401) {
      console.warn("Error de autenticación al obtener restante")
    }
    return null
  }
}
