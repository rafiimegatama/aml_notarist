-- AlterTable
ALTER TABLE "AiRequestLog" ADD COLUMN "caseId" TEXT;
ALTER TABLE "AiRequestLog" ADD COLUMN "confidence" TEXT;
ALTER TABLE "AiRequestLog" ADD COLUMN "knowledgeChunkIds" TEXT;
ALTER TABLE "AiRequestLog" ADD COLUMN "promptVersion" TEXT;

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'EDD_REQUIRED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Case_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CaseChecklist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "identityVerified" BOOLEAN NOT NULL DEFAULT false,
    "sourceOfFundsReviewed" BOOLEAN NOT NULL DEFAULT false,
    "sourceOfWealthReviewed" BOOLEAN NOT NULL DEFAULT false,
    "beneficialOwnerConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "documentsVerified" BOOLEAN NOT NULL DEFAULT false,
    "aiRecommendationReviewed" BOOLEAN NOT NULL DEFAULT false,
    "regulationReviewed" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CaseChecklist_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CaseDecision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "notes" TEXT,
    "decidedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CaseDecision_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CaseAiFinding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "evidence" TEXT,
    "sourceRefs" TEXT,
    "providerId" TEXT,
    "model" TEXT,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CaseAiFinding_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CaseDuplicateCheck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "candidateCustomerId" TEXT NOT NULL,
    "matchedFields" TEXT NOT NULL,
    "confidencePercent" INTEGER NOT NULL,
    "stage" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CaseDuplicateCheck_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KnowledgeDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "KnowledgeChunk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "sectionLabel" TEXT,
    "pageLabel" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KnowledgeChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "KnowledgeDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Case_customerId_key" ON "Case"("customerId");

-- CreateIndex
CREATE INDEX "Case_status_idx" ON "Case"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CaseChecklist_caseId_key" ON "CaseChecklist"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "CaseDecision_caseId_key" ON "CaseDecision"("caseId");

-- CreateIndex
CREATE INDEX "CaseAiFinding_caseId_idx" ON "CaseAiFinding"("caseId");

-- CreateIndex
CREATE INDEX "CaseDuplicateCheck_caseId_idx" ON "CaseDuplicateCheck"("caseId");

-- CreateIndex
CREATE INDEX "KnowledgeChunk_documentId_idx" ON "KnowledgeChunk"("documentId");

-- CreateIndex
CREATE INDEX "AiRequestLog_caseId_idx" ON "AiRequestLog"("caseId");
