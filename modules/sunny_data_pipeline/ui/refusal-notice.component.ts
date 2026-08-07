import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * The refusal — data & retrieval (slides 6–9).
 *
 * This is the visible face of the grounding gate. When nothing in the course material clears the
 * 0.62 similarity threshold, the assistant declines *before* the language model is called, so
 * there is no answer to show and nothing was invented.
 *
 * Presenting that well matters more than it sounds. A refusal that looks like an error teaches
 * students the tool is broken; a refusal that explains itself teaches them what it is for. So this
 * is styled as information, states plainly that the topic is not in this course's material, and
 * always offers a way forward.
 */
@Component({
  selector: 'app-refusal-notice',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="refusal" role="status">
      <p class="lead">
        I could not find this in <strong>{{ courseName || 'this course' }}</strong>’s material,
        so I have not answered rather than guess.
      </p>

      <p class="why">
        I only answer from what your professor has uploaded. That is deliberate — it is why you can
        trust the answers you do get.
      </p>

      <ul class="suggestions">
        <li>Try naming the topic as your professor words it</li>
        <li>Check whether it belongs to one of your other courses</li>
        <li *ngIf="canAskProfessor">Ask your professor — they can upload material covering it</li>
      </ul>

      <div class="actions">
        <button type="button" (click)="rephrase.emit()">Rephrase question</button>
        <button type="button" class="ghost" *ngIf="canAskProfessor" (click)="askProfessor.emit()">
          Ask my professor
        </button>
      </div>
    </div>
  `,
  styles: [`
    .refusal { border: 1px solid #b3d4ff; background: #f4f8ff; border-radius: 10px;
               padding: 1rem 1.15rem; display: flex; flex-direction: column; gap: .5rem; }
    .lead { margin: 0; font-size: .9rem; color: #172b4d; }
    .why  { margin: 0; font-size: .8rem; color: #5e6c84; }
    .suggestions { margin: 0; padding-left: 1.1rem; font-size: .8rem; color: #42526e;
                   display: flex; flex-direction: column; gap: .15rem; }
    .actions { display: flex; gap: .5rem; margin-top: .25rem; }
    button { padding: .4rem .8rem; border: 0; border-radius: 6px; font-size: .8rem;
             background: #0052cc; color: #fff; cursor: pointer; }
    button.ghost { background: transparent; color: #0052cc; border: 1px solid #b3d4ff; }
  `],
})
export class RefusalNoticeComponent {
  @Input() courseName = '';
  @Input() canAskProfessor = true;
  @Output() rephrase = new EventEmitter<void>();
  @Output() askProfessor = new EventEmitter<void>();
}
