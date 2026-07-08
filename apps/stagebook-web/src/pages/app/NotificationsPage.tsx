import { Link } from "react-router-dom";
import { useStageBook } from "../../context/StageBookContext";
import { LuxuryCard } from "../../components/ui/LuxuryCard";
import { Button } from "../../components/ui/Button";

export function NotificationsPage() {
  const { notifications, markNotificationRead } = useStageBook();

  return (
    <div className="page-stack">
      <LuxuryCard>
        <h1 className="page-title">Notifications</h1>
        <p className="page-copy">
          Structured alerts for booking requests, chat, counter-offers, payments, contracts, and payouts.
        </p>
      </LuxuryCard>

      {notifications.map((notification) => (
        <LuxuryCard key={notification.id} className={notification.read ? "" : "notif-unread"}>
          <div className="booking-row">
            <div>
              <p className="label-sm">{notification.type.replace(/_/g, " ")}</p>
              <h3>{notification.title}</h3>
              <p className="page-copy">{notification.body}</p>
              <p className="text-muted">{new Date(notification.createdAt).toLocaleString()}</p>
            </div>
            <div className="booking-row__actions">
              {!notification.read ? (
                <Button variant="ghost" onClick={() => markNotificationRead(notification.id)}>
                  Mark read
                </Button>
              ) : null}
              {notification.bookingId ? (
                <Link to={`/app/messages/${notification.bookingId}`}>Open thread →</Link>
              ) : null}
            </div>
          </div>
        </LuxuryCard>
      ))}
    </div>
  );
}