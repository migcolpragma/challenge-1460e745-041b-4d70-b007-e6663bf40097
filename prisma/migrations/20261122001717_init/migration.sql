-- CreateEnum
CREATE TYPE "LoanRequestStatus" AS ENUM ('PENDING', 'PENDING_ANTIFRAUD', 'APPROVED', 'REJECTED', 'TIMEOUT');

-- CreateTable
CREATE TABLE "LoanRequest" (
    "id" TEXT NOT NULL,
    "operationNumber" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "applicantDocument" TEXT NOT NULL,
    "requestedAmount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "termMonths" INTEGER NOT NULL,
    "interestRate" DECIMAL(5,4) NOT NULL,
    "destinationAccount" TEXT NOT NULL,
    "status" "LoanRequestStatus" NOT NULL DEFAULT 'PENDING',
    "antifraudResult" TEXT,
    "riskBureauResult" TEXT,
    "creditOriginatorResult" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoanRequest_status_idx" ON "LoanRequest"("status");

-- CreateIndex
CREATE INDEX "LoanRequest_createdAt_idx" ON "LoanRequest"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LoanRequest_operationNumber_channel_key" ON "LoanRequest"("operationNumber", "channel");
