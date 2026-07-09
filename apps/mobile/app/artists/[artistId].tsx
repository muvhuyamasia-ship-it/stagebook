import { Link, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { formatZar } from "@stagebook/shared";
import { LuxuryCard } from "../../src/components/LuxuryCard";
import { useStageBook } from "../../src/context/StageBookContext";
import { theme } from "../../src/theme/theme";

export default function ArtistProfileScreen() {
  const { artistId = "" } = useLocalSearchParams<{ artistId: string }>();
  const { getArtist, getCalendarState } = useStageBook();
  const artist = getArtist(artistId);

  if (!artist) {
    return (
      <ScrollView style={styles.page}>
        <Text style={styles.title}>Artist not found</Text>
      </ScrollView>
    );
  }

  const previewDates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    return { iso, state: getCalendarState(artist.id, iso) };
  });

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Link href="/(tabs)/discover" asChild>
        <Pressable>
          <Text style={styles.back}>← Discover</Text>
        </Pressable>
      </Link>
      <LuxuryCard>
        <Text style={styles.title}>{artist.stageName}</Text>
        <Text style={styles.muted}>
          {artist.city} · ⭐ {artist.rating} ({artist.reviewCount} reviews)
        </Text>
        <Link href={`/bookings/new?artist=${artist.id}`} asChild>
          <Pressable style={styles.btn}>
            <Text style={styles.btnText}>Book now</Text>
          </Pressable>
        </Link>
      </LuxuryCard>
      <LuxuryCard>
        <Text style={styles.section}>Biography</Text>
        <Text style={styles.muted}>{artist.bio}</Text>
        <View style={styles.chips}>
          {artist.genres.map((genre) => (
            <Text key={genre} style={styles.chip}>
              {genre}
            </Text>
          ))}
        </View>
        <Text style={styles.gold}>From {formatZar(artist.basePriceZar)}</Text>
      </LuxuryCard>
      <LuxuryCard>
        <Text style={styles.section}>Availability preview</Text>
        <View style={styles.miniCal}>
          {previewDates.map((d) => (
            <View
              key={d.iso}
              style={[
                styles.miniDay,
                {
                  backgroundColor:
                    d.state === "available"
                      ? "rgba(16,185,129,0.2)"
                      : d.state === "partial"
                        ? "rgba(245,158,11,0.2)"
                        : d.state === "booked"
                          ? "rgba(239,68,68,0.2)"
                          : "rgba(55,65,81,0.25)"
                }
              ]}
            >
              <Text style={styles.miniDayText}>{d.iso.slice(8)}</Text>
            </View>
          ))}
        </View>
      </LuxuryCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, gap: 12, paddingTop: 56 },
  back: { color: theme.colors.gold, marginBottom: 8 },
  title: { color: theme.colors.textPrimary, fontSize: 26, fontWeight: "700" },
  section: { color: theme.colors.textPrimary, fontWeight: "700", fontSize: 17, marginBottom: 8 },
  muted: { color: theme.colors.textMuted, lineHeight: 22 },
  gold: { color: theme.colors.gold, fontWeight: "700", fontSize: 18, marginTop: 10 },
  btn: {
    backgroundColor: theme.colors.gold,
    padding: 12,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 12
  },
  btnText: { color: "#1a1408", fontWeight: "700" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  chip: {
    color: theme.colors.gold,
    borderWidth: 1,
    borderColor: theme.colors.borderGold,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12
  },
  miniCal: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  miniDay: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  miniDayText: { color: theme.colors.textPrimary, fontSize: 11, fontWeight: "600" }
});