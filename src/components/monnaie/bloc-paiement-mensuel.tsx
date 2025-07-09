"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { ChevronDownIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export function BlocPaiementMensuel() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [open, setOpen] = useState(false)
  const [montant, setMontant] = useState("")

  const handleSubmit = async () => {
    if (!date) return toast.error("Date invalide")

    const parsed = parseFloat(montant)
    if (isNaN(parsed) || parsed <= 0) {
      toast.error("Montant invalide")
      return
    }

    try {
      const res = await fetch("/api/monnaie/paiements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mois: date, montant: parsed }),
      })

      if (res.status === 409) {
        toast.error("Un paiement existe déjà pour ce mois.")
        return
      }

      if (!res.ok) throw new Error()

      toast.success("Paiement enregistré")
      setMontant("")
    } catch {
      toast.error("Erreur lors de l’enregistrement")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Valider un paiement</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3">
          <Label className="px-1">Date de paiement</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-48 justify-between font-normal"
              >
                {date
                  ? format(date, "dd MMMM yyyy", { locale: fr })
                  : "Sélectionner une date"}
                <ChevronDownIcon className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto overflow-hidden p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                captionLayout="dropdown"
                onSelect={(d) => {
                  setDate(d)
                  setOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col gap-1">
          <Label>Montant payé (€)</Label>
          <Input
            type="number"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            placeholder="Ex : 2200"
            className="max-w-xs"
          />
        </div>

        <Button onClick={handleSubmit}>Valider le paiement</Button>
      </CardContent>
    </Card>
  )
}