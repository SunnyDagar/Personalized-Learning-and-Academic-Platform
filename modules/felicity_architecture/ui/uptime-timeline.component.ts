import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DayStatus {
  date: string;
  availabilityPct: number | null;
}

/**
 * Uptime timeline — architecture (slides 13–16).
 *
 * The bar-per-day view a status page uses. It answers a question a single availability figure
 * cannot: was the month one bad afternoon, or a service degrading steadily? Those need different
 * responses, and the monthly average hides the difference entirely.
 *
 * Days with no data are drawn distinctly rather than as an outage — "we were not measuring" and
 * "we were down" are not the same claim to make to a customer.
 */
@Component({
  selector: 'app-uptime-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <figure class="timeline">
      <figcaption>
        <span>{{ label }}</span>
        <span class="summary">{{ summary }}</span>
      </figcaption>

      <div class="bars" role="img" [attr.aria-label]="summary">
        <span *ngFor="let d of days" class="bar" [class]="bandFor(d)"
              [title]="d.date + ': ' + (d.availabilityPct === null ? 'no data' : d.availabilityPct + '%')"></span>
      </div>

      <div class="scale">
        <span>{{ days.length ? days[0].date : '' }}</span>
        <span>{{ days.length ? days[days.length - 1].date : '' }}</span>
      </div>
    </figure>
  `,
  styles: [`
    .timeline { margin: 0; display: flex; flex-direction: column; gap: .3rem; }
    figcaption { display: flex; justify-content: space-between; font-size: .78rem; color: #5e6c84; }
    .summary { font-weight: 700; color: #172b4d; }
    .bars { display: flex; gap: 2px; align-items: flex-end; height: 34px; }
    .bar { flex: 1; height: 100%; border-radius: 2px; background: #36b37e; }
    .bar.degraded { background: #ffab00; }
    .bar.down     { background: #ff5630; }
    .bar.nodata   { background: repeating-linear-gradient(45deg,#ebecf0,#ebecf0 2px,#fff 2px,#fff 4px); }
    .scale { display: flex; justify-content: space-between; font-size: .65rem; color: #97a0af; }
  `],
})
export class UptimeTimelineComponent {
  @Input() label = 'Availability';
  @Input() days: DayStatus[] = [];
  /** The SLO target, used to decide what counts as degraded. */
  @Input() target = 99.5;

  bandFor(d: DayStatus): 'ok' | 'degraded' | 'down' | 'nodata' {
    if (d.availabilityPct === null) return 'nodata';
    if (d.availabilityPct >= this.target) return 'ok';
    return d.availabilityPct >= 95 ? 'degraded' : 'down';
  }

  /** Averaged over measured days only — absent days must not count as perfect. */
  get summary(): string {
    const measured = this.days.filter(d => d.availabilityPct !== null);
    if (!measured.length) return 'No data yet';
    const avg = measured.reduce((s, d) => s + (d.availabilityPct as number), 0) / measured.length;
    const bad = this.days.filter(d => this.bandFor(d) === 'down' || this.bandFor(d) === 'degraded').length;
    return `${avg.toFixed(2)}% over ${measured.length} days` + (bad ? ` · ${bad} below target` : '');
  }
}
