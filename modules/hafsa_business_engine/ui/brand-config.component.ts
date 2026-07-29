/**
 * Branding & licence banner — Hafsa Shabbeer (white-label surface, slides 17+).
 *
 * Each tenant institution gets its own name in the product. The brand string comes from the
 * server (/public/brand) so a licence change takes effect without redeploying the client.
 * If the licence is suspended the API stops answering and this renders the locked state —
 * the visible end of the kill-switch described in the business model.
 */
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-brand-config',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="brandbar" [class.locked]="locked">
      <span class="name">{{ brand || 'Loading…' }}</span>
      <span class="prog" *ngIf="program && !locked">{{ program }}</span>
      <span class="lock" *ngIf="locked">Licence inactive — contact your administrator</span>
    </div>
  `,
  styles: [`
    .brandbar { display:flex; align-items:baseline; gap:10px; padding:8px 14px;
                background:linear-gradient(135deg,#eef4fb,#e7eefb); border:1px solid #d8e4f3;
                border-radius:8px; }
    .name { font-weight:800; color:#1a2433; }
    .prog { font-size:.82rem; color:#5b6678; }
    .brandbar.locked { background:#fdeaea; border-color:#f5c2c2; }
    .lock { font-size:.82rem; color:#c53030; font-weight:600; }
  `],
})
export class BrandConfigComponent {
  @Input() brand = '';
  @Input() program = '';
  /** true when the API reports the tenant licence is not active (HTTP 503) */
  @Input() locked = false;
}
