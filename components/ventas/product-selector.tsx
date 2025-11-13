"use client"

import type React from "react"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Plus, Search } from "lucide-react"
import axiosInstance from "@/hooks/axiosInstance"

interface Joya {
  id: number
  nombre: string
  kilataje: string
  precio: number
  cantidad: number // stock
}

interface BackendJoya extends Joya {
  totalCodigosAsignados?: number
  previewCodigosAsignados?: string[]
}

interface ProductSelectorProps {
  onSelectProduct: (product: {
    id: number
    code: string
    name: string
    kilataje: string
    price: number
    stock: number
    barcode?: string // ← se agrega para que el padre pueda evitar duplicados y sumar cantidad
  }) => void
}

export function ProductSelector({ onSelectProduct }: ProductSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [joyas, setJoyas] = useState<Joya[]>([]) // Los 10 iniciales
  const [searchResults, setSearchResults] = useState<Joya[]>([]) // Resultados de búsqueda
  const [loading, setLoading] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  const inputRef = useRef<HTMLInputElement | null>(null)
  const scanTimer = useRef<NodeJS.Timeout | null>(null)
  const searchTimer = useRef<NodeJS.Timeout | null>(null)

  // Carga inicial (10 primeros) al abrir
  useEffect(() => {
    const fetchJoyas = async () => {
      try {
        const { data } = await axiosInstance.get<Joya[]>("/api/joyas/primeros?limite=10")
        setJoyas(data)
      } catch (error) {
        console.error("Error al cargar joyas:", error)
      }
    }
    if (open) {
      fetchJoyas()
      setTimeout(() => inputRef.current?.focus(), 0)
    } else {
      setSearchTerm("")
      setSearchResults([])
      setScanError(null)
      setIsSearching(false)
      if (scanTimer.current) clearTimeout(scanTimer.current)
      if (searchTimer.current) clearTimeout(searchTimer.current)
    }
  }, [open])

  // Buscar productos por ID cuando se escribe un número
  const searchProductById = async (id: string) => {
    if (!id.trim() || isNaN(Number(id))) return

    setIsSearching(true)
    setLoading(true)
    try {
      const { data } = await axiosInstance.get<Joya>(`/api/joyas/${id}`)
      setSearchResults([data])
    } catch (error) {
      console.error("Error al buscar producto:", error)
      setSearchResults([])
    } finally {
      setLoading(false)
      setIsSearching(false)
    }
  }

  // Determinar qué productos mostrar
  const displayedProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    // Si no hay término de búsqueda, mostrar los 10 iniciales
    if (!term) return joyas

    // Si hay resultados de búsqueda específica, mostrarlos
    if (searchResults.length > 0) return searchResults

    // Si no, filtrar dentro de los 10 iniciales por nombre/kilataje
    return joyas.filter((j) => j.nombre.toLowerCase().includes(term) || j.kilataje.toLowerCase().includes(term))
  }, [joyas, searchResults, searchTerm])

  const buildSelected = (j: Joya) => ({
    id: j.id,
    code: `P-${j.id}`,
    name: j.nombre,
    kilataje: j.kilataje,
    price: j.precio,
    stock: j.cantidad,
  })

  const handleSelectProduct = (joya: Joya) => {
    onSelectProduct(buildSelected(joya))
    setOpen(false)
  }

  // Heurística simple: códigos EAN/UPC suelen ser 8–18 dígitos
  const isProbablyBarcode = (v: string) => /^\d{8,18}$/.test(v)

  const resolveBarcode = async (raw: string) => {
    const code = raw.trim()
    if (!isProbablyBarcode(code)) return
    try {
      setScanning(true)
      setLoading(true)
      setScanError(null)

      const { data } = await axiosInstance.get<BackendJoya>(
        `/api/joyas/buscar/codigo-barra/${encodeURIComponent(code)}`,
      )

      // Auto-agrega con el barcode incluido y cierra
      onSelectProduct({ ...buildSelected(data), barcode: code })
      setOpen(false)
      setSearchTerm("")
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || // Spring suele mandar aquí el detalle
        err?.response?.data?.error ||
        err?.message ||
        "Código de barras no disponible."
      setScanError(msg)
    } finally {
      setLoading(false)
      setScanning(false)
    }
  }

  // Auto-scan por pausa breve (para pistolas sin Enter)
  const onChangeSearch = (v: string) => {
    setSearchTerm(v)
    setScanError(null)
    setSearchResults([]) // Limpiar resultados anteriores

    // Limpiar timers anteriores
    if (scanTimer.current) clearTimeout(scanTimer.current)
    if (searchTimer.current) clearTimeout(searchTimer.current)

    // Si parece código de barras, intentar escanear
    if (isProbablyBarcode(v)) {
      scanTimer.current = setTimeout(() => {
        if (!scanning) resolveBarcode(v)
      }, 150)
    }
    // Si parece ID de producto (solo números, pero no código de barras), buscar
    else if (/^\d+$/.test(v) && v.length < 8) {
      searchTimer.current = setTimeout(() => {
        searchProductById(v)
      }, 300)
    }
  }

  // Escaneo con Enter (la mayoría de pistolas lo mandan)
  const onSearchKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const term = searchTerm.trim()

      // Si parece código de barras, escanear
      if (isProbablyBarcode(term)) {
        resolveBarcode(term)
      }
      // Si parece ID de producto, buscar
      else if (/^\d+$/.test(term)) {
        searchProductById(term)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button id="product-selector-trigger" variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Agregar Producto
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Seleccionar Producto</DialogTitle>
          <DialogDescription>Escanea un código de barras, busca por ID (ej. 34) o por nombre/código.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 py-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Buscar por ID, nombre o código… (escanea aquí)"
            value={searchTerm}
            onChange={(e) => onChangeSearch(e.target.value)}
            onKeyDown={onSearchKeyDown}
            className="h-9"
          />
          {(loading || isSearching) && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        {scanError && <div className="text-sm text-red-600 -mt-3 mb-2">{scanError}</div>}

        <div className="max-h-[300px] overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Kilataje</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    {isSearching ? "Buscando..." : "No se encontraron productos."}
                  </TableCell>
                </TableRow>
              ) : (
                displayedProducts.map((joya) => (
                  <TableRow key={joya.id}>
                    <TableCell>{`P-${joya.id}`}</TableCell>
                    <TableCell>{joya.nombre}</TableCell>
                    <TableCell>{joya.kilataje}</TableCell>
                    <TableCell>${joya.precio.toFixed(2)}</TableCell>
                    <TableCell>{joya.cantidad}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelectProduct(joya)}
                        disabled={joya.cantidad <= 0}
                        title="Agregar"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
