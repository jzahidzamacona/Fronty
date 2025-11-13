// hooks/empleados.ts
import axiosInstance from "@/hooks/axiosInstance"

// 👇 Usa "ADMIN"/"EMPLEADO" porque tu backend los mapea a ROLE_*
export type RolApp = "ADMIN" | "EMPLEADO"

export async function asignarCredencialesEmpleado(
  empleadoId: number,
  payload: { username: string; password: string; roles: RolApp[] }
) {
  const { data } = await axiosInstance.post(
    `/api/empleados/${empleadoId}/credenciales`,
    payload
  )
  return data
}
