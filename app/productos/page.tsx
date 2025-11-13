"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductosTable } from "@/components/productos/productos-table"
import AsignarCodigosBarra from "@/components/productos/AsignarCodigosBarra"
import { Plus, RefreshCw } from "lucide-react"

export default function ProductosPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Productos</h2>

        <div className="flex gap-2">
          <Link href="/productos/actualizar">
            <Button variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar Inventario
            </Button>
          </Link>
          <Link href="/productos/nuevo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Producto
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="todos">
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="oro">Oro</TabsTrigger>
          <TabsTrigger value="plata">Plata</TabsTrigger>
          <TabsTrigger value="bajo-stock">Bajo Stock</TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="space-y-4">
          <ProductosTable />
        </TabsContent>
        <TabsContent value="oro" className="space-y-4">
          <ProductosTable filter="oro" />
        </TabsContent>
        <TabsContent value="plata" className="space-y-4">
          <ProductosTable filter="plata" />
        </TabsContent>
        <TabsContent value="bajo-stock" className="space-y-4">
          <ProductosTable filter="bajo-stock" />
        </TabsContent>
      </Tabs>

      <AsignarCodigosBarra />
    </div>
  )
}
