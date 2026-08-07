import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Return-on-investment calculator — business engine (slides 17–end).
 *
 * The tool a buyer uses to justify the purchase internally. It compares the licence against the
 * teaching-assistant hours the platform displaces, using the institution's own numbers rather
 * than ours — a calculator with our assumptions baked in convinces nobody.
 *
 * The stated assumptions are shown, not hidden. A procurement officer will look for them, and a
 * model that cannot be checked is treated as marketing.
 */
@Component({
  selector: 'app-roi-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="roi">
      <h3>Estimate your return</h3>

      <div class="inputs">
        <label>Students
          <input type="number" min="1" [(ngModel)]="students" name="students" />
        </label>
        <label>Support hours / week
          <input type="number" min="0" [(ngModel)]="hoursPerWeek" name="hours" />
        </label>
        <label>Cost per hour (CAD)
          <input type="number" min="0" [(ngModel)]="hourlyRate" name="rate" />
        </label>
        <label>Weeks per year
          <input type="number" min="1" max="52" [(ngModel)]="weeks" name="weeks" />
        </label>
      </div>

      <dl class="result">
        <div><dt>Current support cost</dt><dd>{{ currentCost | currency: 'CAD': 'symbol-narrow': '1.0-0' }}</dd></div>
        <div><dt>Hours displaced ({{ displacementPct }}%)</dt><dd>{{ hoursSaved | number: '1.0-0' }} hrs</dd></div>
        <div><dt>Value released</dt><dd>{{ valueReleased | currency: 'CAD': 'symbol-narrow': '1.0-0' }}</dd></div>
        <div class="net" [class.positive]="netBenefit > 0">
          <dt>Net of licence ({{ licenceCost | currency: 'CAD': 'symbol-narrow': '1.0-0' }})</dt>
          <dd>{{ netBenefit | currency: 'CAD': 'symbol-narrow': '1.0-0' }}</dd>
        </div>
      </dl>

      <p class="payback" *ngIf="netBenefit > 0">
        Pays for itself in about {{ paybackMonths }} months.
      </p>

      <p class="assumption">
        Assumes the assistant handles {{ displacementPct }}% of routine questions — a planning
        assumption, not a measured result. Adjust every input above to your own numbers.
      </p>
    </section>
  `,
  styles: [`
    .roi { border: 1px solid #dfe1e6; border-radius: 12px; padding: 1.1rem 1.25rem;
           display: flex; flex-direction: column; gap: .7rem; background: #fff; }
    h3 { margin: 0; font-size: .95rem; }
    .inputs { display: grid; grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); gap: .6rem; }
    label { display: flex; flex-direction: column; gap: .2rem; font-size: .72rem; color: #5e6c84; }
    input { padding: .4rem .5rem; border: 1px solid #dfe1e6; border-radius: 5px; font: inherit; }
    .result { margin: 0; display: flex; flex-direction: column; gap: .25rem; }
    .result > div { display: flex; justify-content: space-between; font-size: .85rem; }
    dt { color: #5e6c84; } dd { margin: 0; font-weight: 700; }
    .net { border-top: 1px solid #f0f1f3; padding-top: .35rem; }
    .net.positive dd { color: #006644; }
    .payback { margin: 0; font-size: .8rem; color: #006644; font-weight: 600; }
    .assumption { margin: 0; font-size: .7rem; color: #97a0af; }
  `],
})
export class RoiCalculatorComponent {
  @Input() licenceCost = 24000;
  /** A planning assumption to be replaced with the institution's own pilot data. */
  @Input() displacementPct = 35;

  students = 1200;
  hoursPerWeek = 40;
  hourlyRate = 32;
  weeks = 34;

  get currentCost(): number {
    return this.hoursPerWeek * this.hourlyRate * this.weeks;
  }

  get hoursSaved(): number {
    return this.hoursPerWeek * this.weeks * (this.displacementPct / 100);
  }

  get valueReleased(): number {
    return this.hoursSaved * this.hourlyRate;
  }

  get netBenefit(): number {
    return this.valueReleased - this.licenceCost;
  }

  get paybackMonths(): number {
    const monthly = this.valueReleased / 12;
    return monthly > 0 ? Math.max(1, Math.ceil(this.licenceCost / monthly)) : 0;
  }
}
