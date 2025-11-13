"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import axiosInstance from "@/hooks/axiosInstance"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ArrowLeft, MoreHorizontal, Search, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

type Cliente = {
  id: number
  nombre?: string
  apellidoPaterno?: string
  apellidoMaterno?: string
  telefono?: string
}

type Venta = { id: number; fechaVenta?: string; fechaCreacion?: string; totalVenta: number }
type Apartado = { id: number; fechaApartado?: string; fechaCreacion?: string; totalApartado: number }
type Hechura = { id: number; fechaRecibida?: string; fechaCreacion?: string; total: number }
type Reloj = { id: number; fechaRecibida?: string; fechaCreacion?: string; total: number }

type NotaCredito = {
  id: number
  fechaCreacion?: string
  totalDisponible?: number
  totalUsado?: number
  totalOriginal?: number
  creditoRestante?: number
}

type Abono = {
  id: number
  fecha?: string
  monto: number
  tipoNota?: "VENTA" | "APARTADO" | "HECHURA" | "RELOJ"
  notaId?: number
}

type Bundle = {
  cliente: Cliente
  ventas?: Venta[]
  apartados?: Apartado[]
  hechuras?: Hechura[]
  relojes?: Reloj[]
  notasCredito?: NotaCredito[] | null
  abonos?: Abono[] | null
}

type Row = {
  clienteId: number
  clienteNombre: string
  clienteTelefono?: string 
  tipo: "VENTA" | "APARTADO" | "HECHURA" | "RELOJ" | "NOTA_CREDITO" | "ABONO"
  id: number
  fecha: string
  total: number
  descripcion?: string
  pdfUrl?: string
  folio: string
}

const currency = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" })

// Nombre seguro/defensivo
const fullName = (c?: Cliente) =>
  ([
    c?.nombre ?? "",
    c?.apellidoPaterno ?? "",
    c?.apellidoMaterno ?? "",
  ]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()) || "—"

const base = (process.env.NEXT_PUBLIC_REACT_BASE_LOCAL ?? "").replace(/\/$/, "")

const buildPdfUrl = (tipo: Row["tipo"], id: number): string | undefined => {
  if (tipo === "VENTA") return `${base}/api/pdf/venta/${id}`
  if (tipo === "APARTADO") return `${base}/api/pdf/apartado/${id}`
  if (tipo === "HECHURA") return `${base}/api/pdf/hechura/${id}`
  if (tipo === "RELOJ") return `${base}/api/pdf/reloj/${id}`
  if (tipo === "NOTA_CREDITO") return `${base}/api/pdf/nota-credito/${id}`
  return undefined
}

