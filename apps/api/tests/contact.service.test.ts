import { beforeEach, describe, expect, it } from "vitest";
import { contactService } from "../src/modules/contact/contact.service";
import { store } from "../src/lib/inMemoryStore";

type MutableStore = typeof store & {
  contactThreads: unknown[];
  outboundEmails: unknown[];
};

const mutableStore = store as MutableStore;

describe("ContactService", () => {
  beforeEach(() => {
    mutableStore.contactThreads = [];
    mutableStore.outboundEmails = [];
  });

  it("creates a contact thread from a public inquiry", () => {
    const thread = contactService.createThread({
      name: "Lerato Nkosi",
      email: "lerato@acme.co.za",
      company: "Acme",
      subject: "Need company email hosting",
      message: "Please help us move our business email to our domain.",
      serviceInterest: "Email Hosting",
      preferredReplyChannel: "email"
    });

    expect(thread.status).toBe("open");
    expect(thread.messages).toHaveLength(1);
    expect(thread.messages[0]?.senderType).toBe("client");
  });

  it("queues an outbound email when an admin replies by email", () => {
    const thread = contactService.createThread({
      name: "Lerato Nkosi",
      email: "lerato@acme.co.za",
      subject: "Need company email hosting",
      message: "Please help us move our business email to our domain.",
      serviceInterest: "Email Hosting",
      preferredReplyChannel: "email"
    });

    const updated = contactService.replyAsAdmin(thread.id, {
      adminUserId: "admin-user-1",
      body: "We can help with setup, migration, and ongoing support.",
      channel: "email"
    });

    expect(updated.messages.at(-1)?.channel).toBe("email");
    expect(mutableStore.outboundEmails).toHaveLength(1);
    expect(mutableStore.outboundEmails[0]?.status).toBe("queued");
  });

  it("exposes in-app chat replies to the signed-in client", () => {
    const thread = contactService.createThread({
      userId: "client-user-1",
      name: "Lerato Nkosi",
      email: "lerato@acme.co.za",
      subject: "Need company email hosting",
      message: "Please help us move our business email to our domain.",
      serviceInterest: "Email Hosting",
      preferredReplyChannel: "chat"
    });

    contactService.replyAsAdmin(thread.id, {
      adminUserId: "admin-user-1",
      body: "I have opened an onboarding checklist for your business email migration.",
      channel: "chat"
    });

    const inbox = contactService.listThreadsForUser("client-user-1");
    expect(inbox).toHaveLength(1);
    expect(inbox[0]?.messages.at(-1)?.senderType).toBe("admin");
    expect(inbox[0]?.messages.at(-1)?.channel).toBe("chat");
  });
});
