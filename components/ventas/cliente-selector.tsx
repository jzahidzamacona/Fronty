"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { ClienteFormDialog } from "@/components/clientes/cliente-form-dialog"
import axiosInstance from "@/hooks/axiosInstance"

interface Cliente {
  id: string | number
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  telefono?: string | null
  nombreCompleto?: string
}

interface ClienteSelectorProps {
  value: string
  onValueChange: (value: string) => void
  vendedorId?: string
}

export function ClienteSelector({ value, onValueChange, vendedorId }: ClienteSelectorProps) {
  const [open, setOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [query, setQuery] = useState("")
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const composedName = (c: Cliente) =>
    c?.nombreCompleto?.trim() ||
    `${c?.nombre ?? ""} ${c?.apellidoPaterno ?? ""} ${c?.apellidoMaterno ?? ""}`
      .replace(/\s+/g, " ")
      .trim()

  const isPhone = (s: string) => /^\d{2,}$/.test(s.replace(/\s|[-()+]/g, "")) // 2+ dígitos

  const selectedLabel = useMemo(() => {
    const c = clientes.find((x) => String(x.id) === String(value))
    return c ? `${composedName(c)} — ${c.telefono ?? "s/tel"}` : "Seleccionar cliente"
  }, [value, clientes])

  async function fetchDefault() {
    try {
      const res = await axiosInstance.get("/api/clientes")
      setClientes(res.data ?? [])
    } catch (e) {
      console.error("Error cargando clientes:", e)
      setClientes([])
    }
  }

  async function search(q: string) {
    const trimmed = q.trim()
    if (!trimmed) {
      await fetchDefault()
      return
    }
    try {
      if (isPhone(trimmed)) {
        const tel = trimmed.replace(/\s|[-()+]/g, "")
        const res = await axiosInstance.get("/api/clientes/buscar/telefono", { params: { telefono: tel } })
        setClientes(res.data ?? [])
      } else {
        const res = await axiosInstance.get("/api/clientes/buscar/nombre", { params: { q: trimmed } })
        setClientes(res.data ?? [])
      }
    } catch (e) {
      console.error("Error buscando clientes:", e)
      setClientes([])
    }
  }

  useEffect(() => {
    fetchDefault()
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 250)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const handleClienteCreated = (cliente: Cliente) => {
    setClientes((prev) => [...prev, cliente])
    onValueChange(String(cliente.id))
  }

  const handleNuevoClienteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDialogOpen(true)
  }

  return (
    <div className="flex gap-2 w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            id="cliente-selector-trigger"
          >
            {selectedLabel}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[360px] p-0">
          {/* Importante: shouldFilter desactiva el filtro interno de Command */}
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar por nombre o teléfono…"
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>No se encontraron clientes.</CommandEmpty>
              <CommandGroup>
                {clientes.map((cliente) => {
                  const label = `${composedName(cliente)} — ${cliente.telefono ?? "Sin teléfono"}`
                  return (
                    <CommandItem
                      key={cliente.id}
                      value={label.toLowerCase()} // opcional, no filtra pero ayuda para accesibilidad
                      onSelect={() => {
                        onValueChange(String(cliente.id))
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          String(value) === String(cliente.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{composedName(cliente)}</span>
                        <span className="text-xs opacity-70">{cliente.telefono ?? "Sin teléfono"}</span>
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="icon"
        onClick={handleNuevoClienteClick}
        aria-label="Nuevo cliente"
        title="Nuevo cliente"
      >
        <UserPlus className="h-4 w-4" />
      </Button>

      <ClienteFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onClienteCreated={handleClienteCreated}
        vendedorId={vendedorId}
      />
    </div>
  )
}
