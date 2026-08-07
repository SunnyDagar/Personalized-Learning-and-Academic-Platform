import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

/**
 * Warns before a session expires instead of letting work vanish.
 *
 * A student halfway through an assessment should not lose it to a silent token expiry. The token's
 * exp claim is read locally for display only — the server decides what is actually still valid.
 */
@Component({
  selector: 'app-session-timer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="session-warning" *ngIf="showWarning" role="status" aria-live="polite">
      <span>Your session ends in {{ minutesLeft }} min.</span>
      <button type="button" (click)="staySignedIn.emit?.()">Stay signed in</button>
    </div>
  `,
  styles: [`
    .session-warning {
      display: flex; gap: .75rem; align-items: center;
      padding: .5rem .9rem; border-radius: 6px;
      background: #fff4e5; color: #7a4a00; font-size: .875rem;
    }
    button { border: 0; background: #7a4a00; color: #fff; padding: .3rem .7rem; border-radius: 4px; cursor: pointer; }
  `],
})
export class SessionTimerComponent implements OnInit, OnDestroy {
  /** Start warning this many seconds before expiry. */
  readonly warnBefore = 120;

  minutesLeft = 0;
  showWarning = false;
  staySignedIn: any;

  private timer?: ReturnType<typeof setInterval>;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.tick();
    this.timer = setInterval(() => this.tick(), 15_000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private tick(): void {
    const remaining = this.secondsRemaining();
    if (remaining <= 0) {
      this.showWarning = false;
      if (localStorage.getItem('auth_token')) {
        localStorage.removeItem('auth_token');
        this.router.navigate(['/login'], { queryParams: { reason: 'expired' } });
      }
      return;
    }
    this.minutesLeft = Math.max(1, Math.ceil(remaining / 60));
    this.showWarning = remaining <= this.warnBefore;
  }

  /** Reads exp from the token payload. Display only — never an authorisation decision. */
  private secondsRemaining(): number {
    const token = localStorage.getItem('auth_token');
    if (!token) return 0;
    const parts = token.split('.');
    if (parts.length !== 3) return 0;
    try {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      return typeof payload.exp === 'number' ? payload.exp - Math.floor(Date.now() / 1000) : 0;
    } catch {
      return 0;
    }
  }
}
