// Codex BEGIN: guest sheet service cloud migration path / Guest sheet service 雲端遷移路徑
import * as XLSX from "xlsx";
import { STATUS_TEXT } from "../constants/status";
import { buildGoogleDriveDownloadUrl, buildGoogleSheetExportUrl, extractGoogleDriveFileId, extractGoogleSheetId } from "../config/sheet";
import { cloudTestRoster } from "../data/cloudTestRoster";
import { workflowSimulationRoster } from "../data/workflowSimulation";
import {
  CloudMutationResult,
  CloudSyncPlan,
  CreateGuestPayload,
  GoogleBridgeMeta,
  GuestRecord,
  GuestStatus,
  GuestUpdatePayload,
  RosterSnapshot,
  SharedCacheState,
  SheetConfig,
} from "../types/guest";

const LOCAL_STORAGE_KEY = "signin-signout-system.shared-state.v2";

function cloneGuests(guests: GuestRecord[]) {
  return guests.map((guest) => ({
    ...guest,
    signatureHints: [...guest.signatureHints],
    history: guest.history ? [...guest.history] : undefined,
  }));
}

function toBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "yes" || normalized === "y" || normalized === "1";
  }

  if (typeof value === "number") {
    return value === 1;
  }

  return false;
}

function normalizeStatus(value: unknown, checkedIn: boolean, enteredVenue: boolean, announced: boolean): GuestStatus {
  const raw = String(value ?? "").trim();
  const allowed = Object.values(STATUS_TEXT) as string[];
  if (allowed.includes(raw)) {
    return raw as GuestStatus;
  }

  if (announced) {
    return STATUS_TEXT.onsite;
  }
  if (enteredVenue) {
    return STATUS_TEXT.waitingAnnounce;
  }
  if (checkedIn) {
    return STATUS_TEXT.waitingEntry;
  }

  return STATUS_TEXT.notCheckedIn;
}

function findHeaderRow(rows: unknown[][]) {
  const headerKeywords = ["name", "guest", "姓名", "來賓"];
  const index = rows.findIndex((row) =>
    row.some((cell) => {
      const value = String(cell ?? "").trim().toLowerCase();
      return headerKeywords.some((keyword) => value.includes(keyword.toLowerCase()));
    }),
  );
  return index >= 0 ? index : 0;
}

function parseWorkbookRows(rows: unknown[][]): GuestRecord[] {
  const headerRow = findHeaderRow(rows);
  const dataRows = rows.filter((row, index) => index > headerRow && row.some((cell) => String(cell ?? "").trim() !== ""));

  return dataRows.map((row, index) => {
    const checkedIn = toBoolean(row[5]);
    const enteredVenue = toBoolean(row[6]);
    const announced = toBoolean(row[7]);
    const status = normalizeStatus(row[8], checkedIn, enteredVenue, announced);
    const name = String(row[1] ?? "").trim();

    return {
      id: String(row[0] ?? index + 1),
      sequence: Number(row[0] ?? index + 1),
      name,
      organization: String(row[2] ?? "").trim(),
      title: String(row[3] ?? "").trim(),
      requiresSpeech: toBoolean(row[4]),
      status,
      speechNote: String(row[9] ?? "").trim(),
      note: String(row[10] ?? "").trim(),
      updatedBy: String(row[11] ?? "").trim(),
      checkInAt: String(row[12] ?? "").trim() || undefined,
      enteredVenueAt: String(row[13] ?? "").trim() || undefined,
      announcedAt: String(row[14] ?? "").trim() || undefined,
      speechStartAt: String(row[15] ?? "").trim() || undefined,
      speechEndAt: String(row[16] ?? "").trim() || undefined,
      interviewStartAt: String(row[17] ?? "").trim() || undefined,
      interviewEndAt: String(row[18] ?? "").trim() || undefined,
      leftAt: String(row[19] ?? "").trim() || undefined,
      onsiteMinutes: Number(row[20] ?? 0) || undefined,
      totalStayMinutes: Number(row[21] ?? 0) || undefined,
      partyOrRole: String(row[22] ?? "").trim() || undefined,
      sourceUrl: String(row[23] ?? "").trim() || undefined,
      signatureHints: name.split("").filter(Boolean),
      highlight: toBoolean(row[4]),
      isAdHoc: false,
    };
  });
}

