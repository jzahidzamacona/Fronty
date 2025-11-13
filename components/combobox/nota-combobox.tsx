"use client"

import { useState } from "react"
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "@/components/ui/command"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Nota {
  id: number
  cliente?: {
    nombre: string
    apellidoPaterno?: string
  }
}

interface NotaComboboxProps {
  notas: Nota[]
  value: string
  onChange: (value: string) => void
}

export function NotaCombobox({ notas, value, onChange }: NotaComboboxProps) {
  const [open, setOpen] = useState(false)
  const selected = notas.find((n) => String(n.id) === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between">
          {selected ? `${selected.id} - ${selected.cliente?.nombre || ""}` : "Seleccionar nota"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar por número..." />
          <CommandList>
            <CommandEmpty>No se encontraron resultados.</CommandEmpty>
            {notas.map((nota) => (
              <CommandItem
                key={nota.id}
                value={String(nota.id)}
                onSelect={() => {
                  onChange(String(nota.id))
                  setOpen(false)
                }}
              >
                <Check
                  className={cn("mr-2 h-4 w-4", value === String(nota.id) ? "opacity-100" : "opacity-0")}
                />
                {nota.id} - {nota.cliente?.nombre || ""}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
