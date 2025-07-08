"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"

type Stat = {
  label: string
  value: string
  info: string
  avatar?: string | null
}

export function DashboardStatsTable() {
  const [stats, setStats] = useState<Stat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((data: Stat[]) => setStats(data))
      .catch(() => toast.error("Erreur chargement des statistiques"))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistiques clés</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Stat</TableHead>
              <TableHead>Valeur</TableHead>
              <TableHead>Infos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.map((stat) => (
              <TableRow key={stat.label}>
                <TableCell>{stat.label}</TableCell>
                <TableCell>
                  {stat.avatar && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={stat.avatar} />
                        <AvatarFallback>👤</AvatarFallback>
                      </Avatar>
                      {stat.value}
                    </div>
                  )}
                  {!stat.avatar && stat.value}
                </TableCell>
                <TableCell>{stat.info}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}