import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface AnswerSource {
  title: string;
  chunk: number;
  score?: number;
}

/**
 * Answer provenance — data & retrieval (slides 6–9).
 *
 * Every answer names the passages it was built from. This is what separates the assistant from a
 * general chatbot: a student can open the source and check, and a professor can see that answers
 * come from their own material rather than the open internet.
 *
 * Similarity scores are shown as a qualitative band, not a raw number. "0.71" invites students to
 * treat it as a confidence percentage, which it is not — it is a distance between embeddings.
 */
@Component({
  selector: 'app-source-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="sources" *ngIf="sources?.length">
      <h4>Based on {{ sources.length }} {{ sources.length === 1 ? 'passage' : 'passages' }} from your course material</h4>

      <ul>
        <li *ngFor="let s of sources" (click)="open.emit(s)">
          <span class="title">{{ s.title }}</span>
          <span class="detail">
            passage {{ s.chunk }}
            <span class="strength" *ngIf="s.score !== undefined">· {{ strength(s.score) }} match</span>
          </span>
        </li>
      </ul>

      <p class="note">Answers are drawn only from material uploaded to this course.</p>
    </section>
  `,
  styles: [`
    .sources { border-top: 1px solid #f0f1f3; padding-top: .6rem; margin-top: .75rem; }
    h4 { margin: 0 0 .4rem; font-size: .72rem; text-transform: uppercase;
         letter-spacing: .04em; color: #7a869a; font-weight: 700; }
    ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .2rem; }
    li { display: flex; justify-content: space-between; gap: .75rem; padding: .3rem .4rem;
         border-radius: 5px; cursor: pointer; font-size: .8rem; }
    li:hover { background: #f4f5f7; }
    .title { font-weight: 600; color: #0052cc; }
    .detail { color: #7a869a; white-space: nowrap; }
    .note { margin: .45rem 0 0; font-size: .68rem; color: #97a0af; }
  `],
})
export class SourceListComponent {
  @Input() sources: AnswerSource[] = [];
  @Output() open = new EventEmitter<AnswerSource>();

  /** Bands, not numbers — a cosine score is not a confidence percentage. */
  strength(score: number): string {
    if (score >= 0.8) return 'very close';
    if (score >= 0.7) return 'close';
    return 'related';
  }
}
