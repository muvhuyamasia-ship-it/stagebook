import { v4 as uuid } from "uuid";
import type {
  ArtistProfile,
  BookingRequest,
  ChatMessage,
  ContactThread,
  ContractRecord,
  IdentityVerificationRecord,
  OutboundEmail,
  PasswordResetToken,
  PayoutRequest,
  RepresentativeLink,
  SiteContent,
  User,
  UserRole
} from "@stagebook/shared";
import { hashPassword } from "../modules/auth/password";

interface AuthRecord extends User {
  passwordHash: string;
}

export const store = {
  users: [] as AuthRecord[],
  artists: [] as ArtistProfile[],
  representativeLinks: [] as RepresentativeLink[],
  bookings: [] as BookingRequest[],
  chatMessages: [] as ChatMessage[],
  contracts: [] as ContractRecord[],
  verifications: [] as IdentityVerificationRecord[],
  payouts: [] as PayoutRequest[],
  siteContent: undefined as SiteContent | undefined,
  contactThreads: [] as ContactThread[],
  outboundEmails: [] as OutboundEmail[],
  passwordResetTokens: [] as PasswordResetToken[]
};

export function seedData() {
  if (store.users.length > 0) {
    return;
  }

  const artistUserId = uuid();
  const representativeUserId = uuid();
  const clientUserId = uuid();
  const artistProfileId = uuid();

  const createUser = (email: string, role: UserRole, displayName: string, password: string) => ({
    id: role === "artist" ? artistUserId : role === "representative" ? representativeUserId : clientUserId,
    email,
    role,
    displayName,
    passwordHash: hashPassword(password)
  });

  store.users.push(
    createUser("artist@stagebook.test", "artist", "Luna Vibe", "password123"),
    createUser("rep@stagebook.test", "representative", "Aiden Manager", "password123"),
    createUser("client@stagebook.test", "client", "Nova Events", "password123"),
    {
      id: uuid(),
      email: "admin@rasilwela.test",
      role: "admin",
      displayName: "Rasilwela Admin",
      passwordHash: hashPassword("Password123!")
    },
    {
      id: uuid(),
      email: "client@rasilwela.test",
      role: "client",
      displayName: "Rasilwela Client",
      passwordHash: hashPassword("Password123!")
    }
  );

  store.artists.push({
    id: artistProfileId,
    userId: artistUserId,
    stageName: "Luna Vibe",
    bio: "Afro-house and live percussion sets for luxury events across South Africa.",
    genres: ["Afro House", "DJ", "Live Percussion"],
    basePriceZar: 18000,
    city: "Johannesburg",
    province: "Gauteng",
    latitude: -26.2041,
    longitude: 28.0473,
    rating: 4.9,
    reviewCount: 128,
    media: [
      { id: uuid(), type: "image", url: "https://images.example.com/luna-vibe-cover.jpg" },
      { id: uuid(), type: "video", url: "https://videos.example.com/luna-vibe-reel.mp4" }
    ],
    availabilityStatus: "available",
    bankAccountLinked: true
  });

  store.representativeLinks.push({
    representativeUserId,
    artistProfileId
  });
}

export function sanitizeUser(authRecord: AuthRecord): User {
  const { passwordHash: _passwordHash, ...user } = authRecord;
  return user;
}
