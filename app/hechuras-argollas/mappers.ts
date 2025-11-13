// app/hechuras-argollas/mappers.ts
import { ArgollaDTO, ArgollaResumen } from "./types"

const up = (x:any)=> String(x ?? "").toUpperCase()

export function mapDtoToResumen(a: ArgollaDTO): ArgollaResumen {
  const efectivo = a.detallePago?.find(p => up(p.tipo) === "EFECTIVO")?.monto || 0
  const tarjeta  = a.detallePago?.find(p => up(p.tipo) === "TARJETA")?.monto  || 0
  const notaC    = a.detallePago?.find(p => up(p.tipo) === "NOTA_CREDITO")?.monto || 0

  const nombreCliente = [a.cliente?.nombre, a.cliente?.apellidoPaterno, a.cliente?.apellidoMaterno]
    .filter(Boolean).join(" ").trim()

  const nombreEmpleado = [a.empleado?.nombre, a.empleado?.apellidoPaterno, a.empleado?.apellidoMaterno]
    .filter(Boolean).join(" ").trim()

  const desc =
    a.tipo === "SOBREPEDIDO"
      ? `${a.modelo ?? ""} • ${a.kilataje ?? ""} • ${a.mm ?? ""}mm • ${a.tipoAcabado ?? ""}`.replace(/\s•\s$/,"")
      : `Stock #${a.argollaStockId} x ${a.cantidadStock}`

  return {
    id: a.id,
    tipo: a.tipo,
    date: a.fechaRecibida,
    deliveryDate: a.fechaEntrega,
    cliente: nombreCliente,
    telefono: a.cliente?.telefono,
    empleado: nombreEmpleado,
    descripcion: desc,
    total: a.total ?? 0,
    formaPago: a.formaPago ?? "",
    inicial: a.montoInicial ?? 0,
    efectivo, tarjeta, notaCredito: notaC,
    restante: a.montoRestante ?? 0,
  }
}
