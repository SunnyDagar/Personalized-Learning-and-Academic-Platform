import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * One place where every failed API call is turned into something a student can read.
 *
 * Without this, each component invents its own error handling and the user sees raw status codes
 * or nothing at all. A 401 is special-cased: the session is over, so we clear it and route to
 * login rather than leaving the user clicking a dead page.
 */
@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_role');
          this.router.navigate(['/login'], { queryParams: { reason: 'expired' } });
        }
        return throwError(() => ({
          message: this.messageFor(error),
          status: error.status,
          // Quoting this back to us makes a report traceable to one upstream log line.
          requestId: error.error?.request_id ?? null,
          retryable: [408, 429, 502, 503, 504].includes(error.status),
        }));
      })
    );
  }

  private messageFor(error: HttpErrorResponse): string {
    // Prefer the server's own wording — it is already written for a person.
    if (typeof error.error?.detail === 'string' && error.error.detail.length < 200) {
      return error.error.detail;
    }
    if (error.status === 0) {
      return 'You appear to be offline. Check your connection and try again.';
    }
    const known: Record<number, string> = {
      400: 'That request was not valid. Please check what you entered.',
      403: 'You do not have access to that.',
      404: 'We could not find what you asked for.',
      429: 'Too many requests. Please wait a moment and try again.',
      503: 'The service is temporarily unavailable. Please try again shortly.',
    };
    return known[error.status] ?? 'Something went wrong. Please try again.';
  }
}
