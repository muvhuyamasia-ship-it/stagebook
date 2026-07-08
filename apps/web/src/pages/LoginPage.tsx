import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthShell } from "../components/AuthShell";
import { Field } from "../components/Field";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLocalError(null);
    try {
      const response = await login({ email, password });
      navigate(response.user.role.toLowerCase() === "admin" ? "/admin" : "/client");
    } catch (cause) {
      setLocalError(cause instanceof Error ? cause.message : "Unable to sign in.");
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to access client conversations or manage the group content from the admin side."
      sideTitle="Why this login matters"
      sideCopy={[
        "Client accounts can continue conversations in inbox or chat form.",
        "Admin accounts can manage homepage content and message replies.",
        "Every screen is responsive and button-driven for quick navigation."
      ]}
    >
      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-card__heading">
          <h2>Login</h2>
          <p>Use the account credentials issued by Rasilwela Group.</p>
        </div>

        <Field label="Email address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.co.za" />
        <Field label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" />

        {(localError ?? error) ? <div className="form-alert">{localError ?? error}</div> : null}

        <button type="submit" className="button button--accent button--full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <div className="auth-links">
          <Link to="/forgot-password">Forgot password?</Link>
          <Link to="/signup">Create account</Link>
        </div>
      </form>
    </AuthShell>
  );
}
