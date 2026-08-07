import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Platform status banner — architecture (slides 13–16).
 *
 * When the upstream is degraded or a licence has lapsed, users need to be told once, at the top,
 * rather than discovering it through a series of failed clicks. Licence states get their own
 * wording because "expired" is an administrative problem with a clear owner, not an outage.
 */
@Component({
  selector: 'app-status-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="banner" *ngIf="state !== 'ok'" [class]="state" role="status" aria-live="polite">
      <strong>{{ heading }}</strong>
      <span>{{ detail || defaultDetail }}</span>
    </div>
  `,
  styles: [`
    .banner { display: flex; flex-direction: column; gap: .15rem;
              padding: .6rem 1rem; border-radius: 8px; font-size: .85rem; }
    .banner strong { font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; }
    .degraded { background: #fff4e5; color: #7a4a00; }
    .outage   { background: #fff6f5; color: #bf2600; }
    .licence  { background: #eae6ff; color: #403294; }
    .offline  { background: #f4f5f7; color: #42526e; }
  `],
})
export class StatusBannerComponent {
  /** ok hides the banner entirely. */
  @Input() state: 'ok' | 'degraded' | 'outage' | 'licence' | 'offline' = 'ok';
  @Input() detail = '';

  get heading(): string {
    return {
      ok: '',
      degraded: 'Running slowly',
      outage: 'Service unavailable',
      licence: 'Licence problem',
      offline: 'You are offline',
    }[this.state];
  }

  get defaultDetail(): string {
    return {
      ok: '',
      degraded: 'Some requests are taking longer than usual. Your work is still being saved.',
      outage: 'We cannot reach the service right now. Please try again shortly.',
      licence: 'This institution’s licence is not active. Please contact your administrator.',
      offline: 'Check your connection — changes will not be saved until you reconnect.',
    }[this.state];
  }
}
