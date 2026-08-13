// ── Codex BEGIN: simulation panel / 模擬驗證面板 ─────────────────
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../styles/theme";
import { AppRole, GuestRecord } from "../types/guest";

interface SimulationPanelProps {
  guests: GuestRecord[];
  role: AppRole;
}

function actorLabel(actor: "checkin" | "checkpoint" | "host") {
  if (actor === "checkin") {
    return "報到處";
  }
  if (actor === "checkpoint") {
    return "檢查點";
  }
  return "主持人";
}

export function SimulationPanel({ guests, role }: SimulationPanelProps) {
  const relevantGuests = useMemo(() => {
    const withHistory = guests.filter((guest) => guest.history && guest.history.length > 0);
    if (role === "checkin") {
      return withHistory.filter((guest) => guest.history?.some((event) => event.actor === "checkin"));
    }
    if (role === "checkpoint") {
      return withHistory.filter((guest) => guest.history?.some((event) => event.actor === "checkpoint"));
    }
    return withHistory.filter((guest) => guest.history?.some((event) => event.actor === "host"));
  }, [guests, role]);

  if (relevantGuests.length === 0) {
    return null;
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.heading}>三頁模擬驗證</Text>
      <Text style={styles.subheading}>目前頁面顯示此角色在 2026-07-16 測試流程中的可視化結果。</Text>
      {relevantGuests.map((guest) => (
        <View key={guest.id} style={styles.item}>
          <Text style={styles.name}>
            {guest.name}｜{guest.status}
          </Text>
          {guest.history?.map((event, index) => (
            <Text key={`${guest.id}-${index}`} style={styles.event}>
              {actorLabel(event.actor)} {event.status} {event.time.slice(11, 16)}
              {event.note ? `｜${event.note}` : ""}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "#F7F2E2",
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  heading: {
    color: "#6C4A00",
    fontSize: 18,
    fontWeight: "800",
  },
  subheading: {
    color: "#7A6440",
  },
  item: {
    gap: 4,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E2D6B8",
  },
  name: {
    color: theme.colors.text,
    fontWeight: "800",
  },
  event: {
    color: theme.colors.text,
    fontSize: 12,
  },
});
// ── Codex END ────────────────────────────────────────────────
