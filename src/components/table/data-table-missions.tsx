// src/components/table/data-table-missions.tsx
"use client"

import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu"
import { Mission } from "@/types/missions"
import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { STATUT_ICONS } from "@/lib/status"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type Props = {
  data: Mission[]
  onEdit: (mission: Mission) => void
  onDelete: (id: number) => void
  isLoading?: boolean
}

export function DataTableMissions({ data, onEdit, onDelete, isLoading }: Props) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  // Anti-flash
  const [initializing, setInitializing] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setInitializing(false), 600)
    return () => clearTimeout(t)
  }, [])

  const showLoading = useMemo(
      () => isLoading === true || (initializing && (!data || data.length === 0)),
      [isLoading, initializing, data]
  )

  const columns: ColumnDef<Mission>[] = [
    {
      id: "voir",
      header: "Détail",
      cell: ({ row }) => (
          <Link href={`/missions/${row.original.id}`}>
            <Button variant="outline" size="sm" className="w-[64px]">
              Voir
            </Button>
          </Link>
      ),
    },
    {
      id: "mission",
      header: ({ column }) => (
          <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="px-0"
          >
            Mission
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
      ),
      accessorFn: (row) => row.titre,
      cell: ({ row }) => {
        const mission = row.original
        const initial = mission.titre?.[0]?.toUpperCase() ?? "?"
        return (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={mission.image || ""} alt={mission.titre} />
                <AvatarFallback className="text-sm">{initial}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="font-medium truncate max-w-[260px]">{mission.titre}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[260px]">
                {mission.projet?.nom ?? "—"}
              </span>
              </div>
            </div>
        )
      },
    },
    {
      accessorKey: "statut",
      header: "Statut",
      cell: ({ row }) => {
        const statut = row.original.statut
        const { icon: Icon, className, spin } = STATUT_ICONS[statut] || {}
        return (
            <Badge variant="outline" className={`flex items-center gap-1 ${className}`}>
              {Icon && <Icon className={`mr-1 h-3 w-3 ${spin ? "animate-spin" : ""}`} />}
              {statut.replace("_", " ").toLowerCase()}
            </Badge>
        )
      },
    },
    {
      accessorKey: "dateDebut",
      header: "Début",
      cell: ({ row }) => {
        const date = row.original.dateDebut
        return <span className="tabular-nums">{date ? new Date(date).toLocaleDateString("fr-FR") : "-"}</span>
      },
    },
    {
      accessorKey: "requiredDailyMinutes",
      header: "Cible / jour",
      cell: ({ row }) => {
        const minutes = row.original.requiredDailyMinutes
        if (!minutes) return "—"
        const h = Math.floor(minutes / 60)
        const m = minutes % 60
        return <span className="tabular-nums">{h}h{m > 0 ? ` ${m}min` : ""}</span>
      },
    },
    {
      accessorKey: "tjm",
      header: "TJM",
      cell: ({ row }) => {
        const tjm = row.original.tjm
        return <span className="tabular-nums">{tjm ? `${tjm.toFixed(0)} €` : "—"}</span>
      },
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => null,
      cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(row.original)}>Modifier</DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => onDelete(row.original.id)}
                    className="text-destructive"
                >
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
      ),
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
  })

  const renderSkeletonRows = () => {
    return Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={`skeleton-${i}`} className="h-[64px]">
          {/* Détail */}
          <TableCell className="w-[96px]">
            <Skeleton className="h-8 w-[64px] rounded-md" />
          </TableCell>

          {/* Mission (avatar + 2 lignes) */}
          <TableCell className="w-[420px]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10">
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
              <div className="flex flex-col min-w-0">
                <Skeleton className="h-4 w-[240px] rounded" />
                <div className="mt-2">
                  <Skeleton className="h-3 w-[200px] rounded" />
                </div>
              </div>
            </div>
          </TableCell>

          {/* Statut */}
          <TableCell className="w-[160px]">
            <div className="inline-flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-6 w-[110px] rounded-md" />
            </div>
          </TableCell>

          {/* Début */}
          <TableCell className="w-[140px]">
            <Skeleton className="h-4 w-[90px] rounded" />
          </TableCell>

          {/* Cible / jour */}
          <TableCell className="w-[160px]">
            <Skeleton className="h-4 w-[120px] rounded" />
          </TableCell>

          {/* TJM */}
          <TableCell className="w-[120px]">
            <Skeleton className="h-4 w-[60px] rounded" />
          </TableCell>

          {/* Actions */}
          <TableCell className="w-[80px]">
            <div className="flex justify-end">
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </TableCell>
        </TableRow>
    ))
  }

  return (
      <div className="w-full space-y-4">
        <div className="flex items-center gap-2">
          <Input
              type="search"
              placeholder="Filtrer par titre..."
              value={(table.getColumn("mission")?.getFilterValue() as string) ?? ""}
              onChange={(event) => table.getColumn("mission")?.setFilterValue(event.target.value)}
              className="max-w-sm"
              autoComplete="off"
              disabled={showLoading}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto" disabled={showLoading}>
                Colonnes <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table.getAllColumns()
                  .filter((col) => col.getCanHide())
                  .map((column) => (
                      <DropdownMenuCheckboxItem
                          key={column.id}
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                  ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="rounded-md border">
          <Table className="table-fixed">
            {/* Grille figée (skeleton = contenu) */}
            <colgroup>
              <col style={{ width: "96px" }} />
              <col style={{ width: "420px" }} />
              <col style={{ width: "160px" }} />
              <col style={{ width: "140px" }} />
              <col style={{ width: "160px" }} />
              <col style={{ width: "120px" }} />
              <col style={{ width: "80px" }} />
            </colgroup>

            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="whitespace-nowrap">
                          {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                    ))}
                  </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {showLoading ? (
                  renderSkeletonRows()
              ) : table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} className="h-[64px]">
                        {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                        ))}
                      </TableRow>
                  ))
              ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center h-24">
                      Aucun résultat.
                    </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end gap-2">
          <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={showLoading || !table.getCanPreviousPage()}
          >
            Précédent
          </Button>
          <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={showLoading || !table.getCanNextPage()}
          >
            Suivant
          </Button>
        </div>
      </div>
  )
}
