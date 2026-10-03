/*
  Warnings:

  - A unique constraint covering the columns `[supertokensId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "User_supertokensId_key" ON "User"("supertokensId");
