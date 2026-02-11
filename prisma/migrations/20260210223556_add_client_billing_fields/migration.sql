-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('INDIVIDUAL', 'COMPANY');

-- CreateEnum
CREATE TYPE "VatStatus" AS ENUM ('UNKNOWN', 'NOT_APPLICABLE', 'VAT_EXEMPT', 'VAT_REGISTERED');

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "addressLine1" TEXT,
ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "billingEmail" TEXT,
ADD COLUMN     "billingNote" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "companyRegistrationNumber" TEXT,
ADD COLUMN     "countryCode" TEXT,
ADD COLUMN     "legalName" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "siren" TEXT,
ADD COLUMN     "siret" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "tvaNumber" TEXT,
ADD COLUMN     "type" "ClientType" NOT NULL DEFAULT 'COMPANY',
ADD COLUMN     "vatStatus" "VatStatus" NOT NULL DEFAULT 'UNKNOWN';
