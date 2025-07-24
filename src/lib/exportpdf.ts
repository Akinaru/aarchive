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

  // Titre principal
  doc.setFillColor(240)
  doc.rect(0, 0, 210, 30, 'F')
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text("Rapport hebdomadaire des temps", 14, 20)

  // Dates
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text(`Semaine du ${format(weekStart, "dd/MM/yyyy")} au ${format(weekEnd, "dd/MM/yyyy")}`, 14, 36)

  // Total
  const totalMinutes = temps.reduce((sum, t) => sum + t.dureeMinutes, 0)
  doc.setFont("helvetica", "bold")
  doc.text("Total semaine :", 14, 44)
  doc.setFont("helvetica", "normal")
  doc.text(formatMinutes(totalMinutes), 50, 44)

  // 🧾 Répartition globale par type
  const globalData = Object.entries(byType).map(([type, minutes]) => [
    type,
    formatMinutes(minutes),
    `${((minutes / totalMinutes) * 100).toFixed(1)}%`,
  ])

  autoTable(doc, {
    head: [["Type", "Durée", "Pourcentage"]],
    body: globalData,
    startY: 50,
    theme: "grid",
    headStyles: {
      fillColor: [220, 220, 220],
      textColor: 0,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
  })

  let currentY =
    (doc as any).lastAutoTable?.finalY !== undefined
      ? (doc as any).lastAutoTable.finalY + 10
      : 60

  // 📅 Détail journalier
  weekDays.forEach((dayDate) => {
    const dayKey = format(dayDate, "yyyy-MM-dd")
    const entries = byDate[dayKey] || []
    const dayMinutes = entries.reduce((sum, e) => sum + e.dureeMinutes, 0)

    // Check for new page if needed
    if (currentY > 260) {
      doc.addPage()
      currentY = 20
    }

    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text(`${format(dayDate, "EEEE dd/MM")} — ${formatMinutes(dayMinutes)}`, 14, currentY)
    currentY += 6

    if (entries.length > 0) {
      const dayData = entries.map((e) => [
        e.mission.titre,
        e.typeTache.nom,
        formatMinutes(e.dureeMinutes),
        e.description ? cleanText(e.description) : "—",
      ])

      autoTable(doc, {
        head: [["Mission", "Type", "Durée", "Description"]],
        body: dayData,
        startY: currentY,
        theme: "striped",
        headStyles: {
          fillColor: [200, 200, 200],
          textColor: 0,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 9,
          cellPadding: 2,
        },
        margin: { left: 14, right: 14 },
      })

      currentY =
        (doc as any).lastAutoTable?.finalY !== undefined
          ? (doc as any).lastAutoTable.finalY + 10
          : currentY + 10
    } else {
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.text("Aucun temps enregistré", 20, currentY)
      currentY += 10
    }
  })

  // 📄 Export
  doc.save(`rapport-semaine-${format(weekStart, "yyyy-MM-dd")}.pdf`)
}