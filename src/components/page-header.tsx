"use client"

import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { SidebarTrigger } from "./ui/sidebar"

type PageHeaderProps = {
  title: string
  subtitle?: string
  breadcrumb?: {
    label: string
    href?: string
  }[]
  className?: string
}

export function PageHeader({ title, subtitle, breadcrumb, className }: PageHeaderProps) {
  return (
    <div className={cn("space-y-1 mb-6", className)}>
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        {breadcrumb && (
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            {breadcrumb.map((item, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-4 w-4" />}
                {item.href ? (
                  <Link href={item.href} className="hover:underline">
                    {item.label}
                  </Link>
                ) : (
                  <span className="font-medium text-foreground">{item.label}</span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
    </div>
  )
}