// app/empleados/page.tsx
"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { EmpleadosTable } from "@/components/empleados/empleados-table"
import { Plus } from "lucide-react"
import { isAdmin } from "@/app/utils/roles";

export default function EmpleadosPage() {
  const [canCreate, setCanCreate] = useState(false)

  useEffect(() => {
    setCanCreate(isAdmin())
  }, [])

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Empleados</h2>

        {canCreate && (
          <Link href="/empleados/nuevo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Empleado
            </Button>
          </Link>
        )}
      </div>

      <EmpleadosTable />
    </div>
  )
}
