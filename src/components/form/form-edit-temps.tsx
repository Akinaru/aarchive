"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Temps } from "@/types/temps"
import { TypeTache } from "@/types/taches"

type Props = {
  selectedTemps: Temps | null
  types: TypeTache[]
  edited: {
    dureeMinutes: number
    typeTacheId: string
    description: string
  }
  setEdited: (val: Props["edited"]) => void
  setSelectedTemps: (val: Temps | null) => void
  updateTemps: () => void
}

export function FormEditTemps({
  selectedTemps,
  types,
  edited,
  setEdited,
  setSelectedTemps,
  updateTemps,
}: Props) {
  const [time, setTime] = useState("00:00")

  useEffect(() => {
    const hours = String(Math.floor(edited.dureeMinutes / 60)).padStart(2, "0")
    const minutes = String(edited.dureeMinutes % 60).padStart(2, "0")
    setTime(`${hours}:${minutes}`)
  }, [edited.dureeMinutes])

  const handleTimeChange = (val: string) => {
    setTime(val)
    const [h, m] = val.split(":").map(Number)
    const total = (h ?? 0) * 60 + (m ?? 0)
    setEdited({ ...edited, dureeMinutes: total })
  }

  return (
    <Dialog
      open={!!selectedTemps}
      onOpenChange={(open) => !open && setSelectedTemps(null)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier le temps</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {/* Durée */}
          <div className="flex flex-col gap-1">
            <Label htmlFor="time-picker">Durée</Label>
            <Input
              type="time"
              id="time-picker"
              step="60"
              value={time}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
            />
          </div>

          {/* Type de tâche */}
          <div className="flex flex-col gap-1">
            <Label htmlFor="type-tache">Type de tâche</Label>
            <Select
              value={edited.typeTacheId}
              onValueChange={(value) =>
                setEdited({ ...edited, typeTacheId: value })
              }
            >
              <SelectTrigger id="type-tache">
                <SelectValue placeholder="Type de tâche" />
              </SelectTrigger>
              <SelectContent>
                {types
                  .filter((type) => type?.id !== undefined && type?.nom !== undefined)
                  .map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.nom}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={edited.description}
              onChange={(e) =>
                setEdited({ ...edited, description: e.target.value })
              }
              placeholder="Description"
            />
          </div>

          {/* Bouton */}
          <Button onClick={updateTemps}>Enregistrer les modifications</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}