import { useState, type FormEvent } from "react";

// Imported from the module rather than the barrel: this file is a hydrated
// island, and the barrel would drag the read services (and the fixtures behind
// them) into the client bundle.
import {
  describeSubmitError,
  formsEnabled,
  subscribeNewsletter,
} from "../../services/forms";

interface NewsletterFormProps {
  note?: string;
}

type Status = "idle" | "sending" | "sent" | "error";

/**
 * Email capture used by both newsletter blocks. Sits on the dark `primary`
 * panel, so its lettering is gold.
 *
 * `POST /v1/newsletter/subscriptions/` does not exist yet, so `formsEnabled` is
 * off by default and submission is intercepted with a notice saying so. The
 * success copy assumes double opt-in, which is what the endpoint should do.
 */
export default function NewsletterForm({ note }: NewsletterFormProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") ?? "");

    setStatus("sending");
    setError("");

    try {
      await subscribeNewsletter(email);
      form.reset();
      setStatus("sent");
    } catch (cause) {
      setError(describeSubmitError(cause));
      setStatus("error");
    }
  };

  const sending = status === "sending";

  return (
    <>
      <form className="flex flex-col gap-4 sm:flex-row" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor="newsletter-email">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          placeholder="Enter your email address"
          className="font-body-md flex-1 rounded-none border-b border-secondary-fixed/40 bg-transparent px-4 py-3 text-secondary-fixed transition-colors placeholder:text-secondary-fixed/50 focus:border-secondary-fixed focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending}
          className="font-label-md text-label-md rounded-full bg-secondary-fixed px-8 py-4 whitespace-nowrap text-primary transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? "Subscribing…" : "Subscribe"}
        </button>
      </form>

      {status !== "idle" && !sending && (
        <p
          role="status"
          aria-live="polite"
          className="font-body-md mt-4 text-xs text-secondary-fixed/70"
        >
          {status === "sent"
            ? "Almost there — check your inbox to confirm your subscription."
            : formsEnabled
              ? error
              : "Newsletter signup is not connected to a backend yet."}
        </p>
      )}

      {note && (
        <p className="font-body-md mt-4 text-xs text-secondary-fixed/50">{note}</p>
      )}
    </>
  );
}
