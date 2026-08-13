// Codex BEGIN: status constants t1 cleanup / Product T1 狀態常數修正
import { GuestStatus } from "../types/guest";

export const STATUS_TEXT = {
  notCheckedIn: "未報到",
  waitingEntry: "等待進場",
  waitingAnnounce: "等待唱名",
  waitingSpeech: "等待致詞",
  onsite: "現場",
  temporarilyAway: "暫離",
  leftForInterview: "離開待受訪",
  left: "離開",
} as const satisfies Record<string, GuestStatus>;

export const STATUS_FLOW: GuestStatus[] = [
  STATUS_TEXT.notCheckedIn,
  STATUS_TEXT.waitingEntry,
  STATUS_TEXT.waitingAnnounce,
  STATUS_TEXT.waitingSpeech,
  STATUS_TEXT.onsite,
  STATUS_TEXT.temporarilyAway,
  STATUS_TEXT.leftForInterview,
  STATUS_TEXT.left,
];

export const STATUS_COLORS: Record<GuestStatus, string> = {
  [STATUS_TEXT.notCheckedIn]: "#E7EDF1",
  [STATUS_TEXT.waitingEntry]: "#F7D354",
  [STATUS_TEXT.waitingAnnounce]: "#70B4FF",
  [STATUS_TEXT.waitingSpeech]: "#FFB347",
  [STATUS_TEXT.onsite]: "#62C98C",
  [STATUS_TEXT.temporarilyAway]: "#B7A6FF",
  [STATUS_TEXT.leftForInterview]: "#F5A166",
  [STATUS_TEXT.left]: "#DA6A6A",
};
// Codex END
