export interface DetalleMovimientoCaja {
  tipo: string
  metodoPago: string
  monto: number
  fechaHora: string
  empleado: string
}

export interface CorteDetalladoResponse {
  fecha: string
  montoApertura: number
  totalEntradasEfectivo: number
  totalEntradasTarjeta: number
  totalNotasCreditoUsadas: number
  totalSalidas: number
  totalEnCaja: number
  detalle: DetalleMovimientoCaja[]
}
