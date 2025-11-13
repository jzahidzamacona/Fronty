export interface NotaCreditoResumen {
  id: number
  fechaCreacion: string
  origenTipo: string
  origenNotaId: number
  clienteId: number
  empleadoId: number
  totalOriginal: number
  totalUsado: number
  creditoRestante: number
  notaCancelada: boolean
}
export interface NotaCredito {
  id: number
  amount: number
  creditoRestante: number
}