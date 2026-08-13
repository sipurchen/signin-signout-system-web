// Codex BEGIN: legacy web shell fallback / 舊瀏覽器 WebUI 外殼降級
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  PixelRatio,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useGuestRoster } from "./src/hooks/useGuestRoster";
import { CheckinScreen } from "./src/screens/CheckinScreen";
import { CheckpointScreen } from "./src/screens/CheckpointScreen";
import { HostScreen } from "./src/screens/HostScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { theme } from "./src/styles/theme";
import { AppRole } from "./src/types/guest";

type DeviceClass = "phone" | "tablet";

// Codex BEGIN: web settings bootstrap / Web 設定視窗啟動參數
function readSettingsOpenFromSearch(): boolean {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return false;
  }

  try {
    const search = typeof window.location?.search === "string" ? window.location.search : "";
    const params = new URLSearchParams(search);
    return params.get("settings") === "1";
  } catch {
    return false;
  }
}
// Codex END

const ROLE_TABS: Array<{ key: AppRole; label: string }> = [
  { key: "checkin", label: "報到" },
  { key: "checkpoint", label: "檢查點" },
  { key: "host", label: "主持" },
];

function classifyDevice(width: number, height: number): DeviceClass {
  const scale = PixelRatio.get() || 1;
  const shortestDp = Math.min(width, height) / scale;
  const longestDp = Math.max(width, height) / scale;
  return shortestDp < 520 || longestDp < 900 ? "phone" : "tablet";
}

function readRoleFromHash(): AppRole {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return "checkin";
  }

  const hash = typeof window.location?.hash === "string" ? window.location.hash : "";
  const role = hash.replace("#", "");
  if (role === "checkin" || role === "checkpoint" || role === "host") {
    return role;
  }

  return "checkin";
}

function detectLegacyWeb(): boolean {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return false;
  }

  const css = window.CSS;
  if (!css || typeof css.supports !== "function") {
    return true;
  }

  return !css.supports("gap", "1px");
}

function setHashSafely(role: AppRole) {
  if (Platform.OS !== "web" || typeof window === "undefined" || !window.location) {
    return;
  }

  try {
    window.location.hash = role;
  } catch {
    // Keep local role state even if hash writes fail / hash 寫入失敗時仍保留本地角色狀態
  }
}

