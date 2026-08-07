import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * The ask box — data & retrieval (slides 6–9).
 *
 * Where every retrieval starts. Two things it guards, both of which cost real money if left to the
 * server: an empty or punctuation-only question retrieves nothing but still pays for an embedding
 * call, and a double submit fires the same expensive question twice. Both are stopped here, which
 * mirrors payload_limits.php and request_dedupe.php on the edge.
 *
 * The character counter appears only as the limit approaches — a counter on an empty box is noise.
 */
@Component({
  selector: 'app-query-box',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <form class="ask" (ngSubmit)="submit()">
      <label class="sr-only" for="q">Ask a question about {{ courseName || 'this course' }}</label>

      <textarea id="q" rows="3" [(ngModel)]="text" name="q"
                [disabled]="busy"
                [attr.maxlength]="maxChars"
                [placeholder]="placeholder"
                (keydown)="onKeydown($event)"></textarea>

      <div class="foot">
        <span class="counter" *ngIf="nearLimit" [class.over]="remaining <= 0">
          {{ remaining }} characters left
        </span>
        <span class="hint" *ngIf="!nearLimit">Ctrl + Enter to send</span>

        <button type="submit" [disabled]="!canSend">
          {{ busy ? 'Thinking…' : 'Ask' }}
        </button>
      </div>
    </form>
  `,
  styles: [`
    .ask { display: flex; flex-direction: column; gap: .4rem; }
    textarea { width: 100%; padding: .6rem .7rem; border: 1px solid #dfe1e6;
               border-radius: 8px; font: inherit; resize: vertical; }
    textarea:disabled { background: #fafbfc; color: #7a869a; }
    .foot { display: flex; align-items: center; justify-content: space-between; gap: .75rem; }
    .counter, .hint { font-size: .72rem; color: #7a869a; }
    .counter.over { color: #bf2600; font-weight: 700; }
    button { padding: .45rem 1.1rem; border: 0; border-radius: 6px;
             background: #0052cc; color: #fff; cursor: pointer; font-size: .85rem; }
    button[disabled] { opacity: .5; cursor: not-allowed; }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  `],
})
export class QueryBoxComponent {
  @Input() courseName = '';
  /** True while an answer is in flight — blocks the duplicate submit. */
  @Input() busy = false;
  @Input() maxChars = 2000;
  @Output() ask = new EventEmitter<string>();

  text = '';

  get placeholder(): string {
    return this.courseName
      ? `Ask anything about ${this.courseName}…`
      : 'Ask a question about your course material…';
  }

  get remaining(): number {
    return this.maxChars - this.text.length;
  }

  get nearLimit(): boolean {
    return this.remaining <= 150;
  }

  /** Must contain an actual word — punctuation alone retrieves nothing. */
  get hasContent(): boolean {
    return /[\p{L}\p{N}]/u.test(this.text);
  }

  get canSend(): boolean {
    return !this.busy && this.hasContent && this.remaining >= 0;
  }

  onKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.submit();
    }
  }

  submit(): void {
    if (!this.canSend) return;
    this.ask.emit(this.text.trim());
    this.text = '';
  }
}
