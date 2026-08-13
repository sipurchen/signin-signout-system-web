// Codex BEGIN: checkpoint screen left-after-interview fix / 檢查處離開待受訪後仍可離開
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { DataSyncBar } from "../components/DataSyncBar";
import { GuestCard } from "../components/GuestCard";
import { SimulationPanel } from "../components/SimulationPanel";
import { STATUS_TEXT } from "../constants/status";
import { theme } from "../styles/theme";
import { nextStatusForCheckpointAction } from "../utils/statusMachine";

interface CheckpointScreenProps {
  compactMode?: boolean;
  hideSyncBar?: boolean;
  roster: any;
}

export function CheckpointScreen({ roster, compactMode, hideSyncBar }: CheckpointScreenProps) {
  const [query, setQuery] = useState("");

  const actionableGuests = useMemo(() => {
    const normalized = query.trim();
    return roster.guests.filter((guest: any) => {
      const visible = guest.status !== STATUS_TEXT.notCheckedIn;
      const matches =
        !normalized ||
        guest.name.includes(normalized) ||
        guest.organization.includes(normalized) ||
        guest.title.includes(normalized);
      return visible && matches;
    });
  }, [query, roster.guests]);

  async function update(guestId: string, nextStatus: string, note?: string) {
    await roster.mutateStatus(guestId, nextStatus, "檢查處", note);
  }

  return (
    <View style={styles.wrapper}>
      {roster.config.sourceType === "simulation" && <SimulationPanel guests={roster.guests} role="checkpoint" />}
      {!hideSyncBar && <DataSyncBar roster={roster} compactMode={compactMode} />}

      <View style={styles.panel}>
        <Text style={styles.heading}>檢查處作業</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="搜尋來賓、單位或職稱"
          placeholderTextColor={theme.colors.placeholder}
          style={styles.input}
        />
      </View>

      {actionableGuests.map((guest: any) => {
        const isWaitingEntry = guest.status === STATUS_TEXT.waitingEntry;
        const isWaitingAnnounce = guest.status === STATUS_TEXT.waitingAnnounce;
        const isWaitingSpeech = guest.status === STATUS_TEXT.waitingSpeech;
        const isOnSite = guest.status === STATUS_TEXT.onsite;
        const isTemporarilyAway = guest.status === STATUS_TEXT.temporarilyAway;
        const isLeftForInterview = guest.status === STATUS_TEXT.leftForInterview;

        return (
          <View key={guest.id} style={styles.cardWrap}>
            <GuestCard guest={guest} />
            <View style={styles.buttonGrid}>
              {isWaitingEntry && (
                <TouchableOpacity onPress={() => update(guest.id, nextStatusForCheckpointAction(guest.status, "confirm-entry"))} style={styles.actionButton}>
                  <Text style={styles.actionText}>確認進場</Text>
                </TouchableOpacity>
              )}

              {isWaitingAnnounce && (
                <TouchableOpacity
                  onPress={() => update(guest.id, nextStatusForCheckpointAction(guest.status, "revert-to-entry"), "主持人尚未唱名，返回等待進場")}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionText}>回到等待進場</Text>
                </TouchableOpacity>
              )}

              {(isOnSite || isTemporarilyAway) && (
                <TouchableOpacity
                  onPress={() => update(guest.id, nextStatusForCheckpointAction(guest.status, "toggle-temp-leave"), isOnSite ? "暫離現場" : "回到現場")}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionText}>{isOnSite ? "暫離" : "回到現場"}</Text>
                </TouchableOpacity>
              )}

              {(isWaitingEntry || isWaitingAnnounce || isWaitingSpeech || isOnSite || isTemporarilyAway) && (
                <TouchableOpacity onPress={() => update(guest.id, nextStatusForCheckpointAction(guest.status, "mark-left-interview"))} style={styles.actionButton}>
                  <Text style={styles.actionText}>離開待受訪</Text>
                </TouchableOpacity>
              )}

              {(isWaitingEntry || isWaitingAnnounce || isWaitingSpeech || isOnSite || isTemporarilyAway || isLeftForInterview) && (
                <TouchableOpacity onPress={() => update(guest.id, nextStatusForCheckpointAction(guest.status, "mark-left"))} style={[styles.actionButton, styles.dangerButton]}>
                  <Text style={styles.actionText}>離開</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 14,
  },
  panel: {
    backgroundColor: theme.colors.panel,
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  heading: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  input: {
    backgroundColor: theme.colors.backgroundSoft,
    borderRadius: 14,
    color: theme.colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cardWrap: {
    gap: 10,
  },
  buttonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actionButton: {
    backgroundColor: theme.colors.panelDark,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dangerButton: {
    backgroundColor: "#8E2E2E",
  },
  actionText: {
    color: theme.colors.textOnDark,
    fontWeight: "800",
  },
});
// Codex END
