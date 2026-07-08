export type SiteStatus = "live" | "in_development";
export type MessageStatus = "open" | "responded" | "closed";
export type MessageSource = "chat" | "email";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface SiteStat {
  label: string;
  value: string;
}

export interface SiteService {
  id: string;
  title: string;
  description: string;
  status: SiteStatus;
  highlight: string;
}

export interface SiteHero {
  eyebrow: string;
  title: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
}

export interface SiteAbout {
  story: string;
  mission: string;
  values: string[];
  stats: SiteStat[];
}

export interface SiteContact {
  email: string;
  phone: string;
  office: string;
  responseTime: string;
}

export interface SiteContent {
  hero: SiteHero;
  about: SiteAbout;
  services: SiteService[];
  subsidiaries: SiteService[];
  highlights: string[];
  contact: SiteContact;
}

export interface SiteContentPatch {
  hero?: Partial<SiteHero>;
  about?: Partial<SiteAbout>;
  services?: SiteService[];
  subsidiaries?: SiteService[];
  highlights?: string[];
  contact?: Partial<SiteContact>;
}

export interface SiteReply {
  id: string;
  senderRole: string;
  senderName: string;
  body: string;
  createdAt: string;
  channel: MessageSource;
}

export interface SiteThread {
  id: string;
  subject: string;
  status: MessageStatus;
  customerName: string;
  customerEmail: string;
  source: MessageSource;
  updatedAt: string;
  unreadCount: number;
  replies: SiteReply[];
}

export interface SiteMessageDraft {
  subject: string;
  body: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResult {
  message: string;
  resetToken?: string;
  expiresAt?: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}
