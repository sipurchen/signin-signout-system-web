// Codex BEGIN: host screen t1 cleanup / Product T1 主持人頁修正
import React, { useEffect, useMemo, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { DataSyncBar } from "../components/DataSyncBar";
import { GuestCard } from "../components/GuestCard";
import { SimulationPanel } from "../components/SimulationPanel";
import { STATUS_TEXT } from "../constants/status";
import { theme } from "../styles/theme";
import { nextStatusForHostAction } from "../utils/statusMachine";

interface HostScreenProps {
  compactMode?: boolean;
  hideSyncBar?: boolean;
  roster: any;
}

export function HostScreen({ roster, compactMode, hideSyncBar }: HostScreenProps) {
  const [speechQueueOpen, setSpeechQueueOpen] = useState(false);
  const [speechQueueIds, setSpeechQueueIds] = useState<string[]>([]);

  const waitingToAnnounce = useMemo(
    () => roster.guests.filter((guest: any) => guest.status === STATUS_TEXT.waitingAnnounce),
    [roster.guests],
  );
  const waitingToSpeak = useMemo(
    () => roster.guests.filter((guest: any) => guest.status === STATUS_TEXT.waitingSpeech),
    [roster.guests],
  );
  const onSiteGuests = useMemo(
    () => roster.guests.filter((guest: any) => guest.status === STATUS_TEXT.onsite || guest.status === STATUS_TEXT.temporarilyAway),
    [roster.guests],
  );
  const speechGuests = useMemo(
    () => roster.guests.filter((guest: any) => guest.requiresSpeech || guest.highlight),
    [roster.guests],
  );

  useEffect(() => {
    setSpeechQueueIds((current) => {
      const nextIds = waitingToSpeak.map((guest: any) => guest.id);
      const retained = current.filter((id: string) => nextIds.includes(id));
      const appended = nextIds.filter((id: string) => !retained.includes(id));
      return [...retained, ...appended];
    });
  }, [waitingToSpeak]);

  const orderedSpeechQueue = useMemo(() => {
    const byId = new Map(waitingToSpeak.map((guest: any) => [guest.id, guest]));
    return speechQueueIds.map((id) => byId.get(id)).filter(Boolean);
  }, [speechQueueIds, waitingToSpeak]);

  async function markAnnounced(guest: any) {
    const nextStatus = guest.requiresSpeech || guest.highlight ? nextStatusForHostAction(STATUS_TEXT.waitingAnnounce, "announce-waiting-speech") : STATUS_TEXT.onsite;
    await roster.mutateStatus(guest.id, nextStatus, "主持人", `主持人已唱名：${guest.name}`);
  }

  async function markSpeechFinished(guestId: string, guestName: string) {
    await roster.mutateStatus(
      guestId,
      nextStatusForHostAction(STATUS_TEXT.waitingSpeech, "finish-speech"),
      "主持人",
      `主持人已確認致詞完成：${guestName}`,
    );
  }

  function moveQueueItem(guestId: string, direction: -1 | 1) {
    setSpeechQueueIds((current) => {
      const index = current.indexOf(guestId);
      if (index < 0) {
        return current;
      }

      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  return (
    <View style={styles.wrapper}>
      {roster.config.sourceType === "simulation" && <SimulationPanel guests={roster.guests} role="host" />}
      {!hideSyncBar && <DataSyncBar roster={roster} compactMode={compactMode} />}

      <View style={styles.banner}>
        <View style={styles.bannerHeader}>
          <View style={styles.bannerCopy}>
            <Text style={styles.bannerTitle}>主持人控制台</Text>
            <Text style={styles.bannerText}>唱名完成後推進狀態；需致詞來賓會先進入等待致詞，再由主持人切到現場。</Text>
          </View>
          <TouchableOpacity onPress={() => setSpeechQueueOpen(true)} style={styles.queueButton}>
            <Text style={styles.queueButtonText}>等待致詞列表</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>等待唱名</Text>
        {waitingToAnnounce.length === 0 ? (
          <Text style={styles.empty}>目前沒有等待唱名的來賓。</Text>
        ) : (
          waitingToAnnounce.map((guest: any) => (
            <View key={guest.id} style={styles.cardWrap}>
              <GuestCard guest={guest} />
              <View style={styles.actionRow}>
                <TouchableOpacity onPress={() => markAnnounced(guest)} style={styles.actionButton}>
                  <Text style={styles.actionText}>{guest.requiresSpeech || guest.highlight ? "唱名完成，轉等待致詞" : "唱名完成，轉現場"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>等待致詞</Text>
        {waitingToSpeak.length === 0 ? (
          <Text style={styles.empty}>目前沒有等待致詞的來賓。</Text>
        ) : (
          waitingToSpeak.map((guest: any) => (
            <View key={guest.id} style={styles.cardWrap}>
              <GuestCard guest={guest} />
              <View style={styles.actionRow}>
                <TouchableOpacity onPress={() => markSpeechFinished(guest.id, guest.name)} style={styles.actionButton}>
                  <Text style={styles.actionText}>致詞完成，轉現場</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>現場 / 暫離</Text>
        {onSiteGuests.length === 0 ? <Text style={styles.empty}>目前沒有現場或暫離來賓。</Text> : onSiteGuests.map((guest: any) => <GuestCard key={guest.id} guest={guest} />)}
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>VIP / 需致詞提醒</Text>
        {speechGuests.length === 0 ? <Text style={styles.empty}>目前沒有需要特別提醒的來賓。</Text> : speechGuests.map((guest: any) => <GuestCard key={guest.id} guest={guest} />)}
      </View>

      <Modal visible={speechQueueOpen} transparent animationType="fade" onRequestClose={() => setSpeechQueueOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>等待致詞列表</Text>
              <TouchableOpacity onPress={() => setSpeechQueueOpen(false)} style={styles.closeButton}>
                <Text style={styles.closeText}>關閉</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {orderedSpeechQueue.length === 0 ? (
                <Text style={styles.empty}>目前沒有等待致詞的來賓。</Text>
              ) : (
                orderedSpeechQueue.map((guest: any, index: number) => (
                  <View key={guest.id} style={styles.queueRow}>
                    <View style={styles.queueNameWrap}>
                      <Text style={styles.queueIndex}>{index + 1}.</Text>
                      <Text style={styles.queueName}>{guest.name}</Text>
                    </View>
                    <View style={styles.queueActions}>
                      <TouchableOpacity onPress={() => moveQueueItem(guest.id, -1)} style={styles.orderButton}>
                        <Text style={styles.orderText}>上移</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => moveQueueItem(guest.id, 1)} style={styles.orderButton}>
                        <Text style={styles.orderText}>下移</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 18,
  },
  banner: {
    backgroundColor: "#FFF0D2",
    borderRadius: 18,
    padding: 16,
  },
  bannerHeader: {
    gap: 12,
  },
  bannerCopy: {
    gap: 4,
  },
  bannerTitle: {
    color: "#7A4B00",
    fontWeight: "800",
    fontSize: 18,
  },
  bannerText: {
    color: "#7A4B00",
  },
  queueButton: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.panelDark,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  queueButtonText: {
    color: theme.colors.textOnDark,
    fontWeight: "800",
  },
  section: {
    gap: 12,
  },
  cardWrap: {
    gap: 8,
  },
  heading: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  empty: {
    color: theme.colors.muted,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionText: {
    color: theme.colors.textOnDark,
    fontWeight: "800",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(8, 18, 24, 0.48)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    gap: 12,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  modalTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  closeButton: {
    backgroundColor: "#DCE5EA",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  closeText: {
    color: theme.colors.text,
    fontWeight: "700",
  },
  queueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E8EEF2",
  },
  queueNameWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  queueIndex: {
    color: theme.colors.muted,
    fontWeight: "700",
  },
  queueName: {
    color: theme.colors.text,
    fontWeight: "800",
  },
  queueActions: {
    flexDirection: "row",
    gap: 8,
  },
  orderButton: {
    backgroundColor: "#EEF3F6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  orderText: {
    color: theme.colors.text,
    fontWeight: "800",
  },
});
// Codex END
