// Codex BEGIN: guest roster cloud sync integration / Guest roster 雲端同步整合
import { useEffect, useMemo, useRef, useState } from "react";
import { STATUS_TEXT } from "../constants/status";
import { defaultSheetConfig, getSheetLabel } from "../config/sheet";
import {
  createDemoGuests,
  createSimulationGuests,
  loadGuests,
  loadGuestsForCloudSync,
  loadGuestsFromFile,
  loadSharedCacheState,
  readLocalSnapshot,
  resolveCloudSyncPlan,
  syncGuestCreate,
  syncGuestStatus,
  writeLocalSnapshot,
} from "../services/guestSheetService";
import { CreateGuestPayload, GuestRecord, GuestStatus, RosterSnapshot, SheetConfig } from "../types/guest";

function nowIso() {
  return new Date().toISOString();
}

function toMinutes(start?: string, end?: string) {
  if (!start || !end) {
    return undefined;
  }

  const ms = new Date(end).getTime() - new Date(start).getTime();
  return ms > 0 ? Math.round(ms / 60000) : undefined;
}

function applyStatusMetadata(guest: GuestRecord, status: GuestStatus, updatedBy: string, note?: string): GuestRecord {
  const timestamp = nowIso();
  const nextGuest: GuestRecord = {
    ...guest,
    status,
    updatedBy,
    note: note ?? guest.note,
  };

  if (status === STATUS_TEXT.waitingEntry && !guest.checkInAt) {
    nextGuest.checkInAt = timestamp;
  }

  if (status === STATUS_TEXT.waitingAnnounce) {
    nextGuest.enteredVenueAt = timestamp;
  }

  if (status === STATUS_TEXT.waitingSpeech) {
    nextGuest.announcedAt = timestamp;
    if (guest.requiresSpeech && !guest.speechStartAt) {
      nextGuest.speechStartAt = timestamp;
    }
  }

  if (status === STATUS_TEXT.onsite) {
    nextGuest.announcedAt = nextGuest.announcedAt ?? guest.announcedAt ?? timestamp;
    if (guest.requiresSpeech && !guest.speechStartAt) {
      nextGuest.speechStartAt = nextGuest.announcedAt;
    }
    if (guest.requiresSpeech && !guest.speechEndAt) {
      nextGuest.speechEndAt = timestamp;
    }
  }

  if (status === STATUS_TEXT.leftForInterview) {
    nextGuest.leftAt = guest.leftAt ?? timestamp;
    nextGuest.interviewStartAt = timestamp;
    if (guest.requiresSpeech && guest.speechStartAt && !guest.speechEndAt) {
      nextGuest.speechEndAt = timestamp;
    }
  }

  if (status === STATUS_TEXT.left) {
    nextGuest.leftAt = guest.leftAt ?? timestamp;
    if (guest.status === STATUS_TEXT.leftForInterview && !guest.interviewEndAt) {
      nextGuest.interviewEndAt = timestamp;
    }
    if (guest.requiresSpeech && guest.speechStartAt && !guest.speechEndAt) {
      nextGuest.speechEndAt = timestamp;
    }
  }

  if (status === STATUS_TEXT.waitingEntry) {
    nextGuest.enteredVenueAt = undefined;
    nextGuest.announcedAt = undefined;
    nextGuest.speechStartAt = undefined;
    nextGuest.speechEndAt = undefined;
  }

  if (status === STATUS_TEXT.temporarilyAway) {
    nextGuest.leftAt = guest.leftAt;
  }

  nextGuest.onsiteMinutes = toMinutes(nextGuest.enteredVenueAt, nextGuest.leftAt);
  nextGuest.totalStayMinutes = toMinutes(nextGuest.checkInAt, nextGuest.leftAt);
  return nextGuest;
}

function describeRuntime(config: SheetConfig) {
  const plan = resolveCloudSyncPlan(config);
  return `${plan.strategy} / ${plan.role} / ${plan.readMode} -> ${plan.writeMode}`;
}

