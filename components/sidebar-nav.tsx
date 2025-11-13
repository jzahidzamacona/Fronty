"use client"

import {
  CalendarDays,
  CreditCard,
  DollarSign,
  Home,
  Package,
  ShoppingBag,
  Users,
  Watch,
  BarChart3,
  Database,
  UserCog,
  Calculator,
  UserCheck,
  Calendar,
  Gem, 
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { isAdmin } from "@/app/utils/roles"
import { getSessionTimeLeft } from "@/hooks/axiosInstance"

export default function SidebarNav() {
  const pathname = usePathname()
  const [canSeeEmployees, setCanSeeEmployees] = useState(false)
  const [sessionTime, setSessionTime] = useState({ hours: 0, minutes: 0, expired: false })

  // leer roles del token en cliente
  useEffect(() => {
    setCanSeeEmployees(isAdmin())
  }, [])

  // ✅ NUEVO: Actualizar tiempo de sesión cada minuto
  useEffect(() => {
    const updateSessionTime = () => {
      setSessionTime(getSessionTimeLeft())
    }

    updateSessionTime() // Inicial
    const interval = setInterval(updateSessionTime, 60000) // Cada minuto

    // Escuchar cuando se renueva el token
    const handleTokenRefresh = () => {
      updateSessionTime()
    }

    window.addEventListener("tokenRefreshed", handleTokenRefresh)
    window.addEventListener("authChanged", handleTokenRefresh)

    return () => {
      clearInterval(interval)
      window.removeEventListener("tokenRefreshed", handleTokenRefresh)
      window.removeEventListener("authChanged", handleTokenRefresh)
    }
  }, [])

  // ✅ NUEVO: Componente para mostrar tiempo de sesión (DISCRETO)
  const SessionTimer = () => {
    if (sessionTime.expired) {
      return (
        <div className="px-3 py-2 text-xs text-red-500 border-t">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            Sesión expirada
          </div>
        </div>
      )
    }

    // Solo mostrar advertencia si queda menos de 1 hora
    const isVeryLowTime = sessionTime.hours === 0 && sessionTime.minutes < 60
    const isLowTime = sessionTime.hours < 2

    if (isVeryLowTime) {
      return (
        <div className="px-3 py-2 text-xs text-orange-600 border-t">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            ⚠️ Sesión: {sessionTime.minutes}m (renovando automáticamente)
          </div>
        </div>
      )
    }

    const statusColor = isLowTime ? "text-yellow-600" : "text-green-600"
    const dotColor = isLowTime ? "bg-yellow-500" : "bg-green-500"

    return (
      <div className={`px-3 py-2 text-xs border-t ${statusColor}`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${dotColor}`}></div>
          Sesión: {sessionTime.hours}h {sessionTime.minutes}m
        </div>
      </div>
    )
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-primary" />
          <span className="font-bold">Joyería Diamante</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/"} tooltip="Dashboard">
              <Link href="/">
                <Home className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/calendario" || pathname.startsWith("/calendario/")}
              tooltip="Calendario de Entregas"
            >
              <Link href="/calendario">
                <Calendar className="h-5 w-5" />
                <span>Calendario</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/caja" || pathname.startsWith("/caja/")} tooltip="Caja">
              <Link href="/caja">
                <Calculator className="h-5 w-5" />
                <span>Caja</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/ventas" || pathname.startsWith("/ventas/")}
              tooltip="Ventas"
            >
              <Link href="/ventas">
                <DollarSign className="h-5 w-5" />
                <span>Ventas</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/apartados" || pathname.startsWith("/apartados/")}
              tooltip="Apartados"
            >
              <Link href="/apartados">
                <ShoppingBag className="h-5 w-5" />
                <span>Apartados</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/hechuras" || pathname.startsWith("/hechuras/")}
              tooltip="Hechuras"
            >
              <Link href="/hechuras">
                <Package className="h-5 w-5" />
                <span>Hechuras</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
{/* Hechuras Argollas */}
<SidebarMenuItem>
  <SidebarMenuButton
    asChild
    isActive={pathname === "/hechuras-argollas" || pathname.startsWith("/hechuras-argollas/")}
    tooltip="Hechuras Argollas"
  >
    <Link href="/hechuras-argollas">
      <Gem className="h-5 w-5" />
      <span>Hechuras Argollas</span>
    </Link>
  </SidebarMenuButton>
</SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/relojes" || pathname.startsWith("/relojes/")}
              tooltip="Relojes"
            >
              <Link href="/relojes">
                <Watch className="h-5 w-5" />
                <span>Relojes</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/abonos" || pathname.startsWith("/abonos/")}
              tooltip="Abonos"
            >
              <Link href="/abonos">
                <CreditCard className="h-5 w-5" />
                <span>Abonos</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/notas-credito" || pathname.startsWith("/notas-credito/")}
              tooltip="Notas de Crédito"
            >
              <Link href="/notas-credito">
                <CalendarDays className="h-5 w-5" />
                <span>Notas de Crédito</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/clientes" || pathname.startsWith("/clientes/")}
              tooltip="Clientes"
            >
              <Link href="/clientes">
                <Users className="h-5 w-5" />
                <span>Clientes</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/productos" || pathname.startsWith("/productos/")}
              tooltip="Productos"
            >
              <Link href="/productos">
                <Database className="h-5 w-5" />
                <span>Productos</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Empleados → solo ADMIN */}
          {canSeeEmployees && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/empleados" || pathname.startsWith("/empleados/")}
                tooltip="Empleados"
              >
                <Link href="/empleados">
                  <UserCog className="h-5 w-5" />
                  <span>Empleados</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/reportes" || pathname.startsWith("/reportes/")}
              tooltip="Reportes"
            >
              <Link href="/reportes">
                <BarChart3 className="h-5 w-5" />
                <span>Reportes</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/ventas/por-empleado" || pathname.startsWith("/ventas/por-empleado/")}
              tooltip="Ventas por Empleado"
            >
              <Link href="/ventas/por-empleado">
                <UserCheck className="h-5 w-5" />
                <span>Ventas por Empleado</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <p>Joyería Sistema v1.0</p>
          </div>
          <SidebarTrigger />
        </div>
        {/* ✅ NUEVO: Indicador discreto de tiempo de sesión */}
        <SessionTimer />
      </SidebarFooter>
    </Sidebar>
  )
}
