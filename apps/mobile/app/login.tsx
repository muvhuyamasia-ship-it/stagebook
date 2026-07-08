import { useState } from "react";
import { Link, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../src/context/AuthContext";
import { LuxuryCard } from "../src/components/LuxuryCard";
import { theme } from "../src/theme/theme";

const DEMO_ACCOUNTS = [
  { label: "Client", email: "client@stagebook.test", password: "password123" },
  { label: "Artist", email: "artist@stagebook.test", password: "password123" }
];

export default function LoginScreen() {
  const router = useRouter();
  const { login, error, clearError } = useAuth();
  const [email, setEmail] = useState("client@stagebook.test");
  const [password, setPassword] = useState("password123");
  const [submitting, setSubmitting] = useState(false);

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
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>StageBook</Text>
      <Text style={styles.title}>Sign in to sync bookings & messages</Text>
      <LuxuryCard>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={styles.btn} onPress={onSubmit} disabled={submitting}>
          <Text style={styles.btnText}>{submitting ? "Signing in…" : "Sign in"}</Text>
        </Pressable>
      </LuxuryCard>
      <View style={styles.demoRow}>
        {DEMO_ACCOUNTS.map((account) => (
          <Pressable
            key={account.label}
            style={styles.demoBtn}
            onPress={() => {
              setEmail(account.email);
              setPassword(account.password);
            }}
          >
            <Text style={styles.demoText}>Use {account.label}</Text>
          </Pressable>
        ))}
      </View>
      <Link href="/" style={styles.back}>
        <Text style={styles.backText}>← Back to landing</Text>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 24, paddingTop: 72, gap: 16 },
  eyebrow: { color: theme.colors.gold, letterSpacing: 3, textTransform: "uppercase", fontSize: 12 },
  title: { color: theme.colors.textPrimary, fontSize: 28, fontWeight: "700" },
  label: { color: theme.colors.gold, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.borderGold,
    borderRadius: 12,
    padding: 12,
    color: theme.colors.textPrimary,
    marginTop: 6
  },
  error: { color: theme.colors.danger, marginTop: 10 },
  btn: {
    backgroundColor: theme.colors.gold,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16
  },
  btnText: { color: "#1a1408", fontWeight: "700" },
  demoRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  demoBtn: {
    borderWidth: 1,
    borderColor: theme.colors.borderGold,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14
  },
  demoText: { color: theme.colors.gold, fontWeight: "600" },
  back: { marginTop: 8 },
  backText: { color: theme.colors.textMuted }
});