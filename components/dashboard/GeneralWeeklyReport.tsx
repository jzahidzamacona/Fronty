// components/dashboard/GeneralWeeklyReport.tsx
"use client"

import { useEffect, useState } from "react"
import axiosInstance from "@/hooks/axiosInstance"
import { format, startOfWeek, endOfWeek } from "date-fns"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, FileText, Printer } from "lucide-react"

/* ─────────── Tipos ─────────── */
interface Detalle {
  id?: number
  folio?: string
  cliente: string
  total?: number
  formaPago?: string
  metodoPago?: string
  montoEfectivo?: number | null
  montoTarjeta?: number | null
  montoNotaCredito?: number | null
}
interface Joya {
  id: number
  nombre: string
  kilataje: string
  cantidad: number
  precio: number
  fechaCreacion: string
}
interface JoyaActualizada extends Joya {
  stockAgregado: number
  fechaModificacion: string
}

/** ← keys REALES del backend para notas de crédito */
interface BackendNotaCredito {
  id: number
  nombreCliente: string
  nombreEmpleado?: string
  origenTipo: string
  origenNotaId: number
  totalOriginal: number
  totalDisponible: number
  totalUsado: number
  usada: boolean
  notaCancelada: boolean
  fechaCreacion: string
}

interface Reporte {
  fecha: string
  totalEfectivo: number
  totalTarjeta: number
  totalNotaCredito: number
  totalNotasCreditoGeneradas: number
  totalEnCaja: number

  totalVentas: number
  totalVentasEfectivo: number
  totalVentasTarjeta: number
  totalVentasCredito: number
  ventas: Detalle[]

  totalApartados: number
  totalApartadosEfectivo: number
  totalApartadosTarjeta: number
  totalApartadosCredito: number
  apartados: Detalle[]

  totalHechuras: number
  totalHechurasEfectivo: number
  totalHechurasTarjeta: number
  totalHechurasCredito: number
  hechuras: Detalle[]

  totalRelojes: number
  totalRelojesEfectivo: number
  totalRelojesTarjeta: number
  totalRelojesCredito: number
  relojes: Detalle[]

  totalAbonos: number
  totalAbonosEfectivo: number
  totalAbonosTarjeta: number
  totalAbonosCredito: number
  abonos: Detalle[]

  joyasCreadas: Joya[]
  joyasActualizadas: JoyaActualizada[]
  totalStockEnJoyasCreadas: number
  totalStockEnJoyasActualizadas: number
  totalStockAgregadoDelDia: number

  totalNotasCredito: number
  notasCredito: BackendNotaCredito[] // 👈 usamos las keys reales
}
// Total por fila de ABONOS: solo efectivo + tarjeta (excluye nota de crédito)
const totalAbonoRow = (d: Detalle) => Number(d.montoEfectivo ?? 0) + Number(d.montoTarjeta ?? 0)

/* ─────────── Utils ─────────── */
const money = (n: number | undefined | null) =>
  typeof n === "number" ? n.toLocaleString("es-MX", { style: "currency", currency: "MXN" }) : "—"

const Stat = ({
  title,
  value,
  isMoney = true,
}: {
  title: string
  value: number | string | undefined | null
  isMoney?: boolean
}) => (
  <Card>
    <CardContent className="p-4">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-2xl font-semibold">
        {typeof value === "number" ? (isMoney ? money(value) : value) : (value ?? "—")}
      </p>
    </CardContent>
  </Card>
)

const normalizarFormaPago = (d: Detalle): string => {
  const efectivo = d.montoEfectivo || 0
  const tarjeta = d.montoTarjeta || 0
  const credito = d.montoNotaCredito || 0
  const tipos = [efectivo, tarjeta, credito].filter((m) => m > 0)
  if (tipos.length > 1) return "MIXTO"
  if (efectivo > 0) return "EFECTIVO"
  if (tarjeta > 0) return "TARJETA"
  if (credito > 0) return "NOTA CRÉDITO"
  return "—"
}

