import { AppError } from "../../lib/errors";
import { store } from "../../lib/inMemoryStore";

type ContentStatus = "live" | "in_development";

interface SiteContentSection {
  eyebrow?: string;
  title: string;
  description: string;
  primaryCtaLabel?: string;
  secondaryCtaLabel?: string;
}

interface SiteContentCard {
  title: string;
  description: string;
  status: ContentStatus;
}

interface SiteContent {
  brand: {
    name: string;
    tagline: string;
    accent: string;
  };
  navigation: Array<{ label: string; href: string }>;
  hero: SiteContentSection;
  services: Array<{
    slug: string;
    title: string;
    description: string;
    status: ContentStatus;
    bullets: string[];
  }>;
  subsidiaries: Array<SiteContentCard & { slug: string }>;
  about: {
    story: string;
    mission: string;
    values: string[];
  };
  contact: {
    email: string;
    phone: string;
    responsePromise: string;
  };
  admin: {
    editableSections: string[];
    notes: string;
  };
}

interface SiteContentRecord extends SiteContent {
  lastUpdatedAt: string;
  updatedBy?: string;
}

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[K] extends Record<string, unknown>
      ? DeepPartial<T[K]>
      : T[K];
};

type MutableStore = typeof store & {
  siteContent?: SiteContentRecord;
};

const mutableStore = store as MutableStore;

const DEFAULT_SITE_CONTENT: SiteContent = {
  brand: {
    name: "Rasilwela Group",
    tagline: "Software development first, with transport and security growing into the future.",
    accent: "Practical digital systems for South African businesses"
  },
  navigation: [
    { label: "Home", href: "/" },
    { label: "About Us", href: "/about" },
    { label: "Software", href: "/software" },
    { label: "Contact", href: "/contact" }
  ],
  hero: {
    eyebrow: "Rasilwela Software Company",
    title: "Company email hosting and business analysis support that keeps teams moving.",
    description:
      "We help businesses launch on a reliable digital foundation with domain email hosting, software development, and business analyst consulting that fits the way they work.",
    primaryCtaLabel: "Talk to the software team",
    secondaryCtaLabel: "See admin-updated content"
  },
  services: [
    {
      slug: "email-hosting",
      title: "Company Email Hosting",
      description:
        "Set up professional email addresses on your business domain with a cleaner customer experience and easier admin control.",
      status: "live",
      bullets: ["Domain-based mailboxes", "Migration support", "Mailbox administration"]
    },
    {
      slug: "business-analysis",
      title: "Business Analyst Consulting",
      description:
        "Translate business goals into requirements, workflows, and delivery plans that developers can build with confidence.",
      status: "live",
      bullets: ["Process mapping", "Requirements gathering", "Delivery planning"]
    },
    {
      slug: "transport",
      title: "Transport",
      description: "Transport services are planned for a future release.",
      status: "in_development",
      bullets: ["Coming soon", "Operational scope to be announced", "Admin-controlled launch"]
    },
    {
      slug: "security",
      title: "Security",
      description: "Security services are planned for a future release.",
      status: "in_development",
      bullets: ["Coming soon", "Service design in progress", "Admin-controlled launch"]
    }
  ],
  subsidiaries: [
    {
      slug: "software-development",
      title: "Software Development",
      description:
        "Client portals, admin dashboards, business workflows, and integrated communication tools.",
      status: "live"
    },
    {
      slug: "transport",
      title: "Transport",
      description: "Future service line currently under development.",
      status: "in_development"
    },
    {
      slug: "security",
      title: "Security",
      description: "Future service line currently under development.",
      status: "in_development"
    }
  ],
  about: {
    story:
      "Rasilwela Group is building practical business systems with a focus on software delivery today and future subsidiary services as the company grows.",
    mission:
      "Make digital operations easier for businesses through dependable software, clear analysis, and responsive support.",
    values: ["Reliability", "Clarity", "Growth"]
  },
  contact: {
    email: "hello@rasilwela.co.za",
    phone: "+27 10 000 0000",
    responsePromise: "We review every inquiry and respond by email or in-app chat."
  },
  admin: {
    editableSections: ["brand", "hero", "services", "subsidiaries", "about", "contact"],
    notes: "Admin updates should flow through the CMS-backed site content service without code changes."
  }
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clone<T>(value: T): T {
  if (value === undefined || value === null) {
    return value;
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function deepMerge<T>(target: T, patch: DeepPartial<T>): T {
  if (!isPlainObject(target) || !isPlainObject(patch)) {
    return patch as T;
  }

  const result: Record<string, unknown> = { ...target };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) {
      continue;
    }
    const current = result[key];
    if (Array.isArray(value) || !isPlainObject(value) || !isPlainObject(current)) {
      result[key] = clone(value);
      continue;
    }
    result[key] = deepMerge(current, value as DeepPartial<typeof current>);
  }

  return result as T;
}

function assertContentIsValid(content: SiteContent) {
  const validStatuses: ContentStatus[] = ["live", "in_development"];
  const checkStatus = (status: ContentStatus, label: string) => {
    if (!validStatuses.includes(status)) {
      throw new AppError(`Invalid ${label} status`, 400);
    }
  };

  for (const service of content.services) {
    checkStatus(service.status, `service "${service.slug}"`);
  }
  for (const subsidiary of content.subsidiaries) {
    checkStatus(subsidiary.status, `subsidiary "${subsidiary.slug}"`);
  }
}

function createDefaultRecord(): SiteContentRecord {
  const record: SiteContentRecord = {
    ...clone(DEFAULT_SITE_CONTENT),
    lastUpdatedAt: new Date().toISOString()
  };
  assertContentIsValid(record);
  return record;
}

export class SiteContentService {
  getContent() {
    return clone(this.ensureRecord());
  }

  updateContent(input: DeepPartial<SiteContent>, updatedBy?: string) {
    const current = this.ensureRecord();
    const merged = deepMerge(clone(current), input);
    const normalizedUpdatedBy = updatedBy?.trim() || current.updatedBy;
    const next: SiteContentRecord = {
      ...merged,
      lastUpdatedAt: new Date().toISOString(),
      updatedBy: normalizedUpdatedBy
    };
    assertContentIsValid(next);
    mutableStore.siteContent = next;
    return clone(next);
  }

  private ensureRecord() {
    if (!mutableStore.siteContent) {
      mutableStore.siteContent = createDefaultRecord();
    }
    return mutableStore.siteContent;
  }
}

export const siteContentService = new SiteContentService();
