// Codex BEGIN: cloud mode sync bar labels / 雲端模式同步列標示
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { theme } from "../styles/theme";

interface DataSyncBarProps {
  compactMode?: boolean;
  roster: {
    config: {
      runtimeMode?: string;
      syncStrategy?: string;
      cloudRole?: string;
    };
    loading: boolean;
    lastMessage: string;
    reload: (nextConfig?: unknown) => Promise<void>;
  };
}

function getModeLabel(runtimeMode?: string, cloudRole?: string) {
  if (runtimeMode === "cache-host") {
    return "CSV cache 主控";
  }

  if (runtimeMode === "cache-client") {
    return cloudRole === "client" ? "CSV cache 用戶端" : "CSV cache 連線";
  }

  if (cloudRole === "host") {
    return "雲端主控";
  }

  if (cloudRole === "client") {
    return "雲端用戶端";
  }

  return "本機";
}

function getStrategyLabel(syncStrategy?: string) {
  if (syncStrategy === "google-first-shared-csv") {
    return "Google Sheet + Shared CSV";
  }

  if (syncStrategy === "shared-csv") {
    return "Shared CSV";
  }

  return "Local only";
}

export function DataSyncBar({ roster, compactMode }: DataSyncBarProps) {
  const { width } = useWindowDimensions();
  const useCompact = compactMode ?? width < 600;
  const modeLabel = getModeLabel(roster.config.runtimeMode, roster.config.cloudRole);
  const strategyLabel = getStrategyLabel(roster.config.syncStrategy);

  async function refreshData() {
    await roster.reload(roster.config);
  }

  if (useCompact) {
    return (
      <View style={styles.compactRow}>
        <Text style={styles.compactMode}>
          模式：{modeLabel}
          {"\n"}
          路徑：{strategyLabel}
        </Text>
        <TouchableOpacity onPress={refreshData} style={styles.iconButton}>
          <Text style={styles.iconButtonText}>R</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      <View style={styles.copy}>
        <Text style={styles.title}>資料同步</Text>
        <Text style={styles.meta}>模式：{modeLabel}</Text>
        <Text style={styles.meta}>路徑：{strategyLabel}</Text>
        <Text style={styles.message}>{roster.loading ? "正在載入資料..." : roster.lastMessage}</Text>
      </View>
      <TouchableOpacity onPress={refreshData} style={styles.primaryButton}>
        <Text style={styles.primaryText}>重新整理</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "#F2F6F8",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#D7E2E8",
  },
  copy: {},
  title: {
    color: theme.colors.text,
    fontWeight: "800",
    fontSize: 16,
  },
  meta: {
    color: theme.colors.text,
    fontSize: 13,
    marginTop: 4,
  },
  message: {
    color: theme.colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  primaryButton: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.accent,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 12,
  },
  primaryText: {
    color: theme.colors.textOnDark,
    fontWeight: "800",
  },
  compactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F2F6F8",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#D7E2E8",
    minHeight: 48,
  },
  compactMode: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
    lineHeight: 16,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.accent,
    marginLeft: 8,
  },
  iconButtonText: {
    color: theme.colors.textOnDark,
    fontSize: 14,
    fontWeight: "800",
  },
});
// Codex END