function normalizeUrl(value?: string) {
  return String(value ?? "").trim().replace(/\/+$/, "");
}

async function fetchCsv(csvUrl: string) {
  const response = await fetch(csvUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch sheet csv: ${response.status}`);
  }

  return response.text();
}

async function fetchBinary(fileUrl: string) {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch remote file: ${response.status}`);
  }

  return response.arrayBuffer();
}

async function fetchJson(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(String((data as { reason?: string })?.reason ?? response.status));
  }
  return data;
}

function buildBridgePayload(config: SheetConfig, payload: Record<string, unknown>) {
  return {
    ...payload,
    sheetUrl: config.sheetUrl,
    sourceSheetUrl: config.sourceSheetUrl,
    worksheetName: config.worksheetName,
  };
}

function resolveRemoteSource(config: SheetConfig) {
  const rosterUrl = config.sourceSheetUrl || config.sheetUrl;
  if (!rosterUrl) {
    return null;
  }

  if (extractGoogleSheetId(rosterUrl)) {
    return {
      kind: "google-sheet" as const,
      fetchUrl: buildGoogleSheetExportUrl(rosterUrl, config.worksheetName),
    };
  }

  if (extractGoogleDriveFileId(rosterUrl)) {
    return {
      kind: "drive-file" as const,
      fetchUrl: buildGoogleDriveDownloadUrl(rosterUrl),
    };
  }

  return {
    kind: "direct-file" as const,
    fetchUrl: rosterUrl,
  };
}

// Resolve one migration plan for all runtimes / 解析單一路徑規劃，供各端共用
export function resolveCloudSyncPlan(config: SheetConfig): CloudSyncPlan {
  const cacheServerUrl = normalizeUrl(config.cacheServerUrl);
  const googleAppsScriptUrl = normalizeUrl(config.googleAppsScriptUrl);
  const inferredStrategy =
    config.syncStrategy ??
    (config.sourceType === "google-sheet" || config.sourceType === "remote-file" ? "google-first-shared-csv" : cacheServerUrl ? "shared-csv" : "local-only");

  const role =
    config.cloudRole ??
    (config.runtimeMode === "cache-host" ? "host" : config.runtimeMode === "cache-client" ? "client" : "standalone");

  const warnings: string[] = [];
  let readMode: CloudSyncPlan["readMode"];
  let writeMode: CloudSyncPlan["writeMode"] = "none";
  let sourceLabel = "local";

  if (config.sourceType === "demo") {
    readMode = "demo";
    sourceLabel = "demo roster";
  } else if (config.sourceType === "simulation") {
    readMode = "simulation";
    sourceLabel = "simulation roster";
  } else if (config.sourceType === "xlsx") {
    readMode = "local-file";
    sourceLabel = config.localFileName ? `xlsx:${config.localFileName}` : "xlsx";
  } else if (role === "client" && cacheServerUrl) {
    readMode = "shared-cache";
    sourceLabel = "shared csv cache";
  } else {
    readMode = "sheet-source";
    sourceLabel = config.sourceType === "remote-file" ? "remote drive file" : "google sheet";
  }

  if ((role === "host" || role === "client") && cacheServerUrl) {
    writeMode = "shared-cache";
  } else if ((config.sourceType === "google-sheet" || config.sourceType === "remote-file") && googleAppsScriptUrl) {
    writeMode = "google-apps-script";
  }

  if ((role === "host" || role === "client") && !cacheServerUrl) {
    warnings.push("cache-server-url-missing");
  }

  if ((config.sourceType === "google-sheet" || config.sourceType === "remote-file") && !config.sourceSheetUrl && !config.sheetUrl) {
    warnings.push("remote-source-url-missing");
  }

  if (inferredStrategy === "google-first-shared-csv" && !googleAppsScriptUrl) {
    warnings.push("google-apps-script-url-missing");
  }

  return {
    strategy: inferredStrategy,
    role,
    readMode,
    writeMode,
    sourceLabel,
    sourceUrl: config.sourceSheetUrl || config.sheetUrl || undefined,
    writableSheetUrl: config.sheetUrl || undefined,
    cacheServerUrl: cacheServerUrl || undefined,
    googleAppsScriptUrl: googleAppsScriptUrl || undefined,
    warnings,
  };
}

