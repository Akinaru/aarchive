/*
  Warnings:

  - The primary key for the `ProjetClient` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[projetId,clientId]` on the table `ProjetClient` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ProjetClient" DROP CONSTRAINT "ProjetClient_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "ProjetClient_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "ProjetClient_projetId_clientId_key" ON "ProjetClient"("projetId", "clientId");
