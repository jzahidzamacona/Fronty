"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import axiosInstance from "@/hooks/axiosInstance"
import { HechurasTable } from "@/components/hechuras/hechuras-table"
import type { HechuraResumen } from "./hechuras-type"

export default function HechurasPage() {
  const [hechurasData, setHechurasData] = useState<HechuraResumen[]>([])
  const [serverSearch, setServerSearch] = useState<HechuraResumen[] | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const mapHechura = (h: any): HechuraResumen => {
    const up = (x: any) => String(x ?? "").toUpperCase()
    const efectivo = h.detallePago?.find((p: any) => up(p.metodo) === "EFECTIVO")?.monto || 0
    const tarjeta = h.detallePago?.find((p: any) => up(p.metodo) === "TARJETA")?.monto || 0
    const notaCredito = h.detallePago?.find((p: any) => up(p.metodo) === "NOTA_CREDITO")?.monto || 0

    return {
      id: h.id,
      date: h.fechaRecibida,
      deliveryDate: h.fechaDeEntrega,
      customer: `${h.cliente?.nombre ?? ""} ${h.cliente?.apellidoPaterno ?? ""} ${h.cliente?.apellidoMaterno ?? ""}`.trim(),
      telefono: h.cliente?.telefono ?? "",
      empleado: `${h.empleado?.nombre ?? ""} ${h.empleado?.apellidoPaterno ?? ""} ${h.empleado?.apellidoMaterno ?? ""}`.trim(),
      descripcionPieza: (h.detalles ?? []).map((d: any) => d.descripcionPiezaRecibida).filter(Boolean).join(" / "),
      descripcionEspecial: (h.detalles ?? []).map((d: any) => d.descripcionEspecial).filter(Boolean).join(" / "),
      total: h.total ?? 0,
      montoInicial: h.montoInicial ?? 0,
      efectivo,
      tarjeta,
      notaCredito,
      formaPago: h.formaPago ?? "",
      restante: h.montoRestante ?? 0,
      pagos: Array.isArray(h.detallePago) ? h.detallePago : [],
    }
  }

  // Carga inicial: últimas
  useEffect(() => {
    const fetchHechuras = async () => {
      try {
        const endpoint = `${process.env.NEXT_PUBLIC_MSO_API_HECHURA}/ultimas`
        const { data } = await axiosInstance.get(endpoint)
        setHechurasData((Array.isArray(data) ? data : []).map(mapHechura))
      } catch (error) {
        console.error("Error al obtener hechuras:", error)
        setHechurasData([])
      }
    }
    fetchHechuras()
  }, [])

  // Búsqueda por ID si el término es numérico
  useEffect(() => {
    const q = searchTerm.trim()

    if (q === "") {
      setServerSearch(null)
      return
    }
    if (!/^\d+$/.test(q)) {
      setServerSearch(null) // se usará filtrado local
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const endpoint = `${process.env.NEXT_PUBLIC_MSO_API_HECHURA}/${Number(q)}`
        const { data } = await axiosInstance.get(endpoint)
        if (!cancelled) setServerSearch([mapHechura(data)])
      } catch {
        if (!cancelled) setServerSearch([]) // no encontrado
      }
    })()

    return () => {
      cancelled = true
    }
  }, [searchTerm])

  // Filtrado local (solo cuando NO estamos en modo búsqueda por ID)
  const filteredLocal = hechurasData.filter((h) => {
    const term = searchTerm.toLowerCase()
    return (
      h.customer.toLowerCase().includes(term) ||
      h.empleado.toLowerCase().includes(term) ||
      h.descripcionPieza.toLowerCase().includes(term)
    )
  })

  const tableData = serverSearch === null ? filteredLocal : serverSearch

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Hechuras</h2>
        <Button asChild>
          <Link href="/hechuras/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Hechura
          </Link>
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente/vendedor/descripción… o ID exacto"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-8 w-[260px] lg:w-[320px]"
        />
      </div>

      {/* Tabla única (sin pestañas) */}
      <HechurasTable data={tableData} />
    </div>
  )
}
