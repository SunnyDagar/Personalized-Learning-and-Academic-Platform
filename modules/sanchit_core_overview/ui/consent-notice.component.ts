import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Privacy consent at sign-up — core foundations (slides 1–5).
 *
 * Added in response to the privacy and PII feedback on the proposal. An institutional buyer's
 * security review will ask what students were told and when they agreed, so consent is collected
 * explicitly at the point of account creation rather than buried in a terms link.
 *
 * The checkbox starts unticked and the button stays disabled until it is ticked — a pre-ticked box
 * is not consent under GDPR, and a Canadian institution's counsel will check that.
 */
@Component({
  selector: 'app-consent-notice',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="consent">
      <h3>How your data is used</h3>

      <ul>
        <li>Your questions are used to find relevant passages in <strong>your course material only</strong>.</li>
        <li>Quiz and progress data is visible to <strong>you and the professor teaching that course</strong>.</li>
        <li>Your questions are <strong>never used to train AI models</strong>.</li>
        <li>You can request a copy of your data, or its deletion, at any time.</li>
      </ul>

      <label class="agree">
        <input type="checkbox" [(ngModel)]="agreed" name="agreed"
               (ngModelChange)="agreedChange.emit(agreed)" />
        <span>I have read and agree to the privacy notice{{ institution ? ' for ' + institution : '' }}.</span>
      </label>

      <p class="link" *ngIf="policyUrl">
        <a [href]="policyUrl" target="_blank" rel="noopener">Read the full privacy policy</a>
      </p>
    </section>
  `,
  styles: [`
    .consent { border: 1px solid #dfe1e6; border-radius: 10px; padding: 1rem 1.15rem;
               display: flex; flex-direction: column; gap: .5rem; background: #fafbfc; }
    h3 { margin: 0; font-size: .85rem; color: #172b4d; }
    ul { margin: 0; padding-left: 1.1rem; font-size: .8rem; color: #42526e;
         display: flex; flex-direction: column; gap: .2rem; }
    .agree { display: flex; gap: .5rem; align-items: flex-start; font-size: .8rem; color: #172b4d; }
    .agree input { margin-top: .15rem; }
    .link { margin: 0; font-size: .75rem; }
  `],
})
export class ConsentNoticeComponent {
  @Input() institution = '';
  @Input() policyUrl = '';
  /** Never pre-ticked — silence is not consent. */
  @Input() agreed = false;
  @Output() agreedChange = new EventEmitter<boolean>();
}
