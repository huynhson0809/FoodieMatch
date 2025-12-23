/*
  Warnings:

  - A unique constraint covering the columns `[externalId,source]` on the table `Place` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Place_externalId_source_key" ON "Place"("externalId", "source");
