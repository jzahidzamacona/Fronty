"use client"

import { useEffect, useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import axiosInstance from "@/hooks/axiosInstance"

interface ClienteSelectorProps {
  value: string
  onValueChange: (val: string) => void
}

export const ClienteSelector = ({ value, onValueChange }: ClienteSelectorProps) => {
  const [clientes, setClientes] = useState<
    { id: number; nombre: string; apellidoPaterno: string }[]
  >([])

  useEffect(() => {
    axiosInstance.get("/api/clientes").then((res) => setClientes(res.data))
  }, [])

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Seleccionar cliente" />
      </SelectTrigger>
      <SelectContent>
        {clientes.map((c) => (
          <SelectItem key={c.id} value={c.id.toString()}>
            {c.nombre} {c.apellidoPaterno}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
