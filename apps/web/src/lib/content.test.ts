import { describe, expect, it } from "vitest";
import { DEFAULT_SITE_CONTENT } from "../data/defaultContent";
import { mergeSiteContent, normalizeSiteContent, normalizeThreads } from "./content";

describe("content utilities", () => {
  it("preserves untouched site sections when an admin updates only part of the homepage", () => {
    const updated = mergeSiteContent(DEFAULT_SITE_CONTENT, {
      hero: {
        title: "Build cleaner digital operations with Rasilwela Software"
      }
    });

    expect(updated.hero.title).toContain("Rasilwela Software");
    expect(updated.about.story).toBe(DEFAULT_SITE_CONTENT.about.story);
    expect(updated.subsidiaries).toHaveLength(3);
  });

  it("normalizes partial API content into the expected shape", () => {
    const content = normalizeSiteContent({
      hero: {
        title: "Custom systems for growing teams"
      },
      contact: {
        email: "team@rasilwela.co.za"
      }
    });

    expect(content.hero.title).toBe("Custom systems for growing teams");
    expect(content.contact.email).toBe("team@rasilwela.co.za");
    expect(content.services.length).toBeGreaterThan(0);
  });

  it("accepts wrapped inbox payloads and preserves message details", () => {
    const threads = normalizeThreads(
      {
        threads: [
          {
            id: "thread-x",
            subject: "Need help with company email",
            customerName: "Bright Commerce",
            customerEmail: "ops@brightcommerce.co.za",
            replies: [{ body: "Can you help us migrate mailboxes?" }]
          }
        ]
      },
      []
    );

    expect(threads).toHaveLength(1);
    expect(threads[0].subject).toBe("Need help with company email");
    expect(threads[0].replies[0].body).toBe("Can you help us migrate mailboxes?");
  });
});
