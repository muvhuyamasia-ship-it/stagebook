import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthShell } from "../components/AuthShell";
import { Field } from "../components/Field";
import { useAuth } from "../context/AuthContext";

export function SignUpPage() {
  const { signup, loading, error } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLocalError(null);
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    try {
      await signup({ displayName, email, password });
      navigate("/client");
    } catch (cause) {
      setLocalError(cause instanceof Error ? cause.message : "Unable to create the account.");
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Sign up for a client account to access conversations, support, and service updates."
      sideTitle="What you get"
      sideCopy={[
        "A client dashboard for inbox and chat conversations.",
        "Access to company updates and support replies.",
        "A clean route flow between pages on desktop and mobile."
      ]}
    >
      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-card__heading">
          <h2>Sign up</h2>
          <p>Client accounts are created here. Admin access is handled separately.</p>
        </div>

        <Field label="Display name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Nova Studio" />
        <Field label="Email address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="hello@company.co.za" />
        <Field label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Create a password" />
        <Field label="Confirm password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat your password" />

        {(localError ?? error) ? <div className="form-alert">{localError ?? error}</div> : null}

        <button type="submit" className="button button--accent button--full" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>

        <div className="auth-links">
          <Link to="/login">Already have an account?</Link>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
      </form>
    </AuthShell>
  );
}
