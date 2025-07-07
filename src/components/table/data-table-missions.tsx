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
import {
  ChevronDown,
  MoreHorizontal,
  Loader2,
  CheckCircle,
  Clock,
  Eye,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu"
import { Mission } from "@/types/missions"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import Link from "next/link"

type Props = {
  data: Mission[]
  onEdit: (mission: Mission) => void
  onDelete: (id: number) => void
}

export function DataTableMissions({ data, onEdit, onDelete }: Props) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  const [selectedMissionForValidation, setSelectedMissionForValidation] = useState<Mission | null>(null)
  const [montantPaiement, setMontantPaiement] = useState("")

  const handleValiderPaiement = async () => {
    if (!selectedMissionForValidation) return

    try {
      const res = await fetch(`/api/missions/${selectedMissionForValidation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prixReel: parseFloat(montantPaiement),
        }),
      })

      if (!res.ok) throw new Error()
      toast.success("Paiement validé")
      setSelectedMissionForValidation(null)
      setMontantPaiement("")
    } catch {
      toast.error("Erreur lors de la validation")
    }
  }

  const columns: ColumnDef<Mission>[] = [
    {
      accessorKey: "titre",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() =>
            column.toggleSorting(column.getIsSorted() === "asc")
          }
        >
          Titre
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ cell }) => (
        <div className="font-medium">{cell.getValue<string>()}</div>
      ),
    },
    {
      accessorKey: "statut",
      header: "Statut",
      cell: ({ row }) => {
        const statut = row.original.statut
        let icon = null
        let color = "text-muted-foreground"

        switch (statut) {
          case "EN_COURS":
            icon = <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            color = "text-blue-500"
            break
          case "TERMINEE":
            icon = <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
            color = "text-green-500"
            break
          case "EN_ATTENTE":
            icon = <Clock className="mr-1 h-3 w-3 text-yellow-500" />
            color = "text-yellow-500"
            break
        }

        return (
          <Badge variant="outline" className={`flex items-center gap-1 ${color}`}>
            {icon}
            {statut.replace("_", " ").toLowerCase()}
          </Badge>
        )
      },
    },
    {
      accessorKey: "prixEstime",
      header: "Prix estimé",
      cell: ({ cell }) => <div>{cell.getValue<number>()} €</div>,
    },
    {
      accessorKey: "prixReel",
      header: "Prix réel",
      cell: ({ cell }) => {
        const value = cell.getValue<number | null>()
        return <div>{value !== null ? `${value} €` : "-"}</div>
      },
    },
    {
      accessorKey: "projet.nom",
      header: "Projet",
      cell: ({ row }) => <div>{row.original.projet.nom}</div>,
    },
    {
      id: "voir",
      header: "Détail",
      cell: ({ row }) => (
        <Link href={`/missions/${row.original.id}`}>
          <Button variant="outline" size="sm" className="w-full">
            Voir
          </Button>
        </Link>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => null,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(row.original)}>Modifier</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedMissionForValidation(row.original)}>
                Valider le paiement
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

  return (
    <>
      <div className="w-full space-y-4">
        <div className="flex items-center gap-2">
          <Input
            type="search"
            placeholder="Filtrer par titre..."
            value={(table.getColumn("titre")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("titre")?.setFilterValue(event.target.value)
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
        open={!!selectedMissionForValidation}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMissionForValidation(null)
            setMontantPaiement("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Valider le paiement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="number"
              placeholder="Montant payé (€)"
              value={montantPaiement}
              onChange={(e) => setMontantPaiement(e.target.value)}
            />
            <Button onClick={handleValiderPaiement}>Valider</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
