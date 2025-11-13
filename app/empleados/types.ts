// app/empleados/types.ts

export interface ResponseListEmpleados {
  id: number
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  creadoPor: number
  modificadoPor: number
  fechaCreacion: string
  fechaModificacion: string
}
