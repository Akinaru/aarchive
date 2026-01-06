import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { format, addDays, isWithinInterval } from "date-fns"
import { formatMinutes } from "@/lib/time"
import { Temps } from "@/types/temps"

export type WeeklyGroup = {
  weekStart: Date
  weekEnd: Date
  temps: Temps[]
}

function cleanText(input: string): string {
  // Autorise lettres/chiffres/espaces + ponctuation courante utile en description
  return input
      .replace(/[^\p{L}\p{N}\s\-'.(),;:!?/]/gu, "")
      .replace(/\s+/g, " ")
      .trim()
}

function getMissionLabelFromGroups(weeklyGroups: WeeklyGroup[]) {
  const allTemps = weeklyGroups.flatMap((w) => w.temps)
  const titles = new Set<string>()

  for (const t of allTemps) {
    const title = t.mission?.titre ? String(t.mission.titre) : null
    if (title) titles.add(title)
  }

  if (titles.size === 1) return Array.from(titles)[0]
  if (titles.size > 1) return "Toutes les missions"
  return "—"
}

export function generateMonthlyTempsPDF(
    monthStart: Date,
    monthEnd: Date,
    weeklyGroups: WeeklyGroup[]
) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // ===== Header (amélioré) =====
  doc.setFillColor(30, 41, 59) // slate-800
  doc.rect(0, 0, pageWidth, 32, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text("Monthly Time Report", 14, 20)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(
      `From ${format(monthStart, "dd/MM/yyyy")} to ${format(monthEnd, "dd/MM/yyyy")}`,
      14,
      28
  )

  const missionLabel = cleanText(getMissionLabelFromGroups(weeklyGroups))
  doc.setTextColor(17, 24, 39) // slate-900
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text(`Mission: ${missionLabel}`, 14, 42)

  // fine separator
  doc.setDrawColor(226, 232, 240) // slate-200
  doc.setLineWidth(0.6)
  doc.line(14, 46, pageWidth - 14, 46)

  let currentY = 54
  const totalWorkedDays = new Set<string>()

  // ===== Weekly sections =====
  weeklyGroups.forEach(({ weekStart, weekEnd, temps }, index) => {
    const totalMinutes = temps.reduce((sum, t) => sum + Number(t.dureeMinutes ?? 0), 0)

    // Section title pill
    doc.setFillColor(241, 245, 249) // slate-100
    doc.roundedRect(14, currentY - 6, pageWidth - 28, 10, 2, 2, "F")
    doc.setTextColor(15, 23, 42) // slate-900
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.text(
        `Week ${index + 1} (${format(weekStart, "dd/MM")} - ${format(weekEnd, "dd/MM")}): ${formatMinutes(
            totalMinutes
        )}`,
        16,
        currentY
    )
    currentY += 10

    // ---- Repartition by task type ----
    const byType: Record<string, number> = {}
    const byDay: Record<string, number> = {}

    temps.forEach((t) => {
      const type = cleanText(t.typeTache?.nom ?? "Sans type")
      byType[type] = (byType[type] || 0) + Number(t.dureeMinutes ?? 0)

      const key = format(new Date(t.date), "yyyy-MM-dd")
      byDay[key] = (byDay[key] || 0) + Number(t.dureeMinutes ?? 0)
    })

    const repartition = Object.entries(byType)
        .sort((a, b) => b[1] - a[1])
        .map(([type, minutes]) => [
          type,
          formatMinutes(minutes),
          `${totalMinutes > 0 ? ((minutes / totalMinutes) * 100).toFixed(1) : "0.0"}%`,
        ])

    autoTable(doc, {
      head: [["Task Type", "Duration", "%"]],
      body: repartition.length ? repartition : [["—", "0m", "0.0%"]],
      startY: currentY,
      theme: "grid",
      headStyles: {
        fillColor: [226, 232, 240], // slate-200
        textColor: 15,
        fontStyle: "bold",
      },
      styles: { fontSize: 9, cellPadding: 2, textColor: 20 },
      alternateRowStyles: { fillColor: [248, 250, 252] }, // slate-50
      margin: { left: 14, right: 14 },
    })

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4

    // ---- Daily summary ----
    const dailyRows = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
        .filter((date) => isWithinInterval(date, { start: monthStart, end: monthEnd }))
        .map((date) => {
          const key = format(date, "yyyy-MM-dd")
          const minutes = byDay[key] || 0
          if (minutes > 0) totalWorkedDays.add(key)
          return [format(date, "EEEE"), format(date, "dd/MM/yyyy"), formatMinutes(minutes)]
        })

    autoTable(doc, {
      head: [["Day", "Date", "Time Worked"]],
      body: dailyRows.length ? dailyRows : [["—", "—", "0m"]],
      startY: currentY,
      theme: "striped",
      headStyles: {
        fillColor: [241, 245, 249], // slate-100
        textColor: 15,
        fontStyle: "bold",
      },
      styles: { fontSize: 9, cellPadding: 2, textColor: 20 },
      margin: { left: 14, right: 14 },
    })

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4

    // ---- NEW: Detailed entries (unité) ----
    const detailedRows = temps
        .slice()
        .sort((a, b) => +new Date(a.date) - +new Date(b.date))
        .map((t) => {
          const dt = new Date(t.date)
          const mission = cleanText(t.mission?.titre ?? "—")
          const type = cleanText(t.typeTache?.nom ?? "—")
          const desc = t.description ? cleanText(String(t.description)) : "—"
          const minutes = Number(t.dureeMinutes ?? 0)

          return [
            format(dt, "dd/MM/yyyy"),
            format(dt, "HH:mm"),
            mission,
            type,
            desc,
            formatMinutes(minutes),
          ]
        })

    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(15, 23, 42)
    doc.text("Detailed time entries", 14, currentY + 4)
    currentY += 8

    autoTable(doc, {
      head: [["Date", "Time", "Mission", "Task Type", "Description", "Duration"]],
      body: detailedRows.length ? detailedRows : [["—", "—", "—", "—", "—", "0m"]],
      startY: currentY,
      theme: "grid",
      headStyles: {
        fillColor: [30, 41, 59], // slate-800
        textColor: 255,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 2,
        overflow: "linebreak",
        valign: "top",
      },
      columnStyles: {
        0: { cellWidth: 18 }, // date
        1: { cellWidth: 14 }, // time
        2: { cellWidth: 34 }, // mission
        3: { cellWidth: 26 }, // type
        4: { cellWidth: 70 }, // description
        5: { cellWidth: 18, halign: "right" }, // duration
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    })

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  })

  // ===== Billing summary =====
  const allTemps = weeklyGroups.flatMap((w) => w.temps)
  const groupedByMission: Record<number, Temps[]> = {}

  allTemps.forEach((t) => {
    if (!t.mission?.id) return
    groupedByMission[t.mission.id] = groupedByMission[t.mission.id] || []
    groupedByMission[t.mission.id].push(t)
  })

  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.setTextColor(15, 23, 42)
  doc.text("Billing Summary", 14, currentY)
  currentY += 6

  let totalFacture = 0

  Object.entries(groupedByMission).forEach(([, entries]) => {
    const mission = entries[0].mission!
    const tjm = Number(mission.tjm || 0)
    const totalMinutes = entries.reduce((sum, t) => sum + Number(t.dureeMinutes ?? 0), 0)
    const days = totalMinutes / 450
    const invoiceAmount = tjm * days
    totalFacture += invoiceAmount

    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.text(`${cleanText(mission.titre)}`, 14, currentY)
    currentY += 6

    autoTable(doc, {
      head: [["Daily Rate (TJM)", "Time", "Days", "Billed"]],
      body: [
        [
          `${tjm.toFixed(2)} €`,
          formatMinutes(totalMinutes),
          `${days.toFixed(2)} d`,
          `${invoiceAmount.toFixed(2)} €`,
        ],
      ],
      startY: currentY,
      theme: "striped",
      headStyles: {
        fillColor: [226, 232, 240],
        textColor: 15,
        fontStyle: "bold",
      },
      styles: { fontSize: 10, cellPadding: 2, textColor: 20 },
      margin: { left: 14, right: 14 },
    })

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
  })

  // Total footer
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.6)
  doc.line(14, currentY, pageWidth - 14, currentY)
  currentY += 7

  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(15, 23, 42)
  doc.text(`Total billed: ${totalFacture.toFixed(2)} €`, 14, currentY)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(71, 85, 105) // slate-600
  doc.text(`Worked days: ${totalWorkedDays.size}`, pageWidth - 14, currentY, { align: "right" })

  doc.save(`monthly-report-${format(monthStart, "yyyy-MM")}.pdf`)
}