export function useGuestRoster() {
  const [config, setConfig] = useState<SheetConfig>(defaultSheetConfig);
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [lastMessage, setLastMessage] = useState("Loading roster...");
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function hydrateRuntimeConfig(seedConfig: SheetConfig) {
    if (seedConfig.cacheServerUrl) {
      return {
        ...seedConfig,
        runtimeMode: "cache-client" as const,
        cloudRole: "client" as const,
      };
    }

    return {
      ...seedConfig,
      runtimeMode: "local" as const,
      cloudRole: "standalone" as const,
    };
  }

  async function reload(nextConfig = config) {
    setLoading(true);
    try {
      const runtimeConfig = await hydrateRuntimeConfig(nextConfig);
      const { config: resolvedConfig, guests: loaded, plan } = await loadGuestsForCloudSync(runtimeConfig);

      const mergedConfig: SheetConfig =
        plan.readMode === "shared-cache"
          ? {
              ...runtimeConfig,
              ...resolvedConfig,
              cacheServerUrl: runtimeConfig.cacheServerUrl,
              runtimeMode: "cache-client",
              cloudRole: "client",
            }
          : resolvedConfig;

      setLastMessage(`Cloud sync loaded: ${describeRuntime(mergedConfig)} / ${loaded.length} guests`);

      setConfig(mergedConfig);
      setGuests(loaded);
    } catch (error) {
      const snapshot = readLocalSnapshot();
      const preservedConfig: SheetConfig = {
        ...nextConfig,
        runtimeMode: nextConfig.runtimeMode ?? "local",
        cloudRole: nextConfig.cloudRole ?? "standalone",
      };
      if (snapshot?.guests?.length) {
        setConfig({
          ...snapshot.config,
          ...preservedConfig,
          localFileName: preservedConfig.localFileName ?? snapshot.config.localFileName,
        });
        setGuests(snapshot.guests);
        setLastMessage("Recovered roster from local snapshot while keeping the current settings.");
      } else {
        const fallback = createDemoGuests();
        setConfig(preservedConfig);
        setGuests(fallback);
        setLastMessage(error instanceof Error ? `${error.message} Falling back to demo roster.` : "Load failed. Falling back to demo roster.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const snapshot = readLocalSnapshot();
    const initialConfig = snapshot?.config ? { ...defaultSheetConfig, ...snapshot.config } : defaultSheetConfig;
    void reload(initialConfig);
  }, []);

  useEffect(() => {
    if (!guests.length) {
      return;
    }

    const snapshot: RosterSnapshot = {
      config,
      guests,
      lastMessage,
      updatedAt: nowIso(),
    };

    writeLocalSnapshot(snapshot);
  }, [config, guests, lastMessage]);

  useEffect(() => {
    const syncPlan = resolveCloudSyncPlan(config);

    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    if (syncPlan.readMode !== "shared-cache" || !syncPlan.cacheServerUrl) {
      return;
    }

    const cacheServerUrl = syncPlan.cacheServerUrl;

    pollRef.current = setInterval(async () => {
      try {
        const shared = await loadSharedCacheState(cacheServerUrl);
        setConfig((current) => ({
          ...current,
          ...shared.config,
          cacheServerUrl,
          runtimeMode: "cache-client",
          cloudRole: "client",
        }));
        setGuests(shared.guests);
      } catch {
        setLastMessage("Cloud sync polling failed for shared cache client.");
      }
    }, 3000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [config]);

  // Direct-read (sheet-source) mode never had a refresh loop -- only the
  // shared-cache path above polled. Guests on other devices writing through
  // the bridge would only show up after a manual "Save and Reload", so add a
  // slower poll here too (10s: Google's CSV export is cheap but not free,
  // and this path can have many concurrent readers unlike a self-hosted cache).
  const sheetSourcePollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const syncPlan = resolveCloudSyncPlan(config);

    if (sheetSourcePollRef.current) {
      clearInterval(sheetSourcePollRef.current);
      sheetSourcePollRef.current = null;
    }

    if (syncPlan.readMode !== "sheet-source" || (config.sourceType !== "google-sheet" && config.sourceType !== "remote-file")) {
      return;
    }

    sheetSourcePollRef.current = setInterval(async () => {
      try {
        const loaded = await loadGuests(config);
        setGuests(loaded);
      } catch {
        setLastMessage("Cloud sync polling failed for sheet-source read.");
      }
    }, 10000);

    return () => {
      if (sheetSourcePollRef.current) {
        clearInterval(sheetSourcePollRef.current);
        sheetSourcePollRef.current = null;
      }
    };
  }, [config]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.addEventListener !== "function" || typeof window.removeEventListener !== "function") {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== "signin-signout-system.shared-state.v2" || !event.newValue) {
        return;
      }

      try {
        const snapshot = JSON.parse(event.newValue) as RosterSnapshot;
        setConfig(snapshot.config);
        setGuests(snapshot.guests);
        setLastMessage(snapshot.lastMessage || "Roster refreshed from local storage.");
      } catch {
        setLastMessage("Failed to parse shared local snapshot.");
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  async function loadFromFile(fileUri: string, localFileName: string) {
    setLoading(true);
    try {
      const loaded = await loadGuestsFromFile(fileUri);
      const nextConfig: SheetConfig = {
        ...config,
        sourceType: "xlsx",
        localFileName,
      };

      setConfig(nextConfig);
      setGuests(loaded);
      setLastMessage(`Loaded XLSX file: ${localFileName}`);
    } catch (error) {
      setLastMessage(error instanceof Error ? error.message : "Failed to load XLSX file.");
    } finally {
      setLoading(false);
    }
  }

  function loadSimulation() {
    const nextGuests = createSimulationGuests();
    const nextConfig: SheetConfig = {
      ...config,
      sourceType: "simulation",
      cloudRole: "standalone",
    };
    setConfig(nextConfig);
    setGuests(nextGuests);
    setLastMessage("Loaded simulation roster.");
  }

  function updateConfig(nextConfig: Partial<SheetConfig>) {
    setConfig((current) => ({ ...current, ...nextConfig }));
  }

  async function mutateStatus(guestId: string, status: GuestStatus, updatedBy: string, note?: string) {
    let changedGuest: GuestRecord | undefined;

    setGuests((current) =>
      current.map((guest) => {
        if (guest.id !== guestId) {
          return guest;
        }

        changedGuest = applyStatusMetadata(guest, status, updatedBy, note);
        return changedGuest;
      }),
    );

    setLastMessage(`Updating status: ${status}`);

    const result = await syncGuestStatus(config, { guestId, status, updatedBy, note, guest: changedGuest });
    if (!result.ok) {
      setLastMessage(`Cloud sync update failed: ${result.reason ?? "unknown"}`);
      return;
    }

    setLastMessage(`Cloud sync update sent via ${result.channel}`);
  }

  async function createGuest(payload: CreateGuestPayload) {
    const nextRecord: GuestRecord = {
      id: `${Date.now()}`,
      sequence: guests.length + 1,
      name: payload.name,
      organization: payload.organization,
      title: payload.title,
      requiresSpeech: payload.requiresSpeech,
      status: STATUS_TEXT.waitingEntry,
      speechNote: payload.speechNote,
      note: payload.note,
      updatedBy: payload.updatedBy,
      signatureHints: payload.name.split("").filter(Boolean),
      highlight: payload.requiresSpeech,
      isAdHoc: true,
      checkInAt: nowIso(),
    };

    setGuests((current) => [...current, nextRecord]);
    setLastMessage(`Creating guest: ${payload.name}`);

    const result = await syncGuestCreate(config, payload);
    if (!result.ok) {
      setLastMessage(`Cloud sync create failed: ${result.reason ?? "unknown"}`);
      return;
    }

    setLastMessage(`Cloud sync create sent via ${result.channel}`);
  }

  const sheetLabel = useMemo(() => getSheetLabel(config), [config]);

  return {
    config: { ...config, sheetLabel },
    guests,
    loading,
    lastMessage,
    reload,
    loadFromFile,
    loadSimulation,
    updateConfig,
    mutateStatus,
    createGuest,
  };
}
// Codex END
