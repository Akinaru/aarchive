import { CheckCircle, Clock, Loader2, XCircle, LucideIcon } from "lucide-react"

type Statut = "EN_COURS" | "TERMINEE" | "EN_ATTENTE" | "ANNULEE"

export const STATUT_ICONS: Record<Statut, { icon: LucideIcon; className: string; spin?: boolean }> = {
  EN_COURS: { icon: Loader2, className: "text-blue-500", spin: true },
  TERMINEE: { icon: CheckCircle, className: "text-green-500" },
  EN_ATTENTE: { icon: Clock, className: "text-yellow-500" },
  ANNULEE: { icon: XCircle, className: "text-red-500" },
}