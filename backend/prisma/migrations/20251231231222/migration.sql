/*
  Warnings:

  - Added the required column `name2` to the `Teste` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `Teste` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Teste" ADD COLUMN     "name2" TEXT NOT NULL,
ADD COLUMN     "password" TEXT NOT NULL;
