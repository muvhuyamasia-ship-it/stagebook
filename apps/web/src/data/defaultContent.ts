import type { SiteContent, SiteThread } from "../types";

export const DEFAULT_SITE_CONTENT: SiteContent = {
  hero: {
    eyebrow: "Rasilwela Group",
    title: "Software systems, business clarity, and managed email built for growing teams.",
    description:
      "We design and maintain the digital backbone for modern businesses, from custom software and company email hosting to practical business analysis that removes friction from operations.",
    primaryCtaLabel: "Explore software services",
    primaryCtaHref: "/software",
    secondaryCtaLabel: "Open client dashboard",
    secondaryCtaHref: "/client"
  },
  about: {
    story:
      "Rasilwela Group is building a focused software division first, while transport and security remain marked as in development. The immediate priority is helping organisations run cleaner digital operations with dependable systems and responsive support.",
    mission:
      "Deliver practical software, reliable email infrastructure, and business analysis that helps teams make faster decisions.",
    values: [
      "Build with clarity so teams know what is happening and why.",
      "Ship dependable systems that are easy to manage and extend.",
      "Keep communication human, fast, and accountable."
    ],
    stats: [
      { label: "Primary focus", value: "Software services" },
      { label: "Delivery model", value: "Managed + consultative" },
      { label: "Support promise", value: "Responsive by design" }
    ]
  },
  services: [
    {
      id: "software-development",
      title: "Software Development",
      description:
        "Custom web systems, internal tools, and customer-facing portals designed around how your business actually works.",
      status: "live",
      highlight: "Live now"
    },
    {
      id: "email-hosting",
      title: "Company Email Hosting",
      description:
        "Professional email on your own domain, configured for trust, delivery, and a polished brand presence.",
      status: "live",
      highlight: "Domain-based"
    },
    {
      id: "business-analysis",
      title: "Business Analysis",
      description:
        "Requirements discovery, workflow mapping, and solution planning for teams that need sharper execution.",
      status: "live",
      highlight: "Decision support"
    }
  ],
  subsidiaries: [
    {
      id: "transport",
      title: "Transport",
      description:
        "Transport services are being prepared for launch. We will publish the operational details here when the offering is ready.",
      status: "in_development",
      highlight: "Coming soon"
    },
    {
      id: "security",
      title: "Security",
      description:
        "Security services are currently in development and will join the platform later as a separate subsidiary offering.",
      status: "in_development",
      highlight: "Coming soon"
    },
    {
      id: "software",
      title: "Software",
      description:
        "The software division is the active focus, with content, support, and dashboards tuned for immediate use.",
      status: "live",
      highlight: "Priority division"
    }
  ],
  highlights: [
    "Homepage content can be edited from the admin dashboard without code changes.",
    "Client messages can move between email-style inbox and in-app chat.",
    "Route-based navigation keeps the site easy to explore on desktop and mobile."
  ],
  contact: {
    email: "hello@rasilwela.co.za",
    phone: "+27 11 555 0148",
    office: "Johannesburg, South Africa",
    responseTime: "Replies within one business day"
  }
};

export const DEFAULT_ADMIN_THREADS: SiteThread[] = [
  {
    id: "thread-101",
    subject: "Email hosting setup for a finance firm",
    status: "open",
    customerName: "Mosaic Finance",
    customerEmail: "ops@mosaicfinance.co.za",
    source: "email",
    updatedAt: "2026-04-08T09:20:00.000Z",
    unreadCount: 2,
    replies: [
      {
        id: "reply-1",
        senderRole: "client",
        senderName: "Mosaic Finance",
        body: "We need four domain addresses and mailbox migration support.",
        createdAt: "2026-04-08T08:10:00.000Z",
        channel: "email"
      },
      {
        id: "reply-2",
        senderRole: "admin",
        senderName: "Rasilwela Support",
        body: "We can map the domain and share the migration checklist today.",
        createdAt: "2026-04-08T09:20:00.000Z",
        channel: "chat"
      }
    ]
  },
  {
    id: "thread-102",
    subject: "Business analysis for internal workflow review",
    status: "responded",
    customerName: "Apex Logistics",
    customerEmail: "team@apexlogistics.co.za",
    source: "chat",
    updatedAt: "2026-04-07T16:45:00.000Z",
    unreadCount: 0,
    replies: [
      {
        id: "reply-3",
        senderRole: "client",
        senderName: "Apex Logistics",
        body: "Can you review our handoff process between sales and operations?",
        createdAt: "2026-04-07T15:30:00.000Z",
        channel: "chat"
      }
    ]
  }
];

export const DEFAULT_CLIENT_THREADS: SiteThread[] = [
  {
    id: "thread-201",
    subject: "Website hosting and company email",
    status: "open",
    customerName: "Nova Studio",
    customerEmail: "hello@novastudio.co.za",
    source: "chat",
    updatedAt: "2026-04-08T10:30:00.000Z",
    unreadCount: 1,
    replies: [
      {
        id: "reply-4",
        senderRole: "admin",
        senderName: "Rasilwela Support",
        body: "We have your branding notes and can prepare the email rollout plan.",
        createdAt: "2026-04-08T10:30:00.000Z",
        channel: "chat"
      }
    ]
  }
];
