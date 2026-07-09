import type { ArtistProfile } from "@stagebook/shared";

const palettes = [
  ["#1A1428", "#3D2E63", "#CBA848"],
  ["#0F1B2D", "#1F4E79", "#5EEAD4"],
  ["#24140F", "#6B3A2E", "#F59E0B"],
  ["#101820", "#243B55", "#10B981"]
] as const;

export function artistHeroGradient(artist: ArtistProfile): readonly [string, string, string] {
  const seed = artist.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palettes[seed % palettes.length];
}

export function isArtistVerified(artist: ArtistProfile) {
  return artist.bankAccountLinked && artist.rating >= 4.5;
}