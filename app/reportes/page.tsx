"use client"

import { useState } from "react"
import { startOfWeek, endOfWeek, format } from "date-fns"
import { es } from "date-fns/locale"

import Gate from "@/components/ui/Gate"
import axiosInstance from "@/hooks/axiosInstance"

import { GeneralDailyReport } from "@/components/dashboard/general-daily-report"
import { GeneralWeeklyReport } from "@/components/dashboard/GeneralWeeklyReport"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Download, FileText, FileSpreadsheet } from "lucide-react"

const BASE = process.env.NEXT_PUBLIC_REACT_BASE_LOCAL ?? "http://localhost:8080"
const RPT_DIARIO_PDF = process.env.NEXT_PUBLIC_API_REPORTE_DIARIO_PDF ?? "/api/reporte-diario/pdf"
const RPT_SEMANAL_PDF = process.env.NEXT_PUBLIC_API_REPORTE_SEMANAL_PDF ?? "/api/reporte-semanal/pdf"
const RPT_RANGO_PDF = process.env.NEXT_PUBLIC_API_REPORTE_RANGO_PDF ?? "/api/reporte-diario/rango/pdf"

const TZ = "America/Mexico_City"

export default function ReportesPage() {
  // ---- fechas / textos ----
  const ahora = new Date()
  const hoyMX = new Date(new Date().toLocaleString("en-US", { timeZone: TZ }))
  const hoyISO = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(ahora)

  const fechaTexto = new Intl.DateTimeFormat("es-MX", {
    timeZone: TZ,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(ahora)

  const inicioSemana = startOfWeek(hoyMX, { weekStartsOn: 1 })
  const finSemana = endOfWeek(hoyMX, { weekStartsOn: 1 })
  const rangoTexto = `Del ${format(inicioSemana, "dd 'de' MMMM", { locale: es })} al ${format(
    finSemana,
    "dd 'de' MMMM 'de' yyyy",
    { locale: es },
  )}`

  // ---- helpers auth/pdf ----
  const getToken = () => (typeof window !== "undefined" ? (localStorage.getItem("accessToken") ?? "") : "")

  const fetchPdfBlob = async (url: string) => {
    const token = getToken()
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) {
      const msg = await res.text()
      throw new Error(msg || "No se pudo generar el PDF")
    }
    return await res.blob()
  }

  const verPdf = async (url: string) => {
    const blob = await fetchPdfBlob(url)
    const blobUrl = URL.createObjectURL(blob)
    window.open(blobUrl, "_blank", "noopener,noreferrer")
  }

  const descargarPdf = async (url: string, filename: string) => {
    const blob = await fetchPdfBlob(url)
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = blobUrl
    a.download = filename
    a.click()
    URL.revokeObjectURL(blobUrl)
  }

  // ---- estado personalizado ----
  const [fechaDia, setFechaDia] = useState(hoyISO)
  const [fechaSem, setFechaSem] = useState(hoyISO)
  const [desde, setDesde] = useState(hoyISO)
  const [hasta, setHasta] = useState(hoyISO)
  const rangoInvalido = desde > hasta

  // ---- acciones ----
  // Diario
  const verDiario = () => verPdf(`${BASE}${RPT_DIARIO_PDF}?fecha=${fechaDia}`)
  const descargarDiario = () =>
    descargarPdf(`${BASE}${RPT_DIARIO_PDF}?fecha=${fechaDia}`, `reporte_diario_${fechaDia}.pdf`)
  const handleVerPdfHoy = () => verPdf(`${BASE}${RPT_DIARIO_PDF}?fecha=${hoyISO}`)

  // Semanal (tab semanal -> semana que contiene HOY)
  const verSemanalHoy = () => verPdf(`${BASE}${RPT_SEMANAL_PDF}?fecha=${hoyISO}`)
  const descargarSemanalHoy = () =>
    descargarPdf(`${BASE}${RPT_SEMANAL_PDF}?fecha=${hoyISO}`, `reporte_semanal_${hoyISO}.pdf`)

  // Rango
  const verRango = () => verPdf(`${BASE}${RPT_RANGO_PDF}?desde=${desde}&hasta=${hasta}`)
  const descargarRango = () =>
    descargarPdf(`${BASE}${RPT_RANGO_PDF}?desde=${desde}&hasta=${hasta}`, `reporte_rango_${desde}_a_${hasta}.pdf`)

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <h2 className="text-3xl font-bold tracking-tight">Reportes</h2>

      <Tabs defaultValue="diario" className="space-y-4">
        <TabsList>
          <TabsTrigger value="diario">Reporte Diario General</TabsTrigger>

          {/* Reporte Semanal ahora visible para ADMIN y EMPLEADO */}
          <Gate anyRole={["ADMIN", "EMPLEADO"]}>
            <TabsTrigger value="semanal">Reporte Semanal</TabsTrigger>
          </Gate>

          {/* Personalizado SOLO para ADMIN */}
          <Gate anyRole={["ADMIN"]}>
            <TabsTrigger value="personalizado">Personalizado</TabsTrigger>
          </Gate>
        </TabsList>

        {/* Diario (visible para todos) */}
        <TabsContent value="diario" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Reporte Diario General</CardTitle>
                  <CardDescription>Resumen general de operaciones del día actual</CardDescription>
                  <p className="mt-2 font-medium">Reporte del {fechaTexto}</p>
                </div>
                <div className="flex gap-2 mt-4 md:mt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      descargarPdf(`${BASE}${RPT_DIARIO_PDF}?fecha=${hoyISO}`, `reporte_diario_${hoyISO}.pdf`)
                    }
                  >
                    <Download className="mr-2 h-4 w-4" /> PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleVerPdfHoy}>
                    <FileText className="mr-2 h-4 w-4" /> Ver PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <GeneralDailyReport />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Semanal (ahora para ADMIN y EMPLEADO) */}
        <Gate anyRole={["ADMIN", "EMPLEADO"]}>
          <TabsContent value="semanal" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>Reporte Semanal</CardTitle>
                    <CardDescription>
                      Resumen de actividades agrupadas por semana
                      <div className="text-sm mt-1">{rangoTexto}</div>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 mt-4 md:mt-0">
                    <Button variant="outline" size="sm" onClick={descargarSemanalHoy}>
                      <Download className="mr-2 h-4 w-4" /> PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={verSemanalHoy}>
                      <FileText className="mr-2 h-4 w-4" /> Ver PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <GeneralWeeklyReport />
              </CardContent>
            </Card>
          </TabsContent>
        </Gate>

        {/* Personalizado (solo ADMIN) */}
        <Gate anyRole={["ADMIN"]}>
          <TabsContent value="personalizado" className="space-y-6">
            <PersonalizadoUI
              fechaDia={fechaDia}
              setFechaDia={setFechaDia}
              fechaSem={fechaSem}
              setFechaSem={setFechaSem}
              desde={desde}
              setDesde={setDesde}
              hasta={hasta}
              setHasta={setHasta}
              rangoInvalido={rangoInvalido}
              descargarDiario={() => descargarDiario()}
              verDiario={() => verDiario()}
              descargarSemanal={() =>
                descargarPdf(`${BASE}${RPT_SEMANAL_PDF}?fecha=${fechaSem}`, `reporte_semanal_${fechaSem}.pdf`)
              }
              verSemanal={() => verPdf(`${BASE}${RPT_SEMANAL_PDF}?fecha=${fechaSem}`)}
              descargarRango={() => descargarRango()}
              verRango={() => verRango()}
            />
          </TabsContent>
        </Gate>
      </Tabs>
    </div>
  )
}

