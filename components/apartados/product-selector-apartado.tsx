// components/common/product-selector.tsx
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Plus, Search } from "lucide-react"
import axiosInstance from "@/hooks/axiosInstance"

export interface Joya {
  id: number
  nombre: string
  kilataje: string
  precio: number
  cantidad: number
}

type OutProduct = {
  id: number
  code: string
  name: string
  kilataje: string
  price: number
  stock: number
  barcode?: string
}

export function ProductSelector({ onSelectProduct }: { onSelectProduct: (p: OutProduct) => void }) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [joyas, setJoyas] = useState<Joya[]>([])
  const [loading, setLoading] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)

  const inputRef = useRef<HTMLInputElement | null>(null)
  const scanTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const fetchJoyas = async () => {
      try {
        const { data } = await axiosInstance.get<Joya[]>("/api/joyas/primeros?limite=10")
        setJoyas(data)
      } catch (e) {
        console.error("Error al cargar joyas:", e)
      }
    }
    if (open) {
      fetchJoyas()
      setTimeout(() => inputRef.current?.focus(), 0)
    } else {
      setSearchTerm("")
      setScanError(null)
      if (scanTimer.current) clearTimeout(scanTimer.current)
    }
  }, [open])

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return joyas
    return joyas.filter(j => j.nombre.toLowerCase().includes(term) || j.kilataje.toLowerCase().includes(term) || `p-${j.id}`.includes(term))
  }, [joyas, searchTerm])

  const buildSelected = (j: Joya): OutProduct => ({
    id: j.id,
    code: `P-${j.id}`,
    name: j.nombre,
    kilataje: j.kilataje,
    price: j.precio,
    stock: j.cantidad,
  })

  const handleSelect = (j: Joya) => {
    onSelectProduct(buildSelected(j))
    setOpen(false)
  }

  const isProbablyBarcode = (v: string) => /^\d{8,18}$/.test(v)

  const resolveBarcode = async (raw: string) => {
    const code = raw.trim()
    if (!isProbablyBarcode(code)) return
    try {
      setScanning(true); setLoading(true); setScanError(null)
      const { data } = await axiosInstance.get<Joya>(`/api/joyas/buscar/codigo-barra/${encodeURIComponent(code)}`)
      onSelectProduct({ ...buildSelected(data), barcode: code })
      setOpen(false)
      setSearchTerm("")
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Código de barras no disponible."
      setScanError(msg)
    } finally {
      setLoading(false); setScanning(false)
    }
  }

  const onChangeSearch = (v: string) => {
    setSearchTerm(v); setScanError(null)
    if (scanTimer.current) clearTimeout(scanTimer.current)
    if (isProbablyBarcode(v)) {
      scanTimer.current = setTimeout(() => { if (!scanning) resolveBarcode(v) }, 150)
    }
  }

  const onSearchKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") { e.preventDefault(); resolveBarcode(searchTerm) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button id="product-selector-trigger" variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" /> Agregar Producto
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Seleccionar Producto</DialogTitle>
          <DialogDescription>Escanea un código o busca por nombre/código.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 py-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Buscar… (escanea aquí)"
            value={searchTerm}
            onChange={(e) => onChangeSearch(e.target.value)}
            onKeyDown={onSearchKeyDown}
            className="h-9"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
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
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center">No se encontraron productos.</TableCell></TableRow>
              ) : (
                filtered.map(j => (
                  <TableRow key={j.id}>
                    <TableCell>{`P-${j.id}`}</TableCell>
                    <TableCell>{j.nombre}</TableCell>
                    <TableCell>{j.kilataje}</TableCell>
                    <TableCell>${j.precio.toFixed(2)}</TableCell>
                    <TableCell>{j.cantidad}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleSelect(j)} disabled={j.cantidad <= 0} title="Agregar">
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
          <Button variant="outline" onClick={() => setOpen(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