export default function ClienteNotasSearchPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [bundles, setBundles] = useState<Bundle[]>([])

  // filtros
  const [id, setId] = useState("")
  const [nombre, setNombre] = useState("")
  const [apP, setApP] = useState("")
  const [apM, setApM] = useState("")
  const [telefono, setTelefono] = useState("")

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
    } else {
      router.push("/")
    }
  }

  const fetchById = async () => {
    if (!id.trim()) return
    try {
      setLoading(true)
      const { data } = await axiosInstance.get<Bundle>(`/api/clientes/${id}/notas`)
      setBundles(data ? [data] : [])
    } catch {
      toast({ title: "Sin resultados", description: "No se encontró el cliente por ID.", variant: "destructive" })
      setBundles([])
    } finally {
      setLoading(false)
    }
  }

  const fetchByNombre = async () => {
    if (!nombre.trim() || !apP.trim()) {
      toast({ title: "Campos requeridos", description: "Nombre y Apellido Paterno son obligatorios.", variant: "destructive" })
      return
    }
    try {
      setLoading(true)
      const params = new URLSearchParams({
        nombre: nombre.trim(),
        apellidoPaterno: apP.trim(),
        apellidoMaterno: apM.trim(),
      })
      const { data } = await axiosInstance.get<Bundle[]>(`/api/clientes/buscar/nombre-completo?${params.toString()}`)
      setBundles(Array.isArray(data) ? data : [])
    } catch {
      toast({ title: "Sin resultados", description: "No se encontraron clientes con ese nombre.", variant: "destructive" })
      setBundles([])
    } finally {
      setLoading(false)
    }
  }

  // teléfono: intenta bundles por teléfono; si falla, busca clientes y agrega sus notas
  const fetchByTelefono = async () => {
    const raw = telefono.trim()
    if (!raw) return
    try {
      setLoading(true)
      const tel = raw.replace(/\D/g, "")

      // intento directo
      try {
        const { data } = await axiosInstance.get<Bundle[]>(
          `/api/clientes/buscar/telefono/notas?telefono=${encodeURIComponent(tel)}`
        )
        setBundles(Array.isArray(data) ? data : [])
        return
      } catch {
        // fallback
      }

      // fallback por cliente -> notas
      const { data: clientes } = await axiosInstance.get<Cliente[]>(
        `/api/clientes/buscar/telefono?telefono=${encodeURIComponent(tel)}`
      )

      const agg = await Promise.all(
        (clientes ?? []).map((c) =>
          axiosInstance.get<Bundle>(`/api/clientes/${c.id}/notas`).then((r) => r.data)
        )
      )

      setBundles(agg.filter(Boolean))
    } catch {
      toast({ title: "Sin resultados", description: "No se encontraron clientes con ese teléfono.", variant: "destructive" })
      setBundles([])
    } finally {
      setLoading(false)
    }
  }

  const rows: Row[] = useMemo(() => {
    const out: Row[] = []
    for (const b of bundles) {
      const c = b?.cliente
      const cn = fullName(c)
      const cid = c?.id ?? 0
      const ctel = c?.telefono ?? ""

      b.ventas?.forEach((v) => {
        const fecha = v.fechaVenta ?? v.fechaCreacion ?? ""
        out.push({
          clienteId: cid,
          clienteNombre: cn,
          clienteTelefono: ctel,  
          tipo: "VENTA",
          id: v.id,
          fecha,
          total: Number(v.totalVenta ?? 0),
          folio: `V-${v.id}`,
          pdfUrl: buildPdfUrl("VENTA", v.id),
        })
      })

      b.apartados?.forEach((a) => {
        const fecha = a.fechaApartado ?? a.fechaCreacion ?? ""
        out.push({
          clienteId: cid,
          clienteNombre: cn,
          clienteTelefono: ctel,
          tipo: "APARTADO",
          id: a.id,
          fecha,
          total: Number(a.totalApartado ?? 0),
          folio: `AP-${a.id}`,
          pdfUrl: buildPdfUrl("APARTADO", a.id),
        })
      })

      b.hechuras?.forEach((h) => {
        const fecha = h.fechaRecibida ?? h.fechaCreacion ?? ""
        out.push({
          clienteId: cid,
          clienteNombre: cn,
          clienteTelefono: ctel,
          tipo: "HECHURA",
          id: h.id,
          fecha,
          total: Number(h.total ?? 0),
          folio: `H-${h.id}`,
          pdfUrl: buildPdfUrl("HECHURA", h.id),
        })
      })

      b.relojes?.forEach((r) => {
        const fecha = r.fechaRecibida ?? r.fechaCreacion ?? ""
        out.push({
          clienteId: cid,
          clienteNombre: cn,
          clienteTelefono: ctel,
          tipo: "RELOJ",
          id: r.id,
          fecha,
          total: Number(r.total ?? 0),
          folio: `R-${r.id}`,
          pdfUrl: buildPdfUrl("RELOJ", r.id),
        })
      })

      b.notasCredito?.forEach((nc) => {
        const fecha = nc.fechaCreacion ?? ""
        const total = nc.totalDisponible ?? nc.totalOriginal ?? nc.creditoRestante ?? 0
        out.push({
          clienteId: cid,
          clienteNombre: cn,
          clienteTelefono: ctel,
          tipo: "NOTA_CREDITO",
          id: nc.id,
          fecha,
          total: Number(total),
          folio: `NC-${nc.id}`,
          pdfUrl: buildPdfUrl("NOTA_CREDITO", nc.id),
        })
      })

      b.abonos?.forEach((a) => {
        const fecha = a.fecha ?? ""
        const abonoPdf =
          a.tipoNota && a.notaId ? `${base}/api/abonos/ticket/${a.tipoNota}/${a.notaId}` : undefined
        out.push({
          clienteId: cid,
          clienteNombre: cn,
          clienteTelefono: ctel,
          tipo: "ABONO",
          id: a.id,
          fecha,
          total: Number(a.monto ?? 0),
          folio: `AB-${a.id}`,
          pdfUrl: abonoPdf,
          descripcion: a.tipoNota && a.notaId ? `${a.tipoNota} #${a.notaId}` : undefined,
        })
      })
    }
    return out.sort((x, y) => new Date(y.fecha).getTime() - new Date(x.fecha).getTime())
  }, [bundles])

  const openPdf = (url?: string) => url && window.open(url, "_blank")

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      {/* Encabezado con botón regresar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handleBack} aria-label="Regresar">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Notas por Cliente</h2>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Búsqueda</CardTitle>
          <CardDescription>Busca por ID, nombre completo o teléfono.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="id">
            <TabsList>
              <TabsTrigger value="id">Por ID</TabsTrigger>
              <TabsTrigger value="nombre">Por Nombre</TabsTrigger>
              <TabsTrigger value="telefono">Por Teléfono</TabsTrigger>
            </TabsList>

            <TabsContent value="id" className="mt-4 space-y-3">
              <div className="flex gap-2 items-center">
                <Input placeholder="ID de cliente" value={id} onChange={(e) => setId(e.target.value)} className="max-w-[220px]" />
                <Button onClick={fetchById} disabled={!id.trim() || loading}>
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                  Buscar
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="nombre" className="mt-4 space-y-3">
              <div className="flex flex-col gap-2 md:flex-row">
                <Input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className="max-w-[220px]" />
                <Input placeholder="Apellido paterno" value={apP} onChange={(e) => setApP(e.target.value)} className="max-w-[220px]" />
                <Input placeholder="Apellido materno" value={apM} onChange={(e) => setApM(e.target.value)} className="max-w-[220px]" />
                <Button onClick={fetchByNombre} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                  Buscar
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="telefono" className="mt-4 space-y-3">
              <div className="flex gap-2 items-center">
                <Input placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="max-w-[220px]" />
                <Button onClick={fetchByTelefono} disabled={!telefono.trim() || loading}>
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                  Buscar
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
          <CardDescription>Notas del cliente (ventas, apartados, etc.).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Folio</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      {loading ? "Buscando…" : "Sin resultados"}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={`${r.tipo}-${r.id}-${r.fecha}`}>
                      <TableCell className="font-medium">{r.folio}</TableCell>
                      <TableCell>
                        {r.tipo}
                        {r.descripcion ? ` (${r.descripcion})` : ""}
                      </TableCell>
                      <TableCell>{r.fecha ? new Date(r.fecha).toLocaleString("es-MX") : "-"}</TableCell>
                      <TableCell>{r.clienteNombre}</TableCell>
                      <TableCell>
  {r.clienteTelefono ? (
    <a href={`tel:${r.clienteTelefono.replace(/\D/g, "")}`}>{r.clienteTelefono}</a>
  ) : "—"}
</TableCell> 
                      <TableCell>{currency(r.total)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem disabled={!r.pdfUrl} onClick={() => openPdf(r.pdfUrl)}>
                              Ver PDF
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
