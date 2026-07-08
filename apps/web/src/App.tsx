import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { RequireRole } from "./components/RequireRole";
import { AuthProvider } from "./context/AuthContext";
import { SiteContentProvider } from "./context/SiteContentContext";
import { AboutPage } from "./pages/AboutPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { ClientDashboardPage } from "./pages/ClientDashboardPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { SignUpPage } from "./pages/SignUpPage";
import { SoftwarePage } from "./pages/SoftwarePage";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SiteContentProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/software" element={<SoftwarePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
              path="/client"
              element={
                <RequireRole role="client">
                  <ClientDashboardPage />
                </RequireRole>
              }
            />
            <Route
              path="/admin"
              element={
                <RequireRole role="admin">
                  <AdminDashboardPage />
                </RequireRole>
              }
            />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </SiteContentProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
