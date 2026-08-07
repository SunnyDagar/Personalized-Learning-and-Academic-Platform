import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Plan {
  key: string;
  label: string;
  pricePerYear: number;
  seats: number | null;
  features: string[];
}

/**
 * A pricing tier — business engine (slides 17–end).
 *
 * Renders one plan on the institutional pricing page. Unlimited is shown as the word rather than a
 * large number, and the current plan is marked as current instead of offering a pointless upgrade
 * button — small things, but they are what stop a pricing page reading as generated.
 */
@Component({
  selector: 'app-plan-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="plan" [class.current]="isCurrent" [class.featured]="featured">
      <header>
        <h3>{{ plan.label }}</h3>
        <span class="tag" *ngIf="isCurrent">Current plan</span>
        <span class="tag featured-tag" *ngIf="featured && !isCurrent">Most chosen</span>
      </header>

      <p class="price">
        {{ plan.pricePerYear | currency: 'CAD': 'symbol-narrow': '1.0-0' }}
        <span class="per">per year</span>
      </p>

      <p class="seats">{{ plan.seats === null ? 'Unlimited seats' : (plan.seats | number) + ' seats' }}</p>

      <ul class="features">
        <li *ngFor="let f of plan.features">{{ readable(f) }}</li>
      </ul>

      <button type="button" *ngIf="!isCurrent" (click)="choose.emit(plan)">
        Choose {{ plan.label }}
      </button>
    </article>
  `,
  styles: [`
    .plan { border: 1px solid #dfe1e6; border-radius: 12px; padding: 1.1rem 1.25rem;
            display: flex; flex-direction: column; gap: .5rem; background: #fff; }
    .plan.featured { border-color: #0052cc; box-shadow: 0 2px 10px rgba(0,82,204,.08); }
    .plan.current  { background: #fafbfc; }
    header { display: flex; align-items: center; gap: .5rem; }
    h3 { margin: 0; font-size: 1rem; }
    .tag { font-size: .62rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em;
           padding: .12rem .5rem; border-radius: 999px; background: #ebecf0; color: #42526e; }
    .featured-tag { background: #deebff; color: #0747a6; }
    .price { margin: 0; font-size: 1.5rem; font-weight: 800; }
    .per { font-size: .75rem; font-weight: 500; color: #7a869a; margin-left: .2rem; }
    .seats { margin: 0; font-size: .8rem; color: #5e6c84; }
    .features { margin: .25rem 0 0; padding-left: 1.1rem; font-size: .8rem; color: #42526e;
                display: flex; flex-direction: column; gap: .2rem; }
    button { margin-top: auto; padding: .5rem; border: 0; border-radius: 6px;
             background: #0052cc; color: #fff; cursor: pointer; font-size: .85rem; }
  `],
})
export class PlanCardComponent {
  @Input() plan!: Plan;
  @Input() currentPlan = '';
  @Input() featured = false;
  @Output() choose = new EventEmitter<Plan>();

  get isCurrent(): boolean {
    return this.plan?.key === this.currentPlan;
  }

  /** Feature keys are internal; this is what a buyer should read. */
  readable(key: string): string {
    const names: Record<string, string> = {
      ai_assistant: 'AI study assistant',
      flashcards: 'Flashcards',
      basic_analytics: 'Student progress analytics',
      assessments: 'Assessments with AI-drafted grading',
      cohort_analytics: 'Cohort and class insights',
      lms_import: 'Import from Canvas / Blackboard',
      predictive_analytics: 'Predictive at-risk analytics',
      sso: 'Single sign-on',
      audit_export: 'Audit and data export',
    };
    return names[key] ?? key.replace(/_/g, ' ');
  }
}
