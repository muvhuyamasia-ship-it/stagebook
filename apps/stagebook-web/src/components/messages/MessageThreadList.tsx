import { Link } from "react-router-dom";
import type { MessageThreadFilter, MessageThreadSummary } from "@stagebook/shared";

interface MessageThreadListProps {
  threads: MessageThreadSummary[];
  activeBookingId?: string;
  filter: MessageThreadFilter;
  onFilterChange: (filter: MessageThreadFilter) => void;
  linkBase?: string;
}

const filters: MessageThreadFilter[] = ["all", "negotiating", "unread"];

export function MessageThreadList({
  threads,
  activeBookingId,
  filter,
  onFilterChange,
  linkBase = "/app/messages"
}: MessageThreadListProps) {
  return (
    <div className="thread-list">
      <div className="thread-list__filters">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            className={`filter-chip${filter === f ? " filter-chip--active" : ""}`}
            onClick={() => onFilterChange(f)}
          >
            {f === "all" ? "All" : f === "negotiating" ? "Negotiating" : "Unread"}
          </button>
        ))}
      </div>

      {threads.length === 0 ? (
        <p className="thread-list__empty">No conversations match this filter.</p>
      ) : null}

      {threads.map((thread) => {
        const active = thread.bookingId === activeBookingId;
        return (
          <Link
            key={thread.bookingId}
            to={`${linkBase}/${thread.bookingId}`}
            className={`thread-item${active ? " thread-item--active" : ""}`}
          >
            <div className="thread-item__top">
              <h3>{thread.artistName}</h3>
              {thread.unreadCount > 0 ? <span className="thread-item__badge">{thread.unreadCount}</span> : null}
            </div>
            <p className="thread-item__event">{thread.eventName}</p>
            <p className="thread-item__preview">
              {thread.lastMessage?.body ?? "Start the conversation…"}
            </p>
            <div className="thread-item__meta">
              <span className={`status-tag status-tag--${thread.status}`}>
                {thread.isNegotiating ? "🟡 " : ""}
                {thread.statusLabel}
              </span>
              {thread.hasPendingCounter ? <span className="thread-item__counter">Counter pending</span> : null}
            </div>
          </Link>
        );
      })}
    </div>
  );
}