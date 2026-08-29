import type {
  AcceptedDto,
  EnquiryRequestDto,
  NewsletterRequestDto,
} from "./dto";
import { apiPost } from "./http";

/**
 * Writes run in the browser, not at build time, and deliberately do not fall
 * back to placeholder behaviour — a submission that did not reach the API must
 * tell the user so rather than showing a false confirmation.
 */

export function submitEnquiry(payload: EnquiryRequestDto): Promise<AcceptedDto> {
  return apiPost<AcceptedDto>("/enquiries", payload);
}

export function subscribeToNewsletter(
  payload: NewsletterRequestDto,
): Promise<AcceptedDto> {
  return apiPost<AcceptedDto>("/newsletter/subscriptions", payload);
}
