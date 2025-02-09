/*
  Warnings:

  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `kindId` on the `users` table. All the data in the column will be lost.
  - The required column `kindeId` was added to the `users` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
DROP COLUMN "kindId",
ADD COLUMN     "kindeId" TEXT NOT NULL,
ADD COLUMN     "picture" TEXT,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("kindeId");
