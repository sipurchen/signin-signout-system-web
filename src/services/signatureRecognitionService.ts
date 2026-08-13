// ── Codex BEGIN: signature recognition adapter / 簽名辨識介面 ─────────────────
import { extractTextFromImage, isSupported } from "expo-text-extractor";
import { GuestRecord } from "../types/guest";

export interface SignatureRecognitionInput {
  rawText?: string;
  imageUri?: string;
}

export interface SignatureRecognitionResult {
  bestGuest?: GuestRecord;
  candidates: GuestRecord[];
  rawText: string;
  extractedLines: string[];
  source: "manual" | "ocr";
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, "").trim().toLowerCase();
}

function getSearchTerms(rawText: string): string[] {
  const normalized = normalizeText(rawText);
  if (!normalized) {
    return [];
  }

  const uniqueTerms = new Set<string>();
  uniqueTerms.add(normalized);

  // Break OCR text into smaller fragments to improve Chinese-name matching.
  for (const token of rawText.split(/[\s,，、;；/\\\n\r\t]+/).map(normalizeText)) {
    if (token) {
      uniqueTerms.add(token);
    }
  }

  return [...uniqueTerms];
}

function matchGuests(guests: GuestRecord[], rawText: string): GuestRecord[] {
  const terms = getSearchTerms(rawText);
  if (terms.length === 0) {
    return [];
  }

  return guests.filter((guest) => {
    const normalizedName = normalizeText(guest.name);
    const normalizedOrganization = normalizeText(guest.organization);
    const normalizedTitle = normalizeText(guest.title);
    const normalizedHints = guest.signatureHints.map(normalizeText);

    return terms.some(
      (term) =>
        normalizedName.includes(term) ||
        term.includes(normalizedName) ||
        normalizedOrganization.includes(term) ||
        normalizedTitle.includes(term) ||
        normalizedHints.some((hint) => hint.includes(term) || term.includes(hint)),
    );
  });
}

async function extractLinesFromImage(imageUri?: string): Promise<string[]> {
  if (!imageUri || !isSupported) {
    return [];
  }

  try {
    return await extractTextFromImage(imageUri);
  } catch {
    return [];
  }
}

export async function recognizeSignature(
  guests: GuestRecord[],
  input: SignatureRecognitionInput,
): Promise<SignatureRecognitionResult> {
  const extractedLines = await extractLinesFromImage(input.imageUri);
  const manualText = input.rawText?.trim() ?? "";
  const mergedText = [manualText, ...extractedLines].filter(Boolean).join(" ");
  const candidates = matchGuests(guests, mergedText);

  return {
    bestGuest: candidates[0],
    candidates,
    rawText: mergedText.trim(),
    extractedLines,
    source: extractedLines.length > 0 ? "ocr" : "manual",
  };
}
// ── Codex END ────────────────────────────────────────────────
