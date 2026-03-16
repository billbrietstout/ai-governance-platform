/*
  Warnings:

  - Added the required column `updatedAt` to the `ConsultantWorkspace` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ConsultantWorkspace" ADD COLUMN     "assessmentScope" TEXT NOT NULL DEFAULT 'FULL',
ADD COLUMN     "clientContact" TEXT,
ADD COLUMN     "clientVertical" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "createdByConsultantOrgId" TEXT,
ADD COLUMN     "isClientOrg" BOOLEAN NOT NULL DEFAULT false;
