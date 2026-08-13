// Codex BEGIN: guest card t1 cleanup / Product T1 來賓卡片修正
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { STATUS_COLORS } from "../constants/status";
import { theme } from "../styles/theme";
import { GuestRecord } from "../types/guest";

interface GuestCardProps {
  guest: GuestRecord;
  onPress?: () => void;
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

export function GuestCard({ guest, onPress }: GuestCardProps) {
  const { width } = useWindowDimensions();
  const compact = width < 520;

  return (
    <TouchableOpacity disabled={!onPress} onPress={onPress} style={[styles.card, guest.highlight && styles.cardHighlight]}>
      <View style={[styles.row, compact && styles.rowCompact]}>
        <View style={styles.left}>
          <Text style={styles.name}>{guest.name || "未命名來賓"}</Text>
          <Text style={styles.meta}>
            {guest.organization}
            {guest.title ? ` / ${guest.title}` : ""}
          </Text>
          {!!guest.partyOrRole && <Text style={styles.role}>{guest.partyOrRole}</Text>}
        </View>
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[guest.status] ?? "#E7EDF1" }]}>
          <Text style={styles.badgeText}>{guest.status}</Text>
        </View>
      </View>

      {(guest.requiresSpeech || guest.speechNote) && (
        <View style={styles.vipBox}>
          <Text style={styles.vipTitle}>致詞提醒 / VIP</Text>
          <Text style={styles.vipText}>{guest.speechNote || "需由主持人留意致詞順序與唱名。"}</Text>
        </View>
      )}

      {!!guest.note && <Text style={styles.note}>備註：{guest.note}</Text>}

      {!!guest.history?.length && (
        <View style={styles.historyBox}>
          <Text style={styles.historyTitle}>歷程</Text>
          {guest.history.map((event, index) => (
            <Text key={`${guest.id}-history-${index}`} style={styles.historyLine}>
              {event.time.slice(11, 16)} / {actorLabel(event.actor)} / {event.status}
              {event.note ? ` / ${event.note}` : ""}
            </Text>
          ))}
        </View>
      )}

      <View style={[styles.footer, compact && styles.footerCompact]}>
        <Text style={styles.footerText}>最後更新：{guest.updatedBy || "尚未更新"}</Text>
        {guest.totalStayMinutes !== undefined && <Text style={styles.footerText}>停留：{guest.totalStayMinutes} 分鐘</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.panel,
    borderRadius: 18,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  cardHighlight: {
    borderColor: "#D8A11A",
    shadowColor: "#D8A11A",
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  rowCompact: {
    flexDirection: "column",
  },
  left: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: theme.colors.text,
    fontSize: 19,
    fontWeight: "800",
  },
  meta: {
    color: theme.colors.text,
  },
  role: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignSelf: "flex-start",
  },
  badgeText: {
    color: "#102030",
    fontWeight: "800",
  },
  vipBox: {
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#FFF0D2",
  },
  vipTitle: {
    color: "#7A4B00",
    fontWeight: "800",
  },
  vipText: {
    color: "#7A4B00",
    marginTop: 4,
  },
  note: {
    color: theme.colors.text,
  },
  historyBox: {
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#F6F9FB",
    gap: 4,
  },
  historyTitle: {
    color: theme.colors.text,
    fontWeight: "800",
  },
  historyLine: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  footerCompact: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  footerText: {
    color: theme.colors.muted,
    fontSize: 12,
  },
});
// Codex END
