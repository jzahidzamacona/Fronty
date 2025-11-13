// utils/tickets.ts
import { openBlob } from "./openBlob";

// Abonos (ticket por tipo e id de nota)
export async function abrirTicketAbono(tipo: string, notaId: number) {
  // tipo: "APARTADO" | "HECHURA" | "RELOJ" (o los que manejes)
  await openBlob(`/api/abonos/ticket/${tipo}/${notaId}`, `ticket-abono-${tipo}-${notaId}`);
}

// Ventas
export async function abrirTicketVenta(idVenta: number) {
  await openBlob(`/api/pdf/venta/${idVenta}`, `venta-${idVenta}`);
}

// Reloj
export async function abrirTicketReloj(idReloj: number) {
  await openBlob(`/api/pdf/reloj/${idReloj}`, `reloj-${idReloj}`);
}

// Apartado
export async function abrirTicketApartado(idApartado: number) {
  await openBlob(`/api/pdf/apartado/${idApartado}`, `apartado-${idApartado}`);
}

// Hechura
export async function abrirTicketHechura(idHechura: number) {
  await openBlob(`/api/pdf/hechura/${idHechura}`, `hechura-${idHechura}`);
}

// Nota de crédito
export async function abrirNotaCredito(idNC: number) {
  await openBlob(`/api/pdf/nota-credito/${idNC}`, `nota_credito_${idNC}`);
}
