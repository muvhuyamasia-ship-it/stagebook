export * from "./business-logic";
export * from "./design-tokens";
export * from "./navigation";

export type UserRole = "artist" | "representative" | "client" | "admin";

export type AvailabilityStatus = "available" | "limited" | "fully_booked";
export type BookingStatus =
  | "request_sent"
  | "agreement"
  | "paid"
  | "confirmed"
  | "declined"
  | "cancelled"
  | "completed";
export type ContractStatus = "draft" | "pending_signatures" | "signed" | "revision_requested";
export type SignatureMethod = "draw" | "type";
export type PaymentStatus = "pending" | "authorized" | "captured" | "released" | "refunded";
export type IdentityVerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export const STAGEBOOK_TIME_SLOTS = [
  "08:00",
  "10:00",
  "12:00",
  "14:00",
  "16:00",
  "18:00",
  "20:00",
  "22:00"
] as const;

export interface User {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
}

export interface ArtistProfile {
  id: string;
  userId: string;
  stageName: string;
  bio: string;
  genres: string[];
  basePriceZar: number;
  city: string;
  province: string;
  latitude: number;
  longitude: number;
  rating: number;
  reviewCount: number;
  media: ArtistMedia[];
  availabilityStatus: AvailabilityStatus;
  bankAccountLinked: boolean;
}

export interface ArtistMedia {
  id: string;
  type: "image" | "video";
  url: string;
}

export interface RepresentativeLink {
  representativeUserId: string;
  artistProfileId: string;
}

export interface BookingParty {
  userId: string;
  name: string;
  email: string;
}

export interface BookingRequest {
  id: string;
  artistProfileId: string;
  clientUserId: string;
  representativeUserId?: string;
  eventName: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  locationLabel: string;
  latitude: number;
  longitude: number;
  guestCount: number;
  specialRequests?: string;
  technicalRider?: string;
  quotedPriceZar: number;
  status: BookingStatus;
  travelWarning?: string;
}

export interface PaymentSchedule {
  totalAmountZar: number;
  depositAmountZar: number;
  balanceAmountZar: number;
  platformFeeZar: number;
  artistNetZar: number;
  balanceDueAt: string;
}

export interface ChatMessage {
  id: string;
  bookingId: string;
  senderUserId: string;
  senderRole: UserRole;
  body: string;
  createdAt: string;
  systemAction?: "accept" | "decline" | "counter_offer" | "payment" | "contract" | "notification";
  counterOfferId?: string;
  messageType?: "text" | "system" | "counter_offer" | "notification_tile";
}

export interface ContractSignature {
  signerUserId: string;
  signerRole: UserRole;
  method: SignatureMethod;
  value: string;
  signedAt: string;
}

export interface ContractRecord {
  id: string;
  bookingId: string;
  status: ContractStatus;
  bodyMarkdown: string;
  artistSignature?: ContractSignature;
  clientSignature?: ContractSignature;
  pdfUrl?: string;
}

export interface IdentityVerificationRecord {
  artistProfileId: string;
  southAfricanIdNumber: string;
  idDocumentUrl: string;
  faceScanUrl: string;
  status: IdentityVerificationStatus;
}

export interface PayoutRequest {
  id: string;
  artistProfileId: string;
  amountZar: number;
  status: "pending" | "processing" | "paid" | "rejected";
}

export type SubsidiaryStatus = "live" | "in_development";
export type ReplyChannel = "email" | "chat" | "both";
export type ThreadStatus = "open" | "responded" | "closed";

export interface SiteHeroContent {
  eyebrow: string;
  title: string;
  description: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
}

export interface SiteAboutContent {
  story: string;
  mission: string;
  values: string[];
}

export interface SiteContactDetails {
  email: string;
  phone: string;
  responsePromise: string;
}

export interface ServiceOffering {
  slug: string;
  title: string;
  description: string;
  status: SubsidiaryStatus;
  bullets: string[];
}

export interface SubsidiaryInfo {
  slug: string;
  title: string;
  description: string;
  status: SubsidiaryStatus;
}

export interface SiteBrand {
  name: string;
  tagline: string;
  accent: string;
}

export interface SiteNavigationItem {
  label: string;
  href: string;
}

export interface SiteContent {
  brand: SiteBrand;
  navigation: SiteNavigationItem[];
  hero: SiteHeroContent;
  about: SiteAboutContent;
  services: ServiceOffering[];
  subsidiaries: SubsidiaryInfo[];
  contact: SiteContactDetails;
  admin: {
    editableSections: string[];
    notes: string;
  };
}

export interface ContactThreadMessage {
  id: string;
  senderType: "client" | "admin" | "system";
  senderUserId?: string;
  body: string;
  channel: "contact_form" | "email" | "chat";
  createdAt: string;
}

export interface ContactThread {
  id: string;
  userId?: string;
  name: string;
  email: string;
  company?: string;
  subject: string;
  serviceInterest: string;
  preferredReplyChannel: ReplyChannel;
  status: ThreadStatus;
  createdAt: string;
  updatedAt: string;
  messages: ContactThreadMessage[];
}

export interface OutboundEmail {
  id: string;
  threadId: string;
  to: string;
  subject: string;
  body: string;
  status: "queued" | "sent" | "failed";
  createdAt: string;
}

export interface PasswordResetToken {
  id: string;
  email: string;
  token: string;
  expiresAt: string;
}

export * from "./mock-catalog";
export * from "./messaging";
export * from "./stagebook-api";
