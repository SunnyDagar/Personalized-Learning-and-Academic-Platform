import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * A single progress reading — portals (slides 10–12).
 *
 * Used across both portals for mastery, completion and quiz scores. The thresholds match the
 * professor's class view so a student and their professor never see the same number described
 * differently. Colour is never the only signal: the percentage is always shown as text, and the
 * bar carries proper ARIA values for screen readers.
 */
@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="wrap">
      <div class="head">
        <span class="label">{{ label }}</span>
        <span class="value">{{ hasValue ? (safe | number: '1.0-0') + '%' : '—' }}</span>
      </div>

      <div class="track"
           role="progressbar"
           [attr.aria-valuenow]="hasValue ? safe : null"
           aria-valuemin="0" aria-valuemax="100"
           [attr.aria-label]="label">
        <span class="fill" [class]="band" [style.width.%]="safe"></span>
      </div>

      <p class="band-label" *ngIf="hasValue">{{ bandLabel }}</p>
    </div>
  `,
  styles: [`
    .wrap { display: flex; flex-direction: column; gap: .3rem; }
    .head { display: flex; justify-content: space-between; font-size: .8rem; }
    .label { color: #5e6c84; }
    .value { font-weight: 700; }
    .track { height: 8px; background: #ebecf0; border-radius: 5px; overflow: hidden; }
    .fill { display: block; height: 100%; transition: width .3s ease; }
    .fill.strong  { background: #36b37e; }
    .fill.working { background: #ffab00; }
    .fill.weak    { background: #ff5630; }
    .band-label { margin: 0; font-size: .7rem; color: #7a869a; }
  `],
})
export class ProgressBarComponent {
  @Input() label = 'Progress';
  /** null when there is genuinely no data — shown as "—", never as 0%. */
  @Input() value: number | null = null;

  get hasValue(): boolean {
    return this.value !== null && !Number.isNaN(this.value);
  }

  /** Clamped, so a bad figure can never paint outside the track. */
  get safe(): number {
    if (!this.hasValue) return 0;
    return Math.min(100, Math.max(0, this.value as number));
  }

  get band(): 'strong' | 'working' | 'weak' {
    if (this.safe >= 75) return 'strong';
    if (this.safe >= 50) return 'working';
    return 'weak';
  }

  get bandLabel(): string {
    return { strong: 'On track', working: 'Needs practice', weak: 'Needs attention' }[this.band];
  }
}
