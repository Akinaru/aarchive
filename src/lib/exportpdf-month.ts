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

/** ✅ extrait le format + data utilisable par jsPDF.addImage */
function parseDataUrlImage(dataUrl: string): { format: "PNG" | "JPEG"; data: string } | null {
  // data:image/png;base64,AAAA
  const m = /^data:image\/(png|jpeg|jpg);base64,(.+)$/i.exec(dataUrl)
  if (!m) return null
  const ext = m[1].toLowerCase()
  const format = ext === "png" ? "PNG" : "JPEG"
  return { format, data: m[2] }
}

function drawMissionAvatar(
    doc: jsPDF,
    x: number,
    y: number,
    size: number,
    imageDataUrl: string | null | undefined,
    fallbackText: string
) {
  // fond cercle
  doc.setFillColor(241, 245, 249) // slate-100
  doc.circle(x + size / 2, y + size / 2, size / 2, "F")

  const parsed = imageDataUrl ? parseDataUrlImage(imageDataUrl) : null
  if (parsed) {
    try {
      // petit padding pour éviter de toucher le bord
      const pad = Math.max(1, Math.round(size * 0.12))
      doc.addImage(parsed.data, parsed.format, x + pad, y + pad, size - pad * 2, size - pad * 2)
      return
    } catch {
      // fallback texte en cas d'image invalide
    }
  }

  // fallback lettre
  doc.setTextColor(71, 85, 105) // slate-600
  doc.setFont("helvetica", "bold")
  doc.setFontSize(Math.max(8, Math.round(size * 0.55)))
  const letter = cleanText(fallbackText).slice(0, 1).toUpperCase() || "?"
  // centrage approximatif
  doc.text(letter, x + size / 2, y + size * 0.68, { align: "center" })
}

export function generateMonthlyTempsPDF(monthStart: Date, monthEnd: Date, weeklyGroups: WeeklyGroup[]) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // ===== Header =====
  doc.setFillColor(30, 41, 59)
  doc.rect(0, 0, pageWidth, 32, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text("Monthly Time Report", 14, 20)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`From ${format(monthStart, "dd/MM/yyyy")} to ${format(monthEnd, "dd/MM/yyyy")}`, 14, 28)

  const missionLabel = cleanText(getMissionLabelFromGroups(weeklyGroups))
  doc.setTextColor(17, 24, 39)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text(`Mission: ${missionLabel}`, 14, 42)

  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.6)
  doc.line(14, 46, pageWidth - 14, 46)

  let currentY = 54
  const totalWorkedDays = new Set<string>()

  // ===== Weekly sections =====
  weeklyGroups.forEach(({ weekStart, weekEnd, temps }, index) => {
    const totalMinutes = temps.reduce((sum, t) => sum + Number(t.dureeMinutes ?? 0), 0)

    doc.setFillColor(241, 245, 249)
    doc.roundedRect(14, currentY - 6, pageWidth - 28, 10, 2, 2, "F")
    doc.setTextColor(15, 23, 42)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.text(
        `Week ${index + 1} (${format(weekStart, "dd/MM")} - ${format(weekEnd, "dd/MM")}): ${formatMinutes(totalMinutes)}`,
        16,
        currentY
    )
    currentY += 10

    const byType: Record<string, number> = {}
    const byDay: Record<string, number> = {}

    temps.forEach((t) => {
      const type = cleanText(t.typeTache?.nom ?? "Sans type")
      byType[type] = (byType[type] || 0) + Number(t.dureeMinutes ?? 0)

      const key = format(new Date(t.date as any), "yyyy-MM-dd")
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
      headStyles: { fillColor: [226, 232, 240], textColor: 15, fontStyle: "bold" },
      styles: { fontSize: 9, cellPadding: 2, textColor: 20 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
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
      body: dailyRows.length ? dailyRows : [["—", "—", "0m"]],
      startY: currentY,
      theme: "striped",
      headStyles: { fillColor: [241, 245, 249], textColor: 15, fontStyle: "bold" },
      styles: { fontSize: 9, cellPadding: 2, textColor: 20 },
      margin: { left: 14, right: 14 },
    })

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4

    const detailedRows = temps
        .slice()
        .sort((a, b) => +new Date(a.date as any) - +new Date(b.date as any))
        .map((t) => {
          const dt = new Date(t.date as any)
          const mission = cleanText(t.mission?.titre ?? "—")
          const type = cleanText(t.typeTache?.nom ?? "—")
          const desc = t.description ? cleanText(String(t.description)) : "—"
          const minutes = Number(t.dureeMinutes ?? 0)

          return [format(dt, "dd/MM/yyyy"), format(dt, "HH:mm"), mission, type, desc, formatMinutes(minutes)]
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
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 8.5, cellPadding: 2, overflow: "linebreak", valign: "top" },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 14 },
        2: { cellWidth: 34 },
        3: { cellWidth: 26 },
        4: { cellWidth: 70 },
        5: { cellWidth: 18, halign: "right" },
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
    const mid = t.mission?.id
    if (!mid) return
    groupedByMission[mid] = groupedByMission[mid] || []
    groupedByMission[mid].push(t)
  })

  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.setTextColor(15, 23, 42)
  doc.text("Billing Summary", 14, currentY)
  currentY += 8

  let totalFacture = 0

  Object.entries(groupedByMission).forEach(([, entries]) => {
    const mission = entries[0].mission
    if (!mission) return

    const tjm = Number(mission.tjm || 0)
    const totalMinutes = entries.reduce((sum, t) => sum + Number(t.dureeMinutes ?? 0), 0)
    const days = totalMinutes / 450
    const invoiceAmount = tjm * days
    totalFacture += invoiceAmount

    // ✅ avatar + titre
    const avatarSize = 10
    drawMissionAvatar(doc, 14, currentY - 7, avatarSize, mission.image ?? null, mission.titre)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(15, 23, 42)
    doc.text(`${cleanText(mission.titre)}`, 14 + avatarSize + 3, currentY)
    currentY += 6

    autoTable(doc, {
      head: [["Daily Rate (TJM)", "Time", "Days", "Billed"]],
      body: [[`${tjm.toFixed(2)} €`, formatMinutes(totalMinutes), `${days.toFixed(2)} d`, `${invoiceAmount.toFixed(2)} €`]],
      startY: currentY,
      theme: "striped",
      headStyles: { fillColor: [226, 232, 240], textColor: 15, fontStyle: "bold" },
      styles: { fontSize: 10, cellPadding: 2, textColor: 20 },
      margin: { left: 14, right: 14 },
    })

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  })

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
  doc.setTextColor(71, 85, 105)
  doc.text(`Worked days: ${totalWorkedDays.size}`, pageWidth - 14, currentY, { align: "right" })

  doc.save(`monthly-report-${format(monthStart, "yyyy-MM")}.pdf`)
}
