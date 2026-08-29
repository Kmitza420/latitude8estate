import { useState, type FormEvent } from "react";

interface NewsletterFormProps {
  note?: string;
}

/**
 * Email capture used by both newsletter blocks. Sits on the dark `primary`
 * panel, so its lettering is gold. No backend yet, so submission is intercepted.
 */
export default function NewsletterForm({ note }: NewsletterFormProps) {
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

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
          className="font-label-md text-label-md rounded-full bg-secondary-fixed px-8 py-4 whitespace-nowrap text-primary transition-colors hover:bg-white"
        >
          Subscribe
        </button>
      </form>

      {submitted && (
        <p
          role="status"
          className="font-body-md mt-4 text-xs text-secondary-fixed/70"
        >
          Newsletter signup is not connected to a backend yet.
        </p>
      )}

      {note && (
        <p className="font-body-md mt-4 text-xs text-secondary-fixed/50">{note}</p>
      )}
    </>
  );
}
