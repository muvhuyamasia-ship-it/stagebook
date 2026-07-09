import type { ArtistProfile } from "@stagebook/shared";
import { AVAILABILITY_LABEL, formatZar } from "@stagebook/shared";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { artistHeroGradient, isArtistVerified } from "../lib/artistMedia";
import { theme } from "../theme/theme";
import { FloatingSurface } from "./FloatingSurface";
import { PressableScale } from "./PressableScale";

interface ArtistDiscoveryCardProps {
  artist: ArtistProfile;
  onPress: () => void;
  onBookmark?: (artistId: string, saved: boolean) => void;
}

export function ArtistDiscoveryCard({ artist, onPress, onBookmark }: ArtistDiscoveryCardProps) {
  const [saved, setSaved] = useState(false);
  const heroColors = artistHeroGradient(artist);
  const verified = isArtistVerified(artist);

  return (
    <PressableScale onPress={onPress} haptic="selection" style={styles.pressable}>
      <FloatingSurface noPadding style={styles.card}>
        <View style={styles.mediaWrap}>
          <LinearGradient colors={[...heroColors]} style={styles.media} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.mediaOverlay} />
            <Text style={styles.initials}>{artist.stageName.slice(0, 2).toUpperCase()}</Text>
          </LinearGradient>

          {verified ? (
            <View style={styles.verifyBadge}>
              <Text style={styles.verifyText}>✓ Verified</Text>
            </View>
          ) : null}

          <PressableScale
            haptic="light"
            style={[styles.bookmark, saved ? styles.bookmarkActive : null]}
            onPress={() => {
              const next = !saved;
              setSaved(next);
              onBookmark?.(artist.id, next);
            }}
          >
            <Text style={styles.bookmarkIcon}>{saved ? "★" : "☆"}</Text>
          </PressableScale>
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{artist.stageName}</Text>
              <Text style={styles.location}>
                {artist.city} · {artist.province}
              </Text>
            </View>
            <View style={styles.ratingPill}>
              <Text style={styles.ratingText}>★ {artist.rating.toFixed(1)}</Text>
            </View>
          </View>

          <Text style={styles.bio} numberOfLines={2}>
            {artist.bio}
          </Text>

          <View style={styles.tagRow}>
            {artist.genres.slice(0, 3).map((genre) => (
              <View key={genre} style={styles.tag}>
                <Text style={styles.tagText}>{genre}</Text>
              </View>
            ))}
            <View
              style={[
                styles.tag,
                artist.availabilityStatus === "available" ? styles.tagLive : styles.tagMuted
              ]}
            >
              <Text style={styles.tagText}>{AVAILABILITY_LABEL[artist.availabilityStatus]}</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.priceLabel}>From</Text>
            <Text style={styles.price}>{formatZar(artist.basePriceZar)}</Text>
            <Text style={styles.reviews}>{artist.reviewCount} reviews</Text>
          </View>
        </View>
      </FloatingSurface>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: "100%"
  },
  card: {
    borderRadius: theme.radius.xl
  },
  mediaWrap: {
    position: "relative"
  },
  media: {
    height: 220,
    alignItems: "center",
    justifyContent: "center"
  },
  mediaOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.18)"
  },
  initials: {
    fontSize: 42,
    fontWeight: "700",
    color: "rgba(255,255,255,0.82)",
    letterSpacing: 4
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
  bookmark: {
    position: "absolute",
    right: 14,
    top: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(8,8,10,0.72)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderFine
  },
  bookmarkActive: {
    backgroundColor: "rgba(203,168,72,0.22)",
    borderColor: theme.colors.borderGold
  },
  bookmarkIcon: {
    color: theme.colors.gold,
    fontSize: 18,
    fontWeight: "700"
  },
  body: {
    padding: theme.spacing.md,
    gap: 10
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10
  },
  name: {
    ...theme.typography.headline,
    color: theme.colors.textPrimary
  },
  location: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginTop: 2
  },
  ratingPill: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderFine
  },
  ratingText: {
    ...theme.typography.caption,
    color: theme.colors.gold,
    fontWeight: "700"
  },
  bio: {
    ...theme.typography.body,
    color: theme.colors.textMuted
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  tag: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderFine
  },
  tagLive: {
    borderColor: "rgba(16,185,129,0.35)",
    backgroundColor: "rgba(16,185,129,0.12)"
  },
  tagMuted: {
    borderColor: theme.colors.border
  },
  tagText: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary
  },
  footer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginTop: 2
  },
  priceLabel: {
    ...theme.typography.overline,
    color: theme.colors.textMuted
  },
  price: {
    ...theme.typography.metric,
    color: theme.colors.gold,
    flex: 1
  },
  reviews: {
    ...theme.typography.caption,
    color: theme.colors.textMuted
  }
});