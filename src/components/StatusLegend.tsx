// ── Codex BEGIN: status legend / 狀態說明 ─────────────────
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { STATUS_COLORS, STATUS_FLOW } from "../constants/status";
import { theme } from "../styles/theme";

export function StatusLegend() {
  return (
    <View style={styles.wrapper}>
      {STATUS_FLOW.map((status) => (
        <View key={status} style={styles.item}>
          <View style={[styles.swatch, { backgroundColor: STATUS_COLORS[status] }]} />
          <Text style={styles.label}>{status}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: theme.colors.panel,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  swatch: {
    width: 16,
    height: 16,
    borderRadius: 99,
  },
  label: {
    color: theme.colors.text,
    fontWeight: "700",
  },
});
// ── Codex END ────────────────────────────────────────────────
