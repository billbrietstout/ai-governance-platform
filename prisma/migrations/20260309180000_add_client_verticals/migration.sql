-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "clientVerticals" JSONB;

-- AlterTable
ALTER TABLE "AIAsset" ADD COLUMN "clientVertical" TEXT;
