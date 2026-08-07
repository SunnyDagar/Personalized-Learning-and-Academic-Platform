import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * One service level indicator — architecture (slides 13–16).
 *
 * Shows a measurement against its target and how much of the error budget is gone. The budget bar
 * is the point: "99.62% availability" means nothing to most readers, whereas "38% of this month's
 * allowance used" is immediately actionable.
 */
@Component({
  selector: 'app-sli-tile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tile" [class.miss]="!pass && hasValue">
      <div class="top">
        <span class="name">{{ label }}</span>
        <span class="state">{{ hasValue ? (pass ? 'Meeting' : 'Missing') : 'No data' }}</span>
      </div>

      <div class="measure">
        {{ hasValue ? measured : '—' }}<span class="unit" *ngIf="hasValue">{{ unit }}</span>
      </div>
      <div class="target">target {{ target }}{{ unit }} · {{ window }}</div>

      <ng-container *ngIf="budgetConsumed !== null">
        <div class="budget-track" role="progressbar"
             [attr.aria-valuenow]="budgetConsumed" aria-valuemin="0" aria-valuemax="100"
             aria-label="Error budget consumed">
          <span class="budget-fill" [style.width.%]="cappedBudget"
                [class.over]="budgetConsumed >= 100"></span>
        </div>
        <div class="budget-label">{{ budgetConsumed }}% of error budget used</div>
      </ng-container>
    </div>
  `,
  styles: [`
    .tile { border: 1px solid #dfe1e6; border-radius: 10px; padding: .9rem 1rem;
            display: flex; flex-direction: column; gap: .25rem; background: #fff; }
    .tile.miss { border-color: #ffbdad; background: #fff8f7; }
    .top { display: flex; justify-content: space-between; align-items: baseline; }
    .name { font-size: .8rem; color: #5e6c84; }
    .state { font-size: .68rem; font-weight: 700; text-transform: uppercase; color: #006644; }
    .tile.miss .state { color: #bf2600; }
    .measure { font-size: 1.6rem; font-weight: 800; line-height: 1.1; }
    .unit { font-size: .9rem; font-weight: 600; margin-left: .1rem; }
    .target { font-size: .7rem; color: #7a869a; }
    .budget-track { height: 5px; background: #ebecf0; border-radius: 3px; margin-top: .45rem; overflow: hidden; }
    .budget-fill { display: block; height: 100%; background: #36b37e; }
    .budget-fill.over { background: #ff5630; }
    .budget-label { font-size: .66rem; color: #7a869a; }
  `],
})
export class SliTileComponent {
  @Input() label = '';
  @Input() measured: number | null = null;
  @Input() target = 0;
  @Input() unit = '';
  @Input() window = '30 days';
  /** Percent of the error budget consumed; null hides the bar entirely. */
  @Input() budgetConsumed: number | null = null;
  /** Lower is better for latency; higher is better for availability. */
  @Input() lowerIsBetter = false;

  get hasValue(): boolean {
    return this.measured !== null && !Number.isNaN(this.measured);
  }

  get pass(): boolean {
    if (!this.hasValue) return false;
    const v = this.measured as number;
    return this.lowerIsBetter ? v <= this.target : v >= this.target;
  }

  get cappedBudget(): number {
    return Math.min(100, Math.max(0, this.budgetConsumed ?? 0));
  }
}