/* ─────────── Componente ─────────── */
export function GeneralWeeklyReport() {
  const [data, setData] = useState<Reporte | null>(null)
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState("ventas")

  useEffect(() => {
    const hoy = new Date()
    const desde = format(startOfWeek(hoy, { weekStartsOn: 1 }), "yyyy-MM-dd")
    const hasta = format(endOfWeek(hoy, { weekStartsOn: 1 }), "yyyy-MM-dd")

    axiosInstance
      .get<{ dias: Reporte[] }>("/api/reporte-diario/rango", { params: { desde, hasta } })
      .then((r) => setData(resumirRango(r.data.dias)))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // PDF actions
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const fechaParam = format(weekStart, "yyyy-MM-dd")

  const descargarPdf = async () => {
    try {
      const res = await axiosInstance.get("/api/reporte-semanal/pdf", {
        params: { fecha: fechaParam },
        responseType: "blob",
      })
      const blob = new Blob([res.data], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `reporte_semanal_${fechaParam}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      alert("No se pudo descargar el PDF.")
    }
  }

  const verPdf = () => {
    const base = process.env.NEXT_PUBLIC_REACT_BASE_LOCAL // ej: http://localhost:8080
    const path = process.env.NEXT_PUBLIC_API_REPORTE_SEMANAL_PDF || "/api/reporte-semanal/pdf"
    const url = `${base}${path}?fecha=${fechaParam}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const openAbonoPdf = async (row: any) => {
    try {
      // 1) Saca el id del ABONO desde la fila del reporte
      let abonoId: number | undefined = typeof row.id === "number" ? row.id : undefined

      if (!abonoId) {
        const folio = (row.folio ?? "").toString().toUpperCase().trim()
        const m = folio.match(/^(AA|AH|AR|A|H|R)-?0*([0-9]+)$/)
        if (m) abonoId = Number(m[2])
      }

      if (!abonoId || Number.isNaN(abonoId)) {
        alert("No se pudo determinar el ID del abono desde la fila.")
        return
      }

      // 2) Consulta el listado de abonos de la semana
      const hoy = new Date()
      const desde = format(startOfWeek(hoy, { weekStartsOn: 1 }), "yyyy-MM-dd")
      const hasta = format(endOfWeek(hoy, { weekStartsOn: 1 }), "yyyy-MM-dd")
      const fechaInicio = `${desde}T00:00:00`
      const fechaFin = `${hasta}T23:59:59`

      const { data: abonosDeLaSemana } = await axiosInstance.get(process.env.NEXT_PUBLIC_API_ABONOS || "/api/abonos", {
        params: { fechaInicio, fechaFin },
      })

      const match = (abonosDeLaSemana || []).find((a: any) => Number(a.id) === Number(abonoId))
      if (!match) {
        alert("No se encontró el abono en el listado de la semana.")
        return
      }

      const tipo = String(match.tipoNota || "").toUpperCase() as TipoNota
      const notaId = Number(match.notaId)

      if (!["APARTADO", "HECHURA", "RELOJ"].includes(tipo) || !notaId) {
        alert("El abono encontrado no tiene tipo/notaId válidos.")
        return
      }

      // 3) Pide el PDF con axiosInstance y ábrelo en nueva pestaña
      const ABONOS_PATH = process.env.NEXT_PUBLIC_API_ABONOS || "/api/abonos"
      const { data: blobData } = await axiosInstance.get(`${ABONOS_PATH}/ticket/${tipo}/${notaId}`, {
        responseType: "blob",
      })
      const blob = new Blob([blobData], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank", "noopener,noreferrer")
    } catch (e) {
      console.error(e)
      alert("No se pudo abrir el PDF del abono.")
    }
  }

  const scrollTo = (id: string) => {
    setActive(id)
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth" })
  }

  if (loading) return <p className="py-6 text-muted-foreground">Cargando…</p>
  if (!data) return <p className="py-6 text-red-500">Sin datos.</p>

  // ---- Mapeo de Notas de Crédito + KPIs (semana) ----
  const notas = (data.notasCredito ?? []).map((n) => ({
    id: n.id,
    cliente: n.nombreCliente,
    total: Number(n.totalOriginal ?? 0),
    disponible: Number(n.totalDisponible ?? 0),
    usado: Number(n.totalUsado ?? 0),
    usada: Boolean(n.usada),
    cancelada: Boolean(n.notaCancelada),
    origenTipo: n.origenTipo,
    origenFolio: n.origenNotaId,
    empleado: n.nombreEmpleado,
    fecha: n.fechaCreacion,
  }))
  const sumaGeneradas = notas.reduce((a, n) => a + (n.total || 0), 0)
  const sumaDisponible = notas.reduce((a, n) => a + (n.disponible || 0), 0)

  const sections = [
    {
      id: "ventas",
      title: "Ventas",
      detalles: data.ventas,
      efectivo: data.totalVentasEfectivo,
      tarjeta: data.totalVentasTarjeta,
    },
    {
      id: "apartados",
      title: "Apartados",
      detalles: data.apartados,
      efectivo: data.totalApartadosEfectivo,
      tarjeta: data.totalApartadosTarjeta,
    },
    {
      id: "hechuras",
      title: "Hechuras",
      detalles: data.hechuras,
      efectivo: data.totalHechurasEfectivo,
      tarjeta: data.totalHechurasTarjeta,
    },
    {
      id: "relojes",
      title: "Relojes",
      detalles: data.relojes,
      efectivo: data.totalRelojesEfectivo,
      tarjeta: data.totalRelojesTarjeta,
    },
    {
      id: "abonos",
      title: "Abonos",
      detalles: data.abonos,
      efectivo: data.totalAbonosEfectivo,
      tarjeta: data.totalAbonosTarjeta,
    },
    { id: "notas", title: "Notas de Crédito", total: data.totalNotasCredito, detalles: [] as Detalle[] },
    { id: "stock", title: "Stock", detalles: [] as Detalle[] },
  ]

  return (
    <div className="space-y-6">
      {/* KPIs globales de la semana */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Stat title="Total Efectivo de la Semana" value={data.totalEfectivo} />
        <Stat title="Total Tarjeta de la Semana" value={data.totalTarjeta} />
        <Stat title="Notas de Crédito Generadas" value={data.totalNotasCreditoGeneradas} />
        <Stat title="Total en Caja (Acumulado)" value={data.totalEnCaja} />
      </div>

      <Tabs value={active} onValueChange={scrollTo}>
        <TabsList className="grid grid-cols-7 w-full">
          {sections.map((s) => (
            <TabsTrigger key={s.id} value={s.id}>
              {s.title}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="space-y-10 pb-20">
        {sections.map((sec, idx) => (
          <div key={sec.id} id={`section-${sec.id}`} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{sec.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* STOCK */}
                {sec.id === "stock" && (
                  <>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <Stat title="Stock en Joyas Creadas" value={data.totalStockEnJoyasCreadas} isMoney={false} />
                      <Stat
                        title="Stock en Joyas Actualizadas"
                        value={data.totalStockEnJoyasActualizadas}
                        isMoney={false}
                      />
                      <Stat title="Total Stock Agregado" value={data.totalStockAgregadoDelDia} isMoney={false} />
                    </div>

                    {data.joyasCreadas.length > 0 && (
                      <>
                        <h4 className="font-semibold">Joyas Creadas</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Nombre</TableHead>
                              <TableHead>Kilataje</TableHead>
                              <TableHead>Cantidad</TableHead>
                              <TableHead>Precio</TableHead>
                              <TableHead>Fecha</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.joyasCreadas.map((j) => (
                              <TableRow key={j.id}>
                                <TableCell>{j.id}</TableCell>
                                <TableCell>{j.nombre}</TableCell>
                                <TableCell>{j.kilataje}</TableCell>
                                <TableCell>{j.cantidad}</TableCell>
                                <TableCell>{money(j.precio)}</TableCell>
                                <TableCell>{j.fechaCreacion}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </>
                    )}
                  </>
                )}

                {/* Áreas generales */}
                {["ventas", "apartados", "hechuras", "relojes", "abonos"].includes(sec.id) && !!sec.detalles.length && (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Folio</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Forma de Pago</TableHead>
                          <TableHead>Efectivo</TableHead>
                          <TableHead>Tarjeta</TableHead>
                          <TableHead>Nota Crédito</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sec.detalles.map((d) => (
                          <TableRow key={d.id ?? d.folio}>
                            <TableCell>
                              {sec.id.charAt(0).toUpperCase()}-{(d.id ?? d.folio)?.toString().padStart(4, "0")}
                            </TableCell>
                            <TableCell>{d.cliente}</TableCell>
                            <TableCell>{normalizarFormaPago(d)}</TableCell>
                            <TableCell>{money(d.montoEfectivo)}</TableCell>
                            <TableCell>{money(d.montoTarjeta)}</TableCell>
                            <TableCell>{money(d.montoNotaCredito)}</TableCell>
                            <TableCell>{sec.id === "abonos" ? money(totalAbonoRow(d)) : money(d.total)}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Abrir menú</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>

                                  {/* Ventas */}
                                  {sec.id === "ventas" && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        const ventaId = d.id || d.folio
                                        if (!ventaId) {
                                          console.error("No se encontró ID para la venta")
                                          return
                                        }
                                        const url = `${process.env.NEXT_PUBLIC_REACT_BASE_LOCAL}/api/pdf/venta/${ventaId}`
                                        window.open(url, "_blank", "noopener,noreferrer")
                                      }}
                                      className="flex items-center cursor-pointer"
                                    >
                                      <FileText className="mr-2 h-4 w-4" />
                                      Mostrar en PDF
                                    </DropdownMenuItem>
                                  )}

                                  {/* Apartados */}
                                  {sec.id === "apartados" && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        const apartadoId = d.id || d.folio
                                        if (!apartadoId) {
                                          console.error("No se encontró ID para el apartado")
                                          return
                                        }
                                        const url = `${process.env.NEXT_PUBLIC_REACT_BASE_LOCAL}/api/pdf/apartado/${apartadoId}`
                                        window.open(url, "_blank", "noopener,noreferrer")
                                      }}
                                      className="flex items-center cursor-pointer"
                                    >
                                      <Printer className="mr-2 h-4 w-4" />
                                      Ver PDF
                                    </DropdownMenuItem>
                                  )}

                                  {/* Hechuras */}
                                  {sec.id === "hechuras" && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        const hechuraId = d.id || d.folio
                                        if (!hechuraId) {
                                          console.error("No se encontró ID para la hechura")
                                          return
                                        }
                                        const url = `${process.env.NEXT_PUBLIC_REACT_BASE_LOCAL}/api/pdf/hechura/${hechuraId}`
                                        window.open(url, "_blank")
                                      }}
                                      className="flex items-center cursor-pointer"
                                    >
                                      <Printer className="mr-2 h-4 w-4" />
                                      Ver PDF
                                    </DropdownMenuItem>
                                  )}

                                  {/* Relojes */}
                                  {sec.id === "relojes" && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        const relojId = d.id || d.folio
                                        if (!relojId) {
                                          console.error("No se encontró ID para el reloj")
                                          return
                                        }
                                        const url = `${process.env.NEXT_PUBLIC_REACT_BASE_LOCAL}/api/pdf/reloj/${relojId}`
                                        window.open(url, "_blank")
                                      }}
                                      className="flex items-center cursor-pointer"
                                    >
                                      <Printer className="mr-2 h-4 w-4" />
                                      Ver PDF
                                    </DropdownMenuItem>
                                  )}

                                  {/* Abonos */}
                                  {sec.id === "abonos" && (
                                    <DropdownMenuItem
                                      onClick={() => openAbonoPdf(d)}
                                      className="flex items-center cursor-pointer"
                                    >
                                      <Printer className="mr-2 h-4 w-4" />
                                      Imprimir PDF
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
<div className="grid gap-4 sm:grid-cols-2">
  <Stat title="Total Efectivo" value={sec.efectivo} />
  <Stat title="Total Tarjeta" value={sec.tarjeta} />
</div>

                  </>
                )}

                {/* Notas de Crédito (semana) */}
                {sec.id === "notas" && (
                  <>
          <div className="grid sm:grid-cols-1 gap-4">
  <Stat title="Cantidad de Notas (semana)" value={sec.total} isMoney={false} />
</div>
         

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Folio</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Origen</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Disponible</TableHead>
                          <TableHead>Usado</TableHead>
                          <TableHead>Estatus</TableHead>
                          <TableHead>Empleado</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {notas.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={10} className="text-center text-muted-foreground">
                              No hay notas de crédito en la semana.
                            </TableCell>
                          </TableRow>
                        ) : (
                          notas.map((n) => (
                            <TableRow key={n.id}>
                              <TableCell>{n.id}</TableCell>
                              <TableCell>{n.cliente}</TableCell>
                              <TableCell>
                                {n.origenTipo} #{n.origenFolio}
                              </TableCell>
                              <TableCell>{money(n.total)}</TableCell>
                              <TableCell>{money(n.disponible)}</TableCell>
                              <TableCell>{money(n.usado)}</TableCell>
                              <TableCell>
                                {n.cancelada ? "Cancelada" : n.usada ? "Usada" : n.disponible > 0 ? "Parcial" : "—"}
                              </TableCell>
                              <TableCell>{n.empleado ?? "—"}</TableCell>
                              <TableCell>{n.fecha}</TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">Abrir menú</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        const url = `${process.env.NEXT_PUBLIC_REACT_BASE_LOCAL}/api/pdf/nota-credito/${n.id}`
                                        window.open(url, "_blank", "noopener,noreferrer")
                                      }}
                                      className="flex items-center cursor-pointer"
                                    >
                                      <Printer className="mr-2 h-4 w-4" />
                                      Imprimir PDF
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </>
                )}
              </CardContent>
            </Card>

            {idx < sections.length - 1 && <Separator className="my-6" />}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────── Agregador semanal (suma de días) ─────────── */
function resumirRango(dias: Reporte[]): Reporte {
  const inicial: Reporte = {
    fecha: "",
    totalEfectivo: 0,
    totalTarjeta: 0,
    totalNotaCredito: 0,
    totalNotasCreditoGeneradas: 0,
    totalEnCaja: 0,

    totalVentas: 0,
    totalVentasEfectivo: 0,
    totalVentasTarjeta: 0,
    totalVentasCredito: 0,
    ventas: [],

    totalApartados: 0,
    totalApartadosEfectivo: 0,
    totalApartadosTarjeta: 0,
    totalApartadosCredito: 0,
    apartados: [],

    totalHechuras: 0,
    totalHechurasEfectivo: 0,
    totalHechurasTarjeta: 0,
    totalHechurasCredito: 0,
    hechuras: [],

    totalRelojes: 0,
    totalRelojesEfectivo: 0,
    totalRelojesTarjeta: 0,
    totalRelojesCredito: 0,
    relojes: [],

    totalAbonos: 0,
    totalAbonosEfectivo: 0,
    totalAbonosTarjeta: 0,
    totalAbonosCredito: 0,
    abonos: [],

    joyasCreadas: [],
    joyasActualizadas: [],
    totalStockEnJoyasCreadas: 0,
    totalStockEnJoyasActualizadas: 0,
    totalStockAgregadoDelDia: 0,

    totalNotasCredito: 0,
    notasCredito: [],
  }

  return dias.reduce(
    (acc, dia) => ({
      ...inicial,
      totalEfectivo: acc.totalEfectivo + dia.totalEfectivo,
      totalTarjeta: acc.totalTarjeta + dia.totalTarjeta,
      totalNotaCredito: acc.totalNotaCredito + dia.totalNotaCredito,
      totalNotasCreditoGeneradas: acc.totalNotasCreditoGeneradas + dia.totalNotasCreditoGeneradas,
      totalEnCaja: acc.totalEnCaja + dia.totalEnCaja,

      totalVentas: acc.totalVentas + dia.totalVentas,
      totalVentasEfectivo: acc.totalVentasEfectivo + dia.totalVentasEfectivo,
      totalVentasTarjeta: acc.totalVentasTarjeta + dia.totalVentasTarjeta,
      totalVentasCredito: acc.totalVentasCredito + dia.totalVentasCredito,
      ventas: acc.ventas.concat(dia.ventas),

      totalApartados: acc.totalApartados + dia.totalApartados,
      totalApartadosEfectivo: acc.totalApartadosEfectivo + dia.totalApartadosEfectivo,
      totalApartadosTarjeta: acc.totalApartadosTarjeta + dia.totalApartadosTarjeta,
      totalApartadosCredito: acc.totalApartadosCredito + dia.totalApartadosCredito,
      apartados: acc.apartados.concat(dia.apartados),

      totalHechuras: acc.totalHechuras + dia.totalHechuras,
      totalHechurasEfectivo: acc.totalHechurasEfectivo + dia.totalHechurasEfectivo,
      totalHechurasTarjeta: acc.totalHechurasTarjeta + dia.totalHechurasTarjeta,
      totalHechurasCredito: acc.totalHechurasCredito + dia.totalHechurasCredito,
      hechuras: acc.hechuras.concat(dia.hechuras),

      totalRelojes: acc.totalRelojes + dia.totalRelojes,
      totalRelojesEfectivo: acc.totalRelojesEfectivo + dia.totalRelojesEfectivo,
      totalRelojesTarjeta: acc.totalRelojesTarjeta + dia.totalRelojesTarjeta,
      totalRelojesCredito: acc.totalRelojesCredito + dia.totalRelojesCredito,
      relojes: acc.relojes.concat(dia.relojes),

      totalAbonos: acc.totalAbonos + dia.totalAbonos,
      totalAbonosEfectivo: acc.totalAbonosEfectivo + dia.totalAbonosEfectivo,
      totalAbonosTarjeta: acc.totalAbonosTarjeta + dia.totalAbonosTarjeta,
      totalAbonosCredito: acc.totalAbonosCredito + dia.totalAbonosCredito,
      abonos: acc.abonos.concat(dia.abonos),

      joyasCreadas: acc.joyasCreadas.concat(dia.joyasCreadas),
      joyasActualizadas: acc.joyasActualizadas.concat(dia.joyasActualizadas),
      totalStockEnJoyasCreadas: acc.totalStockEnJoyasCreadas + dia.totalStockEnJoyasCreadas,
      totalStockEnJoyasActualizadas: acc.totalStockEnJoyasActualizadas + dia.totalStockEnJoyasActualizadas,
      totalStockAgregadoDelDia: acc.totalStockAgregadoDelDia + dia.totalStockAgregadoDelDia,

      totalNotasCredito: acc.totalNotasCredito + dia.totalNotasCredito,
      notasCredito: acc.notasCredito.concat(dia.notasCredito),
    }),
    inicial,
  )
}

type TipoNota = "APARTADO" | "HECHURA" | "RELOJ"
