import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Password feedback — core foundations (slides 1–5).
 *
 * Shown live while someone sets a password at sign-up. It mirrors the rules in
 * backend/input_validation.php exactly, so a user never passes the meter and is then rejected by
 * the server — the commonest way this pattern goes wrong.
 *
 * Length is weighted above character classes because it is what actually resists guessing. The
 * unmet requirements are listed rather than only scored, since "weak" with no explanation gives
 * people nothing to act on.
 */
@Component({
  selector: 'app-password-strength',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="strength" *ngIf="password">
      <div class="bars" [attr.aria-label]="'Password strength: ' + label" role="img">
        <span *ngFor="let i of [0, 1, 2, 3]" class="bar" [class.on]="i < score" [class]="band"></span>
      </div>

      <p class="label" [class]="band">{{ label }}</p>

      <ul class="unmet" *ngIf="problems.length">
        <li *ngFor="let p of problems">Password {{ p }}</li>
      </ul>
    </div>
  `,
  styles: [`
    .strength { display: flex; flex-direction: column; gap: .25rem; }
    .bars { display: flex; gap: .2rem; }
    .bar { flex: 1; height: 4px; border-radius: 2px; background: #ebecf0; }
    .bar.on.weak   { background: #ff5630; }
    .bar.on.fair   { background: #ffab00; }
    .bar.on.strong { background: #36b37e; }
    .label { margin: 0; font-size: .72rem; font-weight: 700; }
    .label.weak { color: #bf2600; } .label.fair { color: #7a4a00; } .label.strong { color: #006644; }
    .unmet { margin: 0; padding-left: 1rem; font-size: .72rem; color: #7a869a; }
  `],
})
export class PasswordStrengthComponent {
  @Input() password = '';

  /** Must match password_problems() in backend/input_validation.php. */
  get problems(): string[] {
    const p = this.password;
    const out: string[] = [];
    if (p.length < 10) out.push('must be at least 10 characters');
    if (!/[a-zA-Z]/.test(p)) out.push('must include a letter');
    if (!/\d/.test(p)) out.push('must include a number');
    if (/^(password|welcome|durham|learnify)/i.test(p)) out.push('is too easy to guess');
    return out;
  }

  /** 0–4. Length carries the most weight. */
  get score(): number {
    const p = this.password;
    if (!p) return 0;
    if (this.problems.length) return p.length >= 6 ? 1 : 0;

    let s = 2;
    if (p.length >= 14) s++;
    if (/[^a-zA-Z0-9]/.test(p) || p.length >= 18) s++;
    return Math.min(4, s);
  }

  get band(): 'weak' | 'fair' | 'strong' {
    if (this.score <= 1) return 'weak';
    return this.score === 2 ? 'fair' : 'strong';
  }

  get label(): string {
    return { weak: 'Not strong enough yet', fair: 'Acceptable', strong: 'Strong password' }[this.band];
  }
}
