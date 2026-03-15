-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "onboardingStep" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "operatingModel" TEXT,
ADD COLUMN     "orgSize" TEXT,
ADD COLUMN     "primaryUseCase" TEXT;
