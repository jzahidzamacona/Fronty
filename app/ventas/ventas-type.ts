export interface VentaResumen {
  id: number
  fecha: string
  cliente: string
  empleado: string
  productos: string
  total: number
  formaPago: string
  efectivo: number
  tarjeta: number
  notaCredito: number
}
