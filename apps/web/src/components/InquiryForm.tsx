import { useState, type FormEvent } from "react";
import { Field, SelectField, TextAreaField } from "./Field";
import { postJson } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const SERVICE_OPTIONS = [
  "Software Development",
  "Company Email Hosting",
  "Business Analysis"
] as const;

export function InquiryForm({
  title,
  subtitle,
  preferredReplyChannel = "email"
}: {
  title: string;
  subtitle: string;
  preferredReplyChannel?: "email" | "chat";
}) {
  const { session, user } = useAuth();
  const [form, setForm] = useState({
    name: user?.displayName ?? "",
    email: user?.email ?? "",
    company: "",
    subject: "",
    message: "",
    serviceInterest: SERVICE_OPTIONS[0]
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      await postJson("/api/site/messages", {
        ...form,
        preferredReplyChannel
      }, session);

      setNotice("Your message is with the Rasilwela team. We will respond by email or in-app chat.");
      setForm((current) => ({
        ...current,
        company: "",
        subject: "",
        message: ""
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not send your message.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="dashboard-card stack-form" onSubmit={handleSubmit}>
      <div className="form-card__heading">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>

      <div className="editor-grid editor-grid--compact">
        <Field
          label="Name"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          placeholder="Your full name"
        />
        <Field
          label="Email"
          type="email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          placeholder="name@company.co.za"
        />
        <Field
          label="Company"
          value={form.company}
          onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))}
          placeholder="Rasilwela Client"
        />
        <SelectField
          label="Service interest"
          value={form.serviceInterest}
          onChange={(event) => setForm((current) => ({ ...current, serviceInterest: event.target.value }))}
        >
          {SERVICE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </SelectField>
      </div>

      <Field
        label="Subject"
        value={form.subject}
        onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
        placeholder="I need company email hosting for my business"
      />
      <TextAreaField
        label="Message"
        value={form.message}
        onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
        placeholder="Tell us about your business and what you need."
        rows={5}
      />

      {notice ? <div className="form-success">{notice}</div> : null}
      {error ? <div className="form-alert">{error}</div> : null}

      <button type="submit" className="button button--accent" disabled={submitting}>
        {submitting ? "Sending..." : "Send inquiry"}
      </button>
    </form>
  );
}
