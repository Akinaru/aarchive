"use client"

import { PageHeader } from "@/components/page-header"
import { SectionCards } from "@/components/dashboard/dashboard-section-cards"
import { DashboardGraphMissions } from "@/components/dashboard/dashboard-graph-missions"
import { DashboardStatsTable } from "@/components/dashboard/dashboard-stats-table"

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 md:gap-6">
          <PageHeader
            title="Dashboard"
            subtitle="Gérer en globalité votre temps, missions et clients."
            breadcrumb={[{ label: "Dashboard" }]}
          />

          <SectionCards />

          <DashboardGraphMissions />
          <DashboardStatsTable/>
        </div>
      </div>
    </div>
  )
}