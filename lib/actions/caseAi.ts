"use server";

import { revalidatePath } from "next/cache";
import {
  answerRegulationQuestion,
  generateCaseSummary,
  recordMissingDocumentFinding,
  suggestEddQuestions,
  type ComplianceAnswer,
} from "@/lib/ai/services/compliance";

export async function askComplianceQuestionAction(caseId: string, question: string): Promise<ComplianceAnswer> {
  if (!question.trim()) {
    return { answer: "Pertanyaan tidak boleh kosong.", confidence: "LOW", sources: [], grounded: false };
  }
  return answerRegulationQuestion(question, caseId);
}

export async function generateCaseSummaryAction(caseId: string) {
  const result = await generateCaseSummary(caseId);
  if (result.success) revalidatePath(`/cases/${caseId}`);
  return result;
}

export async function suggestEddQuestionsAction(caseId: string) {
  const result = await suggestEddQuestions(caseId);
  if (result.success) revalidatePath(`/cases/${caseId}`);
  return result;
}

export async function checkMissingDocumentsAction(caseId: string) {
  const result = await recordMissingDocumentFinding(caseId);
  if (result.success) revalidatePath(`/cases/${caseId}`);
  return result;
}
