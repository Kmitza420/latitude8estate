import { useState, type FormEvent } from "react";

import { subscribeToNewsletter } from "../../services/forms";

interface NewsletterFormProps {
  note?: string;
}

type Status = "idle" | "sending" | "sent" | "error";

/**
 * Email capture used by both newsletter blocks. Sits on the dark `primary`
 * panel, so its lettering is gold. Posts to the web API.
 */
export default function NewsletterForm({ note }: NewsletterFormProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    setStatus("sending");
    setError(null);

    try {
      await subscribeToNewsletter({ email: String(data.get("email") ?? "") });
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

  return (
    <>
      {status === "sent" ? (
        <p
          role="status"
          className="font-body-md text-body-md text-secondary-fixed"
        >
          Thank you — please check your inbox to confirm your subscription.
        </p>
      ) : (
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
            disabled={status === "sending"}
            className="font-label-md text-label-md rounded-full bg-secondary-fixed px-8 py-4 whitespace-nowrap text-primary transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "sending" ? "Subscribing…" : "Subscribe"}
          </button>
        </form>
      )}

      {status === "error" && (
        <p role="alert" className="font-body-md mt-4 text-xs text-error-container">
          {error}
        </p>
      )}

      {note && status !== "sent" && (
        <p className="font-body-md mt-4 text-xs text-secondary-fixed/50">{note}</p>
      )}
    </>
  );
}
