import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function RequireRole({
  role,
  children
}: {
  role: "admin" | "client";
  children: ReactNode;
}) {
  const { user, ready } = useAuth();

  if (!ready) {
    return <div className="route-loading">Loading workspace...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const normalizedRole = user.role.toLowerCase();
  if (normalizedRole !== role) {
    return <Navigate to={normalizedRole === "admin" ? "/admin" : "/client"} replace />;
  }

  return <>{children}</>;
}
