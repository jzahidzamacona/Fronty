"use client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, Check, X } from "lucide-react"

interface PaymentMethods {
  cash: { used: boolean; amount: string }
  card: { used: boolean; amount: string }
  creditNote: { used: boolean; amount: string; noteId: string }
}

interface Props {
  paymentMethods: PaymentMethods
  totalCosto: number
  totalPago: number
  onChange: (method: keyof PaymentMethods, field: "used" | "amount" | "noteId", value: boolean | string) => void
  validationChecks?: { id: string; label: string; completed: boolean }[]
}

export default function DetallePago({ paymentMethods, totalCosto, totalPago, onChange, validationChecks = [] }: Props) {
  const totalPagoOk = totalPago <= totalCosto
  const isZeroPayment =
    totalPago === 0 &&
    (paymentMethods.cash.used || paymentMethods.card.used || paymentMethods.creditNote.used)
  const anyPaymentSelected =
    paymentMethods.cash.used || paymentMethods.card.used || paymentMethods.creditNote.used

  return (
    <div className="space-y-4">
      {(["cash", "card", "creditNote"] as const).map((method) => (
        <div key={method}>
          <Label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={paymentMethods[method].used as unknown as boolean}
              onChange={(e) => onChange(method, "used", e.target.checked)}
            />
            Pago con {method === "cash" ? "efectivo" : method === "card" ? "tarjeta" : "nota de crédito"}
          </Label>

          {paymentMethods[method].used && (
            <>
              {method === "creditNote" && (
                <Input
                  placeholder="Ej. NC-8 o 8"
                  value={paymentMethods.creditNote.noteId}
                  onChange={(e) => onChange("creditNote", "noteId", e.target.value)}
                  className="mt-2"
                />
              )}
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={paymentMethods[method].amount}
                onChange={(e) => onChange(method, "amount", e.target.value)}
                className="mt-2"
              />
            </>
          )}
          <Separator className="my-3" />
        </div>
      ))}

      <div className="text-sm space-y-1">
        <div>Total: ${totalCosto.toFixed(2)}</div>
        <div>Total pagado: ${totalPago.toFixed(2)}</div>
        <div className="font-semibold">Saldo pendiente: ${(totalCosto - totalPago).toFixed(2)}</div>
        {!totalPagoOk && anyPaymentSelected && (
          <div className="text-red-500">La suma de pagos no puede exceder el total.</div>
        )}
        {isZeroPayment && (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded-md mt-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs">Se registrará sin pago inicial</span>
          </div>
        )}
      </div>

      {validationChecks.length > 0 && (
        <div className="space-y-2 pt-4 border-t">
          {validationChecks.map((check) => (
            <div key={check.id} className="flex items-center gap-2 text-sm">
              {check.completed ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
              <span className={check.completed ? "text-green-700" : "text-red-600"}>{check.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
