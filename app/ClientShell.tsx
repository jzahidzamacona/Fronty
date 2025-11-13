"use client"

import type React from "react"
import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { usePathname, useRouter } from "next/navigation"
import { SidebarProvider } from "@/components/ui/sidebar"
import Navbar from "@/components/Navbar"
import IdleLogout from "@/components/IdleLogout"
import { useAuth } from "@/hooks/useAuth"

const SidebarNav = dynamic(() => import("@/components/sidebar-nav"), { ssr: false })

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const isLogin = pathname?.startsWith("/login") ?? false
  const user = useAuth()
  const [isInitialized, setIsInitialized] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    console.log("[v0] ClientShell - pathname:", pathname)
    console.log("[v0] ClientShell - isLogin:", isLogin)
    console.log("[v0] ClientShell - user:", user)
    console.log("[v0] ClientShell - isInitialized:", isInitialized)
    console.log("[v0] ClientShell - isRedirecting:", isRedirecting)
  }, [pathname, isLogin, user, isInitialized, isRedirecting])

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("[v0] ClientShell - Setting isInitialized to true")
      setIsInitialized(true)
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!isLogin && isInitialized && !user) {
      console.log("[v0] ClientShell - Redirecting to login because no user found")
      setIsRedirecting(true)
      router.push("/login")
    }
  }, [isLogin, router, isInitialized, user])

  if (isLogin) {
    return <div className="min-h-screen">{children}</div>
  }

  if (isRedirecting || !isInitialized || !user) {
    console.log("[v0] ClientShell - Showing loading spinner")
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  console.log("[v0] ClientShell - Rendering authenticated layout")
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <SidebarNav />
        <main className="flex-1 overflow-auto">
          <Navbar />
          <IdleLogout />
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
