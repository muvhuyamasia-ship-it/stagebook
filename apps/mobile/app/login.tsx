import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../src/context/AuthContext";
import { FloatingSurface } from "../src/components/FloatingSurface";
import { PressableScale } from "../src/components/PressableScale";
import { theme } from "../src/theme/theme";

const DEMO_ACCOUNTS = [
  { label: "Client", email: "client@stagebook.test", password: "password123" },
  { label: "Artist", email: "artist@stagebook.test", password: "password123" }
];

export default function LoginScreen() {
  const router = useRouter();
  const { demo } = useLocalSearchParams<{ demo?: string }>();
  const { login, error, clearError } = useAuth();
  const [email, setEmail] = useState("client@stagebook.test");
  const [password, setPassword] = useState("password123");
  const [submitting, setSubmitting] = useState(false);
  const demoLoginStarted = useRef(false);

  useEffect(() => {
    if (!demo || demoLoginStarted.current) return;
    const account = DEMO_ACCOUNTS.find((entry) => entry.label.toLowerCase() === demo.toLowerCase());
    if (!account) return;
    demoLoginStarted.current = true;

    void (async () => {
      clearError();
      setSubmitting(true);
      try {
        await login(account.email, account.password);
        router.replace("/(tabs)/discover");
      } catch {
        // surfaced via context
      } finally {
        setSubmitting(false);
      }
    })();
  }, [clearError, demo, login, router]);

  async function onSubmit() {
    clearError();
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace("/(tabs)/discover");
    } catch {
      // error surfaced via context
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>StageBook</Text>
        <Text style={styles.title}>Sign in to sync bookings & messages</Text>

        <FloatingSurface>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor={theme.colors.textMuted}
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholderTextColor={theme.colors.textMuted}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PressableScale
            style={styles.btn}
            haptic="medium"
            onPress={onSubmit}
            disabled={submitting}
          >
            <Text style={styles.btnText}>{submitting ? "Signing in…" : "Sign in"}</Text>
          </PressableScale>
        </FloatingSurface>

        <View style={styles.demoRow}>
          {DEMO_ACCOUNTS.map((account) => (
            <PressableScale
              key={account.label}
              style={styles.demoBtn}
              haptic="selection"
              onPress={() => {
                setEmail(account.email);
                setPassword(account.password);
              }}
            >
              <Text style={styles.demoText}>Use {account.label}</Text>
            </PressableScale>
          ))}
        </View>

        <Link href="/" style={styles.back}>
          <Text style={styles.backText}>← Back to landing</Text>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.colors.obsidian
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    paddingTop: 72,
    gap: theme.spacing.md
  },
  eyebrow: {
    ...theme.typography.overline,
    color: theme.colors.gold
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.textPrimary
  },
  label: {
    ...theme.typography.overline,
    color: theme.colors.gold
  },
  input: {
    ...theme.typography.body,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderFine,
    borderRadius: theme.radius.md,
    padding: 12,
    color: theme.colors.textPrimary,
    backgroundColor: "rgba(255,255,255,0.03)"
  },
  error: {
    ...theme.typography.caption,
    color: theme.colors.danger
  },
  btn: {
    backgroundColor: theme.colors.gold,
    borderRadius: theme.radius.pill,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4
  },
  btnText: {
    ...theme.typography.body,
    color: "#1a1408",
    fontWeight: "700"
  },
  demoRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap"
  },
  demoBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderGold,
    borderRadius: theme.radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 14
  },
  demoText: {
    ...theme.typography.caption,
    color: theme.colors.gold,
    fontWeight: "600"
  },
  back: {
    marginTop: 4
  },
  backText: {
    ...theme.typography.body,
    color: theme.colors.textMuted
  }
});