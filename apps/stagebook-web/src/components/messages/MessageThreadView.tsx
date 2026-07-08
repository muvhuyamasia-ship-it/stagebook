import { FormEvent, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BOOKING_STATUS_LABEL } from "@stagebook/shared";
import { useAuth } from "../../context/AuthContext";
import { useStageBook } from "../../context/StageBookContext";
import { LuxuryCard } from "../ui/LuxuryCard";
import { Button } from "../ui/Button";
import { TextInput } from "../ui/Field";
import { BookingContextPanel } from "./BookingContextPanel";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { TransactionHub } from "./TransactionHub";

interface MessageThreadViewProps {
  bookingId: string;
  backLink?: string;
}

export function MessageThreadView({ bookingId, backLink = "/app/messages" }: MessageThreadViewProps) {
  const { session } = useAuth();
  const {
    getBooking,
    getArtist,
    getBookingChat,
    getBookingContext,
    getPendingCounterOffer,
    getCounterOffer,
    sendMessage,
    sendCounterOffer,
    acceptCounterOffer,
    declineCounterOffer,
    acceptOffer,
    declineOffer,
    markThreadRead
  } = useStageBook();

  const booking = getBooking(bookingId);
  const artist = booking ? getArtist(booking.artistProfileId) : undefined;
  const messages = getBookingChat(bookingId);
  const context = getBookingContext(bookingId);
  const pendingOffer = getPendingCounterOffer(bookingId);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [body, setBody] = useState("");
  const [counterPrice, setCounterPrice] = useState(booking?.quotedPriceZar ?? 0);
  const [counterStart, setCounterStart] = useState(booking?.startTime ?? "18:00");
  const [counterEnd, setCounterEnd] = useState(booking?.endTime ?? "20:00");
  const [counterNote, setCounterNote] = useState("");

  useEffect(() => {
    if (booking) {
      setCounterPrice(booking.quotedPriceZar);
      setCounterStart(booking.startTime);
      setCounterEnd(booking.endTime);
    }
  }, [booking]);

  useEffect(() => {
    markThreadRead(bookingId);
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [bookingId, messages.length, markThreadRead]);

  if (!booking) {
    return <p>Conversation not found.</p>;
  }

  function onSend(event: FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    sendMessage(bookingId, body.trim());
    setBody("");
  }

  return (
    <div className="message-thread-view">
      <LuxuryCard>
        <Link to={backLink}>← Back to inbox</Link>
        <div className="chat-header">
          <div>
            <h1 className="page-title">{artist?.stageName}</h1>
            <p className="text-muted">{booking.eventName} · {booking.eventDate}</p>
          </div>
          <span className="status-tag status-tag--agreement">
            🟡 {BOOKING_STATUS_LABEL[booking.status]}
          </span>
        </div>
      </LuxuryCard>

      <div className="message-thread-layout">
        <div className="message-thread-main">
          <LuxuryCard className="chat-thread-panel">
            <div className="chat-scroll">
              {messages.map((msg) => (
                <ChatMessageBubble
                  key={msg.id}
                  message={msg}
                  counterOffer={msg.counterOfferId ? getCounterOffer(msg.counterOfferId) : undefined}
                  isOwn={msg.senderUserId === session?.user.id}
                />
              ))}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={onSend} className="chat-compose">
              <TextInput value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type a secure message…" />
              <Button type="submit" variant="primary">Send</Button>
            </form>
          </LuxuryCard>

          <TransactionHub
            currentPrice={booking.quotedPriceZar}
            currentStart={booking.startTime}
            currentEnd={booking.endTime}
            pendingOffer={pendingOffer}
            counterPrice={counterPrice}
            counterStart={counterStart}
            counterEnd={counterEnd}
            counterNote={counterNote}
            onCounterPriceChange={setCounterPrice}
            onCounterStartChange={setCounterStart}
            onCounterEndChange={setCounterEnd}
            onCounterNoteChange={setCounterNote}
            onIssueCounter={(input) => sendCounterOffer(bookingId, input)}
            onAcceptCounter={acceptCounterOffer}
            onDeclineCounter={declineCounterOffer}
            onAcceptOffer={() => acceptOffer(bookingId)}
            onDeclineOffer={() => declineOffer(bookingId)}
          />
        </div>

        <BookingContextPanel items={context} />
      </div>
    </div>
  );
}