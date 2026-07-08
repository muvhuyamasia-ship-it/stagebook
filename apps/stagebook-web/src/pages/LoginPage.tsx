import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AuthShell } from "../components/layout/AuthShell";
import { Button } from "../components/ui/Button";
import { Field, TextInput } from "../components/ui/Field";
import { useAuth } from "../context/AuthContext";
import { isOnboardingComplete, loadOnboarding } from "../lib/onboarding";
import { loadSession } from "../lib/session";

export function LoginPage() {
  const { login, error, clearError, session, isVerified } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (session) {
    return <Navigate to={isVerified ? "/app/discover" : "/onboarding"} replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    clearError();
    setSubmitting(true);
    try {
      await login(email, password);
      const session = loadSession();
      const verified =
        session !== null && isOnboardingComplete(loadOnboarding(session.user.id));
      navigate(verified ? "/app/discover" : "/onboarding", { replace: true });
    } catch {
      // Error surfaced through context.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to your StageBook account"
      subtitle="Access your verified marketplace profile, active bookings, and secure payment milestones."
      footer={
        <p>
          New to StageBook? <Link to="/signup">Create an account</Link>
        </p>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <Field label="Email address">
          <TextInput
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@agency.com"
            required
          />
        </Field>

        <Field label="Password">
          <TextInput
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            required
          />
        </Field>

        {error ? <p className="auth-form__error">{error}</p> : null}

        <Button type="submit" variant="primary" className="auth-form__submit" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}