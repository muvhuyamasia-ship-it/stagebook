import { Link } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { BlurHeader } from "../../src/components/BlurHeader";
import { FloatingSurface } from "../../src/components/FloatingSurface";
import { PressableScale } from "../../src/components/PressableScale";
import { useAuth } from "../../src/context/AuthContext";
import { useStageBook } from "../../src/context/StageBookContext";
import { theme } from "../../src/theme/theme";

export default function ProfileScreen() {
  const { session, logout } = useAuth();
  const { myArtistProfile, verificationStatus } = useStageBook();
  const role = session?.user.role;

  return (
    <BlurHeader title="Profile" subtitle="Account, verification, and policies">
      <FloatingSurface>
        <Text style={styles.label}>Account</Text>
        {session ? (
          <>
            <Text style={styles.value}>{session.user.displayName}</Text>
            <Text style={styles.muted}>
              {session.user.email} · {session.user.role}
            </Text>
            <PressableScale style={styles.btn} haptic="medium" onPress={logout}>
              <Text style={styles.btnText}>Sign out</Text>
            </PressableScale>
          </>
        ) : (
          <>
            <Text style={styles.muted}>Sign in to load live bookings and messages.</Text>
            <Link href="/login" asChild>
              <PressableScale style={styles.btn} haptic="medium">
                <Text style={styles.btnText}>Sign in</Text>
              </PressableScale>
            </Link>
          </>
        )}
      </FloatingSurface>

      {role === "artist" ? (
        <FloatingSurface>
          <Text style={styles.label}>Artist dashboard</Text>
          {myArtistProfile ? (
            <Text style={styles.muted}>
              {myArtistProfile.stageName} · Verification: {verificationStatus ?? "unverified"}
            </Text>
          ) : null}
          <Link href="/profile/edit" asChild>
            <PressableScale style={styles.btnOutline} haptic="selection">
              <Text style={styles.btnOutlineText}>Edit artist profile</Text>
            </PressableScale>
          </Link>
          <Link href="/(tabs)/earnings" asChild>
            <PressableScale style={styles.btnOutline} haptic="selection">
              <Text style={styles.btnOutlineText}>Earnings & payouts</Text>
            </PressableScale>
          </Link>
        </FloatingSurface>
      ) : null}

      <FloatingSurface>
        <Text style={styles.label}>Onboarding status</Text>
        <Text style={styles.value}>Verified (demo)</Text>
        <Text style={styles.muted}>
          ID document scan · Biometric liveness · Escrow policy accepted
        </Text>
      </FloatingSurface>

      <FloatingSurface>
        <Text style={styles.label}>Cancellation tiers</Text>
        <Text style={styles.muted}>14+ days: 100% · 7–13 days: 75% · &lt;7 days: 50%</Text>
      </FloatingSurface>
    </BlurHeader>
  );
}

const styles = StyleSheet.create({
  label: {
    ...theme.typography.overline,
    color: theme.colors.gold
  },
  value: {
    ...theme.typography.headline,
    color: theme.colors.success
  },
  muted: {
    ...theme.typography.body,
    color: theme.colors.textMuted
  },
  btn: {
    marginTop: 4,
    backgroundColor: theme.colors.gold,
    borderRadius: theme.radius.pill,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: "flex-start"
  },
  btnText: {
    ...theme.typography.body,
    color: "#1a1408",
    fontWeight: "700"
  },
  btnOutline: {
    marginTop: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderGold,
    borderRadius: theme.radius.pill,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: "flex-start"
  },
  btnOutlineText: {
    ...theme.typography.body,
    color: theme.colors.gold,
    fontWeight: "600"
  }
});