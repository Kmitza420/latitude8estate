/**
 * The two things a visitor can send us: a property enquiry and a newsletter
 * signup.
 *
 * Unlike the read services, these run in the browser — `ContactForm` and
 * `NewsletterForm` are hydrated React islands — so the request crosses an
 * origin and needs CORS on the API side.
 *
 * **Neither endpoint exists yet.** `FORMS_ENABLED` is off by default, and
 * while it is off both functions reject with `FormsUnavailableError` without
 * touching the network, which is what keeps the forms showing their honest
 * "not connected yet" notice instead of a failed request. Implement the
 * endpoints (see `web/api/TODO.md`), then set `PUBLIC_API_FORMS_ENABLED=true`.
 */

import { FORMS_ENABLED, endpoints } from "./config";
import type {
  EnquiryCreateDto,
  NewsletterSubscriptionCreateDto,
  SubmissionResponseDto,
} from "./dto";
import { ApiError, apiPost } from "./http";

/** Re-exported so components can render the right copy without importing config. */
export const formsEnabled = FORMS_ENABLED;

/** Thrown when a form is submitted before its endpoint has been built. */
export class FormsUnavailableError extends Error {
  constructor() {
    super("Form submission is not connected to a backend yet");
    this.name = "FormsUnavailableError";
  }
}

export interface EnquiryInput {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  /** Present when the enquiry came from a property page. */
  projectSlug?: string;
}

function blankToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export async function submitEnquiry(input: EnquiryInput): Promise<SubmissionResponseDto> {
  if (!formsEnabled) throw new FormsUnavailableError();

  const payload: EnquiryCreateDto = {
    name: input.name.trim(),
    email: input.email.trim(),
    phone: blankToUndefined(input.phone),
    message: blankToUndefined(input.message),
    project_slug: blankToUndefined(input.projectSlug),
  };

  return apiPost<SubmissionResponseDto>(endpoints.enquiries, payload);
}

export async function subscribeNewsletter(email: string): Promise<SubmissionResponseDto> {
  if (!formsEnabled) throw new FormsUnavailableError();

  const payload: NewsletterSubscriptionCreateDto = { email: email.trim() };
  return apiPost<SubmissionResponseDto>(endpoints.newsletterSubscriptions, payload);
}

/**
 * Turn a submission failure into something worth showing a visitor.
 *
 * FastAPI answers a validation failure with `detail` as a list of per-field
 * objects, which is useless as prose, so that case gets generic copy. Wiring
 * those up per field is a UI improvement to make once the endpoints are real.
 */
export function describeSubmitError(error: unknown): string {
  if (error instanceof FormsUnavailableError) return error.message;

  if (error instanceof ApiError) {
    if (error.isTransport) {
      return "We could not reach the server. Please check your connection and try again.";
    }
    if (error.isValidation) {
      return "Please check the details above and try again.";
    }
    if (typeof error.message === "string" && error.message && !error.message.startsWith("5")) {
      return error.message;
    }
  }

  return "Something went wrong on our end. Please try again, or email us directly.";
}
