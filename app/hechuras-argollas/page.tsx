// app/hechuras-argollas/page.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import axiosInstance from "@/hooks/axiosInstance"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { mapDtoToResumen } from "./mappers"
import type { ArgollaDTO, ArgollaResumen } from "./types"
import { ArgollasTable } from "@/components/hechuras-argollas/argollastable"

export default function HechurasArgollasPage() {
  const [rows, setRows] = useState<ArgollaResumen[]>([])
  const [serverSearch, setServerSearch] = useState<ArgollaResumen[] | null>(null)
  const [q, setQ] = useState("")

  // Usa la env o el fallback plano SIN querystring
  const ultimas =
    process.env.NEXT_PUBLIC_API_ARGOLLAS_ULTIMAS ?? "/api/hechuras-argolla"

  // Carga inicial (lista)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        // si algún día quieres filtrar por estado, usa:
        // const { data } = await axiosInstance.get<ArgollaDTO[]>(ultimas, { params: { estado: "EN_PROCESO" } })
        const { data } = await axiosInstance.get<ArgollaDTO[]>(ultimas)
        if (cancelled) return
        const list = (Array.isArray(data) ? data : []).map(mapDtoToResumen)
        setRows(list)
      } catch {
        if (!cancelled) setRows([])
      }
    })()
    return () => { cancelled = true }
  }, [ultimas])

  // Búsqueda por ID (cuando q sea numérico exacto)
  useEffect(() => {
    const term = q.trim()
    if (term === "" || !/^\d+$/.test(term)) {
      setServerSearch(null) // volvemos a filtrar local
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const { data } = await axiosInstance.get<ArgollaDTO>(`/api/hechuras-argolla/${Number(term)}`)
        if (cancelled) return
        const item = data ? [mapDtoToResumen(data)] : []
        setServerSearch(item)
      } catch {
        if (!cancelled) setServerSearch([]) // no encontrado
      }
    })()

    return () => { cancelled = true }
  }, [q])

  // Filtrado local (cuando NO estamos en modo “búsqueda por ID”)
  const filteredLocal = useMemo(() => {
    const t = q.toLowerCase()
    if (!t) return rows
    return rows.filter(r =>
      r.cliente.toLowerCase().includes(t) ||
      r.empleado.toLowerCase().includes(t) ||
      r.descripcion.toLowerCase().includes(t) ||
      String(r.id) === t
    )
  }, [q, rows])

  const tableData = serverSearch === null ? filteredLocal : serverSearch

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Hechuras Argollas</h2>
        <Button asChild>
          <Link href="/hechuras-argollas/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva
          </Link>
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente/vendedor/descripción… o ID exacto"
          value={q}
          onChange={(e)=>setQ(e.target.value)}
          className="h-8 w-[260px] lg:w-[320px]"
        />
      </div>

      <ArgollasTable data={tableData} />
    </div>
  )
}
