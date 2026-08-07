import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Topic {
  name: string;
  mastery: number | null;
  attempts: number;
}

/**
 * Topic breakdown — portals (slides 10–12).
 *
 * Answers the question a student actually has: "what should I revise next?" Sorting by weakest
 * first is the whole point — an alphabetical list makes them do the comparison themselves. Topics
 * never attempted are held back from that ranking, because zero attempts is not the same as poor
 * performance and shouldn't be presented as failure.
 */
@Component({
  selector: 'app-topic-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ul class="topics" *ngIf="topics?.length; else empty">
      <li *ngFor="let t of ranked" (click)="select.emit(t)" [class.untried]="t.attempts === 0">
        <span class="name">{{ t.name }}</span>
        <span class="meta">
          <ng-container *ngIf="t.attempts; else notTried">
            {{ t.mastery }}% · {{ t.attempts }} {{ t.attempts === 1 ? 'attempt' : 'attempts' }}
          </ng-container>
          <ng-template #notTried>not attempted yet</ng-template>
        </span>
      </li>
    </ul>

    <ng-template #empty>
      <p class="empty">No topics yet — they appear once course material has been uploaded.</p>
    </ng-template>
  `,
  styles: [`
    .topics { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
    li { display: flex; justify-content: space-between; gap: 1rem; padding: .55rem .25rem;
         border-bottom: 1px solid #f0f1f3; cursor: pointer; font-size: .875rem; }
    li:hover { background: #fafbfc; }
    li.untried .meta { color: #97a0af; font-style: italic; }
    .name { font-weight: 600; }
    .meta { color: #5e6c84; white-space: nowrap; }
    .empty { color: #5e6c84; font-size: .9rem; }
  `],
})
export class TopicListComponent {
  @Input() topics: Topic[] = [];
  @Output() select = new EventEmitter<Topic>();

  /** Weakest attempted topics first; never-attempted ones last. */
  get ranked(): Topic[] {
    return [...(this.topics ?? [])].sort((a, b) => {
      if (!a.attempts && !b.attempts) return a.name.localeCompare(b.name);
      if (!a.attempts) return 1;
      if (!b.attempts) return -1;
      return (a.mastery ?? 0) - (b.mastery ?? 0);
    });
  }
}
