// Codex BEGIN: guest domain types cache route / 來賓與 CSV cache 型別
export type GuestStatus = string;

export type AppRole = "checkin" | "checkpoint" | "host";

export type CacheRuntimeMode = "local" | "cache-host" | "cache-client";

export type CloudSyncStrategy = "local-only" | "shared-csv" | "google-first-shared-csv";

export type CloudSyncRole = "standalone" | "host" | "client";

export type CloudSyncReadMode = "sheet-source" | "shared-cache" | "local-file" | "demo" | "simulation";

export type CloudSyncWriteMode = "none" | "shared-cache" | "google-apps-script";

export interface SimulationEvent {
  actor: "checkin" | "checkpoint" | "host";
  status: GuestStatus;
  time: string;
  note: string;
}

export interface GuestRecord {
  id: string;
  sequence: number;
  name: string;
  organization: string;
  title: string;
  requiresSpeech: boolean;
  checkInAt?: string;
  enteredVenueAt?: string;
  announcedAt?: string;
  speechStartAt?: string;
  speechEndAt?: string;
  interviewStartAt?: string;
  interviewEndAt?: string;
  leftAt?: string;
  onsiteMinutes?: number;
  totalStayMinutes?: number;
  status: GuestStatus;
  speechNote: string;
  note: string;
  updatedBy: string;
  signatureHints: string[];
  highlight: boolean;
  isAdHoc: boolean;
  partyOrRole?: string;
  sourceUrl?: string;
  history?: SimulationEvent[];
}

export interface SheetConfig {
  sourceSheetUrl: string;
  sheetUrl: string;
  cacheServerUrl: string;
  googleAppsScriptUrl?: string;
  worksheetName: string;
  sourceType: "google-sheet" | "remote-file" | "xlsx" | "demo" | "simulation";
  localFileName?: string;
  sheetLabel?: string;
  runtimeMode?: CacheRuntimeMode;
  syncStrategy?: CloudSyncStrategy;
  cloudRole?: CloudSyncRole;
}

export interface GuestUpdatePayload {
  guestId: string;
  status: GuestStatus;
  updatedBy: string;
  note?: string;
  guest?: GuestRecord;
}

export interface CreateGuestPayload {
  name: string;
  organization: string;
  title: string;
  requiresSpeech: boolean;
  speechNote: string;
  note: string;
  updatedBy: string;
}

export interface RosterSnapshot {
  config: SheetConfig;
  guests: GuestRecord[];
  lastMessage: string;
  updatedAt: string;
}

export interface SharedCacheState {
  config: SheetConfig;
  guests: GuestRecord[];
  generatedAt: string;
  sessionId: string;
}

export interface CloudSyncPlan {
  strategy: CloudSyncStrategy;
  role: CloudSyncRole;
  readMode: CloudSyncReadMode;
  writeMode: CloudSyncWriteMode;
  sourceLabel: string;
  sourceUrl?: string;
  writableSheetUrl?: string;
  cacheServerUrl?: string;
  googleAppsScriptUrl?: string;
  warnings: string[];
}

export interface CloudMutationResult {
  ok: boolean;
  channel: CloudSyncWriteMode;
  reason?: string;
  detail?: unknown;
}

export interface GoogleBridgeMeta {
  ok: boolean;
  action?: string;
  reason?: string;
  bridge?: {
    name?: string;
    version?: string;
    supportedActions?: string[];
    supportedStatuses?: string[];
    defaultSheetUrl?: string;
    defaultWorksheetName?: string;
    dataStartRow?: number;
    columnCount?: number;
  };
}
// Codex END
