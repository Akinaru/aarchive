"use client"

import { useState } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { ChevronDownIcon } from "lucide-react"
import { Mission } from "@/types/missions"
import { TypeTache } from "@/types/taches"

interface FormAddTempsProps {
  missions?: Mission[]         // facultatif si missionId est fourni
  missionId?: number           // priorité si défini
  types: TypeTache[]
  onAdd: () => void
}

export function FormAddTemps({ missions = [], missionId, types, onAdd }: FormAddTempsProps) {
  const [selectedMissionId, setSelectedMissionId] = useState("")
  const [typeTacheId, setTypeTacheId] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [time, setTime] = useState("00:30")

  const isDisabled = (missions.length === 0 && !missionId) || types.length === 0

  const addTemps = async () => {
    const finalMissionId = missionId ?? parseInt(selectedMissionId)
    if (!finalMissionId || !typeTacheId || !time || !date) {
      toast.error("Tous les champs sont requis")
      return
    }

    const [h, m] = time.split(":").map(Number)
    const dureeMinutes = h * 60 + m

    const dateTime = new Date(date)
    dateTime.setHours(h)
    dateTime.setMinutes(m)

    const res = await fetch("/api/temps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        missionId: finalMissionId,
        typeTacheId: parseInt(typeTacheId),
        dureeMinutes,
        description,
        date: dateTime.toISOString(),
      }),
    })

    if (res.ok) {
      toast.success("Temps ajouté")
      setDescription("")
      setTime("00:30")
      if (!missionId) setSelectedMissionId("")
      setTypeTacheId("")
      onAdd()
    } else {
      toast.error("Erreur lors de l’ajout")
    }
  }

  return (
    <div className="flex flex-col md:flex-row md:items-end md:gap-4 gap-4">
      {/* Mission (seulement si missionId non fourni) */}
      {!missionId && (
        <div className="flex flex-col gap-1 min-w-[160px]">
          <Label>Mission</Label>
          <Select value={selectedMissionId} onValueChange={setSelectedMissionId} disabled={isDisabled}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir une mission" />
            </SelectTrigger>
            <SelectContent>
              {missions.map((m) => (
                <SelectItem key={m.id} value={m.id.toString()}>
                  {m.titre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Date */}
      <div className="flex flex-col gap-1 min-w-[140px]">
        <Label>Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-between" disabled={isDisabled}>
              {date ? format(date, "dd/MM/yyyy") : "Choisir"}
              <ChevronDownIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              onSelect={(d) => d && setDate(d)}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Type de tâche */}
      <div className="flex flex-col gap-1 min-w-[160px]">
        <Label>Type de tâche</Label>
        <Select value={typeTacheId} onValueChange={setTypeTacheId} disabled={isDisabled}>
          <SelectTrigger>
            <SelectValue placeholder="Choisir un type" />
          </SelectTrigger>
          <SelectContent>
            {types.map((t) => (
              <SelectItem key={t.id} value={t.id.toString()}>
                {t.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1 flex-1">
        <Label>Description</Label>
        <Input
          placeholder="Détails de la tâche..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isDisabled}
        />
      </div>

      {/* Durée */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="time-picker">Durée</Label>
        <Input
          type="time"
          id="time-picker"
          step="60"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
          disabled={isDisabled}
        />
      </div>

      {/* Bouton */}
      <div className="flex items-end">
        <Button onClick={addTemps} disabled={isDisabled}>Ajouter</Button>
      </div>
    </div>
  )
}
