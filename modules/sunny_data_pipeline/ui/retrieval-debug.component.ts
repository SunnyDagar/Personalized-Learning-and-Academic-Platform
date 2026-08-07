import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Candidate {
  title: string;
  chunk: number;
  score: number;
}

/**
 * Retrieval inspector — data & retrieval (slides 6–9).
 *
 * A professor-only view showing every candidate passage the query scored against, and where the
 * 0.62 threshold fell. It answers the question professors actually ask: "why did it refuse when I
 * know I uploaded that?" — usually because the wording in the material differs from the student's.
 *
 * It is also the honest way to present the gate: the threshold is a measured choice, and this shows
 * the evidence rather than asking anyone to take it on trust.
 */
@Component({
  selector: 'app-retrieval-debug',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="debug" *ngIf="candidates?.length; else nothing">
      <header>
        <h4>Retrieval detail</h4>
        <span class="verdict" [class.refused]="!anyAboveThreshold">
          {{ anyAboveThreshold ? 'Answered' : 'Refused — nothing cleared the threshold' }}
        </span>
      </header>

      <ol class="rows">
        <li *ngFor="let c of ranked" [class.above]="c.score >= threshold">
          <span class="rank-title">{{ c.title }} <span class="chunk">#{{ c.chunk }}</span></span>
          <span class="bar"><span class="fill" [style.width.%]="c.score * 100"></span></span>
          <span class="score">{{ c.score | number: '1.3-3' }}</span>
        </li>
      </ol>

      <p class="legend">
        Threshold <strong>{{ threshold }}</strong>. Passages below it are never sent to the model,
        so an unsupported answer cannot be generated.
      </p>
    </section>

    <ng-template #nothing>
      <p class="legend">No passages were scored — this course has no material uploaded yet.</p>
    </ng-template>
  `,
  styles: [`
    .debug { border: 1px solid #dfe1e6; border-radius: 10px; padding: .85rem 1rem;
             display: flex; flex-direction: column; gap: .5rem; background: #fff; }
    header { display: flex; justify-content: space-between; align-items: baseline; }
    h4 { margin: 0; font-size: .78rem; text-transform: uppercase; letter-spacing: .04em; color: #7a869a; }
    .verdict { font-size: .72rem; font-weight: 700; color: #006644; }
    .verdict.refused { color: #bf2600; }
    .rows { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .25rem; }
    li { display: grid; grid-template-columns: 1fr 6rem 3rem; gap: .6rem;
         align-items: center; font-size: .78rem; color: #7a869a; }
    li.above { color: #172b4d; font-weight: 600; }
    .chunk { color: #97a0af; font-weight: 400; }
    .bar { height: 6px; background: #ebecf0; border-radius: 4px; overflow: hidden; }
    .fill { display: block; height: 100%; background: #c1c7d0; }
    li.above .fill { background: #36b37e; }
    .score { text-align: right; font-variant-numeric: tabular-nums; }
    .legend { margin: 0; font-size: .7rem; color: #7a869a; }
  `],
})
export class RetrievalDebugComponent {
  @Input() candidates: Candidate[] = [];
  /** Mirrors MIN_SIM in retrieval/search.py. */
  @Input() threshold = 0.62;

  get ranked(): Candidate[] {
    return [...(this.candidates ?? [])].sort((a, b) => b.score - a.score);
  }

  get anyAboveThreshold(): boolean {
    return this.ranked.some(c => c.score >= this.threshold);
  }
}
