import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CohortRow {
  cohort: string;
  students: number;
  avgMastery: number | null;
  atRisk: number;
}

/**
 * Cohort comparison — architecture (slides 13–16).
 *
 * Lets a programme lead see which group is falling behind rather than reading one student at a
 * time. Two deliberate choices: cohorts smaller than the threshold are suppressed, because an
 * average over three students identifies those students; and the at-risk share is shown as a
 * proportion, since a raw count says nothing without the cohort size beside it.
 */
@Component({
  selector: 'app-cohort-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <table class="cohorts" *ngIf="visible.length; else none">
      <caption class="sr-only">Mastery and at-risk share by cohort</caption>
      <thead>
        <tr>
          <th scope="col">Cohort</th>
          <th scope="col">Students</th>
          <th scope="col">Avg mastery</th>
          <th scope="col">At risk</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let r of visible">
          <th scope="row">{{ r.cohort }}</th>
          <td>{{ r.students }}</td>
          <td>{{ r.avgMastery === null ? '—' : r.avgMastery + '%' }}</td>
          <td [class.high]="riskShare(r) >= 25">
            {{ r.atRisk }} ({{ riskShare(r) }}%)
          </td>
        </tr>
      </tbody>
    </table>

    <p class="note" *ngIf="suppressed">
      {{ suppressed }} cohort(s) hidden — fewer than {{ minCohortSize }} students, so averages
      would identify individuals.
    </p>

    <ng-template #none><p class="note">No cohort data available.</p></ng-template>
  `,
  styles: [`
    .cohorts { width: 100%; border-collapse: collapse; font-size: .85rem; }
    th, td { text-align: left; padding: .45rem .6rem; border-bottom: 1px solid #f0f1f3; }
    thead th { font-size: .68rem; text-transform: uppercase; letter-spacing: .04em; color: #5e6c84; }
    td.high { color: #bf2600; font-weight: 700; }
    .note { font-size: .72rem; color: #7a869a; }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  `],
})
export class CohortTableComponent {
  @Input() rows: CohortRow[] = [];
  /** Privacy floor — below this a cohort average describes individuals. */
  @Input() minCohortSize = 5;

  get visible(): CohortRow[] {
    return (this.rows ?? []).filter(r => r.students >= this.minCohortSize);
  }

  get suppressed(): number {
    return (this.rows ?? []).length - this.visible.length;
  }

  riskShare(r: CohortRow): number {
    return r.students ? Math.round((r.atRisk / r.students) * 100) : 0;
  }
}
