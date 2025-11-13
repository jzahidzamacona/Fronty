"use client"

import type React from "react"
import { useEffect, useState } from "react"
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
  id: string
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
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

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await axiosInstance.get("/api/clientes")
        setClientes(response.data)
      } catch (error) {
        console.error("Error al cargar clientes:", error)
      }
    }

    fetchClientes()
  }, [])

  const handleClienteCreated = (cliente: Cliente) => {
    setClientes((prev) => [...prev, cliente])
    onValueChange(cliente.id)
  }

  const handleNuevoClienteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDialogOpen(true)
  }

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            id="cliente-selector-trigger"
          >
            {value
              ? (() => {
                  const cliente = clientes.find((c) => c.id === value)
                  return cliente
                    ? `${cliente.nombre} ${cliente.apellidoPaterno} ${cliente.apellidoMaterno}`
                    : "Seleccionar cliente"
                })()
              : "Seleccionar cliente"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Buscar cliente..." />
            <CommandList>
              <CommandEmpty>No se encontraron clientes.</CommandEmpty>
              <CommandGroup>
                {clientes.map((cliente) => (
                  <CommandItem
                    key={cliente.id}
                    value={cliente.id}
                    onSelect={() => {
                      onValueChange(cliente.id)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn("mr-2 h-4 w-4", value === cliente.id ? "opacity-100" : "opacity-0")}
                    />
                    {cliente.nombre} {cliente.apellidoPaterno} {cliente.apellidoMaterno}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Button variant="outline" size="icon" onClick={handleNuevoClienteClick}>
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
