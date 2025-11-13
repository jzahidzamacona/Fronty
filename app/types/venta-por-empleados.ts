export interface VentaPorEmpleado {
  id: number
  fechaVenta: string
  cliente: {
    nombre: string
    apellidoPaterno: string
    apellidoMaterno: string
  }
  totalVenta: number
  detalles: {
    joya: {
      nombre: string
      kilataje: string
    }
    cantidad: number
    subtotal: number
  }[]
  formaPago: string
  detallePago: {
    metodo: string
    monto: number
  }[]
}

export interface EstadisticasEmpleado {
  totalVentas: number
  montoTotal: number
  promedioVenta: number
  mejorVenta: number
  ventasPorDia: Record<string, number>
}
