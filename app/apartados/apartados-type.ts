export interface MetodoPagoDetalle {
  metodo: string
  monto: number
  idReferencia?: number | null
}

export interface ApartadoResumen {
  id: number
  date: string
  cliente: string
  telefono: string
  vendedor: string
  items: string
  total: number
  formaPago: string
  pagos: MetodoPagoDetalle[]
  restante: number
  montoInicial: number
  montoRestante: number
}
