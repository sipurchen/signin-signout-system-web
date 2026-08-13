// Codex BEGIN: status transitions t1 cleanup / Product T1 狀態流轉修正
import { STATUS_TEXT } from "../constants/status";
import { GuestStatus } from "../types/guest";

export type CheckpointAction =
  | "confirm-entry"
  | "revert-to-entry"
  | "toggle-temp-leave"
  | "mark-left-interview"
  | "mark-left";

export type HostAction = "announce-waiting-speech" | "finish-speech";

export function nextStatusForCheckpointAction(currentStatus: GuestStatus, action: CheckpointAction): GuestStatus {
  switch (action) {
    case "confirm-entry":
      return STATUS_TEXT.waitingAnnounce;
    case "revert-to-entry":
      return currentStatus === STATUS_TEXT.waitingAnnounce ? STATUS_TEXT.waitingEntry : currentStatus;
    case "toggle-temp-leave":
      if (currentStatus === STATUS_TEXT.onsite) {
        return STATUS_TEXT.temporarilyAway;
      }
      if (currentStatus === STATUS_TEXT.temporarilyAway) {
        return STATUS_TEXT.onsite;
      }
      return currentStatus;
    case "mark-left-interview":
      return STATUS_TEXT.leftForInterview;
    case "mark-left":
      return STATUS_TEXT.left;
    default:
      return currentStatus;
  }
}

export function nextStatusForHostAction(currentStatus: GuestStatus, action: HostAction): GuestStatus {
  switch (action) {
    case "announce-waiting-speech":
      return currentStatus === STATUS_TEXT.waitingAnnounce ? STATUS_TEXT.waitingSpeech : currentStatus;
    case "finish-speech":
      return currentStatus === STATUS_TEXT.waitingSpeech ? STATUS_TEXT.onsite : currentStatus;
    default:
      return currentStatus;
  }
}

export function canCheckIn(currentStatus: GuestStatus) {
  return currentStatus === STATUS_TEXT.notCheckedIn || currentStatus === STATUS_TEXT.left;
}
// Codex END
