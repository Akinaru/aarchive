/*
  Warnings:

  - You are about to drop the column `adresse` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `codePostal` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `commentaire` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `entreprise` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `pays` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `ville` on the `Client` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Client" DROP COLUMN "adresse",
DROP COLUMN "codePostal",
DROP COLUMN "commentaire",
DROP COLUMN "entreprise",
DROP COLUMN "pays",
DROP COLUMN "ville";
