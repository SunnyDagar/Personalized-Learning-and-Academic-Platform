import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Feature upsell — business engine (slides 17–end).
 *
 * Shown where a feature exists but is not in the institution's plan. Two rules it follows: never
 * pretend the feature is broken, and never dead-end. A professor who clicks "Cohort insights" on a
 * Starter plan should learn what it does and which plan includes it, not receive an error.
 *
 * Hiding a control is presentation only — the hosted API refuses the call regardless, which is
 * where the entitlement is actually enforced.
 */
@Component({
  selector: 'app-upgrade-prompt',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="upsell">
      <span class="lock" aria-hidden="true">◆</span>
      <div class="body">
        <h4>{{ featureLabel }}</h4>
        <p>{{ description || defaultDescription }}</p>
        <p class="plan" *ngIf="requiresPlan">
          Included in the <strong>{{ requiresPlan | titlecase }}</strong> plan.
        </p>
      </div>
      <button type="button" (click)="enquire.emit(feature)">See plans</button>
    </div>
  `,
  styles: [`
    .upsell { display: flex; align-items: flex-start; gap: .85rem;
              padding: 1rem 1.15rem; border: 1px dashed #c0b6f2; border-radius: 10px;
              background: #f7f5ff; }
    .lock { color: #6554c0; font-size: 1rem; line-height: 1.4; }
    .body { flex: 1; display: flex; flex-direction: column; gap: .2rem; }
    h4 { margin: 0; font-size: .9rem; color: #403294; }
    p { margin: 0; font-size: .8rem; color: #5e6c84; }
    .plan { color: #403294; }
    button { align-self: center; white-space: nowrap; padding: .4rem .85rem;
             border: 0; border-radius: 6px; background: #6554c0; color: #fff;
             cursor: pointer; font-size: .8rem; }
  `],
})
export class UpgradePromptComponent {
  @Input() feature = '';
  @Input() featureLabel = 'This feature';
  @Input() description = '';
  /** From entitlement_state() — the cheapest plan that includes the feature. */
  @Input() requiresPlan: string | null = null;
  @Output() enquire = new EventEmitter<string>();

  get defaultDescription(): string {
    return 'This is available on a higher plan. Nothing is broken — your institution has not enabled it.';
  }
}
