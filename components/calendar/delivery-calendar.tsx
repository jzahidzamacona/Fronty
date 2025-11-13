"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Package,
  Watch,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react"
import {
  format,
  isSameDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  parseISO,
} from "date-fns"
import { es } from "date-fns/locale"
import { useCalendarData, getRestanteFromAbonos, type DeliveryItem } from "@/hooks/use-calendar-data"
import { useMonthSummary } from "@/hooks/use-month-summary"

const API_BASE = process.env.NEXT_PUBLIC_REACT_BASE_LOCAL || ""

function compactList(items: string[]) {
  const counts: Record<string, number> = {}
  for (const raw of items) {
    const k = (raw || "").trim()
    if (!k) continue
    counts[k] = (counts[k] || 0) + 1
  }
  return Object.entries(counts).map(([k, c]) => (c > 1 ? `${k} ×${c}` : k))
}

function summarize(items?: string[], fallback?: string) {
  if (items && items.length) {
    const fullArr = compactList(items)
    const full = fullArr.join(", ")
    const short = fullArr.slice(0, 3).join(", ") + (fullArr.length > 3 ? `, +${fullArr.length - 3} más` : "")
    return { short, full }
  }
  const v = (fallback || "").trim()
  return { short: v, full: v }
}

function truncate(str?: string, n = 20) {
  if (!str) return ""
  const s = str.trim()
  return s.length > n ? s.slice(0, n) + "..." : s
}

function getTicketUrl(d: DeliveryItem) {
  const path = d.tipo === "hechura" ? `/api/pdf/hechura/${d.id}` : `/api/pdf/reloj/${d.id}`
  return `${API_BASE}${path}`
}

