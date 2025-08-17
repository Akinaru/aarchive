// components/dashboard/DashboardStatsTable.tsx
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

type StatItem = {
  label: string
  value: string
  avatar?: string | null
}

export function DashboardStatsTable() {
  const [stats, setStats] = useState<StatItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((data: StatItem[]) => setStats(data))
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded-md border p-3">
                <Skeleton className="h-3 w-24 mb-2" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.map((item, idx) => (
              <div key={idx} className="rounded-md border p-3">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm">
                  {item.avatar ? (
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={item.avatar} />
                      <AvatarFallback>👤</AvatarFallback>
                    </Avatar>
                  ) : null}
                  <span className="font-medium text-foreground">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
