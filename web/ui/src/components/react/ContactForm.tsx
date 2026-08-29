import { useState, type FormEvent } from "react";

import Field from "./Field";

interface ContactFormProps {
  /** Prefilled hint in the message box, e.g. the property being enquired about. */
  subject?: string;
  submitLabel?: string;
}

/**
 * Enquiry form, shared by the property detail sidebar and any standalone
 * contact page. There is no backend yet, so submission is intercepted.
 */
export default function ContactForm({
  subject,
  submitLabel = "Send Inquiry",
}: ContactFormProps) {
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

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
        className="font-label-md text-label-md flex w-full items-center justify-center rounded-md bg-primary px-6 py-4 tracking-wider text-on-primary uppercase transition-colors duration-300 hover:bg-secondary"
      >
        {submitLabel}
      </button>

      {submitted && (
        <p
          role="status"
          className="font-body-md text-sm text-on-surface-variant"
        >
          Enquiry form is not connected to a backend yet.
        </p>
      )}
    </form>
  );
}
