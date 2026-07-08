import { useEffect, useMemo, useState, type FormEvent } from "react";
import { SiteShell } from "../components/SiteShell";
import { ThreadInbox } from "../components/ThreadInbox";
import { Field, TextAreaField } from "../components/Field";
import { useAuth } from "../context/AuthContext";
import { DEFAULT_CLIENT_THREADS } from "../data/defaultContent";
import { postJson, getJson } from "../lib/api";
import { normalizeThreads } from "../lib/content";
import type { SiteMessageDraft, SiteThread } from "../types";

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-ZA", { month: "short", day: "numeric" }).format(new Date(value));
}

export function ClientDashboardPage() {
  const { session, user, ready } = useAuth();
  const [threads, setThreads] = useState<SiteThread[]>(DEFAULT_CLIENT_THREADS);
  const [selectedId, setSelectedId] = useState<string | null>(DEFAULT_CLIENT_THREADS[0]?.id ?? null);
  const [draft, setDraft] = useState<SiteMessageDraft>({ subject: "", body: "" });
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadMessages() {
      try {
        const response = await getJson<unknown>("/api/site/messages/mine", session);
        if (!cancelled) {
          const next = normalizeThreads(response, DEFAULT_CLIENT_THREADS);
          setThreads(next);
          setSelectedId(next[0]?.id ?? null);
        }
      } catch {
        if (!cancelled) {
          setThreads(DEFAULT_CLIENT_THREADS);
          setSelectedId(DEFAULT_CLIENT_THREADS[0]?.id ?? null);
        }
      }
    }

    void loadMessages();
    return () => {
      cancelled = true;
    };
  }, [session?.token]);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedId) ?? threads[0] ?? null,
    [threads, selectedId]
  );

  async function handleNewMessage(event: FormEvent) {
    event.preventDefault();
    if (!draft.subject.trim() || !draft.body.trim()) {
      return;
    }

    const optimistic: SiteThread = {
      id: crypto.randomUUID(),
      subject: draft.subject.trim(),
      status: "open",
      customerName: user?.displayName ?? "You",
      customerEmail: user?.email ?? "client@rasilwela.co.za",
      source: "chat",
      updatedAt: new Date().toISOString(),
      unreadCount: 0,
      replies: [
        {
          id: crypto.randomUUID(),
          senderRole: "client",
          senderName: user?.displayName ?? "You",
          body: draft.body.trim(),
          createdAt: new Date().toISOString(),
          channel: "chat"
        }
      ]
    };

    setThreads((current) => [optimistic, ...current]);
    setSelectedId(optimistic.id);
    setDraft({ subject: "", body: "" });
    setNotice("Your message is queued in the inbox preview.");

    try {
      await postJson<unknown>("/api/site/messages", {
        subject: draft.subject,
        body: draft.body,
        preferredReplyChannel: "chat"
      }, session);
      setNotice("Message sent to the support inbox.");
    } catch {
      setNotice("Preview mode saved the message locally. Connect the backend to persist it.");
    }
  }

  async function handleReply(threadId: string, body: string) {
    const nextReply = {
      id: crypto.randomUUID(),
      senderRole: user?.role ?? "client",
      senderName: user?.displayName ?? "You",
      body,
      createdAt: new Date().toISOString(),
      channel: "chat" as const
    };

    setThreads((current) =>
      current.map((thread) =>
        thread.id === threadId
          ? {
              ...thread,
              replies: [...thread.replies, nextReply],
              updatedAt: nextReply.createdAt,
              unreadCount: 0
            }
          : thread
        )
    );

    try {
      await postJson<unknown>(`/api/site/messages/${threadId}/replies`, { body }, session);
      setNotice("Reply sent.");
    } catch {
      setNotice("The reply stayed in the preview inbox until the backend is connected.");
    }
  }

  return (
    <SiteShell>
      <section className="dashboard">
        <div className="dashboard__intro">
          <div>
            <p className="section-eyebrow">Client dashboard</p>
            <h1>Keep your support conversations in one place.</h1>
            <p>
              {ready && session ? (
                <>
                  Signed in as <strong>{user?.displayName}</strong>. Messages can flow through email or in-app chat.
                </>
              ) : (
                "Preview the inbox and chat layout while the authentication backend is being connected."
              )}
            </p>
          </div>

          <div className="dashboard__stats">
            <article className="stat-card">
              <strong>{threads.length}</strong>
              <span>Conversation threads</span>
            </article>
            <article className="stat-card">
              <strong>{selectedThread ? formatShortDate(selectedThread.updatedAt) : "--"}</strong>
              <span>Latest update</span>
            </article>
          </div>
        </div>

        {notice ? <div className="form-success">{notice}</div> : null}

        <div className="dashboard__compose">
          <div className="dashboard-card">
            <div className="form-card__heading">
              <h2>Start a new conversation</h2>
              <p>Ask about company email hosting, software work, or business analysis.</p>
            </div>
            <form className="stack-form" onSubmit={handleNewMessage}>
              <Field
                label="Subject"
                value={draft.subject}
                onChange={(event) => setDraft((current) => ({ ...current, subject: event.target.value }))}
                placeholder="Email hosting setup"
              />
              <TextAreaField
                label="Message"
                value={draft.body}
                onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))}
                placeholder="Tell us what you need..."
                rows={4}
              />
              <button type="submit" className="button button--accent">Send message</button>
            </form>
          </div>
        </div>

        <ThreadInbox
          title="Inbox"
          subtitle="Your support conversation stream"
          threads={threads}
          selectedId={selectedId}
          onSelectThread={setSelectedId}
          onReply={handleReply}
          emptyState="Start a new support thread to see replies here."
        />
      </section>
    </SiteShell>
  );
}
