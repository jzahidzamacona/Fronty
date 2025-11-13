"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

type Props = {
  joyaIdInicial?: number
  /** Deja true para bloquear el campo de lote y poner la fecha del día */
  lockLote?: boolean
  /** Zona horaria para calcular la fecha de hoy (default: Mexico) */
  timeZone?: string
}

// YYYY-MM-DD en la zona indicada (evita el problema de “mañana” por UTC)
function todayISOInTZ(tz = "America/Mexico_City") {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

export default function AsignarCodigosBarra({
  joyaIdInicial,
  lockLote = true,
  timeZone = "America/Mexico_City",
}: Props) {
  const [joyaId, setJoyaId] = useState<number | undefined>(joyaIdInicial)

  // Lote por defecto: L-YYYY-MM-DD (según zona horaria)
  const [lote, setLote] = useState(`L-${todayISOInTZ(timeZone)}`)

  const [textoCodigos, setTextoCodigos] = useState("")
  const [cargando, setCargando] = useState(false)
  const [resp, setResp] = useState<{
    totalSolicitados: number
    totalAsignados: number
    totalRechazados: number
    codigosAsignados: string[]
    codigosRechazados: string[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const parseCodigos = (t: string) =>
    t.split(/[\n,;\s]+/).map(s => s.trim()).filter(Boolean)

  const handleEnviar = async () => {
    setError(null)
    setResp(null)

    if (!joyaId) {
      setError("Debes indicar el ID de la joya.")
      return
    }
    const codigos = parseCodigos(textoCodigos)
    if (codigos.length === 0) {
      setError("Ingresa al menos un código de barras.")
      return
    }

    setCargando(true)
    try {
      const r = await fetch("http://localhost:8080/api/joyas/codigos/asignar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          joyaId,
          codigos,
          // aunque el input esté deshabilitado, mandamos el valor actual
          lote: lote || undefined,
        }),
      })
      if (!r.ok) throw new Error("Error al asignar códigos")
      const data = await r.json()
      setResp({
        totalSolicitados: data.totalSolicitados ?? 0,
        totalAsignados: data.totalAsignados ?? 0,
        totalRechazados: data.totalRechazados ?? 0,
        codigosAsignados: data.codigosAsignados ?? [],
        codigosRechazados: data.codigosRechazados ?? [],
      })
    } catch (e: any) {
      setError(e.message || "Fallo inesperado")
    } finally {
      setCargando(false)
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Asignar Códigos de Barras</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!joyaIdInicial && (
          <div className="space-y-2">
            <Label>Joya ID</Label>
            <Input
              type="number"
              value={joyaId ?? ""}
              onChange={e => setJoyaId(Number(e.target.value))}
              placeholder="ID de la joya"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>Lote (opcional)</Label>
          <Input
            value={lote}
            onChange={e => !lockLote && setLote(e.target.value)}
            disabled={lockLote}
            className={lockLote ? "bg-muted text-muted-foreground cursor-not-allowed" : ""}
            placeholder={`L-${todayISOInTZ(timeZone)}`}
          />
        </div>

        <div className="space-y-2">
          <Label>Códigos (uno por línea o separados por coma)</Label>
          <Textarea
            rows={6}
            value={textoCodigos}
            onChange={e => setTextoCodigos(e.target.value)}
            placeholder={`Da click aqui y usa el escaner de codigos 
...`}
          />
        </div>

        {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        {resp && (
          <div className="rounded-md border p-3 text-sm">
            <div><b>Solicitados:</b> {resp.totalSolicitados}</div>
            <div><b>Asignados:</b> {resp.totalAsignados}</div>
            <div><b>Rechazados:</b> {resp.totalRechazados}</div>

            <div className="mt-2">
              <b>Códigos asignados:</b>
              <ul className="list-disc ml-5">
                {resp.codigosAsignados.map(c => <li key={c}>{c}</li>)}
              </ul>
            </div>

            <div className="mt-2">
              <b>Códigos rechazados:</b>
              <ul className="list-disc ml-5">
                {resp.codigosRechazados.map(c => <li key={c}>{c}</li>)}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleEnviar} disabled={cargando}>
          {cargando ? "Asignando..." : "Asignar códigos"}
        </Button>
      </CardFooter>
    </Card>
  )
}
