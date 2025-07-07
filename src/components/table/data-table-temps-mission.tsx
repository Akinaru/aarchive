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
import { Trash2, ChevronDown, Pencil } from "lucide-react"
import { useState } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import { Temps } from "@/types/temps"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FormAddTemps } from "@/components/form/form-ajout-temps"

type Props = {
  data: Temps[]
  onDelete: (id: number) => void
  onEdit: () => void
}

export function DataTableTempsMission({ data, onDelete, onEdit }: Props) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  const [selectedTemps, setSelectedTemps] = useState<Temps | null>(null)

  const columns: ColumnDef<Temps>[] = [
    {
      accessorKey: "typeTache.nom",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() =>
            column.toggleSorting(column.getIsSorted() === "asc")
          }
        >
          Type de tâche
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => row.original.typeTache?.nom ?? "Inconnu",
    },
    {
      accessorKey: "dureeMinutes",
      header: "Durée",
      cell: ({ cell }) => {
        const v = cell.getValue<number>()
        const h = Math.floor(v / 60)
        const m = v % 60
        return `${h > 0 ? `${h}h` : ""}${m > 0 ? `${m}min` : ""}`
      },
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ cell }) => format(new Date(cell.getValue<string>()), "dd/MM/yyyy HH:mm"),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ cell }) => cell.getValue<string>() || "-",
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => null,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedTemps(row.original)}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={() => {
              onDelete(row.original.id)
              toast.success("Temps supprimé")
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
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

  return (
    <>
      <div className="w-full space-y-4">
        <div className="flex items-center gap-2">
          <Input
            type="search"
            placeholder="Filtrer par type..."
            value={(table.getColumn("typeTache.nom")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("typeTache.nom")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
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
            disabled={!table.getCanPreviousPage()}
          >
            Précédent
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Suivant
          </Button>
        </div>
      </div>

      <Dialog
        open={!!selectedTemps}
        onOpenChange={(open) => {
          if (!open) setSelectedTemps(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le temps</DialogTitle>
          </DialogHeader>
          {selectedTemps && (
            <FormAddTemps
                          missionId={selectedTemps.missionId}
                          onAdd={() => {
                              setSelectedTemps(null)
                              onEdit()
                          } } types={[]}            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
