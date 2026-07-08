import { DEFAULT_ADMIN_THREADS, DEFAULT_CLIENT_THREADS, DEFAULT_SITE_CONTENT } from "../data/defaultContent";
import type { SiteContent, SiteContentPatch, SiteReply, SiteService, SiteThread } from "../types";

type RecordLike = Record<string, unknown>;

function isRecord(value: unknown): value is RecordLike {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function normalizeService(value: unknown, fallback: SiteService): SiteService {
  const record = isRecord(value) ? value : {};
  const status = record.status === "in_development" ? "in_development" : "live";
  return {
    id: asString(record.id, asString(record.slug, fallback.id)),
    title: asString(record.title, asString(record.name, fallback.title)),
    description: asString(record.description, fallback.description),
    status,
    highlight: asString(
      record.highlight,
      status === "in_development" ? "Coming soon" : fallback.highlight
    )
  };
}

function normalizeReply(value: unknown, fallback?: SiteReply): SiteReply {
  const record = isRecord(value) ? value : {};
  return {
    id: asString(record.id, fallback?.id ?? crypto.randomUUID()),
    senderRole: asString(record.senderRole, asString(record.senderType, fallback?.senderRole ?? "client")),
    senderName: asString(record.senderName, fallback?.senderName ?? "Customer"),
    body: asString(record.body, fallback?.body ?? ""),
    createdAt: asString(record.createdAt, fallback?.createdAt ?? new Date().toISOString()),
    channel: record.channel === "chat" || record.channel === "contact_form" ? "chat" : "email"
  };
}

export function normalizeSiteContent(input: unknown): SiteContent {
  const record = isRecord(input) ? (isRecord(input.content) ? input.content : input) : {};
  const services = asArray(record.services).length
    ? asArray(record.services).map((item, index) => normalizeService(item, DEFAULT_SITE_CONTENT.services[index] ?? DEFAULT_SITE_CONTENT.services[0]))
    : DEFAULT_SITE_CONTENT.services;
  const subsidiaries = asArray(record.subsidiaries).length
    ? asArray(record.subsidiaries).map((item, index) =>
        normalizeService(item, DEFAULT_SITE_CONTENT.subsidiaries[index] ?? DEFAULT_SITE_CONTENT.subsidiaries[0])
      )
    : DEFAULT_SITE_CONTENT.subsidiaries;

  return {
    hero: {
      ...DEFAULT_SITE_CONTENT.hero,
      ...(isRecord(record.hero) ? {
        eyebrow: asString(record.hero.eyebrow, DEFAULT_SITE_CONTENT.hero.eyebrow),
        title: asString(record.hero.title, DEFAULT_SITE_CONTENT.hero.title),
        description: asString(record.hero.description, DEFAULT_SITE_CONTENT.hero.description),
        primaryCtaLabel: asString(record.hero.primaryCtaLabel, DEFAULT_SITE_CONTENT.hero.primaryCtaLabel),
        primaryCtaHref: asString(record.hero.primaryCtaHref, DEFAULT_SITE_CONTENT.hero.primaryCtaHref),
        secondaryCtaLabel: asString(record.hero.secondaryCtaLabel, DEFAULT_SITE_CONTENT.hero.secondaryCtaLabel),
        secondaryCtaHref: asString(record.hero.secondaryCtaHref, DEFAULT_SITE_CONTENT.hero.secondaryCtaHref)
      } : {})
    },
    about: {
      story: isRecord(record.about) ? asString(record.about.story, DEFAULT_SITE_CONTENT.about.story) : DEFAULT_SITE_CONTENT.about.story,
      mission: isRecord(record.about) ? asString(record.about.mission, DEFAULT_SITE_CONTENT.about.mission) : DEFAULT_SITE_CONTENT.about.mission,
      values:
        isRecord(record.about) && Array.isArray(record.about.values) && record.about.values.length > 0
          ? record.about.values.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
          : DEFAULT_SITE_CONTENT.about.values,
      stats:
        isRecord(record.about) && Array.isArray(record.about.stats) && record.about.stats.length > 0
          ? record.about.stats
              .map((stat) => (isRecord(stat) ? { label: asString(stat.label), value: asString(stat.value) } : null))
              .filter((stat): stat is { label: string; value: string } => Boolean(stat?.label && stat?.value))
          : DEFAULT_SITE_CONTENT.about.stats
    },
    services,
    subsidiaries,
    highlights:
      Array.isArray(record.highlights) && record.highlights.length > 0
        ? record.highlights.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        : DEFAULT_SITE_CONTENT.highlights,
    contact: {
      ...DEFAULT_SITE_CONTENT.contact,
      ...(isRecord(record.contact)
        ? {
            email: asString(record.contact.email, DEFAULT_SITE_CONTENT.contact.email),
            phone: asString(record.contact.phone, DEFAULT_SITE_CONTENT.contact.phone),
            office: asString(record.contact.office, asString(record.contact.location, DEFAULT_SITE_CONTENT.contact.office)),
            responseTime: asString(
              record.contact.responseTime,
              asString(record.contact.responsePromise, DEFAULT_SITE_CONTENT.contact.responseTime)
            )
          }
        : {})
    }
  };
}

export function mergeSiteContent(current: SiteContent, patch: SiteContentPatch): SiteContent {
  return normalizeSiteContent({
    ...current,
    ...patch,
    hero: {
      ...current.hero,
      ...patch.hero
    },
    about: {
      ...current.about,
      ...patch.about,
      values: patch.about?.values ?? current.about.values,
      stats: patch.about?.stats ?? current.about.stats
    },
    services: patch.services ?? current.services,
    subsidiaries: patch.subsidiaries ?? current.subsidiaries,
    highlights: patch.highlights ?? current.highlights,
    contact: {
      ...current.contact,
      ...patch.contact
    }
  });
}

export function normalizeThreads(input: unknown, fallback: SiteThread[] = DEFAULT_ADMIN_THREADS): SiteThread[] {
  const list = Array.isArray(input)
    ? input
    : isRecord(input) && Array.isArray(input.threads)
      ? input.threads
      : isRecord(input) && Array.isArray(input.messages)
        ? input.messages
        : isRecord(input) && isRecord(input.thread)
          ? [input.thread]
          : isRecord(input) && isRecord(input.message)
            ? [input.message]
        : [];
  if (list.length === 0) {
    return fallback;
  }

  return list.map((item, index) => {
    const fallbackThread = fallback[index] ?? fallback[0] ?? DEFAULT_ADMIN_THREADS[0] ?? DEFAULT_CLIENT_THREADS[0];
    const safeFallback = fallbackThread ?? {
      id: crypto.randomUUID(),
      subject: "Untitled thread",
      status: "open" as const,
      customerName: "Customer",
      customerEmail: "customer@example.com",
      source: "email" as const,
      updatedAt: new Date().toISOString(),
      unreadCount: 0,
      replies: []
    };
    const record = isRecord(item) ? item : {};

    return {
      id: asString(record.id, safeFallback.id),
      subject: asString(record.subject, safeFallback.subject),
      status:
        record.status === "closed"
          ? "closed"
          : record.status === "pending" || record.status === "responded" || record.status === "replied"
            ? "responded"
            : "open",
      customerName: asString(record.customerName, asString(record.name, safeFallback.customerName)),
      customerEmail: asString(record.customerEmail, asString(record.email, safeFallback.customerEmail)),
      source:
        record.source === "chat" || record.preferredReplyChannel === "chat"
          ? "chat"
          : "email",
      updatedAt: asString(record.updatedAt, safeFallback.updatedAt),
      unreadCount:
        typeof record.unreadCount === "number" && Number.isFinite(record.unreadCount)
          ? record.unreadCount
          : typeof record.unreadByClient === "boolean" && record.unreadByClient
            ? 1
          : safeFallback.unreadCount,
      replies:
        Array.isArray(record.replies) && record.replies.length > 0
          ? record.replies.map((reply, replyIndex) =>
              normalizeReply(reply, safeFallback.replies[replyIndex] ?? safeFallback.replies[0])
            )
          : Array.isArray(record.messages) && record.messages.length > 0
            ? record.messages.map((reply, replyIndex) =>
              normalizeReply(reply, safeFallback.replies[replyIndex] ?? safeFallback.replies[0])
            )
            : safeFallback.replies
    };
  });
}

export function createEmptyReply(): SiteReply {
  return {
    id: crypto.randomUUID(),
    senderRole: "admin",
    senderName: "Rasilwela Support",
    body: "",
    createdAt: new Date().toISOString(),
    channel: "chat"
  };
}
