import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthShell } from "../components/AuthShell";
import { Field } from "../components/Field";
import { useAuth } from "../context/AuthContext";

export function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const response = await forgotPassword({ email });
      setMessage(response.message);
      setResetToken(response.resetToken ?? null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not send password reset instructions.");
    }
  }

  return (
    <AuthShell
      title="Recover access"
      subtitle="Request a reset message for the email address linked to your account."
      sideTitle="Reset flow"
      sideCopy={[
        "The forgot-password screen sends instructions to the client email address.",
        "A reset-password page is available for one-time codes or follow-up links.",
        "Buttons always move the user to the next screen."
      ]}
    >
      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-card__heading">
          <h2>Forgot password</h2>
          <p>We will send reset instructions to your inbox.</p>
        </div>

        <Field label="Email address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.co.za" />

        {message ? <div className="form-success">{message}</div> : null}
        {resetToken ? (
          <div className="form-success">
            Demo reset token: <strong>{resetToken}</strong>
            <div className="auth-links">
              <button
                type="button"
                className="button button--ghost"
                onClick={() => navigate(`/reset-password?token=${resetToken}`)}
              >
                Continue to reset screen
              </button>
            </div>
          </div>
        ) : null}
        {error ? <div className="form-alert">{error}</div> : null}

        <button type="submit" className="button button--accent button--full">
          Send reset instructions
        </button>

        <div className="auth-links">
          <Link to="/login">Back to login</Link>
          <Link to="/reset-password">Have a reset code?</Link>
        </div>
      </form>
    </AuthShell>
  );
}
