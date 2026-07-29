/**
 * Route guard — Sanchit Chhabra (app shell & auth, slides 1–5).
 *
 * Protects the student and professor portals. A route is only entered when a session
 * token exists and the user's role matches what the route expects. Roles come from the
 * server at login; nothing here is trusted for authorisation on its own — the API
 * re-checks the token on every request.
 */
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard = (expectedRole?: 'student' | 'professor'): CanActivateFn => () => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    router.navigate(['/login']);
    return false;
  }
  if (expectedRole && role !== expectedRole) {
    // signed in, but this portal isn't theirs — send them to their own
    router.navigate([role === 'professor' ? '/professor' : '/student']);
    return false;
  }
  return true;
};
