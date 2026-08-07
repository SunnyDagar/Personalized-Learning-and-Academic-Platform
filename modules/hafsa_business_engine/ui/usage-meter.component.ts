import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Usage against allowance — business engine (slides 17–end).
 *
 * An administrator should never be surprised by a limit. The warning band at 80% exists so there
 * is time to act; discovering a cap at 100% means the service has already stopped for their
 * students. Unlimited allowances render as usage without a bar, since a progress bar with no
 * ceiling is meaningless.
 */
@Component({
  selector: 'app-usage-meter',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="meter" [class]="state">
      <div class="row">
        <span class="label">{{ label }}</span>
        <span class="figures">
          {{ used | number }}<ng-container *ngIf="allowance !== null"> / {{ allowance | number }}</ng-container>
        </span>
      </div>

      <div class="track" *ngIf="allowance !== null" role="progressbar"
           [attr.aria-valuenow]="pct" aria-valuemin="0" aria-valuemax="100" [attr.aria-label]="label">
        <span class="fill" [style.width.%]="capped"></span>
      </div>

      <p class="note">
        <ng-container [ngSwitch]="state">
          <ng-container *ngSwitchCase="'exceeded'">Allowance used up — additional use is billed at the overage rate.</ng-container>
          <ng-container *ngSwitchCase="'warning'">{{ remaining | number }} remaining this period.</ng-container>
          <ng-container *ngSwitchDefault>{{ allowance === null ? 'Unlimited on this plan.' : (remaining | number) + ' remaining this period.' }}</ng-container>
        </ng-container>
      </p>
    </div>
  `,
  styles: [`
    .meter { display: flex; flex-direction: column; gap: .25rem; }
    .row { display: flex; justify-content: space-between; font-size: .82rem; }
    .label { color: #5e6c84; }
    .figures { font-weight: 700; }
    .track { height: 6px; background: #ebecf0; border-radius: 4px; overflow: hidden; }
    .fill { display: block; height: 100%; background: #36b37e; }
    .warning  .fill { background: #ffab00; }
    .exceeded .fill { background: #ff5630; }
    .note { margin: 0; font-size: .7rem; color: #7a869a; }
    .exceeded .note { color: #bf2600; }
  `],
})
export class UsageMeterComponent {
  @Input() label = 'AI answers';
  @Input() used = 0;
  /** null means unlimited on this plan. */
  @Input() allowance: number | null = null;

  get pct(): number {
    if (this.allowance === null || this.allowance <= 0) return 0;
    return Math.round((this.used / this.allowance) * 100);
  }

  get capped(): number {
    return Math.min(100, this.pct);
  }

  get remaining(): number {
    if (this.allowance === null) return 0;
    return Math.max(0, this.allowance - this.used);
  }

  get state(): 'ok' | 'warning' | 'exceeded' {
    if (this.allowance === null) return 'ok';
    if (this.pct >= 100) return 'exceeded';
    return this.pct >= 80 ? 'warning' : 'ok';
  }
}
