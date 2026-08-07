import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * The empty state — portals (slides 10–12).
 *
 * A brand-new student signs in to a platform with no quizzes taken, no materials read and no
 * progress recorded. Every one of those screens would otherwise render as a blank panel that looks
 * broken. This turns "there is nothing here" into "here is what to do next", and is deliberately
 * distinct from the error state so users can tell a quiet start from a real failure.
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty" [class.error]="variant === 'error'">
      <div class="icon" aria-hidden="true">{{ icon }}</div>
      <h3>{{ title }}</h3>
      <p *ngIf="message">{{ message }}</p>
      <button type="button" *ngIf="actionLabel" (click)="action()">{{ actionLabel }}</button>
    </div>
  `,
  styles: [`
    .empty { display: flex; flex-direction: column; align-items: center; gap: .5rem;
             padding: 2.5rem 1.5rem; text-align: center; color: #5e6c84;
             border: 1px dashed #dfe1e6; border-radius: 10px; background: #fafbfc; }
    .empty.error { border-color: #ffbdad; background: #fff6f5; color: #bf2600; }
    .icon { font-size: 1.75rem; }
    h3 { margin: 0; font-size: .95rem; color: #172b4d; }
    .empty.error h3 { color: #bf2600; }
    p { margin: 0; font-size: .85rem; max-width: 26rem; }
    button { margin-top: .5rem; padding: .4rem .9rem; border: 0; border-radius: 5px;
             background: #0052cc; color: #fff; cursor: pointer; font-size: .85rem; }
  `],
})
export class EmptyStateComponent {
  @Input() title = 'Nothing here yet';
  @Input() message = '';
  @Input() actionLabel = '';
  @Input() variant: 'empty' | 'error' = 'empty';
  /** Optional callback so the caller decides what the button does. */
  @Input() onAction?: () => void;

  get icon(): string {
    return this.variant === 'error' ? '!' : '○';
  }

  action(): void {
    this.onAction?.();
  }
}
