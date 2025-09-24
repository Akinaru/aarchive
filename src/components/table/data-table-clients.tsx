"use client"

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Client } from "@/types/clients"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

type Props = {
  data: (Client & { nbProjets?: number; totalMinutes?: number })[]
  onEdit: (client: Client) => void
  onDelete: (id: number) => void
  isLoading?: boolean
}

export function DataTableClients({ data, onEdit, onDelete, isLoading }: Props) {
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

  const columns: ColumnDef<Client & { nbProjets?: number; totalMinutes?: number }>[] = [
    {
      id: "voir",
      header: "Détail",
      cell: ({ row }) => (
        <Link href={`/clients/${row.original.id}`}>
          <Button variant="outline" size="sm" className="w-[64px]">
            Voir
          </Button>
        </Link>
      ),
    },
    {
      accessorKey: "nom",
      header: "Client",
      cell: ({ row }) => {
        const client = row.original
        const initial = client.nom?.[0]?.toUpperCase() ?? "?"
        return (
          <div className="flex items-center gap-3">
            {/* Avatar shadcn par défaut = h-10 w-10, on fige pour le skeleton parity */}
            <Avatar className="h-10 w-10">
              <AvatarImage src={client.photoPath || ""} alt={client.nom} />
              <AvatarFallback className="text-sm">{initial}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="font-medium truncate max-w-[240px]">{client.nom}</span>
              {client.email && (
                <span className="text-xs text-muted-foreground truncate max-w-[240px]">
                  {client.email}
                </span>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "telephone",
      header: "Téléphone",
      cell: ({ cell }) => <span className="tabular-nums">{cell.getValue<string>() ?? "—"}</span>,
    },
    {
      accessorKey: "nbProjets",
      header: "Projets",
      cell: ({ row }) => <span className="tabular-nums">{row.getValue("nbProjets") ?? 0}</span>,
    },
    {
      accessorKey: "totalMinutes",
      header: "Temps total",
      cell: ({ row }) => {
        const minutes = (row.getValue<number>("totalMinutes") as number) || 0
        const h = Math.floor(minutes / 60)
        const m = minutes % 60
        return <span className="tabular-nums">{h}h{m > 0 ? ` ${m}min` : ""}</span>
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
    // 5 lignes de skeleton avec EXACTEMENT la même structure/tailles que les cellules réelles
    return Array.from({ length: 5 }).map((_, i) => (
      <TableRow key={`skeleton-${i}`} className="h-[64px]">
        {/* Détail (bouton 32px hauteur, 64px largeur) */}
        <TableCell className="w-[96px]">
          <Skeleton className="h-8 w-[64px] rounded-md" />
        </TableCell>

        {/* Client (avatar 40px et 2 lignes de texte) */}
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

        {/* Téléphone */}
        <TableCell className="w-[180px]">
          <Skeleton className="h-4 w-[120px] rounded" />
        </TableCell>

        {/* Projets */}
        <TableCell className="w-[120px]">
          <Skeleton className="h-4 w-[32px] rounded" />
        </TableCell>

        {/* Temps total */}
        <TableCell className="w-[180px]">
          <Skeleton className="h-4 w-[80px] rounded" />
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
        <Table className="table-fixed">
          {/* Colgroup pour figer les largeurs → skeleton et contenu ont EXACTEMENT la même grille */}
          <colgroup>
            <col style={{ width: "96px" }} />
            <col style={{ width: "420px" }} />
            <col style={{ width: "180px" }} />
            <col style={{ width: "120px" }} />
            <col style={{ width: "180px" }} />
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
