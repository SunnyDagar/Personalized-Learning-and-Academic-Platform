/**
 * Mastery card — Arnold Babu (student & professor portals, slides 10–12).
 *
 * One topic, one bar. Used on the student progress dashboard and reused in the professor's
 * class view. Colour follows the same thresholds as the analytics module so a student and
 * their instructor always read the same signal.
 */
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mastery-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="row">
      <div class="head">
        <span class="topic">{{ topic }}</span>
        <span class="val">{{ mastery }}%<span class="muted"> · {{ attempts }} tries</span></span>
      </div>
      <div class="track"><div class="bar" [style.width.%]="mastery" [style.background]="colour()"></div></div>
    </div>
  `,
  styles: [`
    .row { margin-bottom:12px; }
    .head { display:flex; justify-content:space-between; font-size:.88rem; margin-bottom:4px; }
    .topic { font-weight:600; color:#1a2433; }
    .muted { color:#7a8699; font-weight:400; }
    .track { height:10px; background:#eef1f5; border-radius:999px; overflow:hidden; }
    .bar { height:100%; border-radius:999px; transition:width .4s ease; }
  `],
})
export class MasteryCardComponent {
  @Input() topic = '';
  @Input() mastery = 0;
  @Input() attempts = 0;

  /** < 60 needs work · < 80 improving · otherwise on track */
  colour(): string {
    return this.mastery < 60 ? '#d03b3b' : this.mastery < 80 ? '#ec835a' : '#0ca30c';
  }
}
