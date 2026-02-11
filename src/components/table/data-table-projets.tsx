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
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Projet } from "@/types/projets"
import { useEffect, useMemo, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

type Props = {
  data: Projet[]
  onEdit: (projet: Projet) => void
  onDelete: (id: number) => void
  isLoading?: boolean
}

type ProjetClientLink = {
  client: { id: number; nom: string; photoPath?: string | null }
  isBilling?: boolean
}

export function DataTableProjets({ data, onEdit, onDelete, isLoading }: Props) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  const [initializing, setInitializing] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setInitializing(false), 600)
    return () => clearTimeout(t)
  }, [])

  const showLoading = useMemo(
      () => isLoading === true || (initializing && (!data || data.length === 0)),
      [isLoading, initializing, data]
  )

  const columns: ColumnDef<Projet>[] = [
    {
      id: "voir",
      header: "Détail",
      cell: ({ row }) => (
          <Link href={`/projets/${row.original.id}`}>
            <Button variant="outline" size="sm" className="w-[64px]">
              Voir
            </Button>
          </Link>
      ),
    },
    {
      accessorKey: "nom",
      header: ({ column }) => (
          <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="px-0"
          >
            Nom
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
      ),
      cell: ({ cell }) => (
          <div className="font-medium truncate max-w-[320px]">
            {cell.getValue<string>()}
          </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ cell }) => (
          <div className="text-muted-foreground truncate max-w-[520px]">
            {cell.getValue<string>()}
          </div>
      ),
    },
    {
      accessorKey: "missions",
      header: "Missions",
      cell: ({ row }) => <div className="tabular-nums">{row.original.missions.length}</div>,
    },
    {
      accessorKey: "clients",
      header: "Clients",
      cell: ({ row }) => {
        const raw = (row.original.clients || []) as unknown as ProjetClientLink[]
        if (!raw.length) return <span className="text-muted-foreground">Aucun</span>

        // ✅ billing en premier
        const sorted = [...raw].sort((a, b) => {
          const ab = a.isBilling ? 1 : 0
          const bb = b.isBilling ? 1 : 0
          return bb - ab
        })

        const visibles = sorted.slice(0, 3)
        const hiddenCount = sorted.length - visibles.length

        return (
            <div className="flex flex-wrap gap-2">
              {visibles.map((c) => {
                const isBilling = !!c.isBilling
                return (
                    <div
                        key={c.client.id}
                        className={[
                          "flex items-center gap-2 text-sm px-2 py-1 rounded",
                          isBilling ? "bg-background border border-slate-900/20" : "bg-muted",
                        ].join(" ")}
                        title={isBilling ? "Client de facturation" : undefined}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={c.client.photoPath || ""} alt={c.client.nom} />
                        <AvatarFallback>{c.client.nom[0]}</AvatarFallback>
                      </Avatar>

                      <span className="truncate max-w-[140px]">{c.client.nom}</span>

                      {isBilling && (
                          <span className="ml-1 text-[10px] rounded bg-slate-900 text-white px-1.5 py-0.5">
                      Billing
                    </span>
                      )}
                    </div>
                )
              })}

              {hiddenCount > 0 && (
                  <div className="flex items-center gap-2 text-sm bg-muted px-2 py-1 rounded text-muted-foreground">
                    +{hiddenCount} autre{hiddenCount > 1 ? "s" : ""}
                  </div>
              )}
            </div>
        )
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
                <DropdownMenuItem onClick={() => onEdit(row.original)}>
                  Modifier
                </DropdownMenuItem>
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
        <TableRow key={`skeleton-${i}`} className="h-[52px]">
          <TableCell className="w-[96px] py-1">
            <Skeleton className="h-8 w-[64px] rounded-md" />
          </TableCell>
          <TableCell className="w-[360px] py-1">
            <Skeleton className="h-4 w-[320px] rounded" />
          </TableCell>
          <TableCell className="w-[560px] py-1">
            <Skeleton className="h-4 w-[520px] rounded" />
          </TableCell>
          <TableCell className="w-[120px] py-1">
            <Skeleton className="h-4 w-[32px] rounded" />
          </TableCell>
          <TableCell className="w-[420px] py-1">
            <div className="flex flex-nowrap items-center gap-2 overflow-hidden">
              <div className="flex items-center gap-2 bg-muted px-2 py-1 rounded">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-[100px] rounded" />
              </div>
              <div className="flex items-center gap-2 bg-muted px-2 py-1 rounded">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-[90px] rounded" />
              </div>
              <div className="ml-1 bg-muted px-2 py-1 rounded">
                <Skeleton className="h-4 w-[48px] rounded" />
              </div>
            </div>
          </TableCell>
          <TableCell className="w-[80px] py-1">
            <div className="flex justify-end">
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </TableCell>
        </TableRow>
    ))
  }

  return (
      <div className="w-full space-y-3">
        <div className="flex items-center gap-2">
          <Input
              type="search"
              autoComplete="off"
              placeholder="Filtrer par nom..."
              value={(table.getColumn("nom")?.getFilterValue() as string) ?? ""}
              onChange={(event) => table.getColumn("nom")?.setFilterValue(event.target.value)}
              className="max-w-sm"
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
          <Table className="table-fixed text-sm">
            <colgroup>
              <col style={{ width: "96px" }} />
              <col style={{ width: "360px" }} />
              <col style={{ width: "560px" }} />
              <col style={{ width: "120px" }} />
              <col style={{ width: "420px" }} />
              <col style={{ width: "80px" }} />
            </colgroup>

            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="h-[44px]">
                    {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="py-1 whitespace-nowrap">
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
                      <TableRow key={row.id} className="h-[52px]">
                        {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className="py-1">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                        ))}
                      </TableRow>
                  ))
              ) : (
                  <TableRow className="h-[52px]">
                    <TableCell colSpan={columns.length} className="text-center py-1">
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
