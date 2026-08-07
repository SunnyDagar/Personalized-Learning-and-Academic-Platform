import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Licence notice — business engine (slides 17–end).
 *
 * The commercial control point, made visible. When a licence lapses or is suspended, this is what
 * a customer sees — so the wording matters: it names the problem, says who can fix it, and never
 * blames the user. A blocking state deliberately looks different from a warning, because one means
 * "renew soon" and the other means "your students cannot work today".
 */
@Component({
  selector: 'app-licence-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="licence" *ngIf="state !== 'active'" [class]="severity" role="status" aria-live="polite">
      <div class="text">
        <strong>{{ heading }}</strong>
        <span>{{ message }}</span>
      </div>
      <a class="cta" *ngIf="supportEmail" [href]="'mailto:' + supportEmail">Contact administrator</a>
    </div>
  `,
  styles: [`
    .licence { display: flex; align-items: center; justify-content: space-between; gap: 1rem;
               padding: .65rem 1rem; border-radius: 8px; font-size: .85rem; }
    .text { display: flex; flex-direction: column; gap: .1rem; }
    strong { font-size: .72rem; text-transform: uppercase; letter-spacing: .05em; }
    .info     { background: #deebff; color: #0747a6; }
    .warning  { background: #fff4e5; color: #7a4a00; }
    .blocking { background: #fff6f5; color: #bf2600; }
    .cta { white-space: nowrap; font-weight: 600; text-decoration: underline; color: inherit; }
  `],
})
export class LicenceBannerComponent {
  /** Mirrors the states in backend/licence_state.php. */
  @Input() state: 'active' | 'trial' | 'renewal_due' | 'expired' | 'suspended' = 'active';
  @Input() daysLeft: number | null = null;
  @Input() supportEmail = '';

  get severity(): 'info' | 'warning' | 'blocking' {
    if (this.state === 'expired' || this.state === 'suspended') return 'blocking';
    return this.state === 'trial' ? 'info' : 'warning';
  }

  get heading(): string {
    return {
      active: '',
      trial: 'Trial',
      renewal_due: 'Renewal due',
      expired: 'Licence expired',
      suspended: 'Licence suspended',
    }[this.state];
  }

  get message(): string {
    const days = this.daysLeft ?? 0;
    switch (this.state) {
      case 'trial':
        return this.daysLeft === null
          ? 'You are using a trial of this platform.'
          : `Your trial ends in ${days} ${days === 1 ? 'day' : 'days'}.`;
      case 'renewal_due':
        return `This licence expires in ${days} ${days === 1 ? 'day' : 'days'}. Renew to avoid interruption.`;
      case 'expired':
        return 'This licence has lapsed, so the service is unavailable. Your data is retained and will return on renewal.';
      case 'suspended':
        return 'This licence has been suspended. Your administrator can resolve this with your provider.';
      default:
        return '';
    }
  }
}
