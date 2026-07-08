import { useMemo, useState, type FormEvent } from "react";
import type { SiteThread } from "../types";

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function ThreadInbox({
  title,
  subtitle,
  threads,
  selectedId,
  onSelectThread,
  onReply,
  emptyState
}: {
  title: string;
  subtitle: string;
  threads: SiteThread[];
  selectedId: string | null;
  onSelectThread: (threadId: string) => void;
  onReply: (threadId: string, body: string) => Promise<void> | void;
  emptyState: string;
}) {
  const [replyBody, setReplyBody] = useState("");
  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedId) ?? threads[0] ?? null,
    [threads, selectedId]
  );

  async function handleReply(event: FormEvent) {
    event.preventDefault();
    if (!selectedThread || !replyBody.trim()) {
      return;
    }

    await onReply(selectedThread.id, replyBody.trim());
    setReplyBody("");
  }

  return (
    <section className="inbox">
      <div className="section-heading">
        <div>
          <p className="section-eyebrow">{title}</p>
          <h2>{subtitle}</h2>
        </div>
        <span className="status-pill status-pill--soft">{threads.length} thread{threads.length === 1 ? "" : "s"}</span>
      </div>

      <div className="inbox__grid">
        <aside className="thread-list">
          {threads.length === 0 ? (
            <div className="empty-state">
              <h3>No messages yet</h3>
              <p>{emptyState}</p>
            </div>
          ) : (
            threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                className={`thread-item ${thread.id === selectedThread?.id ? "is-active" : ""}`}
                onClick={() => onSelectThread(thread.id)}
              >
                <div className="thread-item__top">
                  <strong>{thread.subject}</strong>
                  <span className={`status-pill status-pill--${thread.status}`}>{thread.status.replace("_", " ")}</span>
                </div>
                <p>{thread.customerName}</p>
                <small>{thread.customerEmail}</small>
                <div className="thread-item__meta">
                  <span>{thread.source}</span>
                  <span>{formatTimestamp(thread.updatedAt)}</span>
                </div>
              </button>
            ))
          )}
        </aside>

        <article className="conversation">
          {selectedThread ? (
            <>
              <div className="conversation__header">
                <div>
                  <p className="section-eyebrow">Selected thread</p>
                  <h3>{selectedThread.subject}</h3>
                </div>
                <div className="conversation__meta">
                  <span className="status-pill">{selectedThread.customerName}</span>
                  <span className="status-pill status-pill--muted">{selectedThread.source}</span>
                </div>
              </div>

              <div className="message-stream">
                {selectedThread.replies.map((reply) => (
                  <div
                    key={reply.id}
                    className={`message-bubble ${reply.senderRole === "admin" ? "message-bubble--admin" : ""}`}
                  >
                    <div className="message-bubble__meta">
                      <strong>{reply.senderName}</strong>
                      <span>{formatTimestamp(reply.createdAt)}</span>
                    </div>
                    <p>{reply.body}</p>
                  </div>
                ))}
              </div>

              <form className="reply-box" onSubmit={handleReply}>
                <label className="field">
                  <span className="field__label">Reply</span>
                  <textarea
                    className="field__control field__control--textarea"
                    value={replyBody}
                    onChange={(event) => setReplyBody(event.target.value)}
                    placeholder="Write a response that will go to email or in-app chat..."
                    rows={4}
                  />
                </label>
                <button type="submit" className="button button--accent">
                  Send reply
                </button>
              </form>
            </>
          ) : (
            <div className="empty-state">
              <h3>{emptyState}</h3>
              <p>Select a message thread to view the conversation.</p>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
