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
  return input.replace(/[^\p{L}\p{N}\s\-'.]/gu, "").trim()
}

export function generateMonthlyTempsPDF(
    monthStart: Date,
    monthEnd: Date,
    weeklyGroups: WeeklyGroup[]
) {
  const doc = new jsPDF()

  doc.setFillColor(200, 200, 200)
  doc.rect(0, 0, 210, 30, "F")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text("Monthly Time Report", 14, 20)

  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text(
      `From ${format(monthStart, "dd/MM/yyyy")} to ${format(monthEnd, "dd/MM/yyyy")}`,
      14,
      36
  )

  let currentY = 44
  const totalWorkedDays = new Set<string>()

  weeklyGroups.forEach(({ weekStart, weekEnd, temps }, index) => {
    const totalMinutes = temps.reduce((sum, t) => sum + t.dureeMinutes, 0)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text(
        `Week ${index + 1} (${format(weekStart, "dd/MM")} - ${format(weekEnd, "dd/MM")}): ${formatMinutes(totalMinutes)}`,
        14,
        currentY
    )
    currentY += 6

    const byType: Record<string, number> = {}
    const byDay: Record<string, number> = {}

    temps.forEach((t) => {
      const type = cleanText(t.typeTache.nom)
      byType[type] = (byType[type] || 0) + t.dureeMinutes

      const key = format(new Date(t.date), "yyyy-MM-dd")
      byDay[key] = (byDay[key] || 0) + t.dureeMinutes
    })

    const repartition = Object.entries(byType).map(([type, minutes]) => [
      type,
      formatMinutes(minutes),
      `${totalMinutes > 0 ? ((minutes / totalMinutes) * 100).toFixed(1) : "0.0"}%`,
    ])

    autoTable(doc, {
      head: [["Task Type", "Duration", "%"]],
      body: repartition,
      startY: currentY,
      theme: "grid",
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: 0,
        fontStyle: "bold",
      },
      styles: { fontSize: 9, cellPadding: 2 },
      margin: { left: 14, right: 14 },
    })

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4

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
      body: dailyRows,
      startY: currentY,
      theme: "striped",
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: 0,
        fontStyle: "bold",
      },
      styles: { fontSize: 9, cellPadding: 2 },
      margin: { left: 14, right: 14 },
    })

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  })

  const allTemps = weeklyGroups.flatMap((w) => w.temps)
  const groupedByMission: Record<number, Temps[]> = {}

  allTemps.forEach((t) => {
    if (!t.mission?.id) return
    groupedByMission[t.mission.id] = groupedByMission[t.mission.id] || []
    groupedByMission[t.mission.id].push(t)
  })

  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.text("Billing Summary", 14, currentY)
  currentY += 6

  let totalFacture = 0

  Object.entries(groupedByMission).forEach(([, entries]) => {
    const mission = entries[0].mission!
    const tjm = mission.tjm || 0
    const totalMinutes = entries.reduce((sum, t) => sum + t.dureeMinutes, 0)
    const days = totalMinutes / 450
    const invoiceAmount = tjm * days
    totalFacture += invoiceAmount

    doc.setFont("helvetica", "normal")
    doc.setFontSize(11)
    doc.text(`${mission.titre}`, 14, currentY)
    currentY += 6

    autoTable(doc, {
      head: [["Daily Rate (TJM)", "Time", "Days", "Billed"]],
      body: [[`${tjm.toFixed(2)} €`, formatMinutes(totalMinutes), `${days.toFixed(2)} d`, `${invoiceAmount.toFixed(2)} €`]],
      startY: currentY,
      theme: "striped",
      styles: { fontSize: 10, cellPadding: 2 },
      margin: { left: 14, right: 14 },
    })

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6
  })

  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text(`Total billed: ${totalFacture.toFixed(2)} €`, 14, currentY)
  currentY += 10

  doc.save(`monthly-report-${format(monthStart, "yyyy-MM")}.pdf`)
}
