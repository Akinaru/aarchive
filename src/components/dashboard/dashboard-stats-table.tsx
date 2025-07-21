"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistiques clés</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <Skeleton className="h-5 w-1/4 my-1" />
                <Skeleton className="h-5 w-1/4 my-1" />
                <Skeleton className="h-5 w-1/3 my-1" />
              </div>
            ))}
          </div>
        ) : (
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
                    {stat.avatar ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={stat.avatar} />
                          <AvatarFallback>👤</AvatarFallback>
                        </Avatar>
                        {stat.value}
                      </div>
                    ) : (
                      stat.value
                    )}
                  </TableCell>
                  <TableCell>{stat.info}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}