"use client"

import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
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
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { ChevronDownIcon } from "lucide-react"
import { Temps } from "@/types/temps"
import { TypeTache } from "@/types/taches"

type Props = {
  selectedTemps: Temps | null
  types: TypeTache[]
  edited: {
    date: string // "YYYY-MM-DD"
    dureeMinutes: number
    typeTacheId: string
    description: string
  }
  setEdited: (val: Props["edited"]) => void
  setSelectedTemps: (val: Temps | null) => void
  updateTemps: () => void
}

function toYMD(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function parseYMD(ymd?: string): Date | undefined {
  if (!ymd) return undefined
  const [y, m, d] = ymd.split("-").map(Number)
  if (!y || !m || !d) return undefined
  // Construit une date locale (évite les décalages de fuseau liés à l'ISO)
  return new Date(y, m - 1, d, 0, 0, 0, 0)
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

  // Date object pour le datepicker (à partir de edited.date en "YYYY-MM-DD")
  const dateObj = useMemo(() => parseYMD(edited.date) ?? new Date(), [edited.date])

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

  const handleSelectDate = (d?: Date) => {
    if (!d) return
    setEdited({ ...edited, date: toYMD(d) })
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
          {/* Date (même UX que l'ajout : Popover + Calendar) */}
          <div className="flex flex-col gap-1">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-between">
                  {dateObj ? format(dateObj, "dd/MM/yyyy") : "Choisir"}
                  <ChevronDownIcon className="ml-2 h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateObj}
                  captionLayout="dropdown"
                  onSelect={handleSelectDate}
                />
              </PopoverContent>
            </Popover>
          </div>

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
