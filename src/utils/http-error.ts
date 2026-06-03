export interface ErrorDetails {
  [key: string]: unknown;
}

export class HttpError extends Error {
  status: number;
  details?: ErrorDetails;

  constructor(status: number, message: string, details?: ErrorDetails) {
    super(message);
    this.status = status;
    if (details !== undefined) {
      this.details = details;
    }
  }
}

export function badRequest(message: string, details?: ErrorDetails) {
  return new HttpError(400, message, details);
}

export function conflict(message: string, details?: ErrorDetails) {
  return new HttpError(409, message, details);
}

export function notFound(message: string, details?: ErrorDetails) {
  return new HttpError(404, message, details);
}
