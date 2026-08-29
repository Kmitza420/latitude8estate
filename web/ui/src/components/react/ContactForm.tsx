import { useState, type FormEvent } from "react";

import Field from "./Field";
import { submitEnquiry } from "../../services/forms";

interface ContactFormProps {
  /** Prefilled hint in the message box, e.g. the property being enquired about. */
  subject?: string;
  /** Slug of the property this enquiry came from, sent along with the payload. */
  propertySlug?: string;
  submitLabel?: string;
}

type Status = "idle" | "sending" | "sent" | "error";

/**
 * Enquiry form, shared by the property detail sidebar and /contact-us.
 * Posts to the web API; a failure is reported rather than hidden.
 */
export default function ContactForm({
  subject,
  propertySlug,
  submitLabel = "Send Inquiry",
}: ContactFormProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    setStatus("sending");
    setError(null);

    try {
      await submitEnquiry({
        name: String(data.get("name") ?? ""),
        email: String(data.get("email") ?? ""),
        phone: String(data.get("phone") ?? "") || undefined,
        message: String(data.get("message") ?? "") || undefined,
        property_slug: propertySlug,
      });
      setStatus("sent");
    } catch (cause) {
      setStatus("error");
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not reach the server. Please try again.",
      );
    }
  };

  if (status === "sent") {
    return (
      <p
        role="status"
        className="font-body-md text-body-md rounded-md bg-surface p-6 text-on-surface"
      >
        Thank you — your enquiry has been received. A specialist will be in
        touch shortly.
      </p>
    );
  }

  return (
    <form className="space-y-6" onSubmit={onSubmit} noValidate={false}>
      <div className="space-y-4">
        <Field id="name" label="Full Name" required />
        <Field id="email" label="Email Address" type="email" required />
        <Field id="phone" label="Phone Number" type="tel" />
        <Field
          id="message"
          label="Message"
          rows={4}
          placeholder={subject ? `I am interested in ${subject}...` : undefined}
        />
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="font-label-md text-label-md flex w-full items-center justify-center rounded-md bg-primary px-6 py-4 tracking-wider text-on-primary uppercase transition-colors duration-300 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : submitLabel}
      </button>

      {status === "error" && (
        <p role="alert" className="font-body-md text-sm text-error">
          {error}
        </p>
      )}
    </form>
  );
}
