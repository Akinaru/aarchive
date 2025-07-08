"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { SectionCards } from "@/components/dashboard/dashboard-section-cards"
import { ChartAreaInteractive } from "@/components/chart/chart-area-interactive"
import { DashboardGraphMissions } from "@/components/dashboard/dashboard-graph-missions"
import { DashboardStatsTable } from "@/components/dashboard/dashboard-stats-table"

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <PageHeader
            title="Dashboard"
            subtitle="Gérer en globalité votre temps, missions et clients."
            breadcrumb={[{ label: "Dashboard" }]}
          />

          <SectionCards />

          <div className="grid grid-cols-1 gap-6 px-4 lg:grid-cols-2 lg:px-6">
            <DashboardGraphMissions navigation={false} />
            <DashboardStatsTable />
          </div>


          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>
        </div>
      </div>
    </div>
  )
}