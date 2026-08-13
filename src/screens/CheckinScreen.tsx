// Codex BEGIN: check-in screen t1 cleanup / Product T1 報到處修正
import React, { useMemo, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { DataSyncBar } from "../components/DataSyncBar";
import { GuestCard } from "../components/GuestCard";
import { SimulationPanel } from "../components/SimulationPanel";
import { STATUS_TEXT } from "../constants/status";
import { recognizeSignature } from "../services/signatureRecognitionService";
import { theme } from "../styles/theme";
import { canCheckIn } from "../utils/statusMachine";

interface CheckinScreenProps {
  compactMode?: boolean;
  hideSyncBar?: boolean;
  roster: any;
}

export function CheckinScreen({ roster, compactMode, hideSyncBar }: CheckinScreenProps) {
  const [query, setQuery] = useState("");
  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestOrg, setNewGuestOrg] = useState("");
  const [newGuestTitle, setNewGuestTitle] = useState("");
  const [newGuestNote, setNewGuestNote] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanText, setLastScanText] = useState("");

  const filteredGuests = useMemo(() => {
    const normalized = query.trim();
    if (!normalized) {
      return roster.guests;
    }

    return roster.guests.filter(
      (guest: any) =>
        guest.name.includes(normalized) ||
        guest.organization.includes(normalized) ||
        guest.title.includes(normalized),
    );
  }, [query, roster.guests]);

  async function checkInGuest(guestId: string) {
    await roster.mutateStatus(guestId, STATUS_TEXT.waitingEntry, "報到處");
  }

  async function scanSignature() {
    if (isScanning) {
      return;
    }

    if (Platform.OS === "web") {
      const result = await recognizeSignature(roster.guests, { rawText: query.trim() });
      setLastScanText(result.rawText);
      if (!result.bestGuest) {
        Alert.alert("找不到對應來賓", "請改用人工搜尋或手動新增。");
        return;
      }

      await checkInGuest(result.bestGuest.id);
      setQuery(result.bestGuest.name);
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("需要相機權限", "請先允許相機權限後再進行簽名辨識。");
      return;
    }

    setIsScanning(true);
    try {
      const capture = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (capture.canceled || !capture.assets?.[0]?.uri) {
        return;
      }

      const result = await recognizeSignature(roster.guests, {
        rawText: query.trim(),
        imageUri: capture.assets[0].uri,
      });

      setLastScanText(result.rawText);

      if (!result.bestGuest) {
        Alert.alert("找不到對應來賓", `OCR 結果：${result.rawText || "無結果"}`);
        return;
      }

      await checkInGuest(result.bestGuest.id);
      setQuery(result.bestGuest.name);
      Alert.alert("報到完成", `已標記 ${result.bestGuest.name}\nOCR：${result.rawText || "無結果"}`);
    } finally {
      setIsScanning(false);
    }
  }

  async function createAdHocGuest() {
    if (!newGuestName.trim()) {
      Alert.alert("缺少來賓姓名", "請先輸入姓名。");
      return;
    }

    await roster.createGuest({
      name: newGuestName.trim(),
      organization: newGuestOrg.trim(),
      title: newGuestTitle.trim(),
      requiresSpeech: false,
      speechNote: "",
      note: newGuestNote.trim(),
      updatedBy: "報到處",
    });

    setNewGuestName("");
    setNewGuestOrg("");
    setNewGuestTitle("");
    setNewGuestNote("");
  }

  return (
    <View style={styles.wrapper}>
      {roster.config.sourceType === "simulation" && <SimulationPanel guests={roster.guests} role="checkin" />}
      {!hideSyncBar && <DataSyncBar roster={roster} compactMode={compactMode} />}

      <View style={styles.panel}>
        <Text style={styles.heading}>報到搜尋與簽名辨識</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="輸入姓名、單位、職稱，或先拍照辨識簽名"
          placeholderTextColor={theme.colors.placeholder}
          style={styles.input}
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={scanSignature} style={styles.primaryButton}>
            <Text style={styles.primaryText}>{isScanning ? "辨識中..." : Platform.OS === "web" ? "模擬辨識" : "拍照辨識簽名"}</Text>
          </TouchableOpacity>
        </View>

        {!!lastScanText && <Text style={styles.scanResult}>最近一次 OCR：{lastScanText}</Text>}
      </View>

      <View style={styles.panel}>
        <Text style={styles.heading}>名單外來賓</Text>
        <TextInput value={newGuestName} onChangeText={setNewGuestName} placeholder="姓名" placeholderTextColor={theme.colors.placeholder} style={styles.input} />
        <TextInput value={newGuestOrg} onChangeText={setNewGuestOrg} placeholder="單位 / 公司" placeholderTextColor={theme.colors.placeholder} style={styles.input} />
        <TextInput value={newGuestTitle} onChangeText={setNewGuestTitle} placeholder="職稱" placeholderTextColor={theme.colors.placeholder} style={styles.input} />
        <TextInput value={newGuestNote} onChangeText={setNewGuestNote} placeholder="備註" placeholderTextColor={theme.colors.placeholder} style={styles.input} />
        <TouchableOpacity onPress={createAdHocGuest} style={styles.primaryButton}>
          <Text style={styles.primaryText}>新增並完成報到</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {filteredGuests.map((guest: any) => (
          <View key={guest.id} style={styles.cardWrap}>
            <GuestCard guest={guest} />
            {canCheckIn(guest.status) ? (
              <TouchableOpacity onPress={() => checkInGuest(guest.id)} style={styles.actionButton}>
                <Text style={styles.actionText}>點擊報到</Text>
              </TouchableOpacity>
            ) : guest.status === STATUS_TEXT.waitingEntry ? (
              <Text style={styles.hintText}>已報到，等待進場。</Text>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 18,
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
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  primaryButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryText: {
    color: theme.colors.textOnDark,
    fontWeight: "800",
  },
  scanResult: {
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  list: {
    gap: 12,
  },
  cardWrap: {
    gap: 8,
  },
  actionButton: {
    alignSelf: "flex-end",
    borderRadius: 999,
    backgroundColor: theme.colors.panelDark,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionText: {
    color: theme.colors.textOnDark,
    fontWeight: "800",
  },
  hintText: {
    color: theme.colors.muted,
    fontSize: 13,
  },
});
// Codex END
