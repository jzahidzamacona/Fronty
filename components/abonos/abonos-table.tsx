"use client"

import { useEffect, useState } from "react"
import axiosInstance from "@/hooks/axiosInstance"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Printer } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { AbonoResumen } from "@/app/abonos/types"

/* ================== Tipos & helpers ================== */

type FiltroTipo = "APARTADO" | "HECHURA" | "HECHURA_ARGOLLA" | "RELOJ"

interface AbonosTableProps {
  filter?: FiltroTipo
}

const prefijo = (t: FiltroTipo | string) =>
  t === "APARTADO" ? "AA" :
  t === "HECHURA" ? "AH" :
  t === "HECHURA_ARGOLLA" ? "HARG" : "AR"

const API_TIPO_TO_KEY: Record<FiltroTipo, "apartado" | "hechura" | "hechuraArgolla" | "reloj"> = {
  APARTADO: "apartado",
  HECHURA: "hechura",
  HECHURA_ARGOLLA: "hechuraArgolla",
  RELOJ: "reloj",
}

const determinarMetodoPago = (efectivo: number, tarjeta: number, notaCredito: number): string => {
  const tipos = [efectivo > 0, tarjeta > 0, notaCredito > 0].filter(Boolean).length
  if (tipos > 1) return "MIXTO"
  if (efectivo > 0) return "EFECTIVO"
  if (tarjeta > 0) return "TARJETA"
  if (notaCredito > 0) return "NOTA CRÉDITO"
  return "SIN PAGO"
}

/* ================== Componente ================== */

