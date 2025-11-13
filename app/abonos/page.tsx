"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AbonosTable } from "@/components/abonos/abonos-table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function AbonosPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Abonos</h2>
          <p className="text-muted-foreground">Listado completo de todos los abonos</p>
        </div>
        <Link href="/abonos/nuevo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Abono
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="TODOS" className="space-y-4">
        <TabsList>
          <TabsTrigger value="TODOS">Todos</TabsTrigger>
          <TabsTrigger value="APARTADO">Apartados</TabsTrigger>
          <TabsTrigger value="HECHURA">Hechuras</TabsTrigger>
          <TabsTrigger value="HECHURA_ARGOLLA">Hechuras Argolla</TabsTrigger>
          <TabsTrigger value="RELOJ">Relojes</TabsTrigger>
        </TabsList>

        <TabsContent value="TODOS">
          <AbonosTable />
        </TabsContent>

        <TabsContent value="APARTADO">
          <AbonosTable filter="APARTADO" />
        </TabsContent>

        <TabsContent value="HECHURA">
          <AbonosTable filter="HECHURA" />
        </TabsContent>

        {/* ✅ pestaña propia para Argolla */}
        <TabsContent value="HECHURA_ARGOLLA">
          <AbonosTable filter="HECHURA_ARGOLLA" />
        </TabsContent>

        <TabsContent value="RELOJ">
          <AbonosTable filter="RELOJ" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
