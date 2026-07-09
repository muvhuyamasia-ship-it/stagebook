import { useEffect, useRef, useState } from "react";
import { Link, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../../../src/context/AuthContext";
import { useStageBook } from "../../../src/context/StageBookContext";
import { LuxuryCard } from "../../../src/components/LuxuryCard";
import { SignaturePad } from "../../../src/components/SignaturePad";
import { theme } from "../../../src/theme/theme";

export default function ContractScreen() {
  const { bookingId = "", generate: generateParam, sign: signParam } = useLocalSearchParams<{
    bookingId: string;
    generate?: string;
    sign?: string;
  }>();
  const { session } = useAuth();
  const { getBooking, getContract, loadContract, generateContract, signContract, requestAmendment } =
    useStageBook();
  const booking = getBooking(bookingId);
  const contract = getContract(bookingId);
  const [amendment, setAmendment] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);

  const autoGenerateStarted = useRef(false);
  const autoSignStarted = useRef(false);

  const demoSignature = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="160" viewBox="0 0 480 160"><rect width="100%" height="100%" fill="#0f0f0f"/><path d="M36,92 L108,68 L188,96 L260,72 L340,88 L420,76" stroke="#CBA848" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>'
  )}`;

  useEffect(() => {
    void loadContract(bookingId);
  }, [bookingId, loadContract]);

  useEffect(() => {
    const shouldGenerate = generateParam === "1" || generateParam === "true";
    if (!shouldGenerate || !bookingId || autoGenerateStarted.current) return;
    autoGenerateStarted.current = true;
    void generateContract(bookingId);
  }, [bookingId, generateContract, generateParam]);

  useEffect(() => {
    const shouldSign = signParam === "1" || signParam === "true";
    if (!shouldSign || !bookingId || !session || autoSignStarted.current) return;
    autoSignStarted.current = true;

    void (async () => {
      await loadContract(bookingId);
      await signContract(bookingId, demoSignature);
      await loadContract(bookingId);
    })();
  }, [bookingId, demoSignature, loadContract, session, signContract, signParam]);

  if (!booking || !session) {
    return (
      <View style={styles.page}>
        <Text style={styles.title}>Booking not found</Text>
      </View>
    );
  }

  const isClient = session.user.role === "client";
  const isArtistSide = session.user.role === "artist" || session.user.role === "representative";
  const mySignature = isClient ? contract?.clientSignature : contract?.artistSignature;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Link href={`/bookings/${bookingId}`} asChild>
        <Pressable>
          <Text style={styles.back}>← Booking detail</Text>
        </Pressable>
      </Link>
      <Text style={styles.title}>Digital contract</Text>

      {!contract ? (
        <LuxuryCard>
          <Pressable style={styles.btn} onPress={() => generateContract(bookingId)}>
            <Text style={styles.btnText}>Generate contract</Text>
          </Pressable>
        </LuxuryCard>
      ) : null}

      {contract ? (
        <>
          <LuxuryCard>
            <Text style={styles.section}>Contract document</Text>
            <Text style={styles.doc}>{contract.bodyMarkdown}</Text>
          </LuxuryCard>

          <LuxuryCard>
            <Text style={styles.section}>Request amendment</Text>
            <TextInput
              style={styles.input}
              multiline
              value={amendment}
              onChangeText={setAmendment}
              placeholderTextColor={theme.colors.textMuted}
            />
            <Pressable style={styles.btnOutline} onPress={() => requestAmendment(bookingId, amendment)}>
              <Text style={styles.btnOutlineText}>Request amendment</Text>
            </Pressable>
          </LuxuryCard>

          <LuxuryCard>
            <Text style={styles.section}>Signature status</Text>
            <Text style={styles.muted}>
              Client: {contract.clientSignature ? "Signed" : "Awaiting"}
            </Text>
            <Text style={styles.muted}>
              Artist: {contract.artistSignature ? "Signed" : "Awaiting"}
            </Text>
          </LuxuryCard>

          {contract.status !== "signed" && (isClient || isArtistSide) && !mySignature ? (
            <LuxuryCard>
              <Text style={styles.section}>Your signature</Text>
              <Pressable style={styles.checkRow} onPress={() => setAgreed((v) => !v)}>
                <Text style={styles.muted}>
                  {agreed ? "☑" : "☐"} I formally agree to the terms of this binding contract.
                </Text>
              </Pressable>
              <SignaturePad
                label={isClient ? "Client signature canvas" : "Artist signature canvas"}
                disabled={!agreed || saving}
                onSave={async (sig) => {
                  setSaving(true);
                  await signContract(bookingId, sig);
                  setSaving(false);
                }}
              />
            </LuxuryCard>
          ) : null}

          {contract.status === "signed" ? (
            <LuxuryCard>
              <Text style={styles.success}>Contract finalized</Text>
              <Link href={`/bookings/${bookingId}/payment`} asChild>
                <Pressable style={styles.btn}>
                  <Text style={styles.btnText}>Proceed to PayFast deposit</Text>
                </Pressable>
              </Link>
            </LuxuryCard>
          ) : null}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.obsidian },
  content: { padding: 20, gap: 12, paddingTop: 56 },
  back: { color: theme.colors.gold, marginBottom: 8 },
  title: { color: theme.colors.textPrimary, fontSize: 28, fontWeight: "700" },
  section: { color: theme.colors.gold, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase" },
  doc: { color: theme.colors.textMuted, lineHeight: 20, marginTop: 8 },
  muted: { color: theme.colors.textMuted, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    padding: 10,
    color: theme.colors.textPrimary,
    minHeight: 90,
    marginTop: 8
  },
  checkRow: { marginVertical: 8 },
  btn: {
    backgroundColor: theme.colors.gold,
    padding: 12,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 8
  },
  btnText: { color: "#1a1408", fontWeight: "700" },
  btnOutline: {
    borderWidth: 1,
    borderColor: theme.colors.borderGold,
    padding: 12,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 8
  },
  btnOutlineText: { color: theme.colors.gold, fontWeight: "600" },
  success: { color: theme.colors.success, fontWeight: "700", fontSize: 18 }
});