"use client"

import { useEffect, useMemo, useState } from "react"
import axiosInstance from "@/hooks/axiosInstance"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal,
  Search, FileText, Edit, Trash2, AlertTriangle, RefreshCw,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Producto {
  id: number
  nombre: string
  kilataje: string
  cantidad: number
  precio: number
  creadoPor: number
  modificadoPor: number | null
  fechaCreacion: string
  fechaModificacion: string | null
}

interface ProductosTableProps {
  filter?: "oro" | "plata" | "bajo-stock"
}

const isPositiveInt = (s: string) => /^[1-9]\d*$/.test(s.trim())

export function ProductosTable({ filter }: ProductosTableProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [listaBase, setListaBase] = useState<Producto[]>([])        // ← los 10 primeros
  const [resultadosId, setResultadosId] = useState<Producto[] | null>(null) // ← búsqueda por ID

  const base = useMemo(
    () => (process.env.NEXT_PUBLIC_MSO_API_JOYA ?? "/api/joyas").replace(/\/$/, ""),
    []
  )

  // 1) Cargar SIEMPRE los 10 primeros para vista rápida
  useEffect(() => {
    const fetchPrimeros = async () => {
      try {
        const { data } = await axiosInstance.get<Producto[]>(`${base}/primeros?limit=10`)
        setListaBase(data)
      } catch (e) {
        console.error("Error al obtener productos:", e)
        setListaBase([])
      }
    }
    fetchPrimeros()
  }, [base])

  // 2) Si escriben un ID exacto, traer ese producto del backend
  useEffect(() => {
    const term = searchTerm.trim()

    // limpiar resultados si no hay búsqueda o no es un entero → volvemos a lista base
    if (!term || !isPositiveInt(term)) {
      setResultadosId(null)
      return
    }

    const id = Number(term)
    const t = setTimeout(async () => {
      try {
        const { data } = await axiosInstance.get<Producto>(`${base}/${id}`)
        setResultadosId(data ? [data] : [])
      } catch {
        setResultadosId([]) // 404 u otro error → sin resultados
      }
    }, 300) // debounce

    return () => clearTimeout(t)
  }, [searchTerm, base])

  // 3) Datos a renderizar:
  //    - Si hay resultadosId !== null → estamos en modo “búsqueda por ID”
  //    - Si no, usamos listaBase y aplicamos filtros locales (tipo + texto)
  const datos = useMemo(() => {
    if (resultadosId !== null) {
      return resultadosId
    }

    let filtered = [...listaBase]

    // filtro por tipo
    if (filter === "oro") {
      filtered = filtered.filter(p => p.kilataje.toLowerCase().includes("oro"))
    } else if (filter === "plata") {
      filtered = filtered.filter(p => p.kilataje.toLowerCase().includes("pl"))
    } else if (filter === "bajo-stock") {
      filtered = filtered.filter(p => p.cantidad <= 3)
    }

    // filtro por texto (no-ID): nombre/kilataje/id dentro de los 10
    if (searchTerm && !isPositiveInt(searchTerm)) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p =>
        p.nombre.toLowerCase().includes(term) ||
        p.kilataje.toLowerCase().includes(term) ||
        p.id.toString().includes(term)
      )
    }

    return filtered.sort((a, b) => a.id - b.id)
  }, [resultadosId, listaBase, filter, searchTerm])

  const handleUpdateInventory = (productId: number) => {
    router.push(`/productos/actualizar?id=${productId}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID, nombre o kilataje..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 w-[250px] lg:w-[300px]"
          />
        </div>
        <Link href="/productos/actualizar">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar Inventario
          </Button>
        </Link>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Kilataje</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead>Creado por</TableHead>
              <TableHead>Actualizado por</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {datos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            ) : (
              datos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.id}</TableCell>
                  <TableCell>{p.nombre}</TableCell>
                  <TableCell>{p.kilataje}</TableCell>
                  <TableCell className="text-right">
                    {p.cantidad <= 3 ? (
                      <div className="flex items-center justify-end">
                        <span className="mr-2">{p.cantidad}</span>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      </div>
                    ) : (
                      p.cantidad
                    )}
                  </TableCell>
                  <TableCell className="text-right">${p.precio.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <div>ID: {p.creadoPor}</div>
                      <div className="text-muted-foreground">
                        {new Date(p.fechaCreacion).toLocaleDateString("es-MX")}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <div>{p.modificadoPor ? `ID: ${p.modificadoPor}` : "—"}</div>
                      <div className="text-muted-foreground">
                        {p.fechaModificacion
                          ? new Date(p.fechaModificacion).toLocaleDateString("es-MX")
                          : "—"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleUpdateInventory(p.id)}
                        title="Actualizar inventario"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Link href={`/productos/${p.id}`} className="flex items-center">
                              <FileText className="mr-2 h-4 w-4" />
                              Ver detalles
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Link href={`/productos/${p.id}/editar`} className="flex items-center">
                              <Edit className="mr-2 h-4 w-4" />
                              Editar producto
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar producto
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* paginación deshabilitada por ahora (lista de 10) */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button variant="outline" size="sm" disabled>
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" disabled>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" disabled>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" disabled>
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
