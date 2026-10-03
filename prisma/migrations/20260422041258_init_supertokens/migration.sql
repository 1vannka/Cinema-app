/*
  Warnings:

  - Added the required column `supertokensId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'USER',
ADD COLUMN     "supertokensId" TEXT NOT NULL,
ALTER COLUMN "password" DROP NOT NULL;