export function createDemoGuests() {
  return cloneGuests(cloudTestRoster);
}

export function createSimulationGuests() {
  return cloneGuests(workflowSimulationRoster);
}

export async function loadGuests(config: SheetConfig): Promise<GuestRecord[]> {
  if (config.sourceType === "demo") {
    return createDemoGuests();
  }

  if (config.sourceType === "simulation") {
    return createSimulationGuests();
  }

  if (config.sourceType === "google-sheet" || config.sourceType === "remote-file") {
    const remoteSource = resolveRemoteSource(config);
    if (!remoteSource?.fetchUrl) {
      throw new Error("Remote source URL is missing or invalid.");
    }

    const workbook =
      remoteSource.kind === "google-sheet"
        ? XLSX.read(await fetchCsv(remoteSource.fetchUrl), { type: "string" })
        : XLSX.read(await fetchBinary(remoteSource.fetchUrl), { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
    return parseWorkbookRows(rows);
  }

  throw new Error("XLSX source must be loaded from a local file.");
}

export async function loadGuestsForCloudSync(config: SheetConfig): Promise<{ config: SheetConfig; guests: GuestRecord[]; plan: CloudSyncPlan }> {
  const plan = resolveCloudSyncPlan(config);

  if (plan.readMode === "shared-cache" && plan.cacheServerUrl) {
    const shared = await loadSharedCacheState(plan.cacheServerUrl);
    return {
      config: { ...config, ...shared.config, cacheServerUrl: plan.cacheServerUrl, runtimeMode: "cache-client", cloudRole: "client" },
      guests: shared.guests,
      plan,
    };
  }

  return {
    config,
    guests: await loadGuests(config),
    plan,
  };
}

export async function loadGuestsFromFile(fileUri: string): Promise<GuestRecord[]> {
  const response = await fetch(fileUri);
  const arrayBuffer = await response.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
  return parseWorkbookRows(rows);
}

export async function initSharedCache(config: SheetConfig, guests: GuestRecord[]) {
  const cacheServerUrl = normalizeUrl(config.cacheServerUrl);
  if (!cacheServerUrl) {
    throw new Error("missing-cache-server-url");
  }

  return fetchJson(`${cacheServerUrl}/cache/init`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      config: {
        ...config,
        cacheServerUrl,
        runtimeMode: "cache-host",
        cloudRole: "host",
      },
      guests,
      syncPlan: resolveCloudSyncPlan({ ...config, cacheServerUrl, runtimeMode: "cache-host", cloudRole: "host" }),
    }),
  });
}

export async function loadSharedCacheState(cacheServerUrl: string): Promise<SharedCacheState> {
  const normalized = normalizeUrl(cacheServerUrl);
  return fetchJson(`${normalized}/cache/state`) as Promise<SharedCacheState>;
}

export async function loadGoogleBridgeMeta(config: SheetConfig): Promise<GoogleBridgeMeta | null> {
  const googleAppsScriptUrl = normalizeUrl(config.googleAppsScriptUrl);
  if (!googleAppsScriptUrl) {
    return null;
  }

  try {
    return (await fetchJson(googleAppsScriptUrl)) as GoogleBridgeMeta;
  } catch {
    return null;
  }
}

