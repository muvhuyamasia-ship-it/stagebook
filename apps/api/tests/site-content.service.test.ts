import { beforeEach, describe, expect, it } from "vitest";
import { siteContentService } from "../src/modules/site/site-content.service";
import { store } from "../src/lib/inMemoryStore";

type MutableStore = typeof store & {
  siteContent?: unknown;
};

const mutableStore = store as MutableStore;

describe("SiteContentService", () => {
  beforeEach(() => {
    mutableStore.siteContent = undefined;
  });

  it("returns default content that highlights software services and marks other subsidiaries as in development", () => {
    const content = siteContentService.getContent();

    expect(content.subsidiaries.find((item) => item.slug === "software-development")?.status).toBe("live");
    expect(content.subsidiaries.find((item) => item.slug === "transport")?.status).toBe("in_development");
    expect(content.subsidiaries.find((item) => item.slug === "security")?.status).toBe("in_development");
  });

  it("applies partial admin updates without losing untouched homepage sections", () => {
    const updated = siteContentService.updateContent({
      hero: {
        eyebrow: "Software Delivery Partner",
        title: "Build smarter digital operations with Rasilwela Software",
        description: "Managed email hosting and business analysis support for growing teams.",
        primaryCtaLabel: "Talk to the software team",
        secondaryCtaLabel: "See admin-managed content"
      },
      about: {
        story: "Rasilwela Group helps businesses modernize with practical digital systems.",
        mission: "Deliver reliable software services that make operations clearer and faster."
      }
    });

    expect(updated.hero.title).toMatch(/Rasilwela Software/i);
    expect(updated.about.story).toMatch(/modernize/i);
    expect(updated.subsidiaries).toHaveLength(3);
    expect(updated.contact.email).toMatch(/@/);
  });
});
