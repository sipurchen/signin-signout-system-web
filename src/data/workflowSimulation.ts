// ── Codex BEGIN: workflow simulation data / 三頁模擬結果 ─────────────────
import { GuestRecord } from "../types/guest";
import { cloudTestRoster } from "./cloudTestRoster";

function mergeGuest(name: string, patch: Partial<GuestRecord>): GuestRecord {
  const base = cloudTestRoster.find((guest) => guest.name === name);
  if (!base) {
    throw new Error(`simulation-guest-not-found:${name}`);
  }

  return {
    ...base,
    ...patch,
  };
}

export const workflowSimulationRoster: GuestRecord[] = cloudTestRoster.map((guest) => ({ ...guest, history: [] }));

const simulatedGuests = [
  mergeGuest("楊瓊瓔", {
    status: "離開",
    updatedBy: "檢查點",
    checkInAt: "2026-07-16T09:04:00+08:00",
    enteredVenueAt: "2026-07-16T09:05:00+08:00",
    announcedAt: "2026-07-16T09:06:00+08:00",
    leftAt: "2026-07-16T09:10:00+08:00",
    onsiteMinutes: 5,
    totalStayMinutes: 6,
    note: "唱名後因公離場",
    history: [
      { actor: "checkin", status: "等待進場", time: "2026-07-16T09:04:00+08:00", note: "" },
      { actor: "checkpoint", status: "等待唱名", time: "2026-07-16T09:05:00+08:00", note: "" },
      { actor: "host", status: "現場", time: "2026-07-16T09:06:00+08:00", note: "主持人完成唱名，安排致詞" },
      { actor: "checkpoint", status: "離開", time: "2026-07-16T09:10:00+08:00", note: "唱名後因公離場" },
    ],
  }),
  mergeGuest("張廖萬堅", {
    status: "離開",
    updatedBy: "檢查點",
    checkInAt: "2026-07-16T09:03:00+08:00",
    enteredVenueAt: "2026-07-16T09:04:00+08:00",
    leftAt: "2026-07-16T09:06:00+08:00",
    onsiteMinutes: 2,
    totalStayMinutes: 3,
    note: "因公離場",
    history: [
      { actor: "checkin", status: "等待進場", time: "2026-07-16T09:03:00+08:00", note: "" },
      { actor: "checkpoint", status: "等待唱名", time: "2026-07-16T09:04:00+08:00", note: "" },
      { actor: "checkpoint", status: "等待進場", time: "2026-07-16T09:05:00+08:00", note: "主持人尚未唱名，來賓先行離開動線" },
      { actor: "checkpoint", status: "離開", time: "2026-07-16T09:06:00+08:00", note: "因公離場" },
    ],
  }),
  mergeGuest("范振東", {
    status: "離開",
    updatedBy: "檢查點",
    checkInAt: "2026-07-16T09:00:00+08:00",
    enteredVenueAt: "2026-07-16T09:01:00+08:00",
    announcedAt: "2026-07-16T09:07:00+08:00",
    leftAt: "2026-07-16T10:15:00+08:00",
    onsiteMinutes: 74,
    totalStayMinutes: 75,
    note: "活動結束離場",
    history: [
      { actor: "checkin", status: "等待進場", time: "2026-07-16T09:00:00+08:00", note: "" },
      { actor: "checkpoint", status: "等待唱名", time: "2026-07-16T09:01:00+08:00", note: "" },
      { actor: "host", status: "現場", time: "2026-07-16T09:07:00+08:00", note: "" },
      { actor: "checkpoint", status: "離開", time: "2026-07-16T10:15:00+08:00", note: "活動結束離場" },
    ],
  }),
  mergeGuest("范夫人", {
    status: "離開",
    updatedBy: "檢查點",
    checkInAt: "2026-07-16T09:01:00+08:00",
    enteredVenueAt: "2026-07-16T09:02:00+08:00",
    announcedAt: "2026-07-16T09:08:00+08:00",
    leftAt: "2026-07-16T10:15:00+08:00",
    onsiteMinutes: 73,
    totalStayMinutes: 74,
    note: "活動結束離場",
    history: [
      { actor: "checkin", status: "等待進場", time: "2026-07-16T09:01:00+08:00", note: "" },
      { actor: "checkpoint", status: "等待唱名", time: "2026-07-16T09:02:00+08:00", note: "" },
      { actor: "host", status: "現場", time: "2026-07-16T09:08:00+08:00", note: "" },
      { actor: "checkpoint", status: "離開", time: "2026-07-16T10:15:00+08:00", note: "活動結束離場" },
    ],
  }),
  mergeGuest("黃志強", {
    status: "離開",
    updatedBy: "檢查點",
    checkInAt: "2026-07-16T09:02:00+08:00",
    enteredVenueAt: "2026-07-16T09:03:00+08:00",
    announcedAt: "2026-07-16T09:09:00+08:00",
    interviewStartAt: "2026-07-16T09:20:00+08:00",
    interviewEndAt: "2026-07-16T09:28:00+08:00",
    leftAt: "2026-07-16T09:28:00+08:00",
    onsiteMinutes: 25,
    totalStayMinutes: 26,
    note: "受訪完成後離場",
    history: [
      { actor: "checkin", status: "等待進場", time: "2026-07-16T09:02:00+08:00", note: "" },
      { actor: "checkpoint", status: "等待唱名", time: "2026-07-16T09:03:00+08:00", note: "" },
      { actor: "host", status: "現場", time: "2026-07-16T09:09:00+08:00", note: "" },
      { actor: "checkpoint", status: "離開待受訪", time: "2026-07-16T09:20:00+08:00", note: "中途離開，安排受訪" },
      { actor: "checkpoint", status: "離開", time: "2026-07-16T09:28:00+08:00", note: "受訪完成後離場" },
    ],
  }),
  mergeGuest("吳國彰", {
    status: "離開",
    updatedBy: "檢查點",
    checkInAt: "2026-07-16T09:02:00+08:00",
    enteredVenueAt: "2026-07-16T09:03:00+08:00",
    announcedAt: "2026-07-16T09:09:00+08:00",
    leftAt: "2026-07-16T09:20:00+08:00",
    onsiteMinutes: 17,
    totalStayMinutes: 18,
    note: "中途離開，不受訪",
    history: [
      { actor: "checkin", status: "等待進場", time: "2026-07-16T09:02:00+08:00", note: "" },
      { actor: "checkpoint", status: "等待唱名", time: "2026-07-16T09:03:00+08:00", note: "" },
      { actor: "host", status: "現場", time: "2026-07-16T09:09:00+08:00", note: "" },
      { actor: "checkpoint", status: "離開", time: "2026-07-16T09:20:00+08:00", note: "中途離開，不受訪" },
    ],
  }),
];

for (const simulatedGuest of simulatedGuests) {
  const index = workflowSimulationRoster.findIndex((guest) => guest.name === simulatedGuest.name);
  workflowSimulationRoster[index] = simulatedGuest;
}
// ── Codex END ────────────────────────────────────────────────
