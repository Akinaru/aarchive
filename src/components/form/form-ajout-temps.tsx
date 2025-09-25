// src/components/form/form-ajout-temps.tsx
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
  missions?: Mission[]
  missionId?: number
  types: TypeTache[]
  onAdd: () => void
}

export function FormAddTemps({ missions = [], missionId, types, onAdd }: FormAddTempsProps) {
  const [selectedMissionId, setSelectedMissionId] = useState("")
  const [typeTacheId, setTypeTacheId] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [mode, setMode] = useState<"duree" | "plage">("duree")
  const [time, setTime] = useState("00:30")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")

  const isDisabled = (missions.length === 0 && !missionId) || types.length === 0

  const calculateDuration = () => {
    if (mode === "duree") {
      const [h, m] = time.split(":").map(Number)
      return h * 60 + m
    } else if (startTime && endTime) {
      const [sh, sm] = startTime.split(":").map(Number)
      const [eh, em] = endTime.split(":").map(Number)
      const start = sh * 60 + sm
      const end = eh * 60 + em
      const diff = end - start
      return diff > 0 ? diff : 0
    }
    return 0
  }

  const addTemps = async () => {
    const finalMissionId = missionId ?? parseInt(selectedMissionId)
    const dureeMinutes = calculateDuration()

    if (!finalMissionId || !typeTacheId || !date || dureeMinutes <= 0) {
      toast.error("Tous les champs sont requis")
      return
    }

    const res = await fetch("/api/temps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        missionId: finalMissionId,
        typeTacheId: parseInt(typeTacheId),
        dureeMinutes,
        description,
        date: date.toISOString(),
      }),
    })

    if (res.ok) {
      toast.success("Temps ajouté")
      setDescription("")
      setTime("00:30")
      setStartTime("")
      setEndTime("")
      if (!missionId) setSelectedMissionId("")
      setTypeTacheId("")
      onAdd()
    } else {
      toast.error("Erreur lors de l’ajout")
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {!missionId && (
        <div className="flex flex-col gap-1 w-full md:col-span-2">
          <Label>Mission</Label>
          <Select value={selectedMissionId} onValueChange={setSelectedMissionId} disabled={isDisabled}>
            <SelectTrigger className="w-full">
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

      <div className="flex flex-col gap-1 w-full">
        <Label>Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-between w-full" disabled={isDisabled}>
              {date ? format(date, "dd/MM/yyyy") : "Choisir"}
              <ChevronDownIcon className="ml-2 h-4 w-4" />
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

      <div className="flex flex-col gap-1 w-full">
        <Label>Type de tâche</Label>
        <Select value={typeTacheId} onValueChange={setTypeTacheId} disabled={isDisabled}>
          <SelectTrigger className="w-full">
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

      {/* Description sur une ligne à elle seule (col-span-2) */}
      <div className="flex flex-col gap-1 w-full md:col-span-2">
        <Label>Description</Label>
        <Input
          placeholder="Détails de la tâche..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isDisabled}
        />
      </div>

      <div className="flex flex-col gap-1 w-full">
        <Label>Mode</Label>
        <Select value={mode} onValueChange={(v) => setMode(v as "duree" | "plage")}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="duree">Durée définie</SelectItem>
            <SelectItem value="plage">Plage horaire</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {mode === "duree" ? (
        <div className="flex flex-col gap-1 w-full">
          <Label>Durée</Label>
          <Input
            type="time"
            step={60}
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
            disabled={isDisabled}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-1 w-full">
          <Label>Plage horaire</Label>
          <div className="flex gap-2">
            <Input
              type="time"
              step={60}
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
              disabled={isDisabled}
            />
            <span className="self-center">→</span>
            <Input
              type="time"
              step={60}
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
              disabled={isDisabled}
            />
          </div>
        </div>
      )}

      {/* Bouton en dernier :
          - mobile: pleine largeur
          - desktop: largeur du contenu, aligné à droite de sa ligne */}
      <div className="flex items-end w-full md:col-span-2 md:justify-end">
        <Button onClick={addTemps} disabled={isDisabled} className="w-full md:w-auto">
          Ajouter
        </Button>
      </div>
    </div>
  )
}
