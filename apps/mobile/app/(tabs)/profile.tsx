import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { useStageBook } from "../../src/context/StageBookContext";
import { LuxuryCard } from "../../src/components/LuxuryCard";
import { theme } from "../../src/theme/theme";

export default function ProfileScreen() {
  const { session, logout } = useAuth();
  const { myArtistProfile, verificationStatus } = useStageBook();
  const role = session?.user.role;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile & Verification</Text>
      <LuxuryCard>
        <Text style={styles.label}>Account</Text>
        {session ? (
          <>
            <Text style={styles.value}>{session.user.displayName}</Text>
            <Text style={styles.muted}>{session.user.email} · {session.user.role}</Text>
            <Pressable style={styles.btn} onPress={logout}>
              <Text style={styles.btnText}>Sign out</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.muted}>Sign in to load live bookings and messages.</Text>
            <Link href="/login" style={styles.btn}>
              <Text style={styles.btnText}>Sign in</Text>
            </Link>
          </>
        )}
      </LuxuryCard>

      {role === "artist" ? (
        <LuxuryCard>
          <Text style={styles.label}>Artist dashboard</Text>
          {myArtistProfile ? (
            <Text style={styles.muted}>
              {myArtistProfile.stageName} · Verification: {verificationStatus ?? "unverified"}
            </Text>
          ) : null}
          <Link href="/profile/edit" asChild>
            <Pressable style={styles.btnOutline}>
              <Text style={styles.btnOutlineText}>Edit artist profile</Text>
            </Pressable>
          </Link>
          <Link href="/(tabs)/earnings" asChild>
            <Pressable style={styles.btnOutline}>
              <Text style={styles.btnOutlineText}>Earnings & payouts</Text>
            </Pressable>
          </Link>
        </LuxuryCard>
      ) : null}

      <LuxuryCard>
        <Text style={styles.label}>Onboarding status</Text>
        <Text style={styles.value}>Verified (demo)</Text>
        <Text style={styles.muted}>ID document scan · Biometric liveness · Escrow policy accepted</Text>
      </LuxuryCard>
      <LuxuryCard>
        <Text style={styles.label}>Cancellation tiers</Text>
        <Text style={styles.muted}>14+ days: 100% · 7–13 days: 75% · &lt;7 days: 50%</Text>
      </LuxuryCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, gap: 12, paddingTop: 56 },
  title: { color: theme.colors.textPrimary, fontSize: 28, fontWeight: "700" },
  label: { color: theme.colors.gold, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase" },
  value: { color: theme.colors.success, fontSize: 18, fontWeight: "700" },
  muted: { color: theme.colors.textMuted, lineHeight: 22 },
  btn: {
    marginTop: 12,
    backgroundColor: theme.colors.gold,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: "flex-start"
  },
  btnText: { color: "#1a1408", fontWeight: "700" },
  btnOutline: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: theme.colors.borderGold,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: "flex-start"
  },
  btnOutlineText: { color: theme.colors.gold, fontWeight: "600" }
});