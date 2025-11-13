"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Mail, FileText } from "lucide-react"

export function DailyReport() {
  const currentDate = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h3 className="text-lg font-medium">Reporte Diario</h3>
          <p className="text-sm text-muted-foreground">Resumen de operaciones del día actual</p>
          <p className="text-md font-medium mt-2">Reporte del {currentDate}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Descargar PDF
          </Button>
          <Button variant="outline" size="sm">
            <Mail className="mr-2 h-4 w-4" />
            Enviar por correo
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="mr-2 h-4 w-4" />
            Mostrar en PDF
          </Button>
        </div>
      </div>

      <Tabs defaultValue="ventas">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="ventas">Ventas</TabsTrigger>
          <TabsTrigger value="apartados">Apartados</TabsTrigger>
          <TabsTrigger value="hechuras">Hechuras</TabsTrigger>
          <TabsTrigger value="relojes">Relojes</TabsTrigger>
          <TabsTrigger value="abonos">Abonos</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
        </TabsList>

        <TabsContent value="ventas" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Ventas Totales</div>
                <div className="text-2xl font-bold">$12,450.00</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Número de Ventas</div>
                <div className="text-2xl font-bold">8</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Ticket Promedio</div>
                <div className="text-2xl font-bold">$1,556.25</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Ventas por Tarjeta</div>
                <div className="text-2xl font-bold">$5,230.00</div>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-md border">
            <div className="p-4">
              <h4 className="text-sm font-medium">Detalle de Ventas</h4>
            </div>
            <div className="px-4 pb-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left text-sm font-medium">Folio</th>
                    <th className="py-2 text-left text-sm font-medium">Cliente</th>
                    <th className="py-2 text-left text-sm font-medium">Productos</th>
                    <th className="py-2 text-left text-sm font-medium">Total</th>
                    <th className="py-2 text-left text-sm font-medium">Forma de Pago</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 text-sm">V-2023-0145</td>
                    <td className="py-2 text-sm">María Rodríguez</td>
                    <td className="py-2 text-sm">Anillo de compromiso</td>
                    <td className="py-2 text-sm">$4,999.00</td>
                    <td className="py-2 text-sm">Tarjeta</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 text-sm">V-2023-0146</td>
                    <td className="py-2 text-sm">Juan López</td>
                    <td className="py-2 text-sm">Reloj de pulsera</td>
                    <td className="py-2 text-sm">$3,889.00</td>
                    <td className="py-2 text-sm">Efectivo</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 text-sm">V-2023-0147</td>
                    <td className="py-2 text-sm">Sofía Díaz</td>
                    <td className="py-2 text-sm">Pulsera de oro</td>
                    <td className="py-2 text-sm">$1,999.00</td>
                    <td className="py-2 text-sm">Tarjeta</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="apartados" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Apartados Activos</div>
                <div className="text-2xl font-bold">24</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Total Apartado</div>
                <div className="text-2xl font-bold">$35,678.50</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Total Abonado</div>
                <div className="text-2xl font-bold">$12,345.00</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Por Cobrar</div>
                <div className="text-2xl font-bold">$23,333.50</div>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-md border">
            <div className="p-4">
              <h4 className="text-sm font-medium">Detalle de Apartados</h4>
            </div>
            <div className="px-4 pb-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left text-sm font-medium">Folio</th>
                    <th className="py-2 text-left text-sm font-medium">Cliente</th>
                    <th className="py-2 text-left text-sm font-medium">Productos</th>
                    <th className="py-2 text-left text-sm font-medium">Total</th>
                    <th className="py-2 text-left text-sm font-medium">Abonado</th>
                    <th className="py-2 text-left text-sm font-medium">Restante</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 text-sm">A-2023-0045</td>
                    <td className="py-2 text-sm">Carlos Mendoza</td>
                    <td className="py-2 text-sm">Aretes de plata</td>
                    <td className="py-2 text-sm">$1,899.00</td>
                    <td className="py-2 text-sm">$500.00</td>
                    <td className="py-2 text-sm">$1,399.00</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 text-sm">A-2023-0046</td>
                    <td className="py-2 text-sm">Laura Vega</td>
                    <td className="py-2 text-sm">Dije personalizado</td>
                    <td className="py-2 text-sm">$2,249.00</td>
                    <td className="py-2 text-sm">$750.00</td>
                    <td className="py-2 text-sm">$1,499.00</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 text-sm">A-2023-0047</td>
                    <td className="py-2 text-sm">Roberto Sánchez</td>
                    <td className="py-2 text-sm">Cadena de oro</td>
                    <td className="py-2 text-sm">$4,499.00</td>
                    <td className="py-2 text-sm">$1,500.00</td>
                    <td className="py-2 text-sm">$2,999.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="hechuras" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Hechuras Activas</div>
                <div className="text-2xl font-bold">12</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Entregas Pendientes</div>
                <div className="text-2xl font-bold">8</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Valor Total</div>
                <div className="text-2xl font-bold">$28,750.00</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Entregas Hoy</div>
                <div className="text-2xl font-bold">2</div>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-md border">
            <div className="p-4">
              <h4 className="text-sm font-medium">Detalle de Hechuras</h4>
            </div>
            <div className="px-4 pb-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left text-sm font-medium">Folio</th>
                    <th className="py-2 text-left text-sm font-medium">Cliente</th>
                    <th className="py-2 text-left text-sm font-medium">Descripción</th>
                    <th className="py-2 text-left text-sm font-medium">Fecha Entrega</th>
                    <th className="py-2 text-left text-sm font-medium">Total</th>
                    <th className="py-2 text-left text-sm font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 text-sm">H-2023-0025</td>
                    <td className="py-2 text-sm">Elena Martínez</td>
                    <td className="py-2 text-sm">Anillo de compromiso personalizado</td>
                    <td className="py-2 text-sm">30/04/2025</td>
                    <td className="py-2 text-sm">$8,500.00</td>
                    <td className="py-2 text-sm">En proceso</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 text-sm">H-2023-0026</td>
                    <td className="py-2 text-sm">Ricardo Fuentes</td>
                    <td className="py-2 text-sm">Dije con iniciales grabadas</td>
                    <td className="py-2 text-sm">28/04/2025</td>
                    <td className="py-2 text-sm">$3,200.00</td>
                    <td className="py-2 text-sm">Listo para entrega</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 text-sm">H-2023-0027</td>
                    <td className="py-2 text-sm">Carmen Ortiz</td>
                    <td className="py-2 text-sm">Pulsera con dijes personalizados</td>
                    <td className="py-2 text-sm">05/05/2025</td>
                    <td className="py-2 text-sm">$4,800.00</td>
                    <td className="py-2 text-sm">En proceso</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="relojes" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Relojes en Reparación</div>
                <div className="text-2xl font-bold">9</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Listos para Entrega</div>
                <div className="text-2xl font-bold">3</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Valor Total</div>
                <div className="text-2xl font-bold">$12,350.00</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Entregas Hoy</div>
                <div className="text-2xl font-bold">1</div>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-md border">
            <div className="p-4">
              <h4 className="text-sm font-medium">Detalle de Relojes</h4>
            </div>
            <div className="px-4 pb-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left text-sm font-medium">Folio</th>
                    <th className="py-2 text-left text-sm font-medium">Cliente</th>
                    <th className="py-2 text-left text-sm font-medium">Marca/Modelo</th>
                    <th className="py-2 text-left text-sm font-medium">Servicio</th>
                    <th className="py-2 text-left text-sm font-medium">Fecha Entrega</th>
                    <th className="py-2 text-left text-sm font-medium">Total</th>
                    <th className="py-2 text-left text-sm font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 text-sm">R-2023-0018</td>
                    <td className="py-2 text-sm">Fernando Gómez</td>
                    <td className="py-2 text-sm">Citizen Eco-Drive</td>
                    <td className="py-2 text-sm">Cambio de batería</td>
                    <td className="py-2 text-sm">26/04/2025</td>
                    <td className="py-2 text-sm">$850.00</td>
                    <td className="py-2 text-sm">Listo</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 text-sm">R-2023-0019</td>
                    <td className="py-2 text-sm">Lucía Hernández</td>
                    <td className="py-2 text-sm">Fossil Carlie</td>
                    <td className="py-2 text-sm">Ajuste de malla</td>
                    <td className="py-2 text-sm">27/04/2025</td>
                    <td className="py-2 text-sm">$450.00</td>
                    <td className="py-2 text-sm">En proceso</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 text-sm">R-2023-0020</td>
                    <td className="py-2 text-sm">Javier Torres</td>
                    <td className="py-2 text-sm">Seiko Presage</td>
                    <td className="py-2 text-sm">Servicio completo</td>
                    <td className="py-2 text-sm">02/05/2025</td>
                    <td className="py-2 text-sm">$1,800.00</td>
                    <td className="py-2 text-sm">En proceso</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="abonos" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Abonos del Día</div>
                <div className="text-2xl font-bold">$1,250.00</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Número de Abonos</div>
                <div className="text-2xl font-bold">2</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Abonos en Efectivo</div>
                <div className="text-2xl font-bold">$500.00</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Abonos con Tarjeta</div>
                <div className="text-2xl font-bold">$750.00</div>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-md border">
            <div className="p-4">
              <h4 className="text-sm font-medium">Detalle de Abonos</h4>
            </div>
            <div className="px-4 pb-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left text-sm font-medium">Folio</th>
                    <th className="py-2 text-left text-sm font-medium">Cliente</th>
                    <th className="py-2 text-left text-sm font-medium">Referencia</th>
                    <th className="py-2 text-left text-sm font-medium">Tipo</th>
                    <th className="py-2 text-left text-sm font-medium">Monto</th>
                    <th className="py-2 text-left text-sm font-medium">Forma de Pago</th>
                    <th className="py-2 text-left text-sm font-medium">Hora</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 text-sm">AB-2023-0089</td>
                    <td className="py-2 text-sm">Carlos Mendoza</td>
                    <td className="py-2 text-sm">A-2023-0045</td>
                    <td className="py-2 text-sm">Apartado</td>
                    <td className="py-2 text-sm">$500.00</td>
                    <td className="py-2 text-sm">Efectivo</td>
                    <td className="py-2 text-sm">11:30</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 text-sm">AB-2023-0090</td>
                    <td className="py-2 text-sm">Laura Vega</td>
                    <td className="py-2 text-sm">H-2023-0026</td>
                    <td className="py-2 text-sm">Hechura</td>
                    <td className="py-2 text-sm">$750.00</td>
                    <td className="py-2 text-sm">Tarjeta</td>
                    <td className="py-2 text-sm">14:15</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="stock" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Productos en Stock</div>
                <div className="text-2xl font-bold">342</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Valor de Inventario</div>
                <div className="text-2xl font-bold">$245,780.00</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Movimientos del Día</div>
                <div className="text-2xl font-bold">7</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Stock Bajo</div>
                <div className="text-2xl font-bold">12</div>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-md border">
            <div className="p-4">
              <h4 className="text-sm font-medium">Movimientos de Stock</h4>
            </div>
            <div className="px-4 pb-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left text-sm font-medium">Código</th>
                    <th className="py-2 text-left text-sm font-medium">Producto</th>
                    <th className="py-2 text-left text-sm font-medium">Tipo</th>
                    <th className="py-2 text-left text-sm font-medium">Cantidad</th>
                    <th className="py-2 text-left text-sm font-medium">Stock Actual</th>
                    <th className="py-2 text-left text-sm font-medium">Hora</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 text-sm">P-0123</td>
                    <td className="py-2 text-sm">Anillo de oro 14k</td>
                    <td className="py-2 text-sm">Salida</td>
                    <td className="py-2 text-sm">1</td>
                    <td className="py-2 text-sm">3</td>
                    <td className="py-2 text-sm">10:15</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 text-sm">P-0456</td>
                    <td className="py-2 text-sm">Cadena de plata</td>
                    <td className="py-2 text-sm">Salida</td>
                    <td className="py-2 text-sm">2</td>
                    <td className="py-2 text-sm">8</td>
                    <td className="py-2 text-sm">12:30</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 text-sm">P-0789</td>
                    <td className="py-2 text-sm">Aretes de diamante</td>
                    <td className="py-2 text-sm">Entrada</td>
                    <td className="py-2 text-sm">4</td>
                    <td className="py-2 text-sm">12</td>
                    <td className="py-2 text-sm">15:45</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
