import type { ChatMessage, CounterOffer } from "@stagebook/shared";
import { formatZar } from "@stagebook/shared";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  counterOffer?: CounterOffer;
  isOwn: boolean;
}

export function ChatMessageBubble({ message, counterOffer, isOwn }: ChatMessageBubbleProps) {
  const isSystem =
    message.messageType === "counter_offer" ||
    message.messageType === "notification_tile" ||
    message.messageType === "system" ||
    Boolean(message.systemAction);

  if (message.messageType === "counter_offer" || message.systemAction === "counter_offer") {
    return (
      <div className="chat-tile chat-tile--counter">
        <p className="chat-tile__eyebrow">Counter-offer issued</p>
        <p className="chat-tile__title">
          {counterOffer ? formatZar(counterOffer.proposedPriceZar) : message.body}
        </p>
        {counterOffer ? (
          <p className="chat-tile__meta">
            {counterOffer.proposedStartTime}–{counterOffer.proposedEndTime}
            {counterOffer.note ? ` · ${counterOffer.note}` : ""}
          </p>
        ) : null}
        <span className="chat-tile__time">{new Date(message.createdAt).toLocaleString()}</span>
      </div>
    );
  }

  if (message.systemAction === "accept") {
    return (
      <div className="chat-tile chat-tile--success">
        <p className="chat-tile__eyebrow">Offer accepted</p>
        <p>{message.body}</p>
      </div>
    );
  }

  if (message.systemAction === "decline") {
    return (
      <div className="chat-tile chat-tile--danger">
        <p className="chat-tile__eyebrow">Offer declined</p>
        <p>{message.body}</p>
      </div>
    );
  }

  if (message.systemAction === "contract") {
    return (
      <div className="chat-tile chat-tile--notify">
        <p className="chat-tile__eyebrow">Contract update</p>
        <p>{message.body}</p>
      </div>
    );
  }

  if (message.systemAction === "payment") {
    return (
      <div className="chat-tile chat-tile--success">
        <p className="chat-tile__eyebrow">Payment milestone</p>
        <p>{message.body}</p>
      </div>
    );
  }

  if (message.messageType === "notification_tile" || message.systemAction === "notification") {
    return (
      <div className="chat-tile chat-tile--notify">
        <p className="chat-tile__eyebrow">System update</p>
        <p>{message.body}</p>
      </div>
    );
  }

  return (
    <div className={`chat-bubble-row${isOwn ? " chat-bubble-row--own" : ""}`}>
      <div className={`chat-bubble${isSystem ? " chat-bubble--system" : ""}`}>
        <p>{message.body}</p>
        <span className="text-muted">{new Date(message.createdAt).toLocaleString()}</span>
      </div>
    </div>
  );
}