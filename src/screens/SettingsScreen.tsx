// ── Codex BEGIN: settings bridge ux refresh / 設定與橋接體驗更新 ─────────────────
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { Alert, Keyboard, Linking, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { StatusLegend } from "../components/StatusLegend";
import { loadGoogleBridgeMeta, resolveCloudSyncPlan } from "../services/guestSheetService";
import { theme } from "../styles/theme";
import { GoogleBridgeMeta, SheetConfig } from "../types/guest";

interface SettingsScreenProps {
  compactMode?: boolean;
  onClose?: () => void;
  roster: any;
}

type BridgeCheckState = "idle" | "checking" | "ok" | "error";

function normalizeUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function toBridgeLabel(meta: GoogleBridgeMeta | null) {
  if (!meta?.bridge) {
    return "No bridge metadata loaded / 尚未讀取橋接資訊";
  }

  const worksheetName = meta.bridge.defaultWorksheetName || "n/a";
  const version = meta.bridge.version || "n/a";
  return `Bridge ready · ${version} · ${worksheetName} / 橋接可用`;
}

export function SettingsScreen({ roster, compactMode, onClose }: SettingsScreenProps) {
  const [sourceSheetUrl, setSourceSheetUrl] = useState(roster.config.sourceSheetUrl ?? "");
  const [workingSheetUrl, setWorkingSheetUrl] = useState(roster.config.sheetUrl ?? "");
  const [cacheServerUrl, setCacheServerUrl] = useState(roster.config.cacheServerUrl ?? "");
  const [googleAppsScriptUrl, setGoogleAppsScriptUrl] = useState(roster.config.googleAppsScriptUrl ?? "");
  const [worksheetName, setWorksheetName] = useState(roster.config.worksheetName ?? "");
  const [writableLinkOpen, setWritableLinkOpen] = useState(false);
  const [bridgeCheckState, setBridgeCheckState] = useState<BridgeCheckState>("idle");
  const [bridgeMeta, setBridgeMeta] = useState<GoogleBridgeMeta | null>(null);
  const [bridgeMessage, setBridgeMessage] = useState("Bridge not checked yet / 尚未檢查 Apps Script Bridge");
  const sourceSheetInputRef = useRef<TextInput | null>(null);
  const workingSheetInputRef = useRef<TextInput | null>(null);
  const cacheServerInputRef = useRef<TextInput | null>(null);
  const bridgeUrlInputRef = useRef<TextInput | null>(null);
  const worksheetInputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    setSourceSheetUrl(roster.config.sourceSheetUrl ?? "");
  }, [roster.config.sourceSheetUrl]);

  useEffect(() => {
    setWorkingSheetUrl(roster.config.sheetUrl ?? "");
  }, [roster.config.sheetUrl]);

  useEffect(() => {
    setCacheServerUrl(roster.config.cacheServerUrl ?? "");
  }, [roster.config.cacheServerUrl]);

  useEffect(() => {
    setGoogleAppsScriptUrl(roster.config.googleAppsScriptUrl ?? "");
  }, [roster.config.googleAppsScriptUrl]);

  useEffect(() => {
    setWorksheetName(roster.config.worksheetName ?? "");
  }, [roster.config.worksheetName]);

  const nextConfig = useMemo(
    () => ({
      ...roster.config,
      sourceType: (sourceSheetUrl.includes("/file/d/") || sourceSheetUrl.includes("uc?export=") ? "remote-file" : "google-sheet") as SheetConfig["sourceType"],
      sourceSheetUrl: sourceSheetUrl.trim() || workingSheetUrl.trim(),
      sheetUrl: workingSheetUrl.trim(),
      cacheServerUrl: normalizeUrl(cacheServerUrl),
      googleAppsScriptUrl: normalizeUrl(googleAppsScriptUrl),
      worksheetName: worksheetName.trim() || "Guest List",
    }),
    [cacheServerUrl, googleAppsScriptUrl, roster.config, sourceSheetUrl, workingSheetUrl, worksheetName],
  );

  const syncPlan = useMemo(() => resolveCloudSyncPlan(nextConfig), [nextConfig]);
  const runtimeMode = roster.config.runtimeMode || "local";

  const hostStatus = useMemo(() => {
    if (runtimeMode === "cache-host") {
      return "This device is the CSV cache host / 目前裝置是 CSV cache host";
    }
    if (runtimeMode === "cache-client") {
      return "This device is using a CSV cache host / 目前裝置是 CSV cache client";
    }
    return "Standalone mode / 目前為獨立模式";
  }, [runtimeMode]);

  const bridgeStatusTone = useMemo(() => {
    if (bridgeCheckState === "ok") {
      return styles.statusSuccess;
    }
    if (bridgeCheckState === "error") {
      return styles.statusError;
    }
    return styles.statusNeutral;
  }, [bridgeCheckState]);

  const bridgeWorksheetMismatch = useMemo(() => {
    const bridgeWorksheetName = bridgeMeta?.bridge?.defaultWorksheetName?.trim();
    const localWorksheetName = nextConfig.worksheetName.trim();
    if (!bridgeWorksheetName || !localWorksheetName) {
      return false;
    }

    return bridgeWorksheetName !== localWorksheetName;
  }, [bridgeMeta?.bridge?.defaultWorksheetName, nextConfig.worksheetName]);

  async function pickXlsx() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"],
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return;
    }

    const file = result.assets[0];
    await roster.loadFromFile(file.uri, file.name);
  }

  function blurAllInputs() {
    sourceSheetInputRef.current?.blur();
    workingSheetInputRef.current?.blur();
    cacheServerInputRef.current?.blur();
    bridgeUrlInputRef.current?.blur();
    worksheetInputRef.current?.blur();
    Keyboard.dismiss();
  }

  async function saveGoogleSheetConfig() {
    blurAllInputs();
    await new Promise((resolve) => setTimeout(resolve, 120));

    if (!sourceSheetUrl.trim() && !workingSheetUrl.trim()) {
      Alert.alert("Source URL required", "Please enter a shared Google Sheet or public Drive file URL / 請輸入共享 Google Sheet 或公開 Drive 檔案網址");
      return;
    }

    roster.updateConfig(nextConfig);
    await roster.reload(nextConfig);
  }

  async function checkBridge() {
    const trimmedBridgeUrl = normalizeUrl(googleAppsScriptUrl);
    if (!trimmedBridgeUrl) {
      setBridgeCheckState("error");
      setBridgeMeta(null);
      setBridgeMessage("Missing Apps Script URL / 缺少 Apps Script URL");
      return;
    }

    setBridgeCheckState("checking");
    setBridgeMessage("Checking bridge metadata... / 檢查橋接資訊中...");

    const result = await loadGoogleBridgeMeta({ ...nextConfig, googleAppsScriptUrl: trimmedBridgeUrl });
    if (!result?.ok || !result.bridge) {
      setBridgeCheckState("error");
      setBridgeMeta(result);
      setBridgeMessage("Bridge check failed or metadata is incomplete / 橋接檢查失敗或資料不完整");
      return;
    }

    setBridgeCheckState("ok");
    setBridgeMeta(result);
    setBridgeMessage(toBridgeLabel(result));
  }

  const sourceFileName = roster.config.localFileName || "No local XLSX selected / 尚未選擇本機 XLSX";
  const currentHostUrl = roster.config.cacheServerUrl || "Host not configured / 尚未設定 Host";
  const bridgeUrlPreview = normalizeUrl(googleAppsScriptUrl) || "Apps Script URL not set / 尚未設定 Apps Script URL";

  return (
    <ScrollView contentContainerStyle={styles.wrapper}>
      <View style={[styles.panel, compactMode && styles.panelCompact]}>
        <Text style={styles.heading}>Cloud Sync Settings</Text>
        <Text style={styles.helperText}>
          Source sheet or Drive file is for read/import. Writable sheet and Apps Script bridge are for cloud writeback. CSV cache host stays optional for LAN sync.
        </Text>
        <Text style={styles.helperText}>讀取來源用 `Source sheet`，雲端寫入用 `Writable sheet + Apps Script URL`，區網同步才需要 `CSV cache host`。</Text>

        <Text style={styles.label}>Source Google Sheet URL / 唯讀來源 Google Sheet URL</Text>
        <TextInput
          ref={sourceSheetInputRef}
          value={sourceSheetUrl}
          onChangeText={setSourceSheetUrl}
          placeholder="Shared CSV, Drive file, or Google Sheet URL"
          placeholderTextColor={theme.colors.placeholder}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Writable Google Sheet URL / 可寫入 Google Sheet URL</Text>
        <TextInput
          ref={workingSheetInputRef}
          value={workingSheetUrl}
          onChangeText={setWorkingSheetUrl}
          placeholder="Optional writable Google Sheet URL"
          placeholderTextColor={theme.colors.placeholder}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Apps Script Web App URL / Apps Script Web App 網址</Text>
        <TextInput
          ref={bridgeUrlInputRef}
          value={googleAppsScriptUrl}
          onChangeText={setGoogleAppsScriptUrl}
          placeholder="Optional Apps Script Web App URL"
          placeholderTextColor={theme.colors.placeholder}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.helperText}>
          Enter a deployed Apps Script Web App URL only when direct Google writeback is required.
        </Text>
        <Text style={styles.helperText}>Make sure the bridge script property `DEFAULT_WORKSHEET_NAME` matches the worksheet name below.</Text>

        <Text style={styles.label}>CSV cache host URL / CSV cache 主機 URL</Text>
        <TextInput
          ref={cacheServerInputRef}
          value={cacheServerUrl}
          onChangeText={setCacheServerUrl}
          placeholder="http://192.168.1.10:43123"
          placeholderTextColor={theme.colors.placeholder}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Worksheet Name / 工作表名稱</Text>
        <TextInput
          ref={worksheetInputRef}
          value={worksheetName}
          onChangeText={setWorksheetName}
          placeholder="Guest List"
          placeholderTextColor={theme.colors.placeholder}
          style={styles.input}
          autoCorrect={false}
        />

        <Text style={styles.label}>Selected XLSX / 已選擇 XLSX</Text>
        <View style={styles.readonlyField}>
          <Text style={styles.readonlyText}>{sourceFileName}</Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={saveGoogleSheetConfig} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Save and Reload / 儲存並重載</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={checkBridge} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Check Bridge / 檢查 Bridge</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={pickXlsx} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Load XLSX / 載入 XLSX</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => roster.loadSimulation()} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Load Simulation / 載入模擬資料</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.panel, compactMode && styles.panelCompact]}>
        <Text style={styles.heading}>Bridge Summary</Text>
        <View style={[styles.statusChip, bridgeStatusTone]}>
          <Text style={styles.statusChipText}>{bridgeMessage}</Text>
        </View>
        <Text style={styles.helperText}>Configured URL: {bridgeUrlPreview}</Text>
        <Text style={styles.helperText}>Write channel: {syncPlan.writeMode}</Text>
        <Text style={styles.helperText}>Read mode: {syncPlan.readMode}</Text>
        <Text style={styles.helperText}>Sync strategy: {syncPlan.strategy}</Text>
        {!!bridgeMeta?.bridge?.supportedStatuses?.length && (
          <Text style={styles.helperText}>Supported statuses: {bridgeMeta.bridge.supportedStatuses.join(" / ")}</Text>
        )}
        {!!bridgeMeta?.bridge?.defaultWorksheetName && (
          <Text style={styles.helperText}>Bridge worksheet: {bridgeMeta.bridge.defaultWorksheetName}</Text>
        )}
        {bridgeWorksheetMismatch && (
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>Worksheet mismatch / 工作表名稱不一致</Text>
            <Text style={styles.warningText}>
              Settings uses `{nextConfig.worksheetName}` but the bridge reports `{bridgeMeta?.bridge?.defaultWorksheetName}`.
            </Text>
            <Text style={styles.warningText}>Update either the settings field or the Apps Script `DEFAULT_WORKSHEET_NAME` property before go-live.</Text>
          </View>
        )}
        {!!syncPlan.warnings.length && (
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>Warnings / 注意事項</Text>
            {syncPlan.warnings.map((warning) => (
              <Text key={warning} style={styles.warningText}>
                - {warning}
              </Text>
            ))}
          </View>
        )}
      </View>

      <View style={[styles.panel, compactMode && styles.panelCompact]}>
        <Text style={styles.heading}>Host / 同步主機</Text>
        <Text style={styles.statusText}>{hostStatus}</Text>
        <Text style={styles.helperText}>Host URL: {currentHostUrl}</Text>
        <Text style={styles.helperText}>Last message: {roster.lastMessage}</Text>

      </View>

      <View style={[styles.panel, compactMode && styles.panelCompact]}>
        <Text style={styles.heading}>Writable Sheet Link</Text>
        <TouchableOpacity onPress={() => setWritableLinkOpen(true)} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Open Writable Sheet / 開啟可寫入工作表</Text>
        </TouchableOpacity>
      </View>

      <StatusLegend />

      <View style={[styles.panel, compactMode && styles.panelCompact]}>
        <Text style={styles.heading}>Close Settings</Text>
        <Text style={styles.helperText}>
          Save first if you changed URLs. Bridge check only verifies the deployed endpoint metadata; it does not run a live guest write.
        </Text>
        <Text style={styles.helperText}>若已修改 URL，先儲存再離開。Bridge check 只驗證端點資訊，不會真的寫入來賓資料。</Text>
        {!!onClose && (
          <TouchableOpacity onPress={onClose} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Close / 關閉</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={writableLinkOpen} transparent animationType="fade" onRequestClose={() => setWritableLinkOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.linkModalCard}>
            <Text style={styles.linkModalTitle}>Writable Google Sheet</Text>
            <Text style={styles.linkContent}>{workingSheetUrl || "No writable sheet configured / 尚未設定可寫入工作表"}</Text>
            {!!workingSheetUrl && (
              <TouchableOpacity onPress={() => Linking.openURL(workingSheetUrl)} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Open in Browser / 在瀏覽器開啟</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setWritableLinkOpen(false)} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Close / 關閉</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 14,
    paddingBottom: 20,
  },
  panel: {
    backgroundColor: theme.colors.panel,
    borderRadius: 20,
    padding: 18,
    gap: 12,
  },
  panelCompact: {
    padding: 14,
    borderRadius: 16,
  },
  heading: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  label: {
    color: theme.colors.text,
    fontWeight: "700",
  },
  input: {
    backgroundColor: theme.colors.backgroundSoft,
    borderRadius: 14,
    color: theme.colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  helperText: {
    color: theme.colors.muted,
    lineHeight: 18,
  },
  statusText: {
    color: theme.colors.text,
    fontWeight: "800",
  },
  readonlyField: {
    backgroundColor: theme.colors.backgroundSoft,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  readonlyText: {
    color: theme.colors.text,
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  primaryButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.accent,
  },
  primaryButtonText: {
    color: theme.colors.textOnDark,
    fontWeight: "800",
  },
  secondaryButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.panelDark,
  },
  secondaryButtonText: {
    color: theme.colors.textOnDark,
    fontWeight: "800",
  },
  statusChip: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  statusNeutral: {
    backgroundColor: theme.colors.backgroundSoft,
  },
  statusSuccess: {
    backgroundColor: "#D9F4E5",
  },
  statusError: {
    backgroundColor: "#F7DDDD",
  },
  statusChipText: {
    color: theme.colors.text,
    fontWeight: "700",
  },
  warningBox: {
    backgroundColor: "#FFF0D9",
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  warningTitle: {
    color: theme.colors.text,
    fontWeight: "800",
  },
  warningText: {
    color: theme.colors.text,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(8, 18, 24, 0.5)",
    justifyContent: "center",
    padding: 20,
  },
  linkModalCard: {
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    padding: 18,
    gap: 14,
  },
  linkModalTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  linkContent: {
    color: theme.colors.text,
    lineHeight: 20,
  },
});
// ── Codex END ────────────────────────────────────────────────
