"use client"

import { useEffect, useState } from "react"
import axiosInstance from "@/hooks/axiosInstance"
import { format } from "date-fns"
import { es } from "date-fns/locale"
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

// ✅ Decláralo aquí, a nivel de módulo (una sola vez en el archivo)
type TipoNota = "APARTADO" | "HECHURA" | "RELOJ";
/* ─── Tipos (los tuyos) ─── */
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
interface NotaCreditoResumen {
  // OJO: tu interfaz no coincide con el backend; la dejamos,
  // pero abajo hacemos un mapeo a una interfaz UI correcta.
  id: number
  cliente: string
  total: number
  disponible: number
  usada: boolean
  fecha: string
}
interface DetalleMovimientoCaja {
  tipo: string
  metodoPago: string
  monto: number
  fechaHora: string
  empleado: string
}
interface CorteDetalladoResponse {
  fecha: string
  montoApertura: number
  totalEntradasEfectivo: number
  totalEntradasTarjeta: number
  totalNotasCreditoUsadas: number
  totalSalidas: number
  totalEnCaja: number
  detalle: DetalleMovimientoCaja[]
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
  notasCredito: NotaCreditoResumen[] | any[] // viene con otras keys
}

/* ─── Utilidades ─── */

// Total por fila de ABONOS: solo efectivo + tarjeta (excluye nota de crédito)
const totalAbonoRow = (d: Detalle) => Number(d.montoEfectivo ?? 0) + Number(d.montoTarjeta ?? 0)

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

/* ─── UI para Notas ─── */
interface NotaCreditoUI {
  id: number
  cliente: string
  total: number
  disponible: number
  usado: number
  usada: boolean
  cancelada: boolean
  origenTipo: string
  origenFolio: number
  empleado?: string
  fecha: string
}

/* ─── Componente ─── */
export function GeneralDailyReport() {
  const [data, setData] = useState<Reporte | null>(null)
  const [caja, setCaja] = useState<CorteDetalladoResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState("ventas")
  const today = new Date().toLocaleDateString("en-CA")

  useEffect(() => {
    axiosInstance
      .get<Reporte>("/api/reporte-diario", { params: { fecha: today } })
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))

    axiosInstance
      .get<CorteDetalladoResponse>(`${process.env.NEXT_PUBLIC_MSO_API_CAJA}/corte-diario/detallado?fecha=${today}`)
      .then((r) => setCaja(r.data))
      .catch(console.error)
  }, [today])

  const scrollTo = (id: string) => {
    setActive(id)
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth" })
  }

  if (loading) return <p className="py-6 text-muted-foreground">Cargando…</p>
  if (!data) return <p className="py-6 text-red-500">Sin datos.</p>

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
    // Abre el PDF del abono resolviendo tipoNota/notaId a partir del abono del día
