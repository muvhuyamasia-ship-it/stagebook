import { useEffect, useRef, useState } from "react";
import { Link, useLocalSearchParams } from "expo-router";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  BALANCE_RATE,
  DEPOSIT_RATE,
  formatZar,
  PAYFAST_SANDBOX_MERCHANT_ID,
  type PayfastCheckoutSession
} from "@stagebook/shared";
import { useStageBook } from "../../../src/context/StageBookContext";
import { LuxuryCard } from "../../../src/components/LuxuryCard";
import { theme } from "../../../src/theme/theme";

export default function PaymentScreen() {
  const { bookingId = "", pay: payParam } = useLocalSearchParams<{
    bookingId: string;
    pay?: string;
  }>();
  const { getBooking, getPaymentSchedule, createPayfastCheckout, completePayfastPayment } =
    useStageBook();
  const booking = getBooking(bookingId);
  const schedule = getPaymentSchedule(bookingId);
  const [checkout, setCheckout] = useState<PayfastCheckoutSession | null>(null);
  const [loading, setLoading] = useState(false);
  const autoPayStarted = useRef(false);

  useEffect(() => {
    const phase = payParam === "balance" ? "balance" : payParam === "deposit" ? "deposit" : null;
    if (!phase || !bookingId || !booking || !schedule || autoPayStarted.current) return;
    if (phase === "deposit" && (booking.status === "paid" || booking.status === "confirmed")) return;
    if (phase === "balance" && booking.status === "confirmed") return;
    autoPayStarted.current = true;

    void (async () => {
      setLoading(true);
      const session = await createPayfastCheckout(bookingId, phase);
      if (session) {
        setCheckout(session);
        await completePayfastPayment(bookingId, phase);
      }
      setLoading(false);
      setCheckout(null);
    })();
  }, [
    booking,
    bookingId,
    completePayfastPayment,
    createPayfastCheckout,
    payParam,
    schedule
  ]);

  if (!booking || !schedule) {
    return (
      <View style={styles.page}>
        <Text style={styles.title}>Booking not found</Text>
      </View>
    );
  }

  const depositPaid = booking.status === "paid" || booking.status === "confirmed";
  const fullyConfirmed = booking.status === "confirmed";

  async function openCheckout(phase: "deposit" | "balance") {
    setLoading(true);
    const session = await createPayfastCheckout(bookingId, phase);
    setLoading(false);
    if (session) setCheckout(session);
  }

  async function confirmSandbox() {
    if (!checkout) return;
    setLoading(true);
    await completePayfastPayment(bookingId, checkout.phase);
    setLoading(false);
    setCheckout(null);
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Link href={`/bookings/${bookingId}`} asChild>
        <Pressable>
          <Text style={styles.back}>← Booking detail</Text>
        </Pressable>
      </Link>
      <Text style={styles.title}>PayFast escrow</Text>

      <LuxuryCard>
        <Text style={styles.muted}>Total: {formatZar(schedule.totalAmountZar)}</Text>
        <Text style={styles.muted}>
          {Math.round(DEPOSIT_RATE * 100)}% deposit: {formatZar(schedule.depositAmountZar)}
        </Text>
        <Text style={styles.muted}>
          {Math.round(BALANCE_RATE * 100)}% balance: {formatZar(schedule.balanceAmountZar)}
        </Text>
        <Pressable
          style={[styles.btn, (depositPaid || loading) && styles.btnDisabled]}
          disabled={depositPaid || loading}
          onPress={() => openCheckout("deposit")}
        >
          <Text style={styles.btnText}>Pay 30% deposit</Text>
        </Pressable>
        <Pressable
          style={[styles.btnOutline, (!depositPaid || fullyConfirmed || loading) && styles.btnDisabled]}
          disabled={!depositPaid || fullyConfirmed || loading}
          onPress={() => openCheckout("balance")}
        >
          <Text style={styles.btnOutlineText}>Pay 70% balance</Text>
        </Pressable>
        {depositPaid ? (
          <Text style={styles.success}>Calendar slot locked globally for this artist/date.</Text>
        ) : null}
      </LuxuryCard>

      <Modal visible={Boolean(checkout)} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <LuxuryCard>
            <Text style={styles.section}>PayFast Sandbox</Text>
            <Text style={styles.muted}>Merchant: {PAYFAST_SANDBOX_MERCHANT_ID}</Text>
            <Text style={styles.amount}>
              {checkout ? formatZar(checkout.amountZar) : ""}
            </Text>
            <Text style={styles.muted}>{checkout?.itemName}</Text>
            <Pressable style={styles.btn} onPress={confirmSandbox} disabled={loading}>
              <Text style={styles.btnText}>{loading ? "Processing…" : "Pay with sandbox"}</Text>
            </Pressable>
            <Pressable style={styles.btnOutline} onPress={() => setCheckout(null)} disabled={loading}>
              <Text style={styles.btnOutlineText}>Cancel</Text>
            </Pressable>
          </LuxuryCard>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.obsidian },
  content: { padding: 20, gap: 12, paddingTop: 56 },
  back: { color: theme.colors.gold, marginBottom: 8 },
  title: { color: theme.colors.textPrimary, fontSize: 28, fontWeight: "700" },
  section: { color: theme.colors.gold, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase" },
  muted: { color: theme.colors.textMuted, marginTop: 4 },
  amount: { color: theme.colors.textPrimary, fontSize: 24, fontWeight: "700", marginVertical: 8 },
  btn: {
    backgroundColor: theme.colors.gold,
    padding: 12,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 10
  },
  btnDisabled: { opacity: 0.45 },
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
  success: { color: theme.colors.success, marginTop: 10 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    padding: 20
  }
});