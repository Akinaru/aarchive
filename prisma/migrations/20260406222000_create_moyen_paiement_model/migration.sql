-- AlterTable
ALTER TABLE "Projet"
DROP COLUMN "acceptsBankTransfer",
DROP COLUMN "acceptsCrypto",
DROP COLUMN "bankAccountHolder",
DROP COLUMN "bankIban",
DROP COLUMN "cryptoNetwork",
DROP COLUMN "cryptoSymbol";

-- CreateEnum
CREATE TYPE "TypeMoyenPaiement" AS ENUM ('CRYPTO', 'BANCAIRE');

-- CreateTable
CREATE TABLE "MoyenPaiement" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "TypeMoyenPaiement" NOT NULL,
    "cryptoSymbol" TEXT,
    "cryptoNetwork" TEXT,
    "bankAccountHolder" TEXT,
    "bankIban" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MoyenPaiement_pkey" PRIMARY KEY ("id")
);
