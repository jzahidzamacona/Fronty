"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

// Opciones predefinidas para kilatajes
const kilatajesPredefinidos = [
  { value: "Oro 10k", label: "Oro 10k" },
  { value: "Oro 14k", label: "Oro 14k" },
  { value: "Oro 18k", label: "Oro 18k" },
  { value: "PL 9.25", label: "PL 9.25" },
  { value: "A/I", label: "A/I" },
  { value: "Caja", label: "Caja" },
  { value: "Plata", label: "Plata" },
  { value: "Otro", label: "Otro" },
]

interface TipoProductoSelectorProps {
  value: string
  onChange: (value: string) => void
}

export function TipoProductoSelector({ value, onChange }: TipoProductoSelectorProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [customValue, setCustomValue] = useState("")
  const [options, setOptions] = useState(kilatajesPredefinidos)
  const [showCustomInput, setShowCustomInput] = useState(false)

  // Actualizar el valor seleccionado cuando cambia externamente
  useEffect(() => {
    // Si el valor no está en las opciones predefinidas, asumimos que es un valor personalizado
    if (value && !options.some((option) => option.value === value)) {
      setCustomValue(value)
    }
  }, [value, options])

  // Manejar la selección de una opción
  const handleSelect = (currentValue: string) => {
    if (currentValue === "custom") {
      setShowCustomInput(true)
      return
    }

    onChange(currentValue)
    setOpen(false)
    setShowCustomInput(false)
  }

  // Manejar la creación de un valor personalizado
  const handleCreateCustomValue = () => {
    if (!inputValue.trim()) return

    // Crear un nuevo valor personalizado
    const newValue = inputValue.trim()
    const newOption = { value: newValue, label: newValue }

    // Añadir a las opciones si no existe ya
    if (!options.some((option) => option.label.toLowerCase() === newValue.toLowerCase())) {
      setOptions((prev) => [...prev, newOption])
    }

    // Seleccionar el nuevo valor
    onChange(newOption.value)
    setCustomValue("")
    setInputValue("")
    setShowCustomInput(false)
    setOpen(false)
  }

  // Encontrar la etiqueta para el valor actual
  const selectedLabel = options.find((option) => option.value === value)?.label || value

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {value ? selectedLabel : "Seleccionar kilataje"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        {showCustomInput ? (
          <div className="flex flex-col p-2 gap-2">
            <Input
              placeholder="Ingresa un nuevo kilataje..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="h-9"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCustomInput(false)
                  setInputValue("")
                }}
              >
                Cancelar
              </Button>
              <Button size="sm" onClick={handleCreateCustomValue} disabled={!inputValue.trim()}>
                Añadir
              </Button>
            </div>
          </div>
        ) : (
          <Command>
            <CommandInput
              placeholder="Buscar kilataje..."
              className="h-9"
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList>
              <CommandEmpty>No se encontraron resultados.</CommandEmpty>
              <CommandGroup heading="Kilatajes">
                {options.map((option) => (
                  <CommandItem key={option.value} value={option.value} onSelect={handleSelect}>
                    <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem onSelect={() => handleSelect("custom")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Añadir nuevo kilataje
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  )
}
