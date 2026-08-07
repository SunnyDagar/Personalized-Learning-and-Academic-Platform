import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface InvoiceLine {
  description: string;
  quantity: number;
  unit: number;
  amount: number;
}

/**
 * Billing summary — business engine (slides 17–end).
 *
 * The administrator's view of what this period costs, rendered from invoice_preview.php. Overage
 * is called out rather than left to be discovered in the totals: a customer surprised by a charge
 * churns, and losing the renewal costs far more than the overage was worth.
 *
 * A preview, clearly labelled as such — the hosted service issues the actual invoice.
 */
@Component({
  selector: 'app-billing-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="billing">
      <header>
        <h3>Estimated charges</h3>
        <span class="period">{{ period }}</span>
      </header>

      <div class="alert" *ngIf="hasOverage">
        Usage has passed your plan allowance this period. The extra is itemised below.
      </div>

      <table>
        <tbody>
          <tr *ngFor="let l of lines" [class.overage]="l.quantity > 1">
            <td class="desc">{{ l.description }}</td>
            <td class="amt">{{ l.amount | currency: currency: 'symbol-narrow': '1.2-2' }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr><td class="desc">Subtotal</td><td class="amt">{{ subtotal | currency: currency: 'symbol-narrow': '1.2-2' }}</td></tr>
          <tr><td class="desc">HST ({{ taxRate * 100 | number: '1.0-0' }}%)</td><td class="amt">{{ tax | currency: currency: 'symbol-narrow': '1.2-2' }}</td></tr>
          <tr class="total"><td class="desc">Total</td><td class="amt">{{ total | currency: currency: 'symbol-narrow': '1.2-2' }}</td></tr>
        </tfoot>
      </table>

      <p class="note">
        This is an estimate for the current period. Your invoice is issued by your provider and is
        the authoritative figure.
      </p>
    </section>
  `,
  styles: [`
    .billing { border: 1px solid #dfe1e6; border-radius: 12px; padding: 1rem 1.15rem;
               display: flex; flex-direction: column; gap: .6rem; background: #fff; }
    header { display: flex; justify-content: space-between; align-items: baseline; }
    h3 { margin: 0; font-size: .95rem; }
    .period { font-size: .75rem; color: #7a869a; }
    .alert { background: #fff4e5; color: #7a4a00; border-radius: 6px;
             padding: .45rem .7rem; font-size: .78rem; }
    table { width: 100%; border-collapse: collapse; font-size: .82rem; }
    td { padding: .35rem 0; }
    .desc { color: #42526e; }
    .amt { text-align: right; font-variant-numeric: tabular-nums; }
    tr.overage .desc { color: #7a4a00; }
    tfoot td { border-top: 1px solid #f0f1f3; padding-top: .45rem; }
    tr.total td { font-weight: 800; font-size: .9rem; border-top: 2px solid #dfe1e6; }
    .note { margin: 0; font-size: .68rem; color: #97a0af; }
  `],
})
export class BillingSummaryComponent {
  @Input() period = '';
  @Input() lines: InvoiceLine[] = [];
  @Input() subtotal = 0;
  @Input() tax = 0;
  @Input() taxRate = 0.13;
  @Input() total = 0;
  @Input() currency = 'CAD';
  @Input() hasOverage = false;
}
