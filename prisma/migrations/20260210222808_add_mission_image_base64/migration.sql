-- DropForeignKey
ALTER TABLE "ProjetClient" DROP CONSTRAINT "ProjetClient_clientId_fkey";

-- DropForeignKey
ALTER TABLE "ProjetClient" DROP CONSTRAINT "ProjetClient_projetId_fkey";

-- AlterTable
ALTER TABLE "ProjetClient" ADD COLUMN     "isBilling" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "ProjetClient_projetId_idx" ON "ProjetClient"("projetId");

-- CreateIndex
CREATE INDEX "ProjetClient_clientId_idx" ON "ProjetClient"("clientId");

-- CreateIndex
CREATE INDEX "ProjetClient_projetId_isBilling_idx" ON "ProjetClient"("projetId", "isBilling");

-- AddForeignKey
ALTER TABLE "ProjetClient" ADD CONSTRAINT "ProjetClient_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjetClient" ADD CONSTRAINT "ProjetClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