export async function updateGuestStatusViaCache(config: SheetConfig, payload: GuestUpdatePayload) {
  const cacheServerUrl = normalizeUrl(config.cacheServerUrl);
  if (!cacheServerUrl) {
    return { ok: false, reason: "missing-cache-server-url" };
  }

  return fetchJson(`${cacheServerUrl}/cache/update-status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }).catch((error) => ({ ok: false, reason: String(error) }));
}

export async function appendGuestViaCache(config: SheetConfig, payload: CreateGuestPayload) {
  const cacheServerUrl = normalizeUrl(config.cacheServerUrl);
  if (!cacheServerUrl) {
    return { ok: false, reason: "missing-cache-server-url" };
  }

  return fetchJson(`${cacheServerUrl}/cache/append-guest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }).catch((error) => ({ ok: false, reason: String(error) }));
}

// Bridge Google writes through Apps Script / 透過 Apps Script 橋接 Google 寫入
export async function updateGuestStatusViaBridge(config: SheetConfig, payload: GuestUpdatePayload) {
  const googleAppsScriptUrl = normalizeUrl(config.googleAppsScriptUrl);
  if (!googleAppsScriptUrl) {
    return { ok: false, reason: "missing-google-apps-script-url" };
  }

  return fetchJson(googleAppsScriptUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildBridgePayload(config, { action: "updateGuestStatus", ...payload })),
  }).catch((error) => ({ ok: false, reason: String(error) }));
}

export async function appendGuestViaBridge(config: SheetConfig, payload: CreateGuestPayload) {
  const googleAppsScriptUrl = normalizeUrl(config.googleAppsScriptUrl);
  if (!googleAppsScriptUrl) {
    return { ok: false, reason: "missing-google-apps-script-url" };
  }

  return fetchJson(googleAppsScriptUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildBridgePayload(config, { action: "appendGuest", ...payload })),
  }).catch((error) => ({ ok: false, reason: String(error) }));
}

export async function syncGuestStatus(config: SheetConfig, payload: GuestUpdatePayload): Promise<CloudMutationResult> {
  const plan = resolveCloudSyncPlan(config);

  if (plan.writeMode === "shared-cache") {
    const result = await updateGuestStatusViaCache(config, payload);
    return {
      ok: Boolean(result?.ok),
      channel: "shared-cache",
      reason: result?.ok ? undefined : String(result?.reason ?? "shared-cache-update-failed"),
      detail: result,
    };
  }

  if (plan.writeMode === "google-apps-script") {
    const result = await updateGuestStatusViaBridge(config, payload);
    return {
      ok: Boolean(result?.ok),
      channel: "google-apps-script",
      reason: result?.ok ? undefined : String(result?.reason ?? "google-bridge-update-failed"),
      detail: result,
    };
  }

  return {
    ok: false,
    channel: "none",
    reason: "no-cloud-write-channel",
  };
}

export async function syncGuestCreate(config: SheetConfig, payload: CreateGuestPayload): Promise<CloudMutationResult> {
  const plan = resolveCloudSyncPlan(config);

  if (plan.writeMode === "shared-cache") {
    const result = await appendGuestViaCache(config, payload);
    return {
      ok: Boolean(result?.ok),
      channel: "shared-cache",
      reason: result?.ok ? undefined : String(result?.reason ?? "shared-cache-append-failed"),
      detail: result,
    };
  }

  if (plan.writeMode === "google-apps-script") {
    const result = await appendGuestViaBridge(config, payload);
    return {
      ok: Boolean(result?.ok),
      channel: "google-apps-script",
      reason: result?.ok ? undefined : String(result?.reason ?? "google-bridge-append-failed"),
      detail: result,
    };
  }

  return {
    ok: false,
    channel: "none",
    reason: "no-cloud-write-channel",
  };
}

export function readLocalSnapshot(): RosterSnapshot | null {
  if (typeof window === "undefined" || !window.localStorage || typeof window.localStorage.getItem !== "function") {
    return null;
  }

  const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as RosterSnapshot;
  } catch {
    return null;
  }
}

export function writeLocalSnapshot(snapshot: RosterSnapshot) {
  if (typeof window === "undefined" || !window.localStorage || typeof window.localStorage.setItem !== "function") {
    return;
  }

  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(snapshot));
}
// Codex END
