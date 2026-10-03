/*
  Warnings:

  - A unique constraint covering the columns `[supertokensId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `supertokensId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'USER',
ADD COLUMN     "supertokensId" TEXT NOT NULL,
ALTER COLUMN "password" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_supertokensId_key" ON "User"("supertokensId");
