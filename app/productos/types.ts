// types.ts o types/productos.ts si estás separando por módulo

export interface Producto {
  id: number
  nombre: string
  kilataje: string
  cantidad: number
  precio: number
  creadoPor: number
  modificadoPor: number | null
  fechaCreacion: string
  fechaModificacion: string | null
}
