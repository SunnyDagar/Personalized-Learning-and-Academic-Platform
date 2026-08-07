import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Flashcard {
  front: string;
  back: string;
}

/**
 * The flashcard study view — portals (slides 10–12).
 *
 * Cards are generated from the professor's own material, so a deck can legitimately arrive empty
 * (nothing uploaded yet) or with a single card. Both are handled explicitly: an empty deck shows a
 * message rather than a broken control, and "next" wraps instead of running off the end.
 */
@Component({
  selector: 'app-flashcard-deck',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="deck" *ngIf="cards?.length; else empty">
      <p class="count">Card {{ index + 1 }} of {{ cards.length }}</p>

      <button type="button" class="card" (click)="flip()"
              [attr.aria-label]="flipped ? 'Showing answer. Activate to hide.' : 'Showing question. Activate to reveal answer.'">
        <span class="face">{{ flipped ? current.back : current.front }}</span>
        <span class="hint">{{ flipped ? 'answer' : 'tap to reveal' }}</span>
      </button>

      <div class="controls">
        <button type="button" (click)="prev()" [disabled]="cards.length < 2">Previous</button>
        <button type="button" (click)="shuffle()" [disabled]="cards.length < 2">Shuffle</button>
        <button type="button" (click)="next()" [disabled]="cards.length < 2">Next</button>
      </div>
    </div>

    <ng-template #empty>
      <p class="empty">No flashcards yet — they appear once your professor uploads course material.</p>
    </ng-template>
  `,
  styles: [`
    .deck { display: flex; flex-direction: column; gap: .75rem; max-width: 30rem; }
    .count { font-size: .75rem; color: #5e6c84; margin: 0; }
    .card { min-height: 9rem; padding: 1.25rem; border: 1px solid #dfe1e6; border-radius: 10px;
            background: #fff; cursor: pointer; display: flex; flex-direction: column;
            justify-content: center; gap: .75rem; text-align: center; font: inherit; }
    .face { font-size: 1.05rem; line-height: 1.5; }
    .hint { font-size: .7rem; color: #97a0af; text-transform: uppercase; letter-spacing: .05em; }
    .controls { display: flex; gap: .5rem; }
    .controls button { flex: 1; padding: .45rem; border: 1px solid #dfe1e6; border-radius: 6px;
                       background: #fafbfc; cursor: pointer; }
    .controls button[disabled] { opacity: .5; cursor: not-allowed; }
    .empty { color: #5e6c84; font-size: .9rem; }
  `],
})
export class FlashcardDeckComponent {
  @Input() cards: Flashcard[] = [];

  index = 0;
  flipped = false;

  get current(): Flashcard {
    return this.cards[this.index] ?? { front: '', back: '' };
  }

  flip(): void {
    this.flipped = !this.flipped;
  }

  /** Wraps, so the controls never reach a dead end. */
  next(): void {
    if (!this.cards.length) return;
    this.index = (this.index + 1) % this.cards.length;
    this.flipped = false;
  }

  prev(): void {
    if (!this.cards.length) return;
    this.index = (this.index - 1 + this.cards.length) % this.cards.length;
    this.flipped = false;
  }

  /** Fisher-Yates on a copy — the input array belongs to the caller. */
  shuffle(): void {
    const out = [...this.cards];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    this.cards = out;
    this.index = 0;
    this.flipped = false;
  }
}
