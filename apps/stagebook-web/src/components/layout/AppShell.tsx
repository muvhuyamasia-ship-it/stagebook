import { NavLink, Outlet, useLocation } from "react-router-dom";
import { tabsForRole } from "@stagebook/shared";
import { useAuth } from "../../context/AuthContext";
import { useStageBook } from "../../context/StageBookContext";
import { Button } from "../ui/Button";

export function AppShell() {
  const { session, logout } = useAuth();
  const { unreadCount, unreadMessageCount } = useStageBook();
  const location = useLocation();
  const tabs = tabsForRole(session?.user.role ?? "client");
  const isSubRoute = location.pathname.split("/").length > 3;

  return (
    <div className="app-layout">
      <header className="app-topbar">
        <div className="app-topbar__brand">
          <span className="app-topbar__mark" aria-hidden="true" />
          <div>
            <p className="app-topbar__name">StageBook</p>
            <p className="app-topbar__role">{session?.user.displayName}</p>
          </div>
        </div>
        <div className="app-topbar__actions">
          {unreadMessageCount > 0 ? <span className="notif-pill">{unreadMessageCount} unread msgs</span> : null}
          {unreadCount > 0 ? (
            <Button as="link" to="/app/notifications" variant="ghost">
              {unreadCount} alerts
            </Button>
          ) : null}
          <Button variant="ghost" onClick={logout}>
            Sign out
          </Button>
        </div>
      </header>

      {!isSubRoute ? (
        <nav className="app-tabbar" aria-label="Main navigation">
          {tabs.map((tab) => (
            <NavLink
              key={tab.id}
              to={tab.path}
              className={({ isActive }) =>
                `app-tabbar__item${isActive ? " app-tabbar__item--active" : ""}`
              }
            >
              <span className="app-tabbar__icon" aria-hidden="true">
                {tab.icon}
              </span>
              <span>
                {tab.label}
                {tab.id === "messages" && unreadMessageCount > 0 ? (
                  <span className="tab-badge">{unreadMessageCount}</span>
                ) : null}
              </span>
            </NavLink>
          ))}
        </nav>
      ) : null}

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}