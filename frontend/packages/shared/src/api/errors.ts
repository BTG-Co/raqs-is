export type FieldIssue = {
  loc: (string | number)[];
  msg: string;
  type: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly detail: string | FieldIssue[];
  readonly fieldErrors: Record<string, string>;

  constructor(status: number, detail: string | FieldIssue[], fieldErrors: Record<string, string>) {
    super(typeof detail === "string" ? detail : "Check the highlighted fields.");
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
    this.fieldErrors = fieldErrors;
  }
}

function isFieldIssue(value: unknown): value is FieldIssue {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return Array.isArray(record.loc) && typeof record.msg === "string";
}

export function fieldNameFromLoc(loc: (string | number)[]): string {
  const parts = loc.filter((part) => part !== "body" && part !== "query" && part !== "path");
  const named = parts.find((part) => typeof part === "string");
  return typeof named === "string" ? named : "";
}

export function parseErrorBody(status: number, body: unknown): ApiError {
  if (typeof body === "object" && body !== null && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;
    if (typeof detail === "string") {
      return new ApiError(status, detail, {});
    }
    if (Array.isArray(detail) && detail.every(isFieldIssue)) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of detail) {
        const field = fieldNameFromLoc(issue.loc);
        if (field && !fieldErrors[field]) fieldErrors[field] = issue.msg;
      }
      return new ApiError(status, detail, fieldErrors);
    }
  }
  return new ApiError(status, "Something went wrong. Try again.", {});
}
