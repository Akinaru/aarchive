/*
  Warnings:

  - You are about to drop the column `utilisateurId` on the `Temps` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Temps" DROP CONSTRAINT "Temps_utilisateurId_fkey";

-- AlterTable
ALTER TABLE "Temps" DROP COLUMN "utilisateurId";
