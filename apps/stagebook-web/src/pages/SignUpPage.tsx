import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { RoleSelector } from "../components/auth/RoleSelector";
import { AuthShell } from "../components/layout/AuthShell";
import { Button } from "../components/ui/Button";
import { Field, TextInput } from "../components/ui/Field";
import { useAuth } from "../context/AuthContext";
import type { SignupRole } from "../types/auth";

function parseRole(value: string | null): SignupRole {
  if (value === "artist" || value === "representative" || value === "client") {
    return value;
  }
  return "client";
}

export function SignUpPage() {
  const [params] = useSearchParams();
  const initialRole = parseRole(params.get("role"));
  const { signup, error, clearError, session, isVerified } = useAuth();
  const navigate = useNavigate();

  if (session) {
    return <Navigate to={isVerified ? "/app/discover" : "/onboarding"} replace />;
  }

  const [role, setRole] = useState<SignupRole>(initialRole);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    clearError();
    setLocalError(null);

    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await signup({ email, password, displayName, role });
      navigate("/onboarding", { replace: true });
    } catch {
      // surfaced via context
    } finally {
      setSubmitting(false);
    }
  }

  const headline =
    role === "artist"
      ? "Join as Artist"
      : role === "representative"
        ? "Represent elite talent"
        : "Book verified talent";

  return (
    <AuthShell
      eyebrow="Create account"
      title={headline}
      subtitle="Choose your role, create your profile, and complete secure verification before entering the marketplace."
      footer={
        <p>
          Already verified? <Link to="/login">Sign in</Link>
        </p>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <RoleSelector value={role} onChange={setRole} />

        <Field label="Full name">
          <TextInput
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Your name"
            required
          />
        </Field>

        <Field label="Email address">
          <TextInput
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@studio.com"
            required
          />
        </Field>

        <Field label="Password" hint="Minimum 8 characters.">
          <TextInput
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </Field>

        <Field label="Confirm password">
          <TextInput
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </Field>

        {localError ? <p className="auth-form__error">{localError}</p> : null}
        {error ? <p className="auth-form__error">{error}</p> : null}

        <Button type="submit" variant="primary" className="auth-form__submit" disabled={submitting}>
          {submitting ? "Creating account…" : "Continue to verification"}
        </Button>
      </form>
    </AuthShell>
  );
}