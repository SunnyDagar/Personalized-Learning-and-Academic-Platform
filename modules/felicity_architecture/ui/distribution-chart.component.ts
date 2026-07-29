/**
 * Grade distribution chart — Félicité Gamgne Domgue (analytics visualisation, slides 13–16).
 *
 * Hand-drawn SVG rather than a charting dependency: the dataset is small, and it keeps the
 * client bundle light (a deliberate trade-off recorded in the deck's "planned for production"
 * column). Reads the distribution map returned by /analytics/course/{id}.
 */
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-distribution-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg viewBox="0 0 520 170" width="100%" height="170" *ngIf="buckets().length">
      <line x1="26" y1="140" x2="510" y2="140" stroke="#c3c2b7"/>
      <g *ngFor="let b of buckets(); let i = index">
        <rect *ngIf="b.v" [attr.x]="56 + i*92" [attr.y]="140 - scale(b.v)"
              width="46" [attr.height]="scale(b.v)" [attr.fill]="palette[i]" rx="3"/>
        <text *ngIf="b.v" [attr.x]="79 + i*92" [attr.y]="132 - scale(b.v)"
              font-size="10" font-weight="600" text-anchor="middle" fill="#1a2433">{{ b.v }}</text>
        <text [attr.x]="79 + i*92" y="156" font-size="9.5" text-anchor="middle" fill="#7a8699">{{ b.k }}</text>
      </g>
    </svg>
  `,
})
export class DistributionChartComponent {
  /** e.g. { "0–49": 3, "50–69": 8, "70–79": 12, "80–89": 9, "90–100": 6 } */
  @Input() distribution: Record<string, number> = {};
  palette = ['#86b6ef', '#5598e7', '#2a78d6', '#1c5cab', '#104281'];

  buckets() { return Object.keys(this.distribution).map(k => ({ k, v: this.distribution[k] })); }
  private max() { return Math.max(1, ...Object.values(this.distribution)); }
  scale(v: number) { return Math.round((v / this.max()) * 110); }
}
