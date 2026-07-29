import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../api.service';
import { BrandService } from '../brand.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth">
      <!-- Left brand panel -->
      <aside class="brandside">
        <a class="back" (click)="home()">&larr; Back to home</a>
        <div class="brandside-mid">
          <div class="logo">🎓 {{ brand.name }}</div>
          <h2>{{ registering ? 'Join thousands of learners.' : 'Welcome back.' }}</h2>
          <p>Your AI study assistant, instant practice tests, flashcards and a live view of exactly
             what you've mastered — grounded in your own course material.</p>
          <ul class="perks">
            <li><span>🤖</span> AI tutor that answers from your course material</li>
            <li><span>📝</span> Auto-generated tests &amp; flashcards</li>
            <li><span>📊</span> Live mastery &amp; progress tracking</li>
          </ul>
        </div>
        <div class="brandside-foot">Personalized Learning &amp; Academic Support Platform</div>
      </aside>

      <!-- Right form panel -->
      <main class="formside">
        <div class="formcard">
          <a class="back mobile-back" (click)="home()">&larr; Home</a>
          <h1>{{ registering ? 'Create your account' : 'Sign in' }}</h1>
          <p class="sub">{{ registering ? 'Get started in less than a minute.' : 'Welcome back — please enter your details.' }}</p>

          <!-- LOGIN -->
          <form *ngIf="!registering" (ngSubmit)="doLogin()">
            <label>Email</label>
            <div class="field"><span class="ic">✉️</span>
              <input [(ngModel)]="email" name="email" type="email" placeholder="you&#64;email.com" autocomplete="username" required /></div>
            <label>Password</label>
            <div class="field"><span class="ic">🔒</span>
              <input [type]="show ? 'text':'password'" [(ngModel)]="password" name="password" placeholder="••••••••" autocomplete="current-password" required />
              <button type="button" class="peek" (click)="show=!show">{{ show ? '🙈' : '👁️' }}</button></div>

            <button class="primary" type="submit" [disabled]="loading">
              <span *ngIf="!loading">Log in</span><span *ngIf="loading" class="spin">⏳</span></button>
            <p class="error" *ngIf="error">⚠ {{ error }}</p>

            <div class="divider"><span>demo accounts</span></div>
            <div class="demo-row">
              <div><b>Students / alumni</b><code>student&#64;demo.learnify</code></div>
              <div><b>Staff</b><code>professor&#64;demo.learnify</code></div>
            </div>
            <p class="muted pw-hint">Password for demo accounts: <b>Demo&#64;1234</b></p>

            <p class="swap">New here? <a (click)="switch(true)">Create an account</a></p>
          </form>

          <!-- SIGN UP -->
          <form *ngIf="registering" (ngSubmit)="doRegister()">
            <label>I am a</label>
            <div class="seg">
              <button type="button" [class.on]="role==='student'" (click)="role='student'">🧑‍🎓 Student / alumni</button>
              <button type="button" [class.on]="role==='professor'" (click)="role='professor'">👩‍🏫 Staff</button>
            </div>
            <label>Full name</label>
            <div class="field"><span class="ic">👤</span>
              <input [(ngModel)]="name" name="name" placeholder="e.g. Alex Kim" required /></div>
            <label>Email</label>
            <div class="field"><span class="ic">✉️</span>
              <input [(ngModel)]="email" name="email" type="email" placeholder="you&#64;email.com" required /></div>
            <label>Password</label>
            <div class="field"><span class="ic">🔒</span>
              <input [type]="show ? 'text':'password'" [(ngModel)]="password" name="password" placeholder="Choose a password" required />
              <button type="button" class="peek" (click)="show=!show">{{ show ? '🙈' : '👁️' }}</button></div>

            <button class="primary" type="submit" [disabled]="loading">
              <span *ngIf="!loading">Create account</span><span *ngIf="loading" class="spin">⏳</span></button>
            <p class="error" *ngIf="error">⚠ {{ error }}</p>

            <p class="swap">Already have an account? <a (click)="switch(false)">Sign in</a></p>
          </form>
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host { display:block; }
    .auth { display:grid; grid-template-columns:1.05fr 1fr; min-height:100vh; background:#f4f6fb; }
    @media (max-width:860px){ .auth { grid-template-columns:1fr; } }

    /* brand side */
    .brandside { background:linear-gradient(150deg,#2b6cb0 0%,#1a365d 100%); color:#fff;
      padding:28px 44px; display:flex; flex-direction:column; justify-content:space-between; position:relative; }
    @media (max-width:860px){ .brandside { display:none; } }
    .back { color:#dbe7f5; font-weight:600; cursor:pointer; text-decoration:none; font-size:.92rem; }
    .back:hover { color:#fff; }
    .brandside-mid { max-width:420px; }
    .logo { font-size:1.6rem; font-weight:800; margin-bottom:26px; }
    .brandside h2 { font-size:2rem; line-height:1.2; margin:0 0 14px; color:#fff; }
    .brandside p { color:#cdddf0; font-size:1.02rem; line-height:1.6; }
    .perks { list-style:none; padding:0; margin:26px 0 0; }
    .perks li { display:flex; align-items:center; gap:12px; margin-bottom:14px; font-size:.98rem; color:#eaf2fb; }
    .perks li span { width:34px; height:34px; border-radius:9px; background:rgba(255,255,255,.15);
      display:flex; align-items:center; justify-content:center; font-size:1.1rem; flex:none; }
    .brandside-foot { color:#9db8d6; font-size:.85rem; }

    /* form side */
    .formside { display:flex; align-items:center; justify-content:center; padding:32px 20px; }
    .formcard { width:100%; max-width:400px; background:#fff; border:1px solid #e7ebf3; border-radius:18px;
      padding:34px 32px; box-shadow:0 12px 40px rgba(20,40,80,.08); }
    .mobile-back { display:none; margin-bottom:14px; color:#2b6cb0; }
    @media (max-width:860px){ .mobile-back { display:inline-block; } }
    .formcard h1 { font-size:1.7rem; margin:0 0 4px; color:#111827; }
    .sub { color:#6b7280; margin:0 0 22px; font-size:.95rem; }
    label { display:block; font-size:.82rem; font-weight:600; color:#374151; margin:14px 0 6px; }

    .field { display:flex; align-items:center; gap:8px; border:1px solid #dfe3ec; border-radius:11px;
      padding:0 12px; background:#fbfcfe; transition:border-color .15s, box-shadow .15s; }
    .field:focus-within { border-color:#2b6cb0; box-shadow:0 0 0 3px rgba(43,108,176,.14); background:#fff; }
    .field .ic { font-size:1rem; opacity:.7; }
    .field input { flex:1; border:0; outline:0; background:transparent; padding:12px 2px; font-size:.98rem; color:#111827; }
    .peek { background:transparent; border:0; cursor:pointer; font-size:1rem; padding:4px; }

    .seg { display:flex; gap:8px; }
    .seg button { flex:1; background:#f1f5fb; color:#475569; border:1px solid #e2e8f0; border-radius:11px;
      padding:11px; font-weight:600; cursor:pointer; font-size:.9rem; transition:.15s; }
    .seg button.on { background:#2b6cb0; color:#fff; border-color:#2b6cb0; box-shadow:0 4px 12px rgba(43,108,176,.25); }

    .primary { width:100%; margin-top:20px; background:#2b6cb0; color:#fff; border:0; border-radius:11px;
      padding:13px; font-size:1rem; font-weight:700; cursor:pointer; transition:.15s; }
    .primary:hover { background:#245a97; } .primary:disabled { opacity:.6; cursor:default; }
    .spin { display:inline-block; animation:sp 1s linear infinite; } @keyframes sp { to { transform:rotate(360deg); } }
    .error { color:#c0392b; background:#fdecea; border-radius:9px; padding:9px 12px; margin:12px 0 0; font-size:.88rem; }

    .divider { display:flex; align-items:center; gap:10px; margin:22px 0 14px; color:#9aa3b2; font-size:.75rem; text-transform:uppercase; letter-spacing:.06em; }
    .divider::before, .divider::after { content:''; flex:1; height:1px; background:#e7ebf3; }
    .demo-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .demo-row div { background:#f7f9fc; border:1px solid #eef1f7; border-radius:10px; padding:10px 12px; font-size:.8rem; color:#475569; }
    .demo-row b { display:block; color:#2b6cb0; margin-bottom:3px; }
    .demo-row code { font-size:.76rem; color:#334155; word-break:break-all; }
    .pw-hint { text-align:center; font-size:.82rem; margin-top:10px; }
    .muted { color:#6b7280; }
    .swap { text-align:center; margin-top:20px; color:#6b7280; font-size:.92rem; }
    .swap a { color:#2b6cb0; font-weight:700; cursor:pointer; }
  `],
})
export class LoginComponent {
  email = '';
  password = '';
  name = '';
  role = 'student';
  registering = false;
  loading = false;
  show = false;
  error = '';

  constructor(private api: ApiService, private router: Router, public brand: BrandService) {}

  home() { this.router.navigate(['/']); }
  switch(reg: boolean) { this.registering = reg; this.error = ''; }

  private onAuth(res: any) {
    localStorage.setItem('token', res.access_token);
    localStorage.setItem('user', JSON.stringify(res.user));
    this.router.navigate([res.user.role === 'professor' ? '/professor' : '/student']);
  }

  doLogin() {
    this.error = ''; this.loading = true;
    this.api.login(this.email, this.password).subscribe({
      next: (res) => { this.loading = false; this.onAuth(res); },
      error: (e) => { this.loading = false; this.error = e?.error?.detail || 'Login failed'; },
    });
  }

  doRegister() {
    this.error = ''; this.loading = true;
    this.api.register(this.name, this.email, this.password, this.role).subscribe({
      next: (res) => { this.loading = false; this.onAuth(res); },
      error: (e) => { this.loading = false; this.error = e?.error?.detail || 'Registration failed'; },
    });
  }
}
