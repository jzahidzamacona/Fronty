// components/AsignarCredencialesModal.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { asignarCredencialesEmpleado, RolApp } from "@/hooks/empleados"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Clipboard } from "lucide-react"

type Props = {
  open: boolean
  onClose: () => void
  empleadoId: number | null
}

// Si tu backend espera "ADMIN"/"EMPLEADO", deja así:
const ROLES: RolApp[] = ["ADMIN", "EMPLEADO"]

export default function AsignarCredencialesModal({ open, onClose, empleadoId }: Props) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [roles, setRoles] = useState<RolApp[]>(["EMPLEADO"])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>("")

  // mostrar contraseña solo una vez
  const lastSubmittedPassword = useRef<string | null>(null)
  const [oneTimeVisible, setOneTimeVisible] = useState(false)

  useEffect(() => {
    if (!open) {
      setUsername("")
      setPassword("")
      setConfirm("")
      setShowPass(false)
      setRoles(["EMPLEADO"])
      setError("")
      lastSubmittedPassword.current = null
      setOneTimeVisible(false)
    }
  }, [open])

  const toggleRole = (r: RolApp) =>
    setRoles(prev => (prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]))

  const handleSubmit = async () => {
    setError("")
    if (!empleadoId) return
    if (!username.trim() || !password.trim()) {
      setError("Usuario y contraseña son obligatorios.")
      return
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.")
      return
    }

    try {
      setSubmitting(true)
      await asignarCredencialesEmpleado(empleadoId, { username, password, roles })
      lastSubmittedPassword.current = password
      setOneTimeVisible(true)
      // borrar del estado inmediatamente
      setPassword("")
      setConfirm("")
      setShowPass(false)
    } catch (e: any) {
      console.error("Error credenciales", e?.response?.status, e?.response?.data)
      setError(e?.response?.data?.message ?? "No se pudieron asignar las credenciales.")
    } finally {
      setSubmitting(false)
    }
  }

  const copyOnce = async () => {
    if (lastSubmittedPassword.current) {
      await navigator.clipboard.writeText(lastSubmittedPassword.current)
    }
  }

  const closeAndForget = () => {
    lastSubmittedPassword.current = null
    setOneTimeVisible(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? closeAndForget() : null)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar credenciales</DialogTitle>
        </DialogHeader>

        {!oneTimeVisible ? (
          <div className="space-y-4">
            {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}

            <div className="space-y-2">
              <Label>Usuario</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" />
            </div>

            <div className="space-y-2">
              <Label>Contraseña</Label>
              <div className="flex gap-2">
                <Input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <Button type="button" variant="outline" onClick={() => setShowPass(s => !s)}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Confirmar contraseña</Label>
              <Input
                type={showPass ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <Label>Roles</Label>
              <div className="flex flex-col gap-2">
                {ROLES.map((r) => (
                  <label key={r} className="flex items-center gap-2">
                    <Checkbox checked={roles.includes(r)} onCheckedChange={() => toggleRole(r)} />
                    <span>{r}</span>
                  </label>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeAndForget}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={submitting || !empleadoId}>
                {submitting ? "Guardando..." : "Guardar credenciales"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm">✅ Credenciales asignadas. <b>Esta es la única vez</b> que verás la contraseña:</p>

            <div className="rounded-lg border p-3">
              <div className="text-sm">Usuario:</div>
              <div className="font-mono">{username}</div>

              <div className="mt-3 text-sm">Contraseña:</div>
              <div className="flex items-center gap-2">
                <code className="font-mono px-2 py-1 bg-muted rounded">{lastSubmittedPassword.current}</code>
                <Button variant="outline" size="icon" onClick={copyOnce} aria-label="Copiar">
                  <Clipboard className="w-4 h-4" />
                </Button>
              </div>

              <div className="mt-3 text-sm">Roles:</div>
              <div className="font-mono">{roles.join(", ")}</div>
            </div>

            <DialogFooter>
              <Button onClick={closeAndForget}>Entendido (ocultar para siempre)</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
