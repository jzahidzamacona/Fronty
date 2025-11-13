export interface ResponseListClientes {
  id: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  telefono: number;
  creadoPor: number;
  modificadoPor: number;
  fechaCreacion: Date;
  fechaModificacion: Date;
  nombreCompleto: string;
}