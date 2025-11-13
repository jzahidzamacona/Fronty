"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, CreditCard, DollarSign, Package, ShoppingBag, Watch } from "lucide-react"

import { SalesOverview } from "@/components/dashboard/sales-overview"
import { ApartadosOverview } from "@/components/dashboard/apartados-overview"
import { HechurasOverview } from "@/components/dashboard/hechuras-overview"
import { RelojesOverview } from "@/components/dashboard/relojes-overview"
import { AbonosOverview } from "@/components/dashboard/abonos-overview"

import axiosInstance from "@/hooks/axiosInstance"

/* ===== Tipos del reporte (para KPIs) ===== */
type VentaRpt = {
  total?: number
  montoEfectivo?: number | null
  montoTarjeta?: number | null
  montoNotaCredito?: number | null
}
type ReporteDiario = {
  fecha: string
  totalVentas?: number
  totalVentasEfectivo?: number
  totalVentasTarjeta?: number

  totalApartados?: number
  totalApartadosEfectivo?: number
  totalApartadosTarjeta?: number

  totalHechuras?: number
  totalHechurasEfectivo?: number
  totalHechurasTarjeta?: number

  totalRelojes?: number
  totalRelojesEfectivo?: number
  totalRelojesTarjeta?: number

  totalAbonos?: number
  totalAbonosEfectivo?: number
  totalAbonosTarjeta?: number

  totalNotasCredito?: number
  totalNotasCreditoGeneradas?: number

  totalEfectivo?: number
  totalTarjeta?: number
  totalEnCaja?: number

  ventas?: VentaRpt[]
}

/* ===== Helpers ===== */
const currency = (n: number) =>
  Number(n || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" })

export default function Dashboard() {
  const [reporte, setReporte] = useState<ReporteDiario | null>(null)

  useEffect(() => {
    const hoyLocal = (() => {
      const d = new Date()
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, "0")
      const dd = String(d.getDate()).padStart(2, "0")
      return `${yyyy}-${mm}-${dd}`
    })()

    const looksLike = (o: any) =>
      o && typeof o === "object" &&
      ("totalVentas" in o || "totalEfectivo" in o || "ventas" in o)

    const unwrap = (raw: any) => {
      if (looksLike(raw)) return raw
      if (raw?.reporte && looksLike(raw.reporte)) return raw.reporte
      if (raw?.data && looksLike(raw.data)) return raw.data
      if (raw && typeof raw === "object") {
        for (const k of Object.keys(raw)) if (looksLike(raw[k])) return raw[k]
      }
      return null
    }

    axiosInstance.get("/api/reporte-diario", { params: { fecha: hoyLocal } })
      .then(({ data }) => setReporte(unwrap(data)))
      .catch(() => setReporte(null))
  }, [])

  // SOLO EFECTIVO + TARJETA (para KPI de ventas)
  const ventasMonto = useMemo(() => {
    if (reporte?.ventas?.length) {
      return reporte.ventas.reduce(
        (acc, v) => acc + Number(v.montoEfectivo || 0) + Number(v.montoTarjeta || 0),
        0
      )
    }
    if (reporte) {
      return (reporte.totalVentasEfectivo || 0) + (reporte.totalVentasTarjeta || 0)
    }
    return 0
  }, [reporte])

  const apartadosActivos = reporte?.totalApartados ?? 0
  const hechurasPendientes = reporte?.totalHechuras ?? 0
  const relojesRep = reporte?.totalRelojes ?? 0

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Panel de Control</h2>
      </div>

      {/* Accesos rápidos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/ventas">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Ventas</CardTitle>
              <DollarSign className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Registrar nuevas ventas y consultar historial</p></CardContent>
          </Card>
        </Link>

        <Link href="/apartados">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Apartados</CardTitle>
              <ShoppingBag className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Gestionar apartados y abonos</p></CardContent>
          </Card>
        </Link>

        <Link href="/hechuras">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Hechuras</CardTitle>
              <Package className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Registrar trabajos personalizados</p></CardContent>
          </Card>
        </Link>

        <Link href="/relojes">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Relojes</CardTitle>
              <Watch className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Gestionar reparaciones de relojes</p></CardContent>
          </Card>
        </Link>

        <Link href="/abonos">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Abonos</CardTitle>
              <CreditCard className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Registrar pagos y abonos</p></CardContent>
          </Card>
        </Link>

        <Link href="/notas-credito">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Notas de Crédito</CardTitle>
              <CalendarDays className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Gestionar notas de crédito</p></CardContent>
          </Card>
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales (Hoy)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currency(ventasMonto)}</div>
            <p className="text-xs text-muted-foreground">
              Efectivo {currency(reporte?.totalVentasEfectivo ?? 0)} · Tarjeta {currency(reporte?.totalVentasTarjeta ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Apartados Activos (Hoy)</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reporte?.totalApartados ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Efectivo {currency(reporte?.totalApartadosEfectivo ?? 0)} · Tarjeta {currency(reporte?.totalApartadosTarjeta ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hechuras Pendientes (Hoy)</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reporte?.totalHechuras ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Efectivo {currency(reporte?.totalHechurasEfectivo ?? 0)} · Tarjeta {currency(reporte?.totalHechurasTarjeta ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relojes en Reparación (Hoy)</CardTitle>
            <Watch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reporte?.totalRelojes ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Efectivo {currency(reporte?.totalRelojesEfectivo ?? 0)} · Tarjeta {currency(reporte?.totalRelojesTarjeta ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs - SOLO GRÁFICAS */}
      <Tabs defaultValue="ventas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ventas">Ventas</TabsTrigger>
          <TabsTrigger value="apartados">Apartados</TabsTrigger>
          <TabsTrigger value="hechuras">Hechuras</TabsTrigger>
          <TabsTrigger value="relojes">Relojes</TabsTrigger>
          <TabsTrigger value="abonos">Abonos</TabsTrigger>
        </TabsList>

        <TabsContent value="ventas">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Ventas</CardTitle>
              <CardDescription>Ventas diarias de la semana actual</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <SalesOverview />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apartados">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Apartados</CardTitle>
              <CardDescription>Apartados diarios de la semana actual</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ApartadosOverview />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hechuras">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Hechuras</CardTitle>
              <CardDescription>Hechuras diarias de la semana actual</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <HechurasOverview />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relojes">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Relojes</CardTitle>
              <CardDescription>Servicios de relojes diarios de la semana actual</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <RelojesOverview />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="abonos">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Abonos</CardTitle>
              <CardDescription>Abonos diarios de la semana actual</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <AbonosOverview />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
