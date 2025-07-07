"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function BreadcrumbSkeleton() {
  return (
    <div className="space-y-2 mb-4">
      <Skeleton className="h-6 w-[200px]" />
      <Skeleton className="h-6 w-[100px]" />
      <Skeleton className="h-4 w-1/4" />
    </div>
  )
}