const openAbonoPdf = async (row: any) => {
  try {
    // 1) Saca el id del ABONO desde la fila del reporte
    //    - Primero por d.id
    //    - Si no, del folio: A-0171 / AA-171 / H-0012 / AR-23, etc.
    let abonoId: number | undefined = typeof row.id === "number" ? row.id : undefined;

    if (!abonoId) {
      const folio = (row.folio ?? "").toString().toUpperCase().trim();
      const m = folio.match(/^(AA|AH|AR|A|H|R)-?0*([0-9]+)$/);
      if (m) abonoId = Number(m[2]);
    }

    if (!abonoId || Number.isNaN(abonoId)) {
      alert("No se pudo determinar el ID del abono desde la fila.");
      return;
    }

    // 2) Consulta el listado de abonos del día y busca el que coincide con ese abonoId
    const fechaInicio = `${today}T00:00:00`;
    const fechaFin    = `${today}T23:59:59`;
    const { data: abonosDeHoy } = await axiosInstance.get(
      (process.env.NEXT_PUBLIC_API_ABONOS || "/api/abonos"),
      { params: { fechaInicio, fechaFin } }
    );

    const match = (abonosDeHoy || []).find((a: any) => Number(a.id) === Number(abonoId));
    if (!match) {
      alert("No se encontró el abono en el listado del día.");
      return;
    }

    const tipo = String(match.tipoNota || "").toUpperCase() as TipoNota;
    const notaId = Number(match.notaId);

    if (!["APARTADO","HECHURA","RELOJ"].includes(tipo) || !notaId) {
      alert("El abono encontrado no tiene tipo/notaId válidos.");
      return;
    }

    // 3) Pide el PDF con axiosInstance (envía Authorization) y ábrelo en nueva pestaña
    const ABONOS_PATH = process.env.NEXT_PUBLIC_API_ABONOS || "/api/abonos";
    const { data: blobData } = await axiosInstance.get(
      `${ABONOS_PATH}/ticket/${tipo}/${notaId}`,
      { responseType: "blob" }
    );
    const blob = new Blob([blobData], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
  } catch (e) {
    console.error(e);
    alert("No se pudo abrir el PDF del abono.");
  }
};



  /* ─── Secciones ─── */
  const sections = [
    {
      id: "ventas",
      title: "Ventas",
      total: data.totalVentas,
      efectivo: data.totalVentasEfectivo,
      tarjeta: data.totalVentasTarjeta,
      credito: data.totalVentasCredito,
      detalles: data.ventas,
    },
    {
      id: "apartados",
      title: "Apartados",
      total: data.totalApartados,
      efectivo: data.totalApartadosEfectivo,
      tarjeta: data.totalApartadosTarjeta,
      credito: data.totalApartadosCredito,
      detalles: data.apartados,
    },
    {
      id: "hechuras",
      title: "Hechuras",
      total: data.totalHechuras,
      efectivo: data.totalHechurasEfectivo,
      tarjeta: data.totalHechurasTarjeta,
      credito: data.totalHechurasCredito,
      detalles: data.hechuras,
    },
    {
      id: "relojes",
      title: "Relojes",
      total: data.totalRelojes,
      efectivo: data.totalRelojesEfectivo,
      tarjeta: data.totalRelojesTarjeta,
      credito: data.totalRelojesCredito,
      detalles: data.relojes,
    },
    {
      id: "abonos",
      title: "Abonos",
      total: data.totalAbonos,
      efectivo: data.totalAbonosEfectivo,
      tarjeta: data.totalAbonosTarjeta,
      credito: data.totalAbonosCredito,
      detalles: data.abonos,
    },
    {
      id: "notas",
      title: "Notas de Crédito",
      total: data.totalNotasCredito,
      detalles: [] as Detalle[],
    },
    {
      id: "stock",
      title: "Stock",
      total: data.totalStockAgregadoDelDia,
      detalles: [] as Detalle[],
    },
  ]

  /* ─── Mapeo REAL de Notas desde el backend ─── */
  const notas: NotaCreditoUI[] = (data.notasCredito ?? []).map((n: any) => ({
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

  const sumaDisponible = notas.reduce((a, n) => a + (n.disponible || 0), 0)

  return (
    <div className="space-y-6">
      {/* ─── MOVIMIENTOS DE CAJA ─── */}
      {caja && (
        <Card>
          <CardHeader>
            <CardTitle>Movimientos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead>Empleado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {caja.detalle.map((mov, i) => (
                  <TableRow key={i}>
                    <TableCell>{mov.tipo}</TableCell>
                    <TableCell>{mov.metodoPago}</TableCell>
                    <TableCell>{money(mov.monto)}</TableCell>
                    <TableCell>{format(new Date(mov.fechaHora), "dd/MM/yyyy HH:mm", { locale: es })}</TableCell>
                    <TableCell>{mov.empleado}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Totales globales */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Stat title="Total Efectivo del Día" value={data.totalEfectivo} />
        <Stat title="Total Tarjeta del Día" value={data.totalTarjeta} />
        <Stat title="Total Nota Crédito del Día" value={data.totalNotasCreditoGeneradas} />
        <Stat title="Total en Caja" value={data.totalEnCaja} />
      </div>

      {/* Tabs */}
      <Tabs value={active} onValueChange={scrollTo}>
        <TabsList className="grid grid-cols-7 w-full">
          {sections.map((s) => (
            <TabsTrigger key={s.id} value={s.id}>
              {s.title}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Secciones */}
      <div className="space-y-10 pb-20">
        {sections.map((sec, idx) => (
          <div key={sec.id} id={`section-${sec.id}`} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{sec.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* ── STOCK ─────────────────────── */}
                {sec.id === "stock" && (
                  <>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <Stat title="Stock en Joyas Creadas" value={data.totalStockEnJoyasCreadas} isMoney={false} />
                      <Stat
                        title="Stock en Joyas Actualizadas"
                        value={data.totalStockEnJoyasActualizadas}
                        isMoney={false}
                      />
                      <Stat title="Total Stock del Día" value={data.totalStockAgregadoDelDia} isMoney={false} />
                    </div>

                    {/* Joyas Creadas */}
                    <div className="space-y-2">
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
                    </div>

                    {/* Joyas Actualizadas */}
                    <div className="space-y-2">
                      <h4 className="font-semibold">Joyas Actualizadas</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Kilataje</TableHead>
                            <TableHead>Agregado</TableHead>
                            <TableHead>Fecha</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.joyasActualizadas.map((j) => (
                            <TableRow key={j.id}>
                              <TableCell>{j.id}</TableCell>
                              <TableCell>{j.nombre}</TableCell>
                              <TableCell>{j.kilataje}</TableCell>
                              <TableCell>{j.stockAgregado}</TableCell>
                              <TableCell>{j.fechaModificacion}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}

                {/* ── NOTAS DE CRÉDITO ───────────── */}
                {sec.id === "notas" && (
                  <>
<div className="grid sm:grid-cols-1 gap-4">
  <Stat title="Cantidad de Notas" value={data.totalNotasCredito} isMoney={false} />
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
                              No hay notas de crédito hoy.
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

                {/* ── ÁREAS GENERALES ────────────── */}
                {["ventas", "apartados", "hechuras", "relojes", "abonos"].includes(sec.id) && (
                  <>
                    {!!sec.detalles.length && (
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
                    )}

                    {/* Totales de la sección */}
<div className="grid gap-4 sm:grid-cols-2">
  <Stat title="Total Efectivo" value={sec.efectivo} />
  <Stat title="Total Tarjeta" value={sec.tarjeta} />
</div>

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
