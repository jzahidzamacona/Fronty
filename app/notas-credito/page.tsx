"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import axiosInstance from "@/hooks/axiosInstance"
import { NotasCreditoTable } from "@/components/notas-credito/notas-credito-table"
import type { NotaCreditoResumen } from "./types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

type OrigenTipo = "VENTA" | "APARTADO" | "HECHURA" | "RELOJ"

const BASE = (process.env.NEXT_PUBLIC_API_NOTAS_CREDITO || "/api/notas-credito").replace(/\/+$/, "")

export default function NotasCreditoPage() {
  const { toast } = useToast()

  // Tabla (últimas / búsqueda por id)
  const [base10, setBase10] = useState<NotaCreditoResumen[]>([])
  const [vista, setVista] = useState<NotaCreditoResumen[]>([])
  const [search, setSearch] = useState("")
  const reqCounter = useRef(0)

  // ---- Nuevo: búsqueda por ORIGEN ----
  const [origenTipo, setOrigenTipo] = useState<OrigenTipo>("VENTA")
  const [origenIdInput, setOrigenIdInput] = useState<string>("")
  const [loadingOrigen, setLoadingOrigen] = useState(false)

  // Cargar últimas 10
  useEffect(() => {
    const run = async () => {
      try {
        const { data } = await axiosInstance.get<NotaCreditoResumen[]>(`${BASE}/ultimas`)
        const arr = (Array.isArray(data) ? data : []).slice(0, 10)
        setBase10(arr)
        setVista(arr)
      } catch (e) {
        console.error("[NOTAS-CREDITO] Error ultimas:", e)
        setBase10([])
        setVista([])
      }
    }
    run()
  }, [])

  // Buscar por ID de nota de crédito
  useEffect(() => {
    const q = search.trim()
    if (q === "") {
      setVista(base10)
      return
    }
    if (!/^\d+$/.test(q)) {
      setVista([])
      return
    }

    const myReq = ++reqCounter.current
    const fetchById = async (id: number) => {
      try {
        const { data } = await axiosInstance.get<NotaCreditoResumen>(`${BASE}/${id}`)
        if (reqCounter.current !== myReq) return
        setVista([data])
      } catch {
        if (reqCounter.current !== myReq) return
        setVista([])
      }
    }
    fetchById(Number(q))
  }, [search, base10])

  // Acción: buscar por ORIGEN -> trae notaId -> luego trae la nota
  const buscarPorOrigen = async () => {
    const idNum = Number(origenIdInput)
    if (!idNum || Number.isNaN(idNum) || idNum <= 0) {
      toast({ title: "ID inválido", description: "Escribe un ID de nota origen válido.", variant: "destructive" })
      return
    }

    setLoadingOrigen(true)
    try {
      // 1) Resumen por origen: /api/notas-credito/resumen/{TIPO}/{idOrigen}
      const urlResumen = `${BASE}/resumen/${origenTipo}/${idNum}`
      const { data: resumen } = await axiosInstance.get<{ notaId?: number }>(urlResumen)

      const notaId = Number(resumen?.notaId ?? 0)
      if (!notaId) {
        toast({
          title: "Sin nota de crédito",
          description: `No existe nota de crédito para ${origenTipo} #${idNum}.`,
          variant: "destructive",
        })
        setVista([])
        return
      }

      // 2) Con notaId, traemos la nota y la mostramos en la tabla
      const { data: nota } = await axiosInstance.get<NotaCreditoResumen>(`${BASE}/${notaId}`)
      setVista([nota])
    } catch (e) {
      console.error("[NOTAS-CREDITO] Buscar por Nota de origen:", e)
      toast({
        title: "Error al buscar",
        description: "No se pudo obtener la nota por origen. Verifica los datos.",
        variant: "destructive",
      })
      setVista([])
    } finally {
      setLoadingOrigen(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Notas de Crédito</h2>
        <Link href="/notas-credito/nueva">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Nota de Crédito
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Notas de Crédito</CardTitle>
          <CardDescription>Vacío: últimos 10 · Número: busca por ID exacto</CardDescription>

          {/* Buscador 1: por ID de nota de crédito */}
          <div className="mt-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Escribe ID de Nota de Crédito (p. ej. 69)…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-[260px] lg:w-[320px] rounded-md border px-3 text-sm outline-none"
            />
          </div>

          {/* Buscador 2: por ORIGEN (nuevo) */}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="text-sm text-muted-foreground">Buscar por nota de origen:</span>

            <Select value={origenTipo} onValueChange={(v) => setOrigenTipo(v as OrigenTipo)}>
              <SelectTrigger className="h-8 w-[160px]">
                <SelectValue placeholder="Tipo de origen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VENTA">VENTA</SelectItem>
                <SelectItem value="APARTADO">APARTADO</SelectItem>
                <SelectItem value="HECHURA">HECHURA</SelectItem>
                <SelectItem value="RELOJ">RELOJ</SelectItem>
              </SelectContent>
            </Select>

            <input
              type="number"
              min={1}
              placeholder="ID nota origen (p. ej. 55)…"
              value={origenIdInput}
              onChange={(e) => setOrigenIdInput(e.target.value)}
              className="h-8 w-[200px] rounded-md border px-3 text-sm outline-none"
            />

            <Button size="sm" onClick={buscarPorOrigen} disabled={loadingOrigen}>
              {loadingOrigen ? "Buscando…" : "Buscar por origen"}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <NotasCreditoTable data={vista} />
        </CardContent>
      </Card>
    </div>
  )
}
