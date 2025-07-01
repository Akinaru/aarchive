import { PageHeader } from "@/components/page-header";

export default function DashboardPage() {
  return (
      <PageHeader
        title="Dashboard"
        subtitle="Gérer en globalité votre temps et vos missions."
        breadcrumb={[
          { label: "Dashboard" },
        ]}
      />
  )
}
