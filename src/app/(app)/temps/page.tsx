"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select"
import {
  Popover, PopoverTrigger, PopoverContent,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { ChevronDownIcon, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { Temps } from "@/types/temps"
import { Mission } from "@/types/missions"
import { TypeTache } from "@/types/taches"

export default function TempsPage() {
  const [temps, setTemps] = useState<Temps[]>([])
  const [missions, setMissions] = useState<Mission[]>([])
  const [types, setTypes] = useState<TypeTache[]>([])

  const [missionId, setMissionId] = useState("")
  const [typeTacheId, setTypeTacheId] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [time, setTime] = useState("00:30")

  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [tempsRes, missionRes, typeRes] = await Promise.all([
        fetch("/api/temps"),
        fetch("/api/missions"),
        fetch("/api/type-tache"),
      ])
      setTemps(await tempsRes.json())
      setMissions(await missionRes.json())
      setTypes(await typeRes.json())
    } catch (err) {
      toast.error("Erreur lors du chargement des données")
    } finally {
      setIsLoading(false)
    }
  }

  const addTemps = async () => {
    if (!missionId || !typeTacheId || !time || !date) {
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
        missionId: parseInt(missionId),
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
      await fetchData()
    } else {
      toast.error("Erreur lors de l’ajout")
    }
  }

  const deleteTemps = async (id: number) => {
    await fetch(`/api/temps/${id}`, { method: "DELETE" })
    toast.success("Supprimé")
    await fetchData()
  }

  useEffect(() => {
    fetchData()
  }, [])

  const lastTemps = temps.slice().reverse().slice(0, 5)
  const totalMinutes = temps.reduce((sum, t) => sum + t.dureeMinutes, 0)

  const isReady = missions.length > 0 && types.length > 0
  const isDisabled = !isReady

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Notation des temps"
        subtitle="Saisissez vos temps de travail quotidiens par mission et type de tâche."
        breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "Temps" }]}
      />

      {!isLoading && !isReady && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Préparation incomplète</AlertTitle>
          <AlertDescription>
            Vous devez d'abord ajouter :
            <ul className="list-disc ml-6 mt-1 space-y-1 text-sm">
              {missions.length === 0 && (
                <li>
                  <Link href="/missions" className="underline hover:opacity-85">au moins une mission</Link>
                </li>
              )}
              {types.length === 0 && (
                <li>
                  <Link href="/type-taches" className="underline hover:opacity-85">au moins un type de tâche</Link>
                </li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && (
        <>
          {/* Formulaire */}
          <Card>
            <CardHeader>
              <CardTitle>Ajouter un temps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-end md:gap-4 gap-4">
                {/* Mission */}
                <div className="flex flex-col gap-1 min-w-[160px]">
                  <Label>Mission</Label>
                  <Select value={missionId} onValueChange={setMissionId} disabled={isDisabled}>
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
            </CardContent>
          </Card>

          {/* Historique */}
          <Card>
            <CardHeader>
              <CardTitle>5 derniers temps saisis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lastTemps.length === 0 ? (
                <p className="text-muted-foreground text-sm">Aucun temps saisi récemment.</p>
              ) : (
                lastTemps.map((t) => {
                  const hasMission = t.mission && t.mission.titre
                  const hasType = t.typeTache && t.typeTache.nom
                  const hasDescription = t.description && t.description.trim() !== ""

                  if (!hasMission || !hasType) return null

                  return (
                    <div key={t.id} className="flex justify-between items-start border rounded-lg p-3">
                      <div>
                        <p className="font-medium">{t.mission.titre} — {t.typeTache.nom}</p>
                        <p className="text-sm text-muted-foreground">
                          {t.dureeMinutes} min — {format(new Date(t.date), "dd/MM/yyyy HH:mm")}
                        </p>
                        {hasDescription && (
                          <p className="text-sm">{t.description}</p>
                        )}
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => deleteTemps(t.id)}>
                        Supprimer
                      </Button>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Statistiques */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent>
              {totalMinutes === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun temps saisi pour l’instant.</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Total saisi : <span className="font-semibold">{totalMinutes}</span> minutes
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
