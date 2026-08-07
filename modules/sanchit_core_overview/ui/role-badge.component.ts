import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Shows which role the current view is being served under.
 *
 * The platform renders very different screens for a student and a professor, and during the pilot
 * the commonest confusion was people not realising which account they were signed in as. This is a
 * presentation cue only — the server enforces what each role may actually do.
 */
@Component({
  selector: 'app-role-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [class.professor]="isProfessor" [class.student]="!isProfessor">
      {{ label }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-block; padding: .15rem .6rem; border-radius: 999px;
      font-size: .72rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
    }
    .student    { background: #e7f0ff; color: #1a45a0; }
    .professor  { background: #e6f6ec; color: #14683a; }
  `],
})
export class RoleBadgeComponent {
  /** Pass a role explicitly, or leave unset to read the stored one. */
  @Input() role?: string;

  get resolved(): string {
    return (this.role ?? localStorage.getItem('user_role') ?? 'guest').toLowerCase();
  }

  get isProfessor(): boolean {
    return this.resolved === 'professor';
  }

  get label(): string {
    const names: Record<string, string> = {
      student: 'Student',
      professor: 'Professor',
      guest: 'Signed out',
    };
    return names[this.resolved] ?? this.resolved;
  }
}
