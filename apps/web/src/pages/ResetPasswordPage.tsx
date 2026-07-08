import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthShell } from "../components/AuthShell";
import { Field } from "../components/Field";
import { useAuth } from "../context/AuthContext";

export function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const response = await resetPassword({ token, password });
      setMessage(response);
      setTimeout(() => navigate("/login"), 1000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not reset your password.");
    }
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Enter the reset token and a new password to regain access."
      sideTitle="Security note"
      sideCopy={[
        "Use a strong password for client and admin access.",
        "Reset links should be tied to a one-time code from the backend.",
        "The route is included so email flows can connect later."
      ]}
    >
      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-card__heading">
          <h2>Reset password</h2>
          <p>Use the reset token prepared by the forgot-password flow.</p>
        </div>

        <Field label="Reset token" value={token} onChange={(event) => setToken(event.target.value)} />
        <Field label="New password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />

        {message ? <div className="form-success">{message}</div> : null}
        {error ? <div className="form-alert">{error}</div> : null}

        <button type="submit" className="button button--accent button--full">
          Reset password
        </button>

        <div className="auth-links">
          <Link to="/login">Back to login</Link>
          <Link to="/forgot-password">Need a code?</Link>
        </div>
      </form>
    </AuthShell>
  );
}
