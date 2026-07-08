import { useEffect, useState } from "react";
import { SiteShell } from "../components/SiteShell";
import { ThreadInbox } from "../components/ThreadInbox";
import { Field, SelectField, TextAreaField } from "../components/Field";
import { useAuth } from "../context/AuthContext";
import { useSiteContent } from "../context/SiteContentContext";
import { DEFAULT_ADMIN_THREADS } from "../data/defaultContent";
import { getJson, postJson } from "../lib/api";
import { normalizeThreads } from "../lib/content";
import type { SiteContent, SiteThread } from "../types";

function makeDraft(content: SiteContent): SiteContent {
  return {
    hero: { ...content.hero },
    about: {
      ...content.about,
      values: [...content.about.values],
      stats: content.about.stats.map((item) => ({ ...item }))
    },
    services: content.services.map((item) => ({ ...item })),
    subsidiaries: content.subsidiaries.map((item) => ({ ...item })),
    highlights: [...content.highlights],
    contact: { ...content.contact }
  };
}

export function AdminDashboardPage() {
  const { session, user, ready } = useAuth();
  const { content, save, source, saving } = useSiteContent();
  const [draft, setDraft] = useState<SiteContent>(() => makeDraft(content));
  const [threads, setThreads] = useState<SiteThread[]>(DEFAULT_ADMIN_THREADS);
  const [selectedId, setSelectedId] = useState<string | null>(DEFAULT_ADMIN_THREADS[0]?.id ?? null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setDraft(makeDraft(content));
  }, [content]);

  useEffect(() => {
    let cancelled = false;
    async function loadThreads() {
      try {
        const response = await getJson<unknown>("/api/site/messages", session);
        if (!cancelled) {
          const next = normalizeThreads(response, DEFAULT_ADMIN_THREADS);
          setThreads(next);
          setSelectedId(next[0]?.id ?? null);
        }
      } catch {
        if (!cancelled) {
          setThreads(DEFAULT_ADMIN_THREADS);
          setSelectedId(DEFAULT_ADMIN_THREADS[0]?.id ?? null);
        }
      }
    }

    void loadThreads();
    return () => {
      cancelled = true;
    };
  }, [session?.token]);

  function updateService(
    collection: "services" | "subsidiaries",
    index: number,
    key: keyof SiteContent["services"][number],
    value: string
  ) {
    setDraft((current) => {
      const next = current[collection].map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      ) as SiteContent["services"];
      return { ...current, [collection]: next } as SiteContent;
    });
  }

  function addService(collection: "services" | "subsidiaries") {
    setDraft((current) => ({
      ...current,
      [collection]: [
        ...current[collection],
        {
          id: crypto.randomUUID(),
          title: "New item",
          description: "Describe the offering here.",
          status: collection === "services" ? "live" : "in_development",
          highlight: collection === "services" ? "Live now" : "Coming soon"
        }
      ]
    }));
  }

  function removeService(collection: "services" | "subsidiaries", index: number) {
    setDraft((current) => ({
      ...current,
      [collection]: current[collection].filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  async function handleSave() {
    try {
      const next = await save(draft);
      setDraft(makeDraft(next));
      setNotice("Homepage content saved.");
    } catch {
      setNotice("Preview mode kept the changes locally until the CMS API is connected.");
    }
  }

  async function handleReply(threadId: string, body: string) {
    setThreads((current) =>
      current.map((thread) =>
        thread.id === threadId
          ? {
              ...thread,
              replies: [
                ...thread.replies,
                {
                  id: crypto.randomUUID(),
                  senderRole: user?.role ?? "admin",
                  senderName: user?.displayName ?? "Rasilwela Support",
                  body,
                  createdAt: new Date().toISOString(),
                  channel: thread.source
                }
              ],
              updatedAt: new Date().toISOString(),
              unreadCount: 0
            }
          : thread
      )
    );

    try {
      const thread = threads.find((item) => item.id === threadId);
      await postJson<unknown>(`/api/site/messages/${threadId}/replies`, {
        body,
        channel: thread?.source ?? "email"
      }, session);
      setNotice("Reply sent to the conversation thread.");
    } catch {
      setNotice("Reply updated in preview mode. Connect the backend to send it.");
    }
  }

  return (
    <SiteShell>
      <section className="dashboard">
        <div className="dashboard__intro">
          <div>
            <p className="section-eyebrow">Admin dashboard</p>
            <h1>Edit homepage content and manage messages from one workspace.</h1>
            <p>
              {ready && user ? (
                <>
                  Signed in as <strong>{user.displayName}</strong>. {source === "api" ? "Your CMS content is synced." : "You are viewing a local preview until the API responds."}
                </>
              ) : (
                "This screen is designed for content managers to update the site without changing code."
              )}
            </p>
          </div>

          <div className="dashboard__stats">
            <article className="stat-card">
              <strong>{draft.services.length}</strong>
              <span>Live services</span>
            </article>
            <article className="stat-card">
              <strong>{threads.filter((thread) => thread.status !== "closed").length}</strong>
              <span>Open threads</span>
            </article>
          </div>
        </div>

        {notice ? <div className="form-success">{notice}</div> : null}

        <div className="admin-grid">
          <section className="dashboard-card dashboard-card--wide">
            <div className="section-heading">
              <div>
                <p className="section-eyebrow">Content editor</p>
                <h2>Homepage content</h2>
              </div>
              <button type="button" className="button button--accent" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save content"}
              </button>
            </div>

            <div className="editor-grid">
              <Field
                label="Hero eyebrow"
                value={draft.hero.eyebrow}
                onChange={(event) => setDraft((current) => ({ ...current, hero: { ...current.hero, eyebrow: event.target.value } }))}
              />
              <Field
                label="Hero title"
                value={draft.hero.title}
                onChange={(event) => setDraft((current) => ({ ...current, hero: { ...current.hero, title: event.target.value } }))}
              />
              <TextAreaField
                label="Hero description"
                value={draft.hero.description}
                onChange={(event) => setDraft((current) => ({ ...current, hero: { ...current.hero, description: event.target.value } }))}
                rows={4}
              />
              <Field
                label="Primary CTA label"
                value={draft.hero.primaryCtaLabel}
                onChange={(event) => setDraft((current) => ({ ...current, hero: { ...current.hero, primaryCtaLabel: event.target.value } }))}
              />
              <Field
                label="Primary CTA link"
                value={draft.hero.primaryCtaHref}
                onChange={(event) => setDraft((current) => ({ ...current, hero: { ...current.hero, primaryCtaHref: event.target.value } }))}
              />
              <Field
                label="Secondary CTA label"
                value={draft.hero.secondaryCtaLabel}
                onChange={(event) => setDraft((current) => ({ ...current, hero: { ...current.hero, secondaryCtaLabel: event.target.value } }))}
              />
              <Field
                label="Secondary CTA link"
                value={draft.hero.secondaryCtaHref}
                onChange={(event) => setDraft((current) => ({ ...current, hero: { ...current.hero, secondaryCtaHref: event.target.value } }))}
              />
              <TextAreaField
                label="Highlights"
                hint="One line per homepage highlight."
                value={draft.highlights.join("\n")}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    highlights: event.target.value
                      .split("\n")
                      .map((item) => item.trim())
                      .filter(Boolean)
                  }))
                }
                rows={4}
              />
              <TextAreaField
                label="About story"
                value={draft.about.story}
                onChange={(event) => setDraft((current) => ({ ...current, about: { ...current.about, story: event.target.value } }))}
                rows={4}
              />
              <TextAreaField
                label="About mission"
                value={draft.about.mission}
                onChange={(event) => setDraft((current) => ({ ...current, about: { ...current.about, mission: event.target.value } }))}
                rows={3}
              />
              <TextAreaField
                label="Values"
                hint="One line per value."
                value={draft.about.values.join("\n")}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    about: {
                      ...current.about,
                      values: event.target.value
                        .split("\n")
                        .map((item) => item.trim())
                        .filter(Boolean)
                    }
                  }))
                }
                rows={4}
              />
            </div>

            <div className="list-editor">
              <div className="list-editor__header">
                <h3>Services</h3>
                <button type="button" className="button button--ghost" onClick={() => addService("services")}>
                  Add service
                </button>
              </div>
              {draft.services.map((service, index) => (
                <article className="list-editor__item" key={service.id}>
                  <div className="editor-grid editor-grid--compact">
                    <Field
                      label="Title"
                      value={service.title}
                      onChange={(event) => updateService("services", index, "title", event.target.value)}
                    />
                    <SelectField
                      label="Status"
                      value={service.status}
                      onChange={(event) => updateService("services", index, "status", event.target.value)}
                    >
                      <option value="live">live</option>
                      <option value="in_development">in development</option>
                    </SelectField>
                    <Field
                      label="Highlight"
                      value={service.highlight}
                      onChange={(event) => updateService("services", index, "highlight", event.target.value)}
                    />
                    <TextAreaField
                      label="Description"
                      value={service.description}
                      onChange={(event) => updateService("services", index, "description", event.target.value)}
                      rows={3}
                    />
                  </div>
                  <button type="button" className="button button--ghost button--danger" onClick={() => removeService("services", index)}>
                    Remove
                  </button>
                </article>
              ))}
            </div>

            <div className="list-editor">
              <div className="list-editor__header">
                <h3>Subsidiaries</h3>
                <button type="button" className="button button--ghost" onClick={() => addService("subsidiaries")}>
                  Add subsidiary
                </button>
              </div>
              {draft.subsidiaries.map((service, index) => (
                <article className="list-editor__item" key={service.id}>
                  <div className="editor-grid editor-grid--compact">
                    <Field
                      label="Title"
                      value={service.title}
                      onChange={(event) => updateService("subsidiaries", index, "title", event.target.value)}
                    />
                    <SelectField
                      label="Status"
                      value={service.status}
                      onChange={(event) => updateService("subsidiaries", index, "status", event.target.value)}
                    >
                      <option value="live">live</option>
                      <option value="in_development">in development</option>
                    </SelectField>
                    <Field
                      label="Highlight"
                      value={service.highlight}
                      onChange={(event) => updateService("subsidiaries", index, "highlight", event.target.value)}
                    />
                    <TextAreaField
                      label="Description"
                      value={service.description}
                      onChange={(event) => updateService("subsidiaries", index, "description", event.target.value)}
                      rows={3}
                    />
                  </div>
                  <button type="button" className="button button--ghost button--danger" onClick={() => removeService("subsidiaries", index)}>
                    Remove
                  </button>
                </article>
              ))}
            </div>

            <div className="editor-grid">
              <Field
                label="Contact email"
                value={draft.contact.email}
                onChange={(event) => setDraft((current) => ({ ...current, contact: { ...current.contact, email: event.target.value } }))}
              />
              <Field
                label="Phone"
                value={draft.contact.phone}
                onChange={(event) => setDraft((current) => ({ ...current, contact: { ...current.contact, phone: event.target.value } }))}
              />
              <Field
                label="Office"
                value={draft.contact.office}
                onChange={(event) => setDraft((current) => ({ ...current, contact: { ...current.contact, office: event.target.value } }))}
              />
              <Field
                label="Response time"
                value={draft.contact.responseTime}
                onChange={(event) => setDraft((current) => ({ ...current, contact: { ...current.contact, responseTime: event.target.value } }))}
              />
            </div>
          </section>

          <aside className="dashboard-card">
            <div className="preview-card">
              <p className="section-eyebrow">Live preview</p>
              <h3>{draft.hero.title}</h3>
              <p>{draft.hero.description}</p>
              <div className="preview-card__list">
                {draft.services.map((service) => (
                  <div className="preview-card__row" key={service.id}>
                    <strong>{service.title}</strong>
                    <span className={`status-pill status-pill--${service.status}`}>{service.highlight}</span>
                  </div>
                ))}
              </div>
            </div>

            <ThreadInbox
              title="Message management"
              subtitle="Admin inbox and chat"
              threads={threads}
              selectedId={selectedId}
              onSelectThread={setSelectedId}
              onReply={handleReply}
              emptyState="Connect the site messages API to populate the admin inbox."
            />
          </aside>
        </div>
      </section>
    </SiteShell>
  );
}
