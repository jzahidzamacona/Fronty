// app/hechuras/hechuras-type.ts
export interface MetodoPagoDetalle {
  metodo: string
  monto: number
  idReferencia?: number | null
}

export interface HechuraResumen {
  id: number
  date: string
  deliveryDate: string
  customer: string
  telefono: string
  empleado: string
  descripcionPieza: string
  descripcionEspecial: string
  total: number
  montoInicial: number
  efectivo: number
  tarjeta: number
  notaCredito: number
  formaPago: string
  restante: number
  pagos: MetodoPagoDetalle[]
}