/* ---------- UI "Personalizado" ---------- */
function PersonalizadoUI(props: {
  fechaDia: string
  setFechaDia: (v: string) => void
  fechaSem: string
  setFechaSem: (v: string) => void
  desde: string
  setDesde: (v: string) => void
  hasta: string
  setHasta: (v: string) => void
  rangoInvalido: boolean
  descargarDiario: () => void
  verDiario: () => void
  descargarSemanal: () => void
  verSemanal: () => void
  descargarRango: () => void
  verRango: () => void
}) {
  const {
    fechaDia,
    setFechaDia,
    fechaSem,
    setFechaSem,
    desde,
    setDesde,
    hasta,
    setHasta,
    rangoInvalido,
    descargarDiario,
    verDiario,
    descargarSemanal,
    verSemanal,
    descargarRango,
    verRango,
  } = props

  // Estado para el reporte de inventario Excel
  const [umbral, setUmbral] = useState("5")
  const [descargandoExcel, setDescargandoExcel] = useState(false)
  const { toast } = useToast()

  // Función para descargar Excel de inventario usando axiosInstance
  const descargarExcelInventario = async () => {
    try {
      setDescargandoExcel(true)
      const umbralValue = umbral || "5"

      toast({
        title: "Descarga iniciada",
        description: `Generando reporte de inventario con umbral ${umbralValue}...`,
      })

      // Usar axiosInstance para manejar autenticación automáticamente
      const response = await axiosInstance.get(`/api/reportes/inventario/excel`, {
        params: { umbral: umbralValue },
        responseType: "blob", // Importante para archivos binarios
      })

      // Crear blob con el tipo correcto para Excel
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })

      // Crear URL temporal y descargar
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `reporte_inventario_umbral_${umbralValue}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Descarga completada",
        description: `Reporte de inventario descargado exitosamente`,
      })
    } catch (error: any) {
      console.error("Error al descargar Excel:", error)

      let errorMessage = "No se pudo descargar el reporte de inventario"

      if (error.response?.status === 401) {
        errorMessage = "No tienes permisos para descargar este reporte"
      } else if (error.response?.status === 500) {
        errorMessage = "Error del servidor al generar el reporte"
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: "Error en la descarga",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setDescargandoExcel(false)
    }
  }

  return (
    <>
      {/* Reporte de Inventario Excel */}
      <Card>
        <CardHeader>
          <CardTitle>Reporte de Inventario Excel</CardTitle>
          <CardDescription>
            Descarga el reporte de inventario con productos bajo el umbral especificado.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-sm text-muted-foreground block mb-1">Umbral de stock bajo</label>
            <Input
              type="number"
              min="0"
              placeholder="5"
              value={umbral}
              onChange={(e) => setUmbral(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={descargarExcelInventario} disabled={descargandoExcel}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              {descargandoExcel ? "Descargando..." : "Excel Stock"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Diario por fecha */}
      <Card>
        <CardHeader>
          <CardTitle>Reporte Diario por fecha</CardTitle>
          <CardDescription>Selecciona una fecha y genera el PDF del día.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-sm text-muted-foreground block mb-1">Fecha</label>
            <input
              type="date"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={fechaDia}
              onChange={(e) => setFechaDia(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={descargarDiario}>
              <Download className="mr-2 h-4 w-4" /> Descargar
            </Button>
            <Button variant="secondary" onClick={verDiario}>
              <FileText className="mr-2 h-4 w-4" /> Ver PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Semanal por fecha */}
      <Card>
        <CardHeader>
          <CardTitle>Reporte Semanal por fecha</CardTitle>
          <CardDescription>Elige un día; se tomará la semana que lo contiene.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-sm text-muted-foreground block mb-1">Fecha dentro de la semana</label>
            <input
              type="date"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={fechaSem}
              onChange={(e) => setFechaSem(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={descargarSemanal}>
              <Download className="mr-2 h-4 w-4" /> Descargar
            </Button>
            <Button variant="secondary" onClick={verSemanal}>
              <FileText className="mr-2 h-4 w-4" /> Ver PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rango de fechas */}
      <Card>
        <CardHeader>
          <CardTitle>Reporte por Rango de Fechas</CardTitle>
          <CardDescription>Genera un PDF desde una fecha hasta otra.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-sm text-muted-foreground block mb-1">Desde</label>
            <input
              type="date"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="text-sm text-muted-foreground block mb-1">Hasta</label>
            <input
              type="date"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled={rangoInvalido} onClick={descargarRango}>
              <Download className="mr-2 h-4 w-4" /> Descargar
            </Button>
            <Button variant="secondary" disabled={rangoInvalido} onClick={verRango}>
              <FileText className="mr-2 h-4 w-4" /> Ver PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
