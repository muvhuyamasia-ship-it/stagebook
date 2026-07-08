import type { ArtistProfile } from "@stagebook/shared";
import { v4 as uuid } from "uuid";
import { AppError } from "../../lib/errors";
import { store } from "../../lib/inMemoryStore";

export class ArtistService {
  list(filters: {
    search?: string;
    genre?: string;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    availability?: string;
  }) {
    return store.artists.filter((artist) => {
      const matchesSearch = !filters.search
        || artist.stageName.toLowerCase().includes(filters.search.toLowerCase());
      const matchesGenre = !filters.genre
        || artist.genres.some((genre) => genre.toLowerCase().includes(filters.genre!.toLowerCase()));
      const matchesLocation = !filters.location
        || [artist.city, artist.province].some((value) => value.toLowerCase().includes(filters.location!.toLowerCase()));
      const matchesMin = filters.minPrice === undefined || artist.basePriceZar >= filters.minPrice;
      const matchesMax = filters.maxPrice === undefined || artist.basePriceZar <= filters.maxPrice;
      const matchesAvailability = !filters.availability || artist.availabilityStatus === filters.availability;
      return matchesSearch && matchesGenre && matchesLocation && matchesMin && matchesMax && matchesAvailability;
    });
  }

  getById(id: string) {
    const artist = store.artists.find((entry) => entry.id === id);
    if (!artist) {
      throw new AppError("Artist not found", 404);
    }
    return artist;
  }

  getByUserId(userId: string) {
    const artist = store.artists.find((entry) => entry.userId === userId);
    if (!artist) {
      throw new AppError("Artist profile not found", 404);
    }
    return artist;
  }

  createOrUpdate(userId: string, input: Omit<ArtistProfile, "id" | "userId" | "rating" | "reviewCount" | "availabilityStatus">) {
    const existing = store.artists.find((artist) => artist.userId === userId);
    if (existing) {
      Object.assign(existing, input);
      return existing;
    }

    const profile: ArtistProfile = {
      id: uuid(),
      userId,
      stageName: input.stageName,
      bio: input.bio,
      genres: input.genres,
      basePriceZar: input.basePriceZar,
      city: input.city,
      province: input.province,
      latitude: input.latitude,
      longitude: input.longitude,
      rating: 0,
      reviewCount: 0,
      media: input.media,
      availabilityStatus: "available",
      bankAccountLinked: input.bankAccountLinked
    };

    store.artists.push(profile);
    return profile;
  }
}

export const artistService = new ArtistService();
