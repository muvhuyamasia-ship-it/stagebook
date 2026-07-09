import { Link } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput
} from "react-native";
import { LuxuryCard } from "../../src/components/LuxuryCard";
import { useStageBook } from "../../src/context/StageBookContext";
import { theme } from "../../src/theme/theme";

export default function ArtistEditorScreen() {
  const {
    myArtistProfile,
    verificationStatus,
    loadArtistDashboard,
    updateMyArtistProfile,
    submitArtistVerification
  } = useStageBook();

  const [stageName, setStageName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [basePrice, setBasePrice] = useState("18000");
  const [genres, setGenres] = useState("");

  useEffect(() => {
    void loadArtistDashboard();
  }, [loadArtistDashboard]);

  useEffect(() => {
    if (!myArtistProfile) return;
    setStageName(myArtistProfile.stageName);
    setBio(myArtistProfile.bio);
    setCity(myArtistProfile.city);
    setProvince(myArtistProfile.province);
    setBasePrice(String(myArtistProfile.basePriceZar));
    setGenres(myArtistProfile.genres.join(", "));
  }, [myArtistProfile]);

  async function onSave() {
    if (!myArtistProfile) return;
    await updateMyArtistProfile({
      stageName,
      bio,
      city,
      province,
      basePriceZar: Number(basePrice) || 0,
      genres: genres.split(",").map((g) => g.trim()).filter(Boolean),
      latitude: myArtistProfile.latitude,
      longitude: myArtistProfile.longitude,
      media: myArtistProfile.media,
      bankAccountLinked: myArtistProfile.bankAccountLinked
    });
  }

  if (!myArtistProfile) {
    return (
      <ScrollView style={styles.page}>
        <Text style={styles.title}>Artist profile not found. Sign in as an artist.</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Link href="/(tabs)/profile" asChild>
        <Pressable>
          <Text style={styles.back}>← Profile</Text>
        </Pressable>
      </Link>
      <LuxuryCard>
        <Text style={styles.title}>Artist profile editor</Text>
        <Text style={styles.muted}>Verification: {verificationStatus ?? "unverified"}</Text>
        {verificationStatus !== "verified" ? (
          <Pressable style={styles.btnOutline} onPress={() => void submitArtistVerification()}>
            <Text style={styles.btnOutlineText}>Submit verification (demo)</Text>
          </Pressable>
        ) : null}
      </LuxuryCard>
      <LuxuryCard>
        <Text style={styles.label}>Stage name</Text>
        <TextInput style={styles.input} value={stageName} onChangeText={setStageName} />
        <Text style={styles.label}>Bio</Text>
        <TextInput style={[styles.input, styles.textArea]} value={bio} onChangeText={setBio} multiline />
        <Text style={styles.label}>City</Text>
        <TextInput style={styles.input} value={city} onChangeText={setCity} />
        <Text style={styles.label}>Province</Text>
        <TextInput style={styles.input} value={province} onChangeText={setProvince} />
        <Text style={styles.label}>Base price (ZAR)</Text>
        <TextInput style={styles.input} value={basePrice} onChangeText={setBasePrice} keyboardType="numeric" />
        <Text style={styles.label}>Genres (comma-separated)</Text>
        <TextInput style={styles.input} value={genres} onChangeText={setGenres} />
        <Pressable style={styles.btn} onPress={() => void onSave()}>
          <Text style={styles.btnText}>Save profile</Text>
        </Pressable>
      </LuxuryCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, gap: 12, paddingTop: 56 },
  back: { color: theme.colors.gold, marginBottom: 8 },
  title: { color: theme.colors.textPrimary, fontSize: 24, fontWeight: "700" },
  muted: { color: theme.colors.textMuted, marginTop: 4 },
  label: { color: theme.colors.gold, fontSize: 12, textTransform: "uppercase", marginBottom: 6, marginTop: 8 },
  input: {
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 12
  },
  textArea: { minHeight: 90, textAlignVertical: "top" },
  btn: {
    backgroundColor: theme.colors.gold,
    padding: 12,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 16
  },
  btnText: { color: "#1a1408", fontWeight: "700" },
  btnOutline: {
    borderWidth: 1,
    borderColor: theme.colors.borderGold,
    padding: 12,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 12
  },
  btnOutlineText: { color: theme.colors.gold, fontWeight: "600" }
});