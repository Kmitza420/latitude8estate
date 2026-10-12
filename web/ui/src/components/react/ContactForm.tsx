import { useState, type FormEvent } from "react";

import Field, { type FieldTone } from "./Field";
import Icon from "./Icon";
// Imported from the module rather than the barrel: this file is a hydrated
// island, and the barrel would drag the read services (and the whole wire
// them) into the client bundle.
import { describeSubmitError, formsEnabled, submitEnquiry } from "../../services/forms";

interface ContactFormProps {
  /** Prefilled hint in the message box, e.g. the property being enquired about. */
  subject?: string;
  /** Set on a property page, so the enquiry reaches the right listing. */
  projectSlug?: string;
  submitLabel?: string;
  /**
   * When given, the form grows a required subject select over these values and
   * sends the chosen one. Used by `/property-management`, where the enquiry has to say
   * which service it is about.
   */
  subjectOptions?: string[];
  /** Material Symbols name shown inside the submit button. */
  submitIcon?: string;
  /**
   * `light` for a form on the page surface, `dark` for one on a `primary`
   * green panel.
   */
  tone?: FieldTone;
  /** Require a phone number. Off by default; on for the management enquiry. */
  phoneRequired?: boolean;
  /** Message box placeholder, when the `subject` hint is not the right prompt. */
  messagePlaceholder?: string;
}

type Status = "idle" | "sending" | "sent" | "error";

/**
 * Enquiry form, shared by the property detail sidebar, `/contact-us` and the
 * property-management enquiry panel.
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
  subjectOptions,
  submitIcon,
  tone = "light",
  phoneRequired = false,
  messagePlaceholder,
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
        subject: String(data.get("subject") ?? ""),
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
  const dark = tone === "dark";

  const placeholder =
    messagePlaceholder ?? (subject ? `I am interested in ${subject}...` : undefined);

  const email = <Field id="email" label="Email Address" type="email" required tone={tone} />;
  const phone = (
    <Field id="phone" label="Phone Number" type="tel" required={phoneRequired} tone={tone} />
  );

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <div className={dark ? "space-y-6" : "space-y-4"}>
        <Field id="name" label="Full Name" required tone={tone} />

        {/*
          Email and phone share a row on the dark panel, as the mockup has it.
          The light tone keeps them as plain siblings rather than wrapping them
          in a `display: contents` div, which would eat the parent's
          `space-y-*` margin (it applies to the wrapper, which has no box).
        */}
        {dark ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {email}
            {phone}
          </div>
        ) : (
          <>
            {email}
            {phone}
          </>
        )}

        {subjectOptions && (
          <Field id="subject" label="Subject" options={subjectOptions} required tone={tone} />
        )}

        <Field
          id="message"
          label={dark ? "Estate Details & Message" : "Message"}
          rows={4}
          placeholder={placeholder}
          required={dark}
          tone={tone}
        />
      </div>

      <button
        type="submit"
        disabled={sending}
        className={`font-label-md text-label-md flex w-full items-center justify-center gap-3 tracking-wider uppercase transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${
          dark
            ? "rounded-full bg-secondary-fixed px-8 py-4 font-bold text-primary hover:bg-white"
            : "rounded-md bg-primary px-6 py-4 text-on-primary hover:bg-secondary"
        }`}
      >
        <span>{sending ? "Sending…" : submitLabel}</span>
        {submitIcon && !sending && <Icon name={submitIcon} className="text-lg" />}
      </button>

      <p
        role="status"
        aria-live="polite"
        className={`font-body-md text-sm ${dark ? "text-on-primary/70" : "text-on-surface-variant"}`}
      >
        {status === "sent" &&
          "Thank you — a specialist will be in touch with you shortly."}
        {status === "error" &&
          (formsEnabled ? error : "Enquiry form is not connected to a backend yet.")}
      </p>
    </form>
  );
}
