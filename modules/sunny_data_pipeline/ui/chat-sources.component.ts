/**
 * Source citation strip — Surender (Sunny) Dagar (assistant surface, slides 6–9).
 *
 * Displays which course chunks an answer was grounded in. This is the visible half of the
 * grounding guarantee: if the assistant answered, it shows what it answered *from*. When the
 * scope gate refuses, there are no sources and the strip renders nothing.
 */
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Source { title: string; chunk: number | string; }

@Component({
  selector: 'app-chat-sources',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sources" *ngIf="sources?.length">
      <span class="label">Grounded in:</span>
      <span class="pill" *ngFor="let s of sources">{{ s.title }} #{{ s.chunk }}</span>
    </div>
  `,
  styles: [`
    .sources { display:flex; flex-wrap:wrap; gap:6px; align-items:center; margin-top:8px; }
    .label { font-size:.78rem; color:#7a8699; font-weight:600; }
    .pill { background:#eef2f7; color:#2b6cb0; border-radius:999px;
            padding:2px 10px; font-size:.75rem; font-weight:600; }
  `],
})
export class ChatSourcesComponent {
  @Input() sources: Source[] = [];
}
