// src/types/clients.ts

// Enums Prisma (on garde des unions "souples" pour éviter de casser si tu ajoutes des valeurs)
export type ClientType = "COMPANY" | "PERSON" | string
export type VatStatus = "UNKNOWN" | "SUBJECT" | "EXEMPT" | string

export type Client = {
  id: number

  // ===== Identité (affichage + facturation) =====
  nom: string
  legalName: string | null
  type: ClientType

  // ===== Contact =====
  email: string | null
  telephone: string | null
  siteWeb: string | null
  photoPath: string | null

  // ===== Adresse de facturation =====
  addressLine1: string | null
  addressLine2: string | null
  postalCode: string | null
  city: string | null
  state: string | null
  countryCode: string | null // ISO2 (ex: "FR", "BE", "CH")

  // ===== Infos société (si COMPANY) =====
  companyRegistrationNumber: string | null // RCS/KB/... selon pays
  siret: string | null
  siren: string | null
  tvaNumber: string | null
  vatStatus: VatStatus

  // ===== Facturation =====
  billingEmail: string | null
  billingNote: string | null

  // ===== Meta =====
  createdAt: string
  updatedAt: string
}

/** Helpers optionnels */
export function clientBillingEmail(c: Client): string | null {
  return c.billingEmail ?? c.email
}

export function clientFullAddress(c: Client): string {
  const parts = [
    c.addressLine1,
    c.addressLine2,
    [c.postalCode, c.city].filter(Boolean).join(" "),
    c.state,
    c.countryCode,
  ]
      .map((x) => (x ?? "").trim())
      .filter(Boolean)

  return parts.join("\n")
}
