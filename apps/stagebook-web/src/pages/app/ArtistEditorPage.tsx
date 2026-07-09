import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useStageBook } from "../../context/StageBookContext";
import { LuxuryCard } from "../../components/ui/LuxuryCard";
import { Button } from "../../components/ui/Button";
import { Field, TextArea, TextInput } from "../../components/ui/Field";

export function ArtistEditorPage() {
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
  const [basePrice, setBasePrice] = useState(18000);
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
    setBasePrice(myArtistProfile.basePriceZar);
    setGenres(myArtistProfile.genres.join(", "));
  }, [myArtistProfile]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await updateMyArtistProfile({
      stageName,
      bio,
      city,
      province,
      basePriceZar: basePrice,
      genres: genres.split(",").map((g) => g.trim()).filter(Boolean),
      latitude: myArtistProfile?.latitude ?? -26.2,
      longitude: myArtistProfile?.longitude ?? 28.04,
      media: myArtistProfile?.media ?? [],
      bankAccountLinked: myArtistProfile?.bankAccountLinked ?? false
    });
  }

  if (!myArtistProfile) {
    return <p>Artist profile not found. Sign in as an artist account.</p>;
  }

  return (
    <form className="page-stack" onSubmit={onSubmit}>
      <LuxuryCard>
        <Link to="/app/profile">← Profile</Link>
        <h1 className="page-title">Artist profile editor</h1>
        <p className="page-copy">Update stage identity, pricing, and availability metadata.</p>
        <p className="text-muted">Verification: {verificationStatus ?? "unverified"}</p>
        {verificationStatus !== "verified" ? (
          <Button type="button" variant="outline" onClick={() => submitArtistVerification()}>
            Submit verification (demo)
          </Button>
        ) : null}
      </LuxuryCard>

      <LuxuryCard>
        <Field label="Stage name">
          <TextInput value={stageName} onChange={(e) => setStageName(e.target.value)} />
        </Field>
        <Field label="Bio">
          <TextArea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
        </Field>
        <Field label="City">
          <TextInput value={city} onChange={(e) => setCity(e.target.value)} />
        </Field>
        <Field label="Province">
          <TextInput value={province} onChange={(e) => setProvince(e.target.value)} />
        </Field>
        <Field label="Base price (ZAR)">
          <TextInput
            type="number"
            value={basePrice}
            onChange={(e) => setBasePrice(Number(e.target.value))}
          />
        </Field>
        <Field label="Genres (comma-separated)">
          <TextInput value={genres} onChange={(e) => setGenres(e.target.value)} />
        </Field>
        <Button type="submit" variant="primary">
          Save profile
        </Button>
      </LuxuryCard>
    </form>
  );
}