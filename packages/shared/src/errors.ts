import { z } from "zod";

/**
 * Mirrors tRPC v11's `TRPC_ERROR_CODE_KEY` set. Keeping the two identical
 * means an error thrown as `new TRPCError({ code })` in the API serialises
 * into `apiErrorSchema` without a translation table.
 */
export const apiErrorCodes = [
  "PARSE_ERROR",
  "BAD_REQUEST",
  "INTERNAL_SERVER_ERROR",
  "NOT_IMPLEMENTED",
  "BAD_GATEWAY",
  "SERVICE_UNAVAILABLE",
  "GATEWAY_TIMEOUT",
  "UNAUTHORIZED",
  "PAYMENT_REQUIRED",
  "FORBIDDEN",
  "NOT_FOUND",
  "METHOD_NOT_SUPPORTED",
  "TIMEOUT",
  "CONFLICT",
  "PRECONDITION_FAILED",
  "PAYLOAD_TOO_LARGE",
  "UNSUPPORTED_MEDIA_TYPE",
  "UNPROCESSABLE_CONTENT",
  "TOO_MANY_REQUESTS",
  "CLIENT_CLOSED_REQUEST",
] as const;

export const apiErrorCodeSchema = z.enum(apiErrorCodes);
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;

/**
 * The envelope the web app can rely on for any failed call. `fieldErrors`
 * carries per-field validation messages so a form can render them inline
 * instead of collapsing everything into one banner.
 */
export const apiErrorSchema = z.object({
  code: apiErrorCodeSchema,
  message: z.string(),
  fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;
