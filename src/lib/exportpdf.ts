import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"
import { formatMinutes } from "@/lib/time"
import { Temps } from "@/types/temps"

type GenerateTempsPDFParams = {
  weekStart: Date
  weekEnd: Date
  temps: Temps[]
  byType: Record<string, number>
  byDate: Record<string, Temps[]>
  weekDays: Date[]
}

function cleanText(input: string): string {
  return input.replace(/[^\p{L}\p{N}\s\-'.]/gu, "").trim()
}

export function generateTempsPDF({
  weekStart,
  weekEnd,
  temps,
  byType,
  byDate,
  weekDays,
}: GenerateTempsPDFParams) {
  const doc = new jsPDF()

  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.text("Rapport hebdomadaire des temps", 14, 20)

  doc.setFontSize(12)
  doc.text("Semaine :", 14, 30)
  doc.setFont("helvetica", "normal")
  doc.text(`${format(weekStart, "dd/MM/yyyy")} - ${format(weekEnd, "dd/MM/yyyy")}`, 40, 30)

  const totalMinutes = temps.reduce((sum, t) => sum + t.dureeMinutes, 0)

  doc.setFont("helvetica", "bold")
  doc.text("Total semaine :", 14, 38)
  doc.setFont("helvetica", "normal")
  doc.text(formatMinutes(totalMinutes), 50, 38)

  const globalData = Object.entries(byType).map(([type, minutes]) => [
    type,
    formatMinutes(minutes),
    `${((minutes / totalMinutes) * 100).toFixed(1)}%`,
  ])

  autoTable(doc, {
    head: [["Type", "Durée", "Pourcentage"]],
    body: globalData,
    startY: 45,
  })

  let currentY =
    (doc as any).lastAutoTable?.finalY !== undefined
      ? (doc as any).lastAutoTable.finalY + 10
      : 55

  weekDays.forEach((dayDate) => {
    const dayKey = format(dayDate, "yyyy-MM-dd")
    const entries = byDate[dayKey] || []
    const dayMinutes = entries.reduce((sum, e) => sum + e.dureeMinutes, 0)

    doc.setFont("helvetica", "bold")
    doc.text(`${format(dayDate, "EEEE dd/MM")} — ${formatMinutes(dayMinutes)}`, 14, currentY)
    currentY += 6

    if (entries.length > 0) {
      const dayData = entries.map((e) => [
        e.mission.titre,
        e.typeTache.nom,
        formatMinutes(e.dureeMinutes),
        e.description ? cleanText(e.description) : "",
      ])

      autoTable(doc, {
        head: [["Mission", "Type", "Durée", "Description"]],
        body: dayData,
        startY: currentY,
        theme: "grid",
        styles: { fontSize: 10 },
      })

      currentY =
        (doc as any).lastAutoTable?.finalY !== undefined
          ? (doc as any).lastAutoTable.finalY + 10
          : currentY + 10
    } else {
      doc.setFont("helvetica", "normal")
      doc.text("Aucun temps enregistré", 20, currentY)
      currentY += 10
    }
  })

  doc.save(`rapport-semaine-${format(weekStart, "yyyy-MM-dd")}.pdf`)
}