-- CreateTable
CREATE TABLE "PendingInvite" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PendingInvite_token_key" ON "PendingInvite"("token");

-- CreateIndex
CREATE INDEX "PendingInvite_orgId_idx" ON "PendingInvite"("orgId");

-- CreateIndex
CREATE INDEX "PendingInvite_email_idx" ON "PendingInvite"("email");

-- CreateIndex
CREATE INDEX "PendingInvite_token_idx" ON "PendingInvite"("token");

-- AddForeignKey
ALTER TABLE "PendingInvite" ADD CONSTRAINT "PendingInvite_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