export default function App() {
  const { width, height } = useWindowDimensions();
  const deviceClass = classifyDevice(width, height);
  const isPhone = deviceClass === "phone";
  const isLandscape = width > height;
  const tabletLandscape = !isPhone && isLandscape;
  const legacyWeb = useMemo(() => detectLegacyWeb(), []);

  const [activeRole, setActiveRole] = useState<AppRole>(readRoleFromHash());
  const [settingsOpen, setSettingsOpen] = useState(readSettingsOpenFromSearch());
  const roster = useGuestRoster();

  useEffect(() => {
    setHashSafely(activeRole);
  }, [activeRole]);

  const screen = useMemo(() => {
    const screenProps = {
      roster,
      compactMode: isPhone || legacyWeb,
      hideSyncBar: isPhone,
    };

    switch (activeRole) {
      case "checkpoint":
        return <CheckpointScreen {...screenProps} />;
      case "host":
        return <HostScreen {...screenProps} />;
      case "checkin":
      default:
        return <CheckinScreen {...screenProps} />;
    }
  }, [activeRole, isPhone, legacyWeb, roster]);

  const hostLink = roster.config.cacheServerUrl || "尚未設定";

  async function refreshRoster() {
    await roster.reload(roster.config);
  }

  function renderRoleButtons(mode: "phone" | "desktop" | "legacy") {
    return ROLE_TABS.map((tab, index) => {
      const active = tab.key === activeRole;
      const buttonStyle =
        mode === "desktop"
          ? [styles.desktopTab, active && styles.desktopTabActive, index > 0 && styles.inlineSpacing]
          : mode === "legacy"
            ? [styles.legacyRoleButton, active && styles.legacyRoleButtonActive, index > 0 && styles.blockSpacingTight]
            : [styles.phoneTab, active && styles.phoneTabActive, index > 0 && styles.inlineSpacingTight];
      const textStyle =
        mode === "desktop"
          ? [styles.desktopTabText, active && styles.desktopTabTextActive]
          : mode === "legacy"
            ? [styles.legacyRoleText, active && styles.legacyRoleTextActive]
            : [styles.phoneTabText, active && styles.phoneTabTextActive];

      return (
        <TouchableOpacity key={tab.key} onPress={() => setActiveRole(tab.key)} style={buttonStyle}>
          <Text style={textStyle}>{tab.label}</Text>
        </TouchableOpacity>
      );
    });
  }

  function renderLegacyShell() {
    return (
      <ScrollView contentContainerStyle={styles.legacyPage} keyboardShouldPersistTaps="handled">
        <View style={styles.legacyHero}>
          <Text style={styles.legacyTitle}>Signin Signout System</Text>
          <Text style={styles.legacySubtitle}>Legacy WebUI fallback keeps checkin, checkpoint, and host flows available.</Text>
          <Text style={styles.legacyHost}>Host: {hostLink}</Text>
        </View>

        <View style={styles.legacyPanel}>
          <Text style={styles.legacySectionTitle}>角色 / Role</Text>
          <View>{renderRoleButtons("legacy")}</View>

          <View style={styles.blockSpacing}>
            <TouchableOpacity onPress={refreshRoster} style={styles.legacyActionButton}>
              <Text style={styles.legacyActionText}>重新載入 / Reload</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSettingsOpen((current) => !current)}
              style={[styles.legacyActionButton, styles.blockSpacingTight]}
            >
              <Text style={styles.legacyActionText}>{settingsOpen ? "隱藏設定 / Hide Settings" : "顯示設定 / Show Settings"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {settingsOpen && (
          <View style={styles.legacyPanel}>
            <Text style={styles.legacySectionTitle}>設定 / Settings</Text>
            <SettingsScreen roster={roster} compactMode={true} onClose={() => setSettingsOpen(false)} />
          </View>
        )}

        <View style={styles.legacyPanel}>{screen}</View>

        <View style={styles.legacyNotice}>
          <Text style={styles.legacyNoticeText}>
            Compatibility note: this fallback removes the modal-first shell and keeps a simple stacked layout for browsers with weak CSS support.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {legacyWeb ? (
        renderLegacyShell()
      ) : isPhone ? (
        <>
          <View style={[styles.phoneTopShell, isLandscape && styles.phoneTopShellLandscape]}>
            <View style={[styles.phoneHero, isLandscape && styles.phoneHeroLandscape]}>
              <Text style={styles.phoneHeroTitle}>Signin Signout System</Text>
              <Text style={styles.phoneHeroHost} numberOfLines={isLandscape ? 1 : 2}>
                Host: {hostLink}
              </Text>
            </View>

            <View style={[styles.phoneToolbar, isLandscape && styles.phoneToolbarLandscape]}>
              <View style={styles.flexRow}>{renderRoleButtons("phone")}</View>
              <TouchableOpacity onPress={refreshRoster} style={[styles.phoneIconButton, styles.inlineSpacing]}>
                <Text style={styles.phoneIconText}>R</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSettingsOpen(true)} style={[styles.phoneIconButton, styles.inlineSpacingTight]}>
                <Text style={styles.phoneIconText}>S</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={[styles.content, styles.contentPhone, isLandscape && styles.contentPhoneLandscape]}
            keyboardShouldPersistTaps="handled"
          >
            {screen}
          </ScrollView>
        </>
      ) : (
        <>
          <View style={[styles.header, styles.headerTablet, tabletLandscape && styles.headerTabletWide]}>
            <View style={styles.headerMain}>
              <Text style={styles.eyebrow}>Signin Signout System</Text>
              <Text style={styles.title}>活動貴賓報到與唱名系統</Text>
              <Text style={styles.subtitle}>同一套介面支援 checkin、checkpoint、host；可走 Host / Client 或本機模式。</Text>
            </View>
            <View style={[styles.metaCard, tabletLandscape && styles.metaCardWide]}>
              <Text style={styles.metaLabel}>目前資料來源</Text>
              <Text style={styles.metaValue}>{roster.config.sheetLabel || "尚未設定資料來源"}</Text>
              <Text style={styles.metaHint}>{roster.loading ? "正在載入..." : roster.lastMessage}</Text>
            </View>
          </View>

          <View style={styles.desktopToolbar}>
            <View style={styles.flexRow}>{renderRoleButtons("desktop")}</View>
            <TouchableOpacity onPress={() => setSettingsOpen(true)} style={styles.desktopSettingsButton}>
              <Text style={styles.desktopSettingsText}>設定</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={[styles.content, tabletLandscape && styles.contentLandscape]} keyboardShouldPersistTaps="handled">
            {screen}
          </ScrollView>
        </>
      )}

      {!legacyWeb && (
        <Modal visible={settingsOpen} transparent animationType="slide" onRequestClose={() => setSettingsOpen(false)}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, isPhone && styles.modalCardPhone]}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderCopy}>
                  <Text style={styles.modalTitle}>設定</Text>
                  <Text style={styles.modalSubtitle}>{isPhone ? `Host: ${hostLink}` : roster.lastMessage}</Text>
                </View>
                <TouchableOpacity onPress={() => setSettingsOpen(false)} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>關閉</Text>
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
                <SettingsScreen roster={roster} compactMode={isPhone} onClose={() => setSettingsOpen(false)} />
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flexRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  inlineSpacing: {
    marginLeft: 8,
  },
  inlineSpacingTight: {
    marginLeft: 4,
  },
  blockSpacing: {
    marginTop: 12,
  },
  blockSpacingTight: {
    marginTop: 8,
  },
  phoneTopShell: {
    backgroundColor: theme.colors.panelStrong,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.12)",
  },
  phoneTopShellLandscape: {
    paddingBottom: 2,
  },
  phoneHero: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
  },
  phoneHeroLandscape: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 6,
  },
  phoneHeroTitle: {
    color: theme.colors.textOnDark,
    fontSize: 20,
    fontWeight: "800",
  },
  phoneHeroHost: {
    color: theme.colors.textOnDark,
    opacity: 0.86,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  phoneToolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: 2,
    paddingBottom: 8,
    backgroundColor: theme.colors.backgroundSoft,
  },
  phoneToolbarLandscape: {
    paddingHorizontal: 12,
  },
  phoneTab: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: theme.colors.panel,
    paddingHorizontal: 4,
    paddingVertical: 7,
  },
  phoneTabActive: {
    backgroundColor: theme.colors.accent,
  },
  phoneTabText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
  phoneTabTextActive: {
    color: theme.colors.textOnDark,
  },
  phoneIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.panelDark,
    flexShrink: 0,
  },
  phoneIconText: {
    color: theme.colors.textOnDark,
    fontSize: 15,
    fontWeight: "800",
  },
  header: {
    backgroundColor: theme.colors.panelStrong,
  },
  headerTablet: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  headerTabletWide: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  headerMain: {
    flex: 1,
  },
  eyebrow: {
    color: theme.colors.textOnDark,
    fontSize: 22,
    fontWeight: "800",
  },
  title: {
    color: theme.colors.textOnDark,
    fontSize: 26,
    fontWeight: "800",
    marginTop: 6,
  },
  subtitle: {
    color: theme.colors.mutedOnDark,
    marginTop: 6,
  },
  metaCard: {
    flex: 1,
    backgroundColor: theme.colors.panelDark,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "center",
    marginTop: 12,
  },
  metaCardWide: {
    marginTop: 0,
    marginLeft: 12,
  },
  metaLabel: {
    color: theme.colors.mutedOnDark,
    fontSize: 12,
  },
  metaValue: {
    color: theme.colors.textOnDark,
    fontWeight: "800",
    marginTop: 4,
  },
  metaHint: {
    color: theme.colors.mutedOnDark,
    fontSize: 12,
    marginTop: 4,
  },
  desktopToolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: theme.colors.backgroundSoft,
  },
  desktopTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: theme.colors.panel,
  },
  desktopTabActive: {
    backgroundColor: theme.colors.accent,
  },
  desktopTabText: {
    color: theme.colors.text,
    fontWeight: "700",
  },
  desktopTabTextActive: {
    color: theme.colors.textOnDark,
  },
  desktopSettingsButton: {
    minWidth: 76,
    minHeight: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.panelDark,
    paddingHorizontal: 14,
    marginLeft: 12,
  },
  desktopSettingsText: {
    color: theme.colors.textOnDark,
    fontSize: 13,
    fontWeight: "800",
  },
  content: {
    padding: 20,
  },
  contentPhone: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  contentPhoneLandscape: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  contentLandscape: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
    paddingHorizontal: 24,
  },
  legacyPage: {
    padding: 12,
  },
  legacyHero: {
    backgroundColor: theme.colors.panelStrong,
    borderRadius: 16,
    padding: 14,
  },
  legacyTitle: {
    color: theme.colors.textOnDark,
    fontSize: 20,
    fontWeight: "800",
  },
  legacySubtitle: {
    color: theme.colors.mutedOnDark,
    marginTop: 6,
    lineHeight: 18,
  },
  legacyHost: {
    color: theme.colors.textOnDark,
    marginTop: 8,
    fontSize: 12,
  },
  legacyPanel: {
    backgroundColor: theme.colors.panel,
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
  },
  legacySectionTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
  },
  legacyRoleButton: {
    borderRadius: 12,
    backgroundColor: theme.colors.backgroundSoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  legacyRoleButtonActive: {
    backgroundColor: theme.colors.accent,
  },
  legacyRoleText: {
    color: theme.colors.text,
    fontWeight: "700",
  },
  legacyRoleTextActive: {
    color: theme.colors.textOnDark,
  },
  legacyActionButton: {
    borderRadius: 12,
    backgroundColor: theme.colors.panelDark,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  legacyActionText: {
    color: theme.colors.textOnDark,
    fontWeight: "800",
  },
  legacyNotice: {
    borderRadius: 14,
    backgroundColor: "#FFF4D8",
    padding: 12,
    marginTop: 12,
    marginBottom: 16,
  },
  legacyNoticeText: {
    color: "#7A4B00",
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(8, 18, 24, 0.55)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 20,
  },
  modalCardPhone: {
    maxHeight: "94%",
    paddingHorizontal: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  modalHeaderCopy: {
    flex: 1,
  },
  modalTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  modalSubtitle: {
    color: theme.colors.muted,
    fontSize: 12,
    marginTop: 4,
    maxWidth: 280,
  },
  closeButton: {
    backgroundColor: theme.colors.panelDark,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginLeft: 12,
  },
  closeButtonText: {
    color: theme.colors.textOnDark,
    fontWeight: "800",
  },
  modalContent: {
    paddingBottom: 24,
  },
});
// Codex END
