-- CreateEnum
CREATE TYPE "Nist80053Family" AS ENUM ('AC', 'AU', 'AT', 'CA', 'CM', 'CP', 'IA', 'IR', 'MA', 'MP', 'PE', 'PL', 'PM', 'PS', 'PT', 'RA', 'SA', 'SC', 'SI', 'SR');

-- AlterTable
ALTER TABLE "Control" ADD COLUMN     "nist80053Family" "Nist80053Family";

-- CreateIndex
CREATE INDEX "Control_nist80053Family_idx" ON "Control"("nist80053Family");
