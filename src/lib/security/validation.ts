export type ValidationResult =
  | {
      success: true;
      q: string;
    }
  | {
      success: false;
      message: string;
    };

const QUERY_MAX_LENGTH = 60;

export function validateSearchQuery(raw: string | null): ValidationResult {
  if (typeof raw !== "string") {
    return {
      success: false,
      message: "q must be a string",
    };
  }

  const q = raw.trim();

  if (q.length < 2) {
    return {
      success: false,
      message: "q must be at least 2 characters",
    };
  }

  if (q.length > QUERY_MAX_LENGTH) {
    return {
      success: false,
      message: `q must be <= ${QUERY_MAX_LENGTH} characters`,
    };
  }

  return {
    success: true,
    q,
  };
}
