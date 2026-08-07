-- CreateTable
CREATE TABLE "AiRequestLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "capability" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "errorMessage" TEXT,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "estimatedCostUsd" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "AiRequestLog_createdAt_idx" ON "AiRequestLog"("createdAt");

-- CreateIndex
CREATE INDEX "AiRequestLog_providerId_idx" ON "AiRequestLog"("providerId");
