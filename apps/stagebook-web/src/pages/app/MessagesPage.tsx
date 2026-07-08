import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { MessageThreadFilter } from "@stagebook/shared";
import { useStageBook } from "../../context/StageBookContext";
import { LuxuryCard } from "../../components/ui/LuxuryCard";
import { MessageThreadList } from "../../components/messages/MessageThreadList";
import { MessageThreadView } from "../../components/messages/MessageThreadView";

export function MessagesPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { getMessageThreads, unreadMessageCount } = useStageBook();
  const [filter, setFilter] = useState<MessageThreadFilter>("all");
  const threads = useMemo(() => getMessageThreads(filter), [getMessageThreads, filter]);

  const activeId = bookingId ?? threads[0]?.bookingId;

  return (
    <div className="messages-page">
      <LuxuryCard>
        <div className="section-head">
          <div>
            <h1 className="page-title">Messages</h1>
            <p className="page-copy">
              Secure negotiation channels with live counter-offers injected into the chat stream.
            </p>
          </div>
          {unreadMessageCount > 0 ? (
            <span className="notif-pill">{unreadMessageCount} unread</span>
          ) : null}
        </div>
      </LuxuryCard>

      <div className="messages-split">
        <LuxuryCard className="messages-inbox">
          <MessageThreadList
            threads={threads}
            activeBookingId={activeId}
            filter={filter}
            onFilterChange={setFilter}
          />
        </LuxuryCard>

        <div className="messages-thread-pane">
          {activeId ? (
            <MessageThreadView bookingId={activeId} />
          ) : (
            <LuxuryCard>
              <p className="page-copy">Select a conversation to open the negotiation thread.</p>
            </LuxuryCard>
          )}
        </div>
      </div>

      {/* Mobile fallback: navigate to dedicated thread route on small screens via list links */}
      {!bookingId && activeId ? (
        <button type="button" className="messages-mobile-open" onClick={() => navigate(`/app/messages/${activeId}`)}>
          Open active thread
        </button>
      ) : null}
    </div>
  );
}