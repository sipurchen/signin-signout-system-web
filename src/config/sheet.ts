// Codex BEGIN: sheet configuration helpers / Sheet config helpers 設定輔助
import { SheetConfig } from "../types/guest";

const DEFAULT_WORKING_SHEET_URL =
  process.env.EXPO_PUBLIC_DEFAULT_WORKING_SHEET_URL ??
  process.env.EXPO_PUBLIC_DEFAULT_SHEET_URL ??
  "";

const DEFAULT_WORKSHEET_NAME = process.env.EXPO_PUBLIC_DEFAULT_WORKSHEET_NAME ?? "Guest List";

const runtimeDefaults = {
  sourceSheetUrl: process.env.EXPO_PUBLIC_DEFAULT_SOURCE_SHEET_URL ?? DEFAULT_WORKING_SHEET_URL,
  sheetUrl: DEFAULT_WORKING_SHEET_URL,
  cacheServerUrl: process.env.EXPO_PUBLIC_DEFAULT_CACHE_SERVER_URL ?? "",
  googleAppsScriptUrl: process.env.EXPO_PUBLIC_DEFAULT_GOOGLE_APPS_SCRIPT_URL ?? "",
  worksheetName: DEFAULT_WORKSHEET_NAME,
  syncStrategy: (process.env.EXPO_PUBLIC_DEFAULT_SYNC_STRATEGY as SheetConfig["syncStrategy"]) ?? "google-first-shared-csv",
  cloudRole: (process.env.EXPO_PUBLIC_DEFAULT_CLOUD_ROLE as SheetConfig["cloudRole"]) ?? "standalone",
};

export const defaultSheetConfig: SheetConfig = {
  sourceSheetUrl: runtimeDefaults.sourceSheetUrl,
  sheetUrl: runtimeDefaults.sheetUrl,
  cacheServerUrl: runtimeDefaults.cacheServerUrl,
  googleAppsScriptUrl: runtimeDefaults.googleAppsScriptUrl,
  worksheetName: runtimeDefaults.worksheetName,
  sourceType: runtimeDefaults.sourceSheetUrl ? "google-sheet" : "demo",
  runtimeMode: "local",
  syncStrategy: runtimeDefaults.syncStrategy,
  cloudRole: runtimeDefaults.cloudRole,
};

export function extractGoogleSheetId(sheetUrl: string): string | null {
  const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match?.[1] ?? null;
}

export function extractGoogleDriveFileId(fileUrl: string): string | null {
  const directMatch = fileUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
  if (directMatch?.[1]) {
    return directMatch[1];
  }

  try {
    const url = new URL(fileUrl);
    return url.searchParams.get("id");
  } catch {
    return null;
  }
}

export function buildGoogleSheetExportUrl(sheetUrl: string, worksheetName: string): string | null {
  const sheetId = extractGoogleSheetId(sheetUrl);
  if (!sheetId) {
    return null;
  }

  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(worksheetName)}`;
}

export function buildGoogleDriveDownloadUrl(fileUrl: string): string | null {
  const fileId = extractGoogleDriveFileId(fileUrl);
  if (!fileId) {
    return null;
  }

  return `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;
}

export function getSheetLabel(config: SheetConfig) {
  const modeLabel =
    config.runtimeMode === "cache-host" ? "CSV cache host" : config.runtimeMode === "cache-client" ? "CSV cache client" : "local";
  const strategyLabel =
    config.syncStrategy === "google-first-shared-csv"
      ? "Google-first"
      : config.syncStrategy === "shared-csv"
        ? "Shared-CSV"
        : "Local-only";

  if (config.sourceType === "xlsx" && config.localFileName) {
    return `XLSX / ${config.localFileName} / ${strategyLabel} / ${modeLabel}`;
  }

  if (config.sourceType === "google-sheet" && (config.sourceSheetUrl || config.sheetUrl)) {
    const sourceLabel =
      config.sourceSheetUrl && config.sourceSheetUrl !== config.sheetUrl ? "source + writable sheet" : "single Google Sheet";
    return `${config.worksheetName} / Google Sheet / ${sourceLabel} / ${strategyLabel} / ${modeLabel}`;
  }

  if (config.sourceType === "remote-file" && config.sourceSheetUrl) {
    return `${config.worksheetName} / Drive File / direct import / ${strategyLabel} / ${modeLabel}`;
  }

  if (config.sourceType === "simulation") {
    return `${config.worksheetName} / Simulation / ${strategyLabel} / ${modeLabel}`;
  }

  return `${config.worksheetName} / Demo / ${strategyLabel} / ${modeLabel}`;
}
// Codex END
