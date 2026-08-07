import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Error budget gauge — architecture (slides 13–16).
 *
 * A hand-drawn SVG arc, for the same reason as the sparkline: this is trigonometry and a path
 * string, not a reason to add a charting dependency to the client bundle.
 *
 * The gauge shows how much of the month's allowance for failure has been spent, which is the
 * number that should decide whether to ship a change or stabilise. "99.6% available" invites a
 * shrug; "78% of this month's budget gone with nine days left" does not.
 */
@Component({
  selector: 'app-error-budget-gauge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <figure class="gauge">
      <svg viewBox="0 0 120 70" role="img"
           [attr.aria-label]="'Error budget: ' + display + ' percent consumed'">
        <path class="track" [attr.d]="arc(100)" />
        <path class="fill" [class]="band" [attr.d]="arc(clamped)" />
        <text x="60" y="52" text-anchor="middle" class="value">{{ display }}%</text>
        <text x="60" y="64" text-anchor="middle" class="caption">budget used</text>
      </svg>

      <figcaption>
        <span [class]="band">{{ verdict }}</span>
        <span class="days" *ngIf="daysRemaining !== null">{{ daysRemaining }} days left in window</span>
      </figcaption>
    </figure>
  `,
  styles: [`
    .gauge { margin: 0; display: flex; flex-direction: column; gap: .2rem; align-items: center; }
    svg { width: 100%; max-width: 13rem; }
    .track { fill: none; stroke: #ebecf0; stroke-width: 10; stroke-linecap: round; }
    .fill  { fill: none; stroke-width: 10; stroke-linecap: round; transition: d .3s ease; }
    .fill.healthy { stroke: #36b37e; }
    .fill.warning { stroke: #ffab00; }
    .fill.spent   { stroke: #ff5630; }
    .value { font-size: 15px; font-weight: 800; fill: #172b4d; }
    .caption { font-size: 7px; fill: #97a0af; text-transform: uppercase; letter-spacing: .08em; }
    figcaption { display: flex; flex-direction: column; align-items: center; font-size: .75rem; }
    figcaption .healthy { color: #006644; } figcaption .warning { color: #7a4a00; }
    figcaption .spent { color: #bf2600; }
    .days { color: #7a869a; font-size: .68rem; }
  `],
})
export class ErrorBudgetGaugeComponent {
  /** Percent of the error budget consumed, from error_budget() in backend/slo.php. */
  @Input() consumedPct = 0;
  @Input() daysRemaining: number | null = null;

  private readonly radius = 45;
  private readonly cx = 60;
  private readonly cy = 50;

  get clamped(): number {
    return Math.min(100, Math.max(0, this.consumedPct));
  }

  get display(): number {
    return Math.round(this.clamped);
  }

  get band(): 'healthy' | 'warning' | 'spent' {
    if (this.clamped >= 100) return 'spent';
    return this.clamped >= 75 ? 'warning' : 'healthy';
  }

  get verdict(): string {
    return {
      healthy: 'Within budget',
      warning: 'Budget running low — prioritise stability',
      spent: 'Budget exhausted — freeze risky changes',
    }[this.band];
  }

  /** Semicircle arc from 180° to 0°, filled proportionally. */
  arc(pct: number): string {
    const angle = Math.PI * (1 - Math.min(100, Math.max(0, pct)) / 100);
    const x = this.cx + this.radius * Math.cos(angle);
    const y = this.cy - this.radius * Math.sin(angle);
    const startX = this.cx - this.radius;
    return `M ${startX} ${this.cy} A ${this.radius} ${this.radius} 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
}
