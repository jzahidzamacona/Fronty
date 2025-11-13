export interface MetodoPagoDetalle {
  metodo: string
  monto: number
  idReferencia?: number | null
}

export interface RelojResumen {
  id: string
  date: string
  cliente: string
  telefono: string
  vendedor: string
  condiciones: string
  observaciones: string
  entrega: string
  total: number
  formaPago: string
  montoInicial: number
  efectivo: number
  tarjeta: number
  notaCredito: number
  restante: number
}
