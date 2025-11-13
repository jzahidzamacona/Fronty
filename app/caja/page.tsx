

import type { Metadata } from "next"
import { CajaTable } from "@/components/caja/caja-table"
import { SalidasCajaTable } from "@/components/caja/salidas-caja-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlusCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RegistrarSalidaForm } from "@/components/caja/registrar-salida-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Caja | Joyería Sistema",
  description: "Gestión de caja diaria",
}

export default function CajaPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Caja</h1>
          <p className="text-muted-foreground">Gestiona los registros de caja diarios</p>
        </div>
        <Button asChild>
          <Link href="/caja/nuevo">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Apertura
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="registros" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="registros">Registros de Caja</TabsTrigger>
          <TabsTrigger value="salidas">Salidas de Efectivo</TabsTrigger>
        </TabsList>

        <TabsContent value="registros" className="mt-6">
          <CajaTable />
        </TabsContent>

        <TabsContent value="salidas" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Registrar Salida de Efectivo</CardTitle>
              <CardDescription>Registra retiros de efectivo realizados por los dueños</CardDescription>
            </CardHeader>
            <CardContent>
              <RegistrarSalidaForm />
            </CardContent>
          </Card>

          <SalidasCajaTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}
