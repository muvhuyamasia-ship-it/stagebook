export type AppUserRole = "artist" | "representative" | "client" | "admin";

export type AppTabId =
  | "discover"
  | "search"
  | "bookings"
  | "messages"
  | "profile"
  | "earnings";

export interface AppTabDefinition {
  id: AppTabId;
  label: string;
  icon: string;
  path: string;
  roles: AppUserRole[] | "all";
}

export const STAGEBOOK_APP_TABS: AppTabDefinition[] = [
  { id: "discover", label: "Discover", icon: "🏠", path: "/app/discover", roles: "all" },
  { id: "search", label: "Search", icon: "🔍", path: "/app/search", roles: "all" },
  { id: "bookings", label: "Bookings", icon: "📅", path: "/app/bookings", roles: "all" },
  { id: "messages", label: "Messages", icon: "💬", path: "/app/messages", roles: "all" },
  { id: "profile", label: "Profile", icon: "👤", path: "/app/profile", roles: "all" },
  {
    id: "earnings",
    label: "Earnings",
    icon: "💰",
    path: "/app/earnings",
    roles: ["artist", "representative"]
  }
];

export function tabsForRole(role: AppUserRole): AppTabDefinition[] {
  return STAGEBOOK_APP_TABS.filter(
    (tab) => tab.roles === "all" || tab.roles.includes(role)
  );
}