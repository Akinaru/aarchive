// src/lib/exportpdf-month.ts
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { addDays, format } from "date-fns"
import { formatMinutes } from "@/lib/time"
import { Temps } from "@/types/temps"

export type WeeklyGroup = {
  weekStart: Date
  weekEnd: Date
  temps: Temps[]
}

type MissionAgg = {
  missionId: number
  titre: string
  tjm: number
  minutes: number
}

type RGB = [number, number, number]

function cleanText(input: string): string {
  return input
      .replace(/[^\p{L}\p{N}\s\-'.(),;:!?/]/gu, "")
      .replace(/\s+/g, " ")
      .trim()
}

function moneyEUR(value: number) {
  return `${Number(value || 0).toFixed(2)} €`
}

function formatHours(minutes: number) {
  const h = minutes / 60
  return `${h.toFixed(2)} h`
}

export async function generateMonthlyTempsPDF(
    monthStart: Date,
    monthEnd: Date,
    weeklyGroups: WeeklyGroup[]
) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // ===== Infos hardcodées (toi) =====
  const issuer = {
    displayName: "AkiAgency — Maxime GALLOTTA", // ✅ "by" retiré
    address: "11 Boulevard Jacques Replat\n74000 Annecy\nFrance",
    email: "maxime.utchimata@gmail.com",
    phone: "+33 7 85 83 60 07",
    website: "https://akinaru.fr",
    siret: "10061790100010",
    vatLine: "VAT not applicable — Article 293 B of the French General Tax Code.",
    legalLine: "French sole trader (micro-entrepreneur).",
  }

  const payment = {
    methodLine: "Payment in crypto: USDT (Tether) on Ethereum network (ERC-20).",
    walletLine: "Wallet address: to be provided at payment time (address may vary).",
    termsLine: "Payment due within 7 days from issue date.",
    refLine: "Please include the invoice number in the payment reference.",
  }

  // ===== Facture meta =====
  const issueDate = new Date()
  const dueDate = addDays(issueDate, 7)
  const invoiceNumber = `INV-${format(issueDate, "yyyyMMdd-HHmmss")}`
  const billingPeriod = `${format(monthStart, "dd/MM/yyyy")} — ${format(monthEnd, "dd/MM/yyyy")}`

  // ===== Aggr par mission =====
  const allTemps = weeklyGroups.flatMap((w) => w.temps)
  const byMission = new Map<number, MissionAgg>()

  for (const t of allTemps) {
    const m = t.mission
    if (!m?.id) continue

    const missionId = m.id
    const tjm = Number(m.tjm ?? 0)
    const minutes = Number(t.dureeMinutes ?? 0)

    const current = byMission.get(missionId)
    if (!current) {
      byMission.set(missionId, {
        missionId,
        titre: String(m.titre ?? "—"),
        tjm,
        minutes,
      })
    } else {
      current.minutes += minutes
    }
  }

  const missionAggs = Array.from(byMission.values()).sort((a, b) => b.minutes - a.minutes)

  // ===== Couleurs (RGB tuples) =====
  const C = {
    slate800: [30, 41, 59] as RGB,
    slate900: [15, 23, 42] as RGB,
    slate200: [226, 232, 240] as RGB,
    slate100: [241, 245, 249] as RGB,
    slate50: [248, 250, 252] as RGB,
    slate600: [71, 85, 105] as RGB,
  }

  // ===== Header bandeau =====
  doc.setFillColor(...C.slate800)
  doc.rect(0, 0, pageWidth, 30, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text("INVOICE", 14, 19)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(`Billing period: ${billingPeriod}`, 14, 26)

  // ===== Bloc émetteur / meta =====
  let y = 38

  // Émetteur (gauche)
  doc.setTextColor(...C.slate900)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text(cleanText(issuer.displayName), 14, y)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9.5)
  y += 5
  doc.setTextColor(...C.slate600)
  doc.text(issuer.address, 14, y)
  y += 16

  doc.text(`Email: ${issuer.email}`, 14, y)
  y += 5
  doc.text(`Phone: ${issuer.phone}`, 14, y)
  y += 5
  doc.text(`Website: ${issuer.website}`, 14, y)
  y += 5
  doc.text(`SIRET: ${issuer.siret}`, 14, y)
  y += 5
  doc.text(issuer.vatLine, 14, y)
  y += 5
  doc.text(issuer.legalLine, 14, y)

  // Meta (droite)
  const metaX = pageWidth - 14
  const metaTop = 38

  doc.setTextColor(...C.slate900)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text("Invoice details", metaX, metaTop, { align: "right" })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9.5)
  doc.setTextColor(...C.slate600)
  doc.text(`Invoice #: ${invoiceNumber}`, metaX, metaTop + 6, { align: "right" })
  doc.text(`Issue date: ${format(issueDate, "dd/MM/yyyy HH:mm")}`, metaX, metaTop + 11, { align: "right" })
  doc.text(`Due date: ${format(dueDate, "dd/MM/yyyy")}`, metaX, metaTop + 16, { align: "right" })
  doc.text("Currency: EUR", metaX, metaTop + 21, { align: "right" })

  // “Bill To” placeholder (pas de client pour l’instant)
  doc.setDrawColor(...C.slate200)
  doc.setLineWidth(0.6)
  doc.line(14, 86, pageWidth - 14, 86)

  doc.setTextColor(...C.slate900)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text("Bill To", 14, 94)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...C.slate600)
  doc.text("Client details not provided.", 14, 100)

  // ===== Lignes facture (missions) =====
  const lineItemsY = 108

  const lineRows = missionAggs.map((m) => {
    const days = m.minutes / 450
    const amount = Number(m.tjm || 0) * days
    return {
      service: cleanText(m.titre),
      hours: formatHours(m.minutes),
      rate: moneyEUR(m.tjm),
      days: `${days.toFixed(2)} d`,
      amount: moneyEUR(amount),
    }
  })

  const subtotal = missionAggs.reduce((s, m) => s + Number(m.tjm || 0) * (m.minutes / 450), 0)
  const vat = 0
  const total = subtotal + vat

  // ✅ tableau noir avec les mêmes marges que le reste (14 / 14)
  autoTable(doc, {
    startY: lineItemsY,
    theme: "grid",
    tableWidth: pageWidth - 28,
    margin: { left: 14, right: 14 },
    head: [["Service", "Hours", "Daily rate", "Days", "Amount"]],
    body: lineRows.length
        ? lineRows.map((r) => [r.service, r.hours, r.rate, r.days, r.amount])
        : [["—", "0.00 h", moneyEUR(0), "0.00 d", moneyEUR(0)]],
    headStyles: {
      fillColor: C.slate800,
      textColor: 255,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 2.5,
      textColor: 20,
      valign: "middle",
    },
    alternateRowStyles: { fillColor: C.slate50 },
    columnStyles: {
      0: { cellWidth: 78 }, // Service
      1: { cellWidth: 22, halign: "right" }, // Hours
      2: { cellWidth: 28, halign: "right" }, // Daily rate
      3: { cellWidth: 18, halign: "right" }, // Days
      4: { cellWidth: 26, halign: "right" }, // Amount
    },
  })

  let afterLinesY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6

  // ===== Totaux =====
  autoTable(doc, {
    startY: afterLinesY,
    theme: "plain",
    margin: { left: 14, right: 14 },
    tableWidth: pageWidth - 28,
    body: [
      ["Subtotal", moneyEUR(subtotal)],
      ["VAT", issuer.vatLine.includes("not applicable") ? "0.00 €" : moneyEUR(vat)],
      ["Total", moneyEUR(total)],
      ["Amount due", moneyEUR(total)],
    ],
    styles: { fontSize: 10, cellPadding: 2.5, textColor: 20 },
    columnStyles: {
      0: { halign: "right" },
      1: { halign: "right" },
    },
    didParseCell: (data) => {
      const label = String(data.cell.raw ?? "")
      if (label === "Total" || label === "Amount due") {
        data.cell.styles.fontStyle = "bold"
      }
    },
  })

  afterLinesY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6

  // ===== Paiement =====
  doc.setDrawColor(...C.slate200)
  doc.setLineWidth(0.6)
  doc.line(14, afterLinesY, pageWidth - 14, afterLinesY)
  afterLinesY += 7

  doc.setTextColor(...C.slate900)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text("Payment instructions", 14, afterLinesY)
  afterLinesY += 5

  doc.setFont("helvetica", "normal")
  doc.setTextColor(...C.slate600)
  doc.setFontSize(9.5)
  doc.text(payment.methodLine, 14, afterLinesY)
  afterLinesY += 5
  doc.text(payment.walletLine, 14, afterLinesY)
  afterLinesY += 5
  doc.text(payment.termsLine, 14, afterLinesY)
  afterLinesY += 5
  doc.text(payment.refLine, 14, afterLinesY)
  afterLinesY += 8

  // ===== Mentions facture (EN) =====
  doc.setTextColor(...C.slate900)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text("Legal notes", 14, afterLinesY)
  afterLinesY += 5

  doc.setFont("helvetica", "normal")
  doc.setTextColor(...C.slate600)
  doc.setFontSize(9.2)

  const notes = [
    issuer.vatLine,
    "No early payment discount is granted unless otherwise agreed in writing.",
    "Late payment may result in penalties in accordance with applicable French regulations.",
    "For professional customers, a fixed recovery fee of €40 may apply in case of late payment (French Commercial Code).",
  ]
  notes.forEach((n) => {
    doc.text(`• ${n}`, 14, afterLinesY)
    afterLinesY += 4.6
  })

  // ===== Annexe (détails temps) =====
  afterLinesY += 6
  doc.setTextColor(...C.slate900)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.text("Appendix — Detailed time entries", 14, afterLinesY)
  afterLinesY += 6

  const detailedRows = allTemps
      .slice()
      .sort((a, b) => +new Date(a.date as any) - +new Date(b.date as any))
      .map((t) => {
        const dt = new Date(t.date as any)
        const mission = cleanText(t.mission?.titre ?? "—")
        const type = cleanText(t.typeTache?.nom ?? "—")
        const desc = t.description ? cleanText(String(t.description)) : "—"
        const minutes = Number(t.dureeMinutes ?? 0)
        return [format(dt, "dd/MM/yyyy"), mission, type, desc, formatMinutes(minutes)]
      })

  autoTable(doc, {
    startY: afterLinesY,
    theme: "grid",
    head: [["Date", "Mission", "Task type", "Description", "Duration"]],
    body: detailedRows.length ? detailedRows : [["—", "—", "—", "—", "0m"]],
    headStyles: {
      fillColor: C.slate100,
      textColor: 15,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 2,
      overflow: "linebreak",
      valign: "top",
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 35 },
      2: { cellWidth: 26 },
      3: { cellWidth: 78 },
      4: { cellWidth: 18, halign: "right" },
    },
    alternateRowStyles: { fillColor: C.slate50 },
    margin: { left: 14, right: 14 },
  })

  doc.save(`invoice-${format(issueDate, "yyyy-MM")}-${invoiceNumber}.pdf`)
}
