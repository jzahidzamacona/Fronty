"use client"

import { useState } from "react"
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface Cliente {
  id: number
  nombre: string
  apellidoPaterno: string
  apellidoMaterno?: string
}

interface ClienteComboboxProps {
  clientes: Cliente[]
  value: string
  onChange: (value: string) => void
}

export function ClienteCombobox({ clientes, value, onChange }: ClienteComboboxProps) {
  const [open, setOpen] = useState(false)

  const selected = clientes.find((c) => String(c.id) === value)
  const displayName = selected ? `${selected.nombre} ${selected.apellidoPaterno}` : "Seleccionar cliente"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between">
          {displayName}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar cliente..." />
          <CommandList>
            <CommandEmpty>No se encontraron resultados.</CommandEmpty>
            {clientes.map((cliente) => (
              <CommandItem
                key={cliente.id}
                value={`${cliente.nombre} ${cliente.apellidoPaterno}`}
                onSelect={() => {
                  onChange(String(cliente.id))
                  setOpen(false)
                }}
              >
                <Check
                  className={cn("mr-2 h-4 w-4", value === String(cliente.id) ? "opacity-100" : "opacity-0")}
                />
                {cliente.nombre} {cliente.apellidoPaterno} {cliente.apellidoMaterno ?? ""}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
