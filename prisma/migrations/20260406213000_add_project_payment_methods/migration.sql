-- AlterTable
ALTER TABLE "Projet"
ADD COLUMN     "acceptsCrypto" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cryptoSymbol" TEXT,
ADD COLUMN     "cryptoNetwork" TEXT,
ADD COLUMN     "acceptsBankTransfer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bankAccountHolder" TEXT,
ADD COLUMN     "bankIban" TEXT;
