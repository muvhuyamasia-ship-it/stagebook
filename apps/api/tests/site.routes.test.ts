import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app";
import { store } from "../src/lib/inMemoryStore";

describe("Site routes", () => {
  beforeEach(() => {
    store.siteContent = undefined;
    store.contactThreads = [];
    store.outboundEmails = [];
    store.passwordResetTokens = [];
  });

  it("lets admins update site content while keeping it public to read", async () => {
    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "admin@rasilwela.test",
      password: "Password123!"
    });

    expect(loginResponse.status).toBe(200);

    const updateResponse = await request(app)
      .put("/api/site/content")
      .set("Authorization", `Bearer ${loginResponse.body.token}`)
      .send({
        hero: {
          eyebrow: "Admin Updated",
          title: "Rasilwela Software for ambitious businesses",
          description: "Managed email hosting and business analysis that scale with you.",
          primaryCtaLabel: "Start a conversation",
          secondaryCtaLabel: "Explore the client portal"
        }
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.hero.title).toMatch(/ambitious businesses/i);

    const publicResponse = await request(app).get("/api/site/content");
    expect(publicResponse.status).toBe(200);
    expect(publicResponse.body.hero.title).toMatch(/ambitious businesses/i);
  });

  it("accepts public contact messages and lets admins reply by email", async () => {
    const createResponse = await request(app).post("/api/site/messages").send({
      name: "Lerato Nkosi",
      email: "lerato@acme.co.za",
      company: "Acme",
      subject: "Need company email hosting",
      message: "Please help us move our team to domain email accounts.",
      serviceInterest: "Email Hosting",
      preferredReplyChannel: "email"
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.messages).toHaveLength(1);

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "admin@rasilwela.test",
      password: "Password123!"
    });

    const replyResponse = await request(app)
      .post(`/api/site/messages/${createResponse.body.id}/replies`)
      .set("Authorization", `Bearer ${loginResponse.body.token}`)
      .send({
        body: "We can help with mailbox setup, migration, and team onboarding.",
        channel: "email"
      });

    expect(replyResponse.status).toBe(201);
    expect(store.outboundEmails).toHaveLength(1);
    expect(store.outboundEmails[0]?.to).toBe("lerato@acme.co.za");
  });
});
