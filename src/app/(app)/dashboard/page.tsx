import { PageHeader } from "@/components/page-header";
import { SectionCards } from "./section-cards";
import { ChartAreaInteractive } from "./chart-area-interactive";

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <PageHeader
            title="Dashboard"
            subtitle="Gérer en globalité votre temps et vos missions."
            breadcrumb={[
              { label: "Dashboard" },
            ]}
          />

          <SectionCards />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>
        </div>
      </div>
    </div>
  )
}
