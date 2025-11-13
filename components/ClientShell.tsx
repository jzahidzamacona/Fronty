// components/ClientShell.tsx
"use client";
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();

  useEffect(() => {
    const onForbidden = () => {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para realizar esta acción.",
        variant: "destructive",
      });
    };
    window.addEventListener("app:forbidden", onForbidden);
    return () => window.removeEventListener("app:forbidden", onForbidden);
  }, [toast]);

  return <>{children}</>;
}
