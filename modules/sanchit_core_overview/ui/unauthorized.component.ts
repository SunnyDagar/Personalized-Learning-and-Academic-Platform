import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

/**
 * The 403 screen — core foundations (slides 1–5).
 *
 * Where auth.guard.ts sends someone who reached a route their role does not cover. Usually not an
 * attack: it is a professor following a link a student sent them, or a bookmark from a previous
 * session. So the tone is matter-of-fact and there is always a way back — a dead end here reads as
 * a broken product.
 *
 * It deliberately does not say what exists at that address. Confirming that a professor-only page
 * is there tells an unauthorised visitor something they should not learn from an error screen.
 */
@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h1>You do not have access to this page</h1>

      <p>
        You are signed in as <strong>{{ roleLabel }}</strong>. This page is not part of that view.
      </p>

      <p class="muted">
        If you followed a link from someone else, they may have a different type of account.
      </p>

      <div class="actions">
        <button type="button" (click)="goHome()">Back to my dashboard</button>
        <button type="button" class="ghost" (click)="signOut()">Sign in as someone else</button>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 32rem; margin: 3rem auto; display: flex; flex-direction: column;
            gap: .6rem; text-align: center; }
    h1 { font-size: 1.15rem; margin: 0; color: #172b4d; }
    p { margin: 0; font-size: .9rem; color: #42526e; }
    .muted { color: #7a869a; font-size: .82rem; }
    .actions { display: flex; gap: .5rem; justify-content: center; margin-top: .75rem; }
    button { padding: .45rem 1rem; border: 0; border-radius: 6px; font-size: .85rem;
             background: #0052cc; color: #fff; cursor: pointer; }
    button.ghost { background: transparent; color: #0052cc; border: 1px solid #dfe1e6; }
  `],
})
export class UnauthorizedComponent {
  constructor(private router: Router) {}

  get role(): string {
    return (localStorage.getItem('user_role') ?? 'guest').toLowerCase();
  }

  get roleLabel(): string {
    return { student: 'a student', professor: 'a professor', guest: 'a guest' }[this.role] ?? this.role;
  }

  goHome(): void {
    this.router.navigate([this.role === 'professor' ? '/professor' : '/student']);
  }

  signOut(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    this.router.navigate(['/login']);
  }
}
