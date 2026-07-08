import { useParams } from "react-router-dom";
import { MessageThreadView } from "../../components/messages/MessageThreadView";

export function ChatThreadPage() {
  const { bookingId = "" } = useParams();

  return (
    <MessageThreadView
      bookingId={bookingId}
      backLink={`/app/bookings/${bookingId}`}
    />
  );
}