"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { TempsParTypeBarChart } from "@/components/chart/temps-bar-chart"
import { ChartTachePie } from "@/components/chart/chart-tache-pie"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Temps } from "@/types/temps"
import { TypeTache } from "@/types/taches"
import { Client } from "@/types/clients"
import { BreadcrumbSkeleton } from "@/components/skeleton/breadcrumb"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatMinutes } from "@/lib/time"

function compactAddress(c: Record<string, unknown>) {
  const addressLine1 = typeof c.addressLine1 === "string" ? c.addressLine1 : ""
  const addressLine2 = typeof c.addressLine2 === "string" ? c.addressLine2 : ""
  const postalCode = typeof c.postalCode === "string" ? c.postalCode : ""
  const city = typeof c.city === "string" ? c.city : ""
  const state = typeof c.state === "string" ? c.state : ""
  const country = typeof c.country === "string" ? c.country : ""

  const parts = [
    addressLine1,
    addressLine2,
    [postalCode, city].filter(Boolean).join(" "),
    state,
    country,
  ]
      .filter(Boolean)
      .map((x) => String(x).trim())
      .filter((x) => x.length > 0)

  return parts.length ? parts.join("\n") : null
}

function readOptionalString(c: Record<string, unknown>, key: string): string | null {
  const v = c[key]
  return typeof v === "string" && v.trim() !== "" ? v : null
}

export default function ClientSinglePage() {
  const { id } = useParams()
  const [client, setClient] = useState<Client | null>(null)
  const [temps, setTemps] = useState<Temps[]>([])
  const [typeTaches, setTypeTaches] = useState<TypeTache[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/clients/${id}/stats`)
        const data = await res.json()
        setClient(data.client)
        setTemps(data.temps)
        setTypeTaches(data.typeTaches)
      } catch {
        setClient(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  if (loading) {
    return (
        <div className="p-6 space-y-4">
          <BreadcrumbSkeleton />
          <div className="grid grid-cols-2 gap-4 mt-6">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
          <Skeleton className="h-96" />
          <Skeleton className="h-36" />
        </div>
    )
  }

  if (!client) {
    return (
        <div className="p-6">
          <Alert>
            <AlertTitle>Client introuvable</AlertTitle>
            <AlertDescription>Le client demandé n&apos;existe pas.</AlertDescription>
          </Alert>
        </div>
    )
  }

  // lecture "safe" des champs additionnels (sans ts-comment)
  const cx = client as unknown as Record<string, unknown>

  const addr = compactAddress(cx)

  const legalName = readOptionalString(cx, "legalName")
  const contactName = readOptionalString(cx, "contactName")
  const billingEmail = readOptionalString(cx, "billingEmail")
  const registrationNumber = readOptionalString(cx, "registrationNumber")
  const vatNumber = readOptionalString(cx, "vatNumber")
  const billingNotes = readOptionalString(cx, "billingNotes")
  const siteWeb = readOptionalString(cx, "siteWeb")

  const subtitleParts: string[] = []
  if (client.email) subtitleParts.push(client.email)
  if (legalName) subtitleParts.push(legalName)
  const city = readOptionalString(cx, "city")
  const country = readOptionalString(cx, "country")
  if (city) subtitleParts.push(city)
  if (country) subtitleParts.push(country)

  const subtitle = subtitleParts.length ? subtitleParts.join(" • ") : "—"

  const totalMinutes = temps.reduce((acc, t) => acc + t.dureeMinutes, 0)
  const totalHeures = formatMinutes(totalMinutes)
  const totalMissions = new Set(temps.map((t) => t.missionId)).size

  return (
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <PageHeader
              title={client.nom}
              subtitle={subtitle}
              breadcrumb={[
                { label: "Dashboard", href: "/dashboard" },
                { label: "Clients", href: "/clients" },
                { label: client.nom },
              ]}
          />

          {/* Infos client */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={client.photoPath || ""} alt={client.nom} />
                <AvatarFallback>{client.nom.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <CardTitle className="text-xl truncate">{client.nom}</CardTitle>
                {legalName ? (
                    <p className="text-sm text-muted-foreground truncate">{legalName}</p>
                ) : null}
              </div>
            </CardHeader>

            <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
              {/* Contact */}
              <div className="rounded-lg border bg-muted/10 p-4">
                <div className="font-semibold mb-2">Contact</div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{client.email ?? "—"}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Téléphone</p>
                    <p className="font-medium">{client.telephone ?? "—"}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Contact (optionnel)</p>
                    <p className="font-medium">{contactName ?? "—"}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Site web</p>
                    <p className="font-medium">{siteWeb ?? "—"}</p>
                  </div>
                </div>
              </div>

              {/* Facturation */}
              <div className="rounded-lg border bg-muted/10 p-4">
                <div className="font-semibold mb-2">Facturation</div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Raison sociale</p>
                    <p className="font-medium">{legalName ?? "—"}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Email de facturation</p>
                    <p className="font-medium">{billingEmail ?? "—"}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">N° immatriculation</p>
                    <p className="font-medium">{registrationNumber ?? "—"}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">TVA intracom</p>
                    <p className="font-medium">{vatNumber ?? "—"}</p>
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-xs text-muted-foreground">Adresse de facturation</p>
                    {addr ? (
                        <pre className="font-medium whitespace-pre-wrap leading-5">{addr}</pre>
                    ) : (
                        <p className="font-medium">—</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-xs text-muted-foreground">Notes</p>
                    <p className="font-medium whitespace-pre-wrap">{billingNotes ?? "—"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques générales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total de temps saisi</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">{totalHeures}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Nombre de missions</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">{totalMissions}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Types de tâches utilisés</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">{typeTaches.length}</CardContent>
            </Card>
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChartTachePie temps={temps} />
            <TempsParTypeBarChart temps={temps} typeTaches={typeTaches} />
          </div>

          {/* Placeholder missions */}
          <Card>
            <CardHeader>
              <CardTitle>Historique des missions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Cette section affichera toutes les missions associées à ce client.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
  )
}
