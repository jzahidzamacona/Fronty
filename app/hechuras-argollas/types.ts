export type ArgollaTipo = "SOBREPEDIDO" | "STOCK"
export type FormaPagoArgolla = "EFECTIVO" | "TARJETA" | "MIXTO" | "SIN_PAGO"

export interface DetallePagoArgolla {
  tipo: "EFECTIVO" | "TARJETA" | "NOTA_CREDITO"
  monto: number
  idReferencia?: number
}

export interface ArgollaDTO {
  id: number
  tipo: ArgollaTipo

  clienteId: number
  empleadoId: number
  cliente: {
    id: number
    nombre: string
    apellidoPaterno?: string
    apellidoMaterno?: string
    telefono?: string
  }
  empleado: {
    id: number
    nombre: string
    apellidoPaterno?: string
    apellidoMaterno?: string
  }

  fechaRecibida: string
  fechaEntrega: string

  modelo?: string | null
  kilataje?: string | null
  mm?: string | null
  tipoAcabado?: string | null
  tallaCaballero?: string | null
  tallaDama?: string | null
  grabadoCaballero?: string | null
  grabadoDama?: string | null

  argollaStockId?: number | null
  cantidadStock?: number | null

  descripcionEspecial?: string | null

  total: number
  montoInicial: number
  montoAbonado: number
  montoRestante: number

  formaPago: FormaPagoArgolla
  detallePago: DetallePagoArgolla[]

  notaCreditoIdUsada: number | null

  creadoPor: number
  fechaCreacion: string
  fechaModificacion: string
}

export interface CrearArgollaSobrepedidoRq {
  clienteId: number
  empleadoId: number
  fechaEntrega: string

  modelo: string
  kilataje: string
  mm: string
  tipoAcabado: string

  tallaCaballero?: string
  tallaDama?: string

  grabadoCaballero?: string
  grabadoDama?: string
  descripcionEspecial?: string

  total: number

  formaPago: FormaPagoArgolla
  detallePago: DetallePagoArgolla[]
  notaCreditoIdUsada: number | null
}

export interface CrearArgollaStockRq {
  clienteId: number
  empleadoId: number
  fechaEntrega: string

  argollaStockId: number
  cantidad: number

  descripcionEspecial?: string
  total?: number

  formaPago: FormaPagoArgolla
  detallePago: DetallePagoArgolla[]
  notaCreditoIdUsada: number | null
}

export interface ArgollaResumen {
  id: number
  tipo: ArgollaTipo
  date: string
  deliveryDate: string
  cliente: string
  telefono?: string
  empleado: string
  descripcion: string
  total: number
  formaPago: FormaPagoArgolla
  inicial: number
  efectivo: number
  tarjeta: number
  notaCredito: number
  restante: number
}