export function DeliveryCalendar() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<DeliveryItem | null>(null)
  const [liveRestante, setLiveRestante] = useState<number | null>(null)
  const [loadingRestante, setLoadingRestante] = useState(false)

  const { hechuras, relojes, loading, error } = useCalendarData(currentMonth)
  const allDeliveries = [...hechuras, ...relojes]

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth() + 1
  const { summary, loading: loadingSummary } = useMonthSummary(year, month)

  const openDetails = async (d: DeliveryItem) => {
    setSelected(d)
    setOpen(true)
    setLiveRestante(null)
    setLoadingRestante(true)

    try {
      const tipo = d.tipo === "hechura" ? "HECHURA" : "RELOJ"
      const restante = await getRestanteFromAbonos(tipo, d.id)
      setLiveRestante(restante)
    } catch (error) {
      console.error("Error loading restante:", error)
    } finally {
      setLoadingRestante(false)
    }
  }

  const getDeliveriesForDate = (date: Date) =>
    allDeliveries.filter((delivery) => {
      if (!delivery.fechaEntrega) return false
      try {
        let deliveryDate: Date
        if (delivery.fechaEntrega.includes("T")) deliveryDate = parseISO(delivery.fechaEntrega)
        else if (delivery.fechaEntrega.includes("/")) {
          const [day, month, year] = delivery.fechaEntrega.split("/")
          deliveryDate = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
        } else if (delivery.fechaEntrega.includes("-")) deliveryDate = parseISO(delivery.fechaEntrega)
        else return false
        return isSameDay(deliveryDate, date)
      } catch {
        return false
      }
    })

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const monthStats = summary
    ? {
        totalEntregas: summary.hechurasTotalMes + summary.relojesTotalMes,
        hechuras: summary.hechurasTotalMes,
        relojes: summary.relojesTotalMes,
        pendientes: summary.hechurasPendientesMes + summary.relojesPendientesMes,
        listas: summary.hechurasSaldadasMes + summary.relojesSaldadosMes,
      }
    : {
        totalEntregas: allDeliveries.length,
        hechuras: hechuras.length,
        relojes: relojes.length,
        pendientes: allDeliveries.filter(
          (d) => d.estado?.toLowerCase().includes("pendiente") || d.estado?.toLowerCase().includes("proceso"),
        ).length,
        listas: allDeliveries.filter(
          (d) => d.estado?.toLowerCase().includes("listo") || d.estado?.toLowerCase().includes("terminado"),
        ).length,
      }

  const navigateMonth = (dir: "prev" | "next") =>
    setCurrentMonth((prev) => (dir === "prev" ? subMonths(prev, 1) : addMonths(prev, 1)))

  return (
    <div className="px-6 md:px-8 lg:px-10 space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarIcon className="h-6 w-6" />
            Calendario / Entregas Programadas
          </h2>
          <p className="text-muted-foreground">Programa y visualiza las fechas de entrega de hechuras y relojes</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: es })}
          </p>
          <p className="text-lg font-semibold">{monthStats.totalEntregas} entregas programadas</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Hechuras</p>
                <p className="text-2xl font-bold">{loadingSummary ? "..." : monthStats.hechuras}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Watch className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Relojes</p>
                <p className="text-2xl font-bold">{loadingSummary ? "..." : monthStats.relojes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Pendientes</p>
                <p className="text-2xl font-bold">{loadingSummary ? "..." : monthStats.pendientes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Saldadas</p>
                <p className="text-2xl font-bold">{loadingSummary ? "..." : monthStats.listas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {format(currentMonth, "MMMM yyyy", { locale: es }).toUpperCase()}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
                Hoy
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Cargando entregas...</span>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-3 w-3" />
              <span>Error: {error}</span>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b">
            {["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"].map((d) => (
              <div
                key={d}
                className="p-3 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7" style={{ minHeight: "600px" }}>
            {calendarDays.map((day) => {
              const deliveries = getDeliveriesForDate(day)
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
              const isToday = isSameDay(day, new Date())

              return (
                <div
                  key={day.toISOString()}
                  className={`border-r border-b last:border-r-0 p-2 min-h-[120px] ${
                    !isCurrentMonth ? "bg-muted/30 text-muted-foreground" : ""
                  } ${isToday ? "bg-blue-50 border-blue-200" : ""}`}
                >
                  <div className={`text-sm font-medium mb-1 ${isToday ? "text-blue-600" : ""}`}>{format(day, "d")}</div>

                  <div className="space-y-1">
                    {deliveries.map((delivery) => {
                      const isHechura = delivery.tipo === "hechura"
                      const { short, full } = isHechura
                        ? summarize(delivery.tiposDePieza, delivery.tipoDePieza)
                        : summarize(delivery.marcas, delivery.marca)

                      const chipTitle =
                        `${delivery.cliente}` +
                        (full ? ` • ${isHechura ? "Piezas: " : "Marcas: "}${full}` : "") +
                        (delivery.descripcion ? ` • Desc: ${truncate(delivery.descripcion, 40)}` : "") +
                        (delivery.total ? ` • $${delivery.total}` : "")

                      return (
                        <div
                          key={`${delivery.tipo}-${delivery.id}-${delivery.fechaEntrega}`}
                          onClick={() => openDetails(delivery)}
                          className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-90 ${
                            isHechura
                              ? "bg-blue-100 text-blue-800 border-l-2 border-blue-500"
                              : "bg-purple-100 text-purple-800 border-l-2 border-purple-500"
                          }`}
                          title={chipTitle}
                        >
                          <div className="font-medium">
                            {isHechura ? "Hechura" : "Reloj"}: {delivery.folio}
                            {short ? `, ${short}` : ""}
                          </div>
                          <div className="text-[10px] opacity-75">{delivery.cliente}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selected?.tipo === "hechura" ? "Hechura" : "Reloj"} {selected?.folio}
            </DialogTitle>
            <DialogDescription>{selected?.cliente}</DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-2 text-sm">
              {selected.telefono && (
                <div>
                  <span className="font-medium">Tel:</span> {selected.telefono}
                </div>
              )}
              <div>
                <span className="font-medium">Descripción:</span>{" "}
                {truncate(selected.descripcion, 50) || "Sin descripción"}
              </div>
              <div>
                <span className="font-medium">{selected.tipo === "hechura" ? "Tipos de pieza" : "Marcas"}:</span>{" "}
                {selected.tipo === "hechura"
                  ? summarize(selected.tiposDePieza, selected.tipoDePieza).full || "—"
                  : summarize(selected.marcas, selected.marca).full || "—"}
              </div>
              <div>
                <span className="font-medium">Fecha de entrega:</span>{" "}
                {selected.fechaEntrega?.includes("T")
                  ? format(parseISO(selected.fechaEntrega), "dd/MM/yyyy")
                  : selected.fechaEntrega}
              </div>
              <div className="pt-2">
                <span className="font-medium">Total:</span>{" "}
                <span className="font-semibold text-green-700">${(selected.total ?? 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="font-medium">Restante:</span>{" "}
                {loadingRestante ? (
                  <span className="text-muted-foreground">Cargando...</span>
                ) : liveRestante !== null ? (
                  <span className="font-semibold text-blue-700">${liveRestante.toFixed(2)}</span>
                ) : (
                  <span className="font-semibold text-blue-700">
                    ${Math.max(0, (selected?.total ?? 0) - (selected?.montoInicial ?? 0)).toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {selected && (
              <Button variant="outline" onClick={() => window.open(getTicketUrl(selected), "_blank")}>
                <FileText className="mr-2 h-4 w-4" />
                Ver PDF
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
