export interface MetodoPagoDetalle {
  metodo: string;
  monto: number;
  idReferencia?: number | null;
}

export interface AbonoResumen {
  id: number;
  fecha: string;
  tipoNota: "APARTADO" | "HECHURA" | "RELOJ";
  notaId: number;
  cliente: string;
  telefono: string;
  vendedor: string;
  total: number;
  formaPago: string;
  primerAbono: number;
  efectivo: number;
  tarjeta: number;
  notaCredito: number;
  restante: number;
  ultimoAbono: number;
}
