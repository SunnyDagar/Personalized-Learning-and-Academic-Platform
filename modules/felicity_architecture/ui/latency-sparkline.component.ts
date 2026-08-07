import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Latency trend — architecture (slides 13–16).
 *
 * Hand-drawn SVG rather than a charting library: the whole shape is a polyline over a fixed
 * viewBox, which is a few lines of arithmetic against roughly 300 KB of dependency for a graphic
 * this simple. It also keeps the client bundle free of a third-party licence.
 *
 * The awkward inputs are handled deliberately — no data, a single point, and a flat series all
 * have to render without dividing by zero.
 */
@Component({
  selector: 'app-latency-sparkline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <figure class="spark">
      <figcaption>
        {{ label }}
        <span class="latest" *ngIf="points.length">{{ points[points.length - 1] }}{{ unit }}</span>
      </figcaption>

      <svg *ngIf="points.length > 1; else tooFew"
           [attr.viewBox]="'0 0 ' + width + ' ' + height"
           preserveAspectRatio="none" role="img"
           [attr.aria-label]="label + ': ' + points.length + ' readings, latest ' + points[points.length - 1] + unit">
        <line *ngIf="threshold" class="threshold"
              x1="0" [attr.y1]="thresholdY" [attr.x2]="width" [attr.y2]="thresholdY" />
        <polyline class="line" [attr.points]="polyline" />
      </svg>

      <ng-template #tooFew>
        <p class="thin">Not enough readings yet</p>
      </ng-template>
    </figure>
  `,
  styles: [`
    .spark { margin: 0; display: flex; flex-direction: column; gap: .2rem; }
    figcaption { display: flex; justify-content: space-between; font-size: .75rem; color: #5e6c84; }
    .latest { font-weight: 700; color: #172b4d; }
    svg { width: 100%; height: 40px; }
    .line { fill: none; stroke: #0052cc; stroke-width: 2; vector-effect: non-scaling-stroke; }
    .threshold { stroke: #ff8b00; stroke-width: 1; stroke-dasharray: 3 3; vector-effect: non-scaling-stroke; }
    .thin { margin: 0; font-size: .72rem; color: #97a0af; }
  `],
})
export class LatencySparklineComponent {
  @Input() label = 'Latency';
  @Input() points: number[] = [];
  @Input() unit = 'ms';
  /** Optional target line, e.g. the p95 SLO. */
  @Input() threshold: number | null = null;

  readonly width = 100;
  readonly height = 30;

  private get min(): number {
    return Math.min(...this.points, ...(this.threshold !== null ? [this.threshold] : []));
  }

  private get max(): number {
    return Math.max(...this.points, ...(this.threshold !== null ? [this.threshold] : []));
  }

  /** Guards the flat-series case, where max - min is zero. */
  private y(value: number): number {
    const span = this.max - this.min;
    if (span === 0) return this.height / 2;
    return this.height - ((value - this.min) / span) * this.height;
  }

  get polyline(): string {
    const step = this.width / (this.points.length - 1);
    return this.points.map((v, i) => `${(i * step).toFixed(1)},${this.y(v).toFixed(1)}`).join(' ');
  }

  get thresholdY(): number {
    return this.threshold === null ? 0 : this.y(this.threshold);
  }
}
