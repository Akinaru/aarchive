/*
  Warnings:

  - You are about to drop the column `prixEstime` on the `Mission` table. All the data in the column will be lost.
  - You are about to drop the column `prixReel` on the `Mission` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Mission" DROP COLUMN "prixEstime",
DROP COLUMN "prixReel";
