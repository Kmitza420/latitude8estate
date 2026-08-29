import { useState, type FormEvent } from "react";

import Field from "./Field";
// Imported from the module rather than the barrel: this file is a hydrated
// island, and the barrel would drag the read services (and the fixtures behind
// them) into the client bundle.
import { describeSubmitError, formsEnabled, submitEnquiry } from "../../services/forms";

interface ContactFormProps {
  /** Prefilled hint in the message box, e.g. the property being enquired about. */
  subject?: string;
  /** Set on a property page, so the enquiry reaches the right listing. */
  projectSlug?: string;
  submitLabel?: string;
}

type Status = "idle" | "sending" | "sent" | "error";

/**
 * Enquiry form, shared by the property detail sidebar and `/contact-us`.
 *
 * `POST /v1/enquiries/` does not exist yet, so `formsEnabled` is off by default
 * and the form keeps saying so rather than firing a request that would fail.
 * Once the endpoint is live, set `PUBLIC_API_FORMS_ENABLED=true` and this sends
 * for real with no further changes here.
 */
export default function ContactForm({
  subject,
  projectSlug,
  submitLabel = "Send Inquiry",
}: ContactFormProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setStatus("sending");
    setError("");

    try {
      await submitEnquiry({
        name: String(data.get("name") ?? ""),
        email: String(data.get("email") ?? ""),
        phone: String(data.get("phone") ?? ""),
        message: String(data.get("message") ?? ""),
        projectSlug,
      });
      form.reset();
      setStatus("sent");
    } catch (cause) {
      setError(describeSubmitError(cause));
      setStatus("error");
    }
  };

  const sending = status === "sending";

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
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
        disabled={sending}
        className="font-label-md text-label-md flex w-full items-center justify-center rounded-md bg-primary px-6 py-4 tracking-wider text-on-primary uppercase transition-colors duration-300 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {sending ? "Sending…" : submitLabel}
      </button>

      <p role="status" aria-live="polite" className="font-body-md text-sm text-on-surface-variant">
        {status === "sent" &&
          "Thank you — a specialist will be in touch with you shortly."}
        {status === "error" &&
          (formsEnabled ? error : "Enquiry form is not connected to a backend yet.")}
      </p>
    </form>
  );
}
