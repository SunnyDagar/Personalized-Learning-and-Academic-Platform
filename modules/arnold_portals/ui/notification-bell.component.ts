import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Notice {
  id: number;
  text: string;
  at: string;
  read: boolean;
  kind?: 'grade' | 'appointment' | 'material' | 'system';
}

/**
 * Notifications — portals (slides 10–12).
 *
 * Shared by both portals. The unread count is capped at "9+" because a three-digit number in a
 * badge breaks the header layout and, past a point, the exact figure stops mattering. Grades are
 * marked distinctly: a released grade is the one notification students open immediately, and
 * burying it among material updates is the fastest way to make the feature useless.
 */
@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bell-wrap">
      <button type="button" class="bell" (click)="toggle()"
              [attr.aria-expanded]="open"
              [attr.aria-label]="unread ? unread + ' unread notifications' : 'Notifications'">
        <span aria-hidden="true">◔</span>
        <span class="badge" *ngIf="unread">{{ badge }}</span>
      </button>

      <div class="panel" *ngIf="open">
        <header>
          <span>Notifications</span>
          <button type="button" class="link" *ngIf="unread" (click)="markAll.emit()">
            Mark all read
          </button>
        </header>

        <ul *ngIf="notices?.length; else none">
          <li *ngFor="let n of recent" [class.unread]="!n.read" [class]="n.kind || 'system'"
              (click)="select.emit(n)">
            <span class="text">{{ n.text }}</span>
            <span class="at">{{ n.at }}</span>
          </li>
        </ul>

        <ng-template #none><p class="none">Nothing new.</p></ng-template>
      </div>
    </div>
  `,
  styles: [`
    .bell-wrap { position: relative; }
    .bell { position: relative; border: 0; background: transparent; cursor: pointer;
            font-size: 1.1rem; padding: .25rem .4rem; }
    .badge { position: absolute; top: -2px; right: -4px; background: #ff5630; color: #fff;
             border-radius: 999px; font-size: .6rem; font-weight: 700; padding: .05rem .3rem; }
    .panel { position: absolute; right: 0; top: 2rem; width: 20rem; z-index: 20;
             background: #fff; border: 1px solid #dfe1e6; border-radius: 10px;
             box-shadow: 0 4px 16px rgba(9,30,66,.15); overflow: hidden; }
    header { display: flex; justify-content: space-between; align-items: center;
             padding: .5rem .75rem; border-bottom: 1px solid #f0f1f3; font-size: .78rem; color: #5e6c84; }
    .link { border: 0; background: none; color: #0052cc; cursor: pointer; font-size: .72rem; }
    ul { list-style: none; margin: 0; padding: 0; max-height: 18rem; overflow-y: auto; }
    li { display: flex; flex-direction: column; gap: .1rem; padding: .5rem .75rem;
         border-bottom: 1px solid #f7f8f9; cursor: pointer; font-size: .8rem; }
    li:hover { background: #fafbfc; }
    li.unread { background: #f4f8ff; font-weight: 600; }
    li.grade { border-left: 3px solid #36b37e; }
    .at { font-size: .68rem; color: #97a0af; }
    .none { padding: .9rem .75rem; margin: 0; font-size: .8rem; color: #7a869a; }
  `],
})
export class NotificationBellComponent {
  @Input() notices: Notice[] = [];
  @Input() maxVisible = 8;
  @Output() select = new EventEmitter<Notice>();
  @Output() markAll = new EventEmitter<void>();

  open = false;

  get unread(): number {
    return (this.notices ?? []).filter(n => !n.read).length;
  }

  /** Past 9 the exact number stops being useful and breaks the header. */
  get badge(): string {
    return this.unread > 9 ? '9+' : String(this.unread);
  }

  /** Unread first, then newest. */
  get recent(): Notice[] {
    return [...(this.notices ?? [])]
      .sort((a, b) => Number(a.read) - Number(b.read))
      .slice(0, this.maxVisible);
  }

  toggle(): void {
    this.open = !this.open;
  }
}