export function AbonosTable({ filter }: AbonosTableProps) {
  const [data, setData] = useState<AbonoResumen[]>([])
  const [searchId, setSearchId] = useState("")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [loading, setLoading] = useState(false)

  // fechas por defecto (ayer → hoy)
  useEffect(() => {
    const hoy = new Date()
    const ayer = new Date()
    ayer.setDate(hoy.getDate() - 1)
    setFechaInicio(ayer.toISOString().split("T")[0])
    setFechaFin(hoy.toISOString().split("T")[0])
  }, [])

  // cargar por rango al montar
  useEffect(() => {
    if (fechaInicio && fechaFin) buscarAbonos(fechaInicio, fechaFin)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaInicio, fechaFin])

  /** Construye una fila de resumen usando un abono y consulta detalle de la nota */
  const construirResumen = async (abono: any): Promise<AbonoResumen> => {
    const { data: detalle } = await axiosInstance.get(`/api/abonos/${abono.tipoNota}/${abono.notaId}`)

    const key = API_TIPO_TO_KEY[abono.tipoNota as FiltroTipo] ?? "apartado"
    const nota = detalle?.[key]
      ?? detalle?.hechuraArgolla
      ?? detalle?.hechura
      ?? detalle?.apartado
      ?? detalle?.reloj
      ?? {}

    let cliente = nota?.cliente ?? detalle?.cliente ?? null
    let empleado = nota?.empleado ?? detalle?.empleado ?? null

    // fallbacks si solo vienen IDs
    if (!cliente && nota?.clienteId) {
      try { const { data } = await axiosInstance.get(`/api/clientes/${nota.clienteId}`); cliente = data } catch {}
    }
    if (!empleado && nota?.empleadoId) {
      try { const { data } = await axiosInstance.get(`/api/empleados/${nota.empleadoId}`); empleado = data } catch {}
    }

    const efectivo = (abono.detallePago ?? [])
      .filter((p: any) => p.metodo === "EFECTIVO")
      .reduce((acc: number, p: any) => acc + (p.monto ?? 0), 0)
    const tarjeta = (abono.detallePago ?? [])
      .filter((p: any) => p.metodo === "TARJETA")
      .reduce((acc: number, p: any) => acc + (p.monto ?? 0), 0)
    const notaCredito = (abono.detallePago ?? [])
      .filter((p: any) => p.metodo === "NOTA_CREDITO")
      .reduce((acc: number, p: any) => acc + (p.monto ?? 0), 0)

    return {
      id: abono.id,
      fecha: abono.fecha,
      tipoNota: abono.tipoNota as FiltroTipo,
      notaId: abono.notaId,
      cliente: cliente ? [cliente.nombre, cliente.apellidoPaterno, cliente.apellidoMaterno].filter(Boolean).join(" ") : "",
      telefono: cliente?.telefono ?? "",
      vendedor: empleado ? [empleado.nombre, empleado.apellidoPaterno, empleado.apellidoMaterno].filter(Boolean).join(" ") : "",
      total: Number(nota.total ?? 0),
      formaPago: determinarMetodoPago(efectivo, tarjeta, notaCredito),
      primerAbono: Number(nota.montoInicial ?? 0),
      efectivo,
      tarjeta,
      notaCredito,
      restante: Number(nota.montoRestante ?? detalle?.restante ?? 0),
      ultimoAbono: Number(abono.monto ?? 0),
    }
  }

  /** Búsqueda por rango de fechas */
  const buscarAbonos = async (inicio: string, fin: string) => {
    setLoading(true)
    try {
      const { data: abonos } = await axiosInstance.get(`/api/abonos`, {
        params: { fechaInicio: `${inicio}T00:00:00`, fechaFin: `${fin}T23:59:59` },
      })
      const resumenes = await Promise.all(abonos.map((a: any) => construirResumen(a)))
      setData(resumenes)
    } catch (e) {
      console.error("Error al buscar abonos:", e)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  /** Búsqueda directa por ID de nota (AA-15, AH-4, HARG-2, HA-7, AR-10…) */
  const buscarPorIdNota = async () => {
    if (!searchId.trim()) return
    setLoading(true)
    try {
      const norm = searchId.trim().toUpperCase()
      const match = norm.match(/^(AA|AH|AR|HARG|HA)-?(\d+)$/)

      let tipoNota: FiltroTipo | undefined = filter
      let notaId = parseInt(searchId, 10)

      if (match) {
        const tag = match[1]
        notaId = parseInt(match[2], 10)
        tipoNota = tag === "AA" ? "APARTADO"
                : tag === "AH" ? "HECHURA"
                : tag === "AR" ? "RELOJ"
                : "HECHURA_ARGOLLA"
      }

      if (!tipoNota || isNaN(notaId)) return

      const { data: detalle } = await axiosInstance.get(`/api/abonos/${tipoNota}/${notaId}`)
      const key = API_TIPO_TO_KEY[tipoNota]

      const nota = detalle?.[key]
        ?? detalle?.hechuraArgolla
        ?? detalle?.hechura
        ?? detalle?.apartado
        ?? detalle?.reloj
        ?? {}

      const cliente = nota?.cliente ?? detalle?.cliente ?? {}
      const vendedor = nota?.empleado ?? detalle?.empleado ?? {}

      // acepta distintos nombres para “historial”
      const historial: any[] = detalle?.historial ?? detalle?.abonos ?? detalle?.lista ?? []

      let resumenes: AbonoResumen[]

      if (historial.length === 0) {
        // si no hay historial, mostramos una fila sintética con la info de la nota
        resumenes = [{
          id: 0,
          fecha: nota.fechaCreacion ?? new Date().toISOString(),
          tipoNota,
          notaId,
          cliente: [cliente.nombre, cliente.apellidoPaterno, cliente.apellidoMaterno].filter(Boolean).join(" "),
          telefono: cliente.telefono,
          vendedor: [vendedor.nombre, vendedor.apellidoPaterno, vendedor.apellidoMaterno].filter(Boolean).join(" "),
          total: Number(nota.total ?? 0),
          formaPago: "SIN PAGO",
          primerAbono: Number(nota.montoInicial ?? 0),
          efectivo: 0,
          tarjeta: 0,
          notaCredito: 0,
          restante: Number(nota.montoRestante ?? detalle?.restante ?? 0),
          ultimoAbono: Number(detalle?.ultimoAbono ?? 0),
        }]
      } else {
        resumenes = historial.map((abono: any) => {
          const efectivo = (abono.detallePago ?? []).filter((p:any)=>p.metodo==="EFECTIVO").reduce((a:number,p:any)=>a+(p.monto??0),0)
          const tarjeta  = (abono.detallePago ?? []).filter((p:any)=>p.metodo==="TARJETA").reduce((a:number,p:any)=>a+(p.monto??0),0)
          const ncred    = (abono.detallePago ?? []).filter((p:any)=>p.metodo==="NOTA_CREDITO").reduce((a:number,p:any)=>a+(p.monto??0),0)

          return {
            id: abono.id,
            fecha: abono.fecha,
            tipoNota,
            notaId,
            cliente: [cliente.nombre, cliente.apellidoPaterno, cliente.apellidoMaterno].filter(Boolean).join(" "),
            telefono: cliente.telefono,
            vendedor: [vendedor.nombre, vendedor.apellidoPaterno, vendedor.apellidoMaterno].filter(Boolean).join(" "),
            total: Number(nota.total ?? 0),
            formaPago: determinarMetodoPago(efectivo, tarjeta, ncred),
            primerAbono: Number(nota.montoInicial ?? 0),
            efectivo,
            tarjeta,
            notaCredito: ncred,
            restante: Number(nota.montoRestante ?? detalle?.restante ?? 0),
            ultimoAbono: Number(abono.monto ?? detalle?.ultimoAbono ?? 0),
          } as AbonoResumen
        })
      }

      setData(resumenes)
    } catch (e) {
      console.error("Error al buscar por ID:", e)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = data.filter((a) => !filter || a.tipoNota === filter)

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <Input
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          placeholder="Selecciona el área y busca por ID (ej. AA-15, AH-4, HARG-2, HA-7, AR-10)"
          className="h-8 w-[320px]"
        />
        <Button className="h-8" onClick={buscarPorIdNota}>Buscar por ID</Button>
      </div>

      <div className="flex gap-2 items-center flex-wrap">
        <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="h-8 w-[150px]" />
        <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="h-8 w-[150px]" />
        <Button onClick={() => buscarAbonos(fechaInicio, fechaFin)}>Buscar</Button>
      </div>

      <div className="rounded-md border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {[
                "Número de Abono", "Fecha", "Tipo", "ID Nota", "Cliente", "Teléfono",
                "Vendedor", "Total", "Pago", "Primer abono", "Efectivo", "Tarjeta",
                "Nota crédito", "Restante", "Último abono", "Acciones"
              ].map((heading, i) => (
                <TableHead key={i} className={`px-4 py-2 ${heading === "Acciones" ? "text-right" : ""}`}>{heading}</TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={16} className="text-center py-4">
                  {loading ? "Cargando abonos..." : "No se encontraron resultados."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((a) => (
                <TableRow key={`${a.tipoNota}-${a.id}-${a.notaId}`}>
                  <TableCell className="px-4 py-2">{`${prefijo(a.tipoNota)}-${a.id}`}</TableCell>
                  <TableCell className="px-4 py-2">{new Date(a.fecha).toLocaleDateString("es-MX")}</TableCell>

                  <TableCell className="px-4 py-2">
                    <Badge variant="outline" className={
                      a.tipoNota === "APARTADO" ? "bg-green-100 text-green-800" :
                      a.tipoNota === "HECHURA" ? "bg-blue-100 text-blue-800" :
                      a.tipoNota === "HECHURA_ARGOLLA" ? "bg-amber-100 text-amber-800" :
                      "bg-purple-100 text-purple-800"
                    }>
                      {a.tipoNota}
                    </Badge>
                  </TableCell>

                  <TableCell className="px-4 py-2">{a.notaId}</TableCell>
                  <TableCell className="px-4 py-2">{a.cliente}</TableCell>
                  <TableCell className="px-4 py-2">{a.telefono}</TableCell>
                  <TableCell className="px-4 py-2">{a.vendedor}</TableCell>
                  <TableCell className="px-4 py-2">${a.total.toFixed(2)}</TableCell>
                  <TableCell className="px-4 py-2">{a.formaPago}</TableCell>
                  <TableCell className="px-4 py-2">${a.primerAbono.toFixed(2)}</TableCell>
                  <TableCell className="px-4 py-2">${a.efectivo.toFixed(2)}</TableCell>
                  <TableCell className="px-4 py-2">${a.tarjeta.toFixed(2)}</TableCell>
                  <TableCell className="px-4 py-2">${a.notaCredito.toFixed(2)}</TableCell>
                  <TableCell className="px-4 py-2">${a.restante.toFixed(2)}</TableCell>
                  <TableCell className="px-4 py-2">${a.ultimoAbono.toFixed(2)}</TableCell>

                  <TableCell className="px-4 py-2 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <a
                            href={`${process.env.NEXT_PUBLIC_REACT_BASE_LOCAL}/api/abonos/ticket/${a.tipoNota}/${a.notaId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center"
                          >
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimir PDF
                          </a>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
