/*
  Warnings:

  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `supertokensId` on the `User` table. All the data in the column will be lost.
  - Made the column `password` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "User_supertokensId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
DROP COLUMN "supertokensId",
ALTER COLUMN "password" SET NOT NULL;
