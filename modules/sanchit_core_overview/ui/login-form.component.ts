import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

/**
 * The sign-in screen — the first thing any user of the platform touches.
 *
 * Deliberately plain: the credentials go straight to the API, which owns authentication. Nothing
 * here decides whether a login is valid; it collects input, shows the server's answer, and stores
 * the returned token. Failed attempts keep the same wording whether the account exists or not, so
 * the form cannot be used to discover which email addresses are registered.
 */
@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <form class="login" (ngSubmit)="submit()">
      <h2>Sign in</h2>

      <p class="notice" *ngIf="expired">Your session ended. Please sign in again.</p>

      <label for="email">Email</label>
      <input id="email" name="email" type="email" [(ngModel)]="email"
             autocomplete="username" required />

      <label for="password">Password</label>
      <input id="password" name="password" type="password" [(ngModel)]="password"
             autocomplete="current-password" required />

      <p class="error" *ngIf="error" role="alert">{{ error }}</p>

      <button type="submit" [disabled]="busy || !email || !password">
        {{ busy ? 'Signing in…' : 'Sign in' }}
      </button>
    </form>
  `,
  styles: [`
    .login { display: flex; flex-direction: column; gap: .5rem; max-width: 22rem; }
    label { font-size: .8rem; color: #5e6c84; }
    input { padding: .5rem; border: 1px solid #dfe1e6; border-radius: 4px; }
    button { margin-top: .6rem; padding: .55rem; border: 0; border-radius: 4px;
             background: #0052cc; color: #fff; cursor: pointer; }
    button[disabled] { opacity: .55; cursor: not-allowed; }
    .error  { color: #bf2600; font-size: .85rem; }
    .notice { color: #7a4a00; font-size: .85rem; }
  `],
})
export class LoginFormComponent {
  email = '';
  password = '';
  error = '';
  busy = false;

  /** Set when the user arrived here because their session expired. */
  expired = new URLSearchParams(location.search).get('reason') === 'expired';

  constructor(private http: HttpClient, private router: Router) {}

  submit(): void {
    this.busy = true;
    this.error = '';

    this.http.post<{ access_token: string; role?: string }>('/api/auth/login', {
      email: this.email,
      password: this.password,
    }).subscribe({
      next: (res) => {
        localStorage.setItem('auth_token', res.access_token);
        if (res.role) localStorage.setItem('user_role', res.role);
        this.router.navigate([res.role === 'professor' ? '/professor' : '/student']);
      },
      error: () => {
        // Same message either way — never reveal whether the email exists.
        this.error = 'Those details did not match an account.';
        this.busy = false;
      },
    });
  }
}
