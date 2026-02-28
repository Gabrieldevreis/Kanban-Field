/*
  Warnings:

  - You are about to drop the column `footer` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the `ProjectMember` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProjectMember" DROP CONSTRAINT "ProjectMember_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectMember" DROP CONSTRAINT "ProjectMember_userId_fkey";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "footer";

-- DropTable
DROP TABLE "ProjectMember";
