import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import { formatZar } from "@stagebook/shared";
import { BlurHeader } from "../../src/components/BlurHeader";
import { FloatingSurface } from "../../src/components/FloatingSurface";
import { PressableScale } from "../../src/components/PressableScale";
import { ArtistProfileSkeleton } from "../../src/components/Skeleton";
import { useSheets } from "../../src/context/SheetContext";
import { useStageBook } from "../../src/context/StageBookContext";
import { artistHeroGradient, isArtistVerified } from "../../src/lib/artistMedia";
import { theme } from "../../src/theme/theme";

export default function ArtistProfileScreen() {
  const { artistId = "" } = useLocalSearchParams<{ artistId: string }>();
  const { getArtist, getCalendarState, dataLoading } = useStageBook();
  const { openBookingWizard } = useSheets();
  const artist = getArtist(artistId);

  if (dataLoading && !artist) {
    return (
      <View style={styles.page}>
        <BlurHeader
          title="Artist"
          leftSlot={
            <PressableScale haptic="selection" onPress={() => router.back()}>
              <Text style={styles.back}>←</Text>
            </PressableScale>
          }
        >
          <ArtistProfileSkeleton />
        </BlurHeader>
      </View>
    );
  }

  if (!artist) {
    return (
      <View style={styles.page}>
        <BlurHeader
          title="Not found"
          subtitle="This artist profile is unavailable"
          leftSlot={
            <PressableScale haptic="selection" onPress={() => router.back()}>
              <Text style={styles.back}>←</Text>
            </PressableScale>
          }
        >
          <FloatingSurface>
            <Text style={styles.muted}>Try browsing Discover for active talent profiles.</Text>
            <PressableScale
              style={styles.btn}
              haptic="medium"
              onPress={() => router.replace("/(tabs)/discover")}
            >
              <Text style={styles.btnText}>Back to Discover</Text>
            </PressableScale>
          </FloatingSurface>
        </BlurHeader>
      </View>
    );
  }

  const heroColors = artistHeroGradient(artist);
  const verified = isArtistVerified(artist);
  const previewDates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    return { iso, state: getCalendarState(artist.id, iso) };
  });

  return (
    <View style={styles.page}>
      <BlurHeader
        title={artist.stageName}
        subtitle={`${artist.city} · ${artist.province}`}
        leftSlot={
          <PressableScale haptic="selection" onPress={() => router.back()}>
            <Text style={styles.back}>←</Text>
          </PressableScale>
        }
        rightSlot={
          <PressableScale
            style={styles.bookBtn}
            haptic="medium"
            onPress={() => openBookingWizard(artist.id)}
          >
            <Text style={styles.bookBtnText}>Book</Text>
          </PressableScale>
        }
      >
        <FloatingSurface noPadding style={styles.heroCard}>
          <View style={styles.mediaWrap}>
            <LinearGradient
              colors={[...heroColors]}
              style={styles.media}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.mediaOverlay} />
              <Text style={styles.initials}>{artist.stageName.slice(0, 2).toUpperCase()}</Text>
            </LinearGradient>
            {verified ? (
              <View style={styles.verifyBadge}>
                <Text style={styles.verifyText}>✓ Verified</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.heroBody}>
            <View style={styles.ratingRow}>
              <Text style={styles.rating}>★ {artist.rating.toFixed(1)}</Text>
              <Text style={styles.reviews}>{artist.reviewCount} reviews</Text>
            </View>
            <Text style={styles.price}>From {formatZar(artist.basePriceZar)}</Text>
            <PressableScale
              style={styles.btn}
              haptic="medium"
              onPress={() => openBookingWizard(artist.id)}
            >
              <Text style={styles.btnText}>Book now</Text>
            </PressableScale>
          </View>
        </FloatingSurface>

        <FloatingSurface>
          <Text style={styles.section}>Biography</Text>
          <Text style={styles.muted}>{artist.bio}</Text>
          <View style={styles.chips}>
            {artist.genres.map((genre) => (
              <View key={genre} style={styles.chip}>
                <Text style={styles.chipText}>{genre}</Text>
              </View>
            ))}
          </View>
        </FloatingSurface>

        <FloatingSurface>
          <Text style={styles.section}>Availability preview</Text>
          <View style={styles.legend}>
            <Text style={styles.dotGreen}>● Available</Text>
            <Text style={styles.dotAmber}>● Partial</Text>
            <Text style={styles.dotRed}>● Booked</Text>
          </View>
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
        </FloatingSurface>
      </BlurHeader>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.colors.obsidian
  },
  back: {
    ...theme.typography.headline,
    color: theme.colors.gold
  },
  bookBtn: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: theme.colors.gold
  },
  bookBtnText: {
    ...theme.typography.caption,
    color: "#1a1408",
    fontWeight: "700"
  },
  heroCard: {
    borderRadius: theme.radius.xl
  },
  mediaWrap: {
    position: "relative"
  },
  media: {
    height: 280,
    alignItems: "center",
    justifyContent: "center"
  },
  mediaOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.18)"
  },
  initials: {
    fontSize: 52,
    fontWeight: "700",
    color: "rgba(255,255,255,0.82)",
    letterSpacing: 6
  },
  verifyBadge: {
    position: "absolute",
    left: 14,
    top: 14,
    backgroundColor: "rgba(8,8,10,0.72)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderFine,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill
  },
  verifyText: {
    ...theme.typography.caption,
    color: theme.colors.success,
    fontWeight: "700"
  },
  heroBody: {
    padding: theme.spacing.md,
    gap: 10
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10
  },
  rating: {
    ...theme.typography.metric,
    color: theme.colors.gold
  },
  reviews: {
    ...theme.typography.caption,
    color: theme.colors.textMuted
  },
  price: {
    ...theme.typography.headline,
    color: theme.colors.textPrimary
  },
  section: {
    ...theme.typography.overline,
    color: theme.colors.gold
  },
  muted: {
    ...theme.typography.body,
    color: theme.colors.textMuted
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4
  },
  chip: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderFine
  },
  chipText: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary
  },
  legend: {
    flexDirection: "row",
    gap: 12
  },
  dotGreen: {
    ...theme.typography.caption,
    color: theme.colors.success
  },
  dotAmber: {
    ...theme.typography.caption,
    color: theme.colors.warning
  },
  dotRed: {
    ...theme.typography.caption,
    color: theme.colors.danger
  },
  miniCal: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  miniDay: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderFine
  },
  miniDayText: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
    fontWeight: "600"
  },
  btn: {
    backgroundColor: theme.colors.gold,
    paddingVertical: 14,
    borderRadius: theme.radius.pill,
    alignItems: "center"
  },
  btnText: {
    ...theme.typography.body,
    color: "#1a1408",
    fontWeight: "700"
  }
});