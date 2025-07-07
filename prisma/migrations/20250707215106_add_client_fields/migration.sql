-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "adresse" TEXT,
ADD COLUMN     "codePostal" TEXT,
ADD COLUMN     "commentaire" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "entreprise" TEXT,
ADD COLUMN     "pays" TEXT,
ADD COLUMN     "photoPath" TEXT,
ADD COLUMN     "siteWeb" TEXT,
ADD COLUMN     "telephone" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "ville" TEXT;
