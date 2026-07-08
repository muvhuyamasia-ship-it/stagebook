import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { StageBookProvider } from "./context/StageBookContext";
import { AppShell } from "./components/layout/AppShell";
import { RequireAuth } from "./components/routing/RequireAuth";
import { RequireVerification } from "./components/routing/RequireVerification";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { SignUpPage } from "./pages/SignUpPage";
import { ArtistProfilePage } from "./pages/app/ArtistProfilePage";
import { BookingDetailPage } from "./pages/app/BookingDetailPage";
import { BookingWizardPage } from "./pages/app/BookingWizardPage";
import { BookingsPage } from "./pages/app/BookingsPage";
import { ChatThreadPage } from "./pages/app/ChatThreadPage";
import { ContractPage } from "./pages/app/ContractPage";
import { DiscoverPage } from "./pages/app/DiscoverPage";
import { EarningsPage } from "./pages/app/EarningsPage";
import { MessagesPage } from "./pages/app/MessagesPage";
import { NotificationsPage } from "./pages/app/NotificationsPage";
import { PaymentPage } from "./pages/app/PaymentPage";
import { ProfilePage } from "./pages/app/ProfilePage";
import { SearchPage } from "./pages/app/SearchPage";

function VerifiedApp() {
  return (
    <StageBookProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="discover" replace />} />
          <Route path="discover" element={<DiscoverPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="bookings/new" element={<BookingWizardPage />} />
          <Route path="bookings/:bookingId" element={<BookingDetailPage />} />
          <Route path="bookings/:bookingId/chat" element={<ChatThreadPage />} />
          <Route path="bookings/:bookingId/contract" element={<ContractPage />} />
          <Route path="bookings/:bookingId/payment" element={<PaymentPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="messages/:bookingId" element={<MessagesPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="earnings" element={<EarningsPage />} />
          <Route path="artists/:artistId" element={<ArtistProfilePage />} />
        </Route>
      </Routes>
    </StageBookProvider>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route
            path="/onboarding"
            element={
              <RequireAuth>
                <OnboardingPage />
              </RequireAuth>
            }
          />
          <Route
            path="/app/*"
            element={
              <RequireAuth>
                <RequireVerification>
                  <VerifiedApp />
                </RequireVerification>
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}