import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PublicChatComponent } from './public-chat.component';
import { BrandService } from '../brand.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, PublicChatComponent],
  template: `
    <!-- Nav -->
    <div class="navbar">
      <nav class="nav">
        <span class="logo" (click)="scrollTop()">{{ brand.name }}</span>
        <span class="nav-links">
          <a class="seclink" (click)="scrollTo('features')">Features</a>
          <a class="seclink" (click)="scrollTo('how')">How it works</a>
          <a class="seclink" (click)="scrollTo('tech')">Tech</a>
          <a class="seclink" (click)="scrollTo('team')">Team</a>
          <a (click)="go('login')">Log in</a>
          <button (click)="go('login')">Get started free</button>
        </span>
      </nav>
    </div>

    <!-- Hero -->
    <header class="hero">
      <div class="hero-inner">
        <div class="hero-text">
          <span class="eyebrow">POWERED BY AI + YOUR COURSE MATERIAL</span>
          <h1>Your personal AI tutor for every course</h1>
          <p class="sub">Learnify turns your lecture notes into an AI study assistant, instant practice
            tests, flashcards, and a live view of exactly what you've mastered — all grounded in your
            own course material, so answers are accurate, not made up.</p>
          <div class="cta">
            <button (click)="go('login')">Get started free</button>
            <a class="ghost-link" (click)="scrollTo('how')">See how it works ↓</a>
          </div>
          <p class="muted demo">Try the demo: <b>student&#64;demo.learnify</b> / <b>Demo&#64;1234</b></p>
        </div>
        <div class="hero-img">
          <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=760&q=80"
               alt="Students studying together" (error)="imgError($event)" />
        </div>
      </div>
    </header>

    <!-- Features -->
    <section class="section" id="features">
      <h2>Everything you need to succeed</h2>
      <p class="section-sub">One platform, powered by retrieval-augmented AI.</p>
      <div class="cards">
        <div class="feature" *ngFor="let f of features">
          <img class="fimg" [src]="f.img" [alt]="f.title" (error)="imgError($event)" />
          <div class="fbody">
            <h3>{{ f.title }}</h3>
            <p>{{ f.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="section alt" id="how">
      <h2>How it works</h2>
      <p class="section-sub">From your notes to a grounded answer in three steps.</p>
      <div class="steps">
        <div class="step" *ngFor="let s of steps; let i = index">
          <div class="step-num">{{ i + 1 }}</div>
          <h3>{{ s.title }}</h3>
          <p>{{ s.text }}</p>
        </div>
      </div>
    </section>

    <!-- Tech behind -->
    <section class="section" id="tech">
      <h2>The tech behind {{ brand.name }}</h2>
      <p class="section-sub">A modern, production-style AI stack — the same architecture from our capstone.</p>
      <div class="techgrid">
        <div class="techcard" *ngFor="let g of techStack">
          <div class="techcat">{{ g.icon }} {{ g.cat }}</div>
          <p class="techdesc">{{ g.desc }}</p>
          <div class="techpills">
            <span class="tech-pill" *ngFor="let t of g.items">{{ t }}</span>
          </div>
        </div>
      </div>
      <p class="muted" style="margin-top:20px;">Flow: <b>Ingest → Clean → Chunk &amp; Embed → Index → Serve</b> — one retrieval layer powering the chatbot, practice tests and flashcards.</p>
    </section>

    <!-- Student gallery -->
    <section class="section alt">
      <h2>Built for how students actually study</h2>
      <p class="section-sub">Anytime, anywhere — on campus, in the library, or at home.</p>
      <div class="gallery">
        <figure *ngFor="let g of gallery">
          <img [src]="g.src" [alt]="g.caption" (error)="imgError($event)" />
          <figcaption>{{ g.caption }}</figcaption>
        </figure>
      </div>
    </section>

    <!-- Team -->
    <section class="section" id="team">
      <h2>Meet the team</h2>
      <p class="section-sub">The people behind {{ brand.name }}.</p>
      <div class="team">
        <figure class="member" *ngFor="let m of team">
          <img [src]="m.img" [alt]="m.name" (error)="avatarFallback($event, m.name)" />
          <figcaption><b>{{ m.name }}</b><span>{{ m.role }}</span></figcaption>
        </figure>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-band">
      <h2>Ready to start learning smarter?</h2>
      <button (click)="go('login')">Create your free account</button>
    </section>

    <footer class="foot">
      <span>{{ brand.name }} — Personalized Learning &amp; Academic Support Platform</span>
    </footer>

    <!-- Public admissions chatbot (Zoe) — for unregistered visitors -->
    <app-public-chat></app-public-chat>
  `,
  styles: [`
    :host { display:block; background:#fff; }
    .navbar { position:sticky; top:0; z-index:50; background:rgba(255,255,255,.92);
      backdrop-filter:blur(10px); border-bottom:1px solid #eef1f7; }
    .nav { display:flex; justify-content:space-between; align-items:center; gap:16px; padding:14px 28px; max-width:1080px; margin:0 auto; }
    .logo { font-weight:800; font-size:1.4rem; color:#2b6cb0; cursor:pointer; }
    .nav-links { display:flex; align-items:center; gap:6px; flex-wrap:wrap; justify-content:flex-end; }
    .nav-links a { color:#2d3748; padding:8px 12px; cursor:pointer; font-weight:600; border-radius:8px; transition:.15s; }
    .nav-links a:hover { color:#2b6cb0; background:#f1f5fb; }
    .nav-links button { background:#2b6cb0; color:#fff; }
    @media (max-width:720px){ .seclink { display:none; } }
    section[id] { scroll-margin-top:76px; }   /* offset so sections don't hide under the sticky bar */

    .hero { background:linear-gradient(135deg,#2b6cb0 0%,#1a365d 100%); color:#fff; padding:60px 20px 70px; }
    .hero-inner { max-width:1080px; margin:0 auto; display:grid; grid-template-columns:1.05fr .95fr; gap:40px; align-items:center; }
    .hero-text { text-align:left; }
    .hero-img img { width:100%; border-radius:14px; box-shadow:0 14px 34px rgba(0,0,0,.35); display:block; }
    @media (max-width:820px){ .hero-inner{ grid-template-columns:1fr; } .hero-text{ text-align:center; } .hero-img{ display:none; } }
    .eyebrow { letter-spacing:.12em; font-size:.75rem; font-weight:700; opacity:.85; }
    .hero h1 { color:#fff; font-size:2.5rem; margin:14px 0; line-height:1.15; }
    .hero .sub { font-size:1.08rem; opacity:.92; margin:0 0 26px; }
    .cta { display:flex; gap:16px; align-items:center; flex-wrap:wrap; }
    @media (max-width:820px){ .cta{ justify-content:center; } }
    .cta button { background:#fff; color:#2b6cb0; font-size:1.05rem; padding:12px 24px; }
    .ghost-link { color:#fff; cursor:pointer; font-weight:600; text-decoration:underline; }
    .demo { margin-top:20px; color:#cbd5e0; }

    .section { max-width:1080px; margin:0 auto; padding:64px 20px; text-align:center; }
    .section.alt { background:#f8f9fa; max-width:none; }
    .section.alt > * { max-width:1080px; margin-left:auto; margin-right:auto; }
    .section h2 { font-size:1.9rem; }
    .section-sub { color:#718096; margin-top:-6px; margin-bottom:32px; }
    .cards { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
    @media (max-width:760px){ .cards{ grid-template-columns:1fr; } }
    .feature { background:#fff; border:1px solid #e2e8f0; border-radius:10px; overflow:hidden; text-align:left; box-shadow:0 1px 3px rgba(0,0,0,.04); transition:transform .15s, box-shadow .15s; }
    .feature:hover { transform:translateY(-4px); box-shadow:0 10px 24px rgba(0,0,0,.10); }
    .fimg { width:100%; height:170px; object-fit:cover; display:block; background:#cbd5e0; }
    .fbody { padding:18px; }
    .feature h3 { margin:0 0 6px; color:#2b6cb0; }
    .feature p { color:#4a5568; font-size:.95rem; margin:0; }

    .steps { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
    @media (max-width:760px){ .steps{ grid-template-columns:1fr; } }
    .step { background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:24px; text-align:left; }
    .step-num { width:34px; height:34px; border-radius:50%; background:#2b6cb0; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; margin-bottom:10px; }
    .step h3 { color:#2b6cb0; margin:4px 0; }
    .step p { color:#4a5568; font-size:.95rem; }

    .techgrid { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; text-align:left; }
    @media (max-width:760px){ .techgrid{ grid-template-columns:1fr; } }
    .techcard { background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:20px; box-shadow:0 1px 3px rgba(0,0,0,.04); }
    .techcat { font-weight:700; color:#1a202c; font-size:1.05rem; }
    .techdesc { color:#718096; font-size:.9rem; margin:6px 0 12px; }
    .techpills { display:flex; flex-wrap:wrap; gap:8px; }
    .tech-pill { background:#edf2f7; border:1px solid #e2e8f0; color:#2b6cb0; border-radius:20px; padding:6px 12px; font-weight:600; font-size:.82rem; }
    .gallery { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
    @media (max-width:760px){ .gallery{ grid-template-columns:1fr; } }
    .gallery figure { margin:0; border-radius:10px; overflow:hidden; background:#e2e8f0; box-shadow:0 2px 6px rgba(0,0,0,.08); }
    .gallery img { width:100%; height:200px; object-fit:cover; display:block; }
    .gallery figcaption { padding:12px; font-size:.9rem; color:#4a5568; background:#fff; text-align:left; }

    .team { display:grid; grid-template-columns:repeat(5,1fr); gap:20px; }
    @media (max-width:860px){ .team { grid-template-columns:repeat(2,1fr); } }
    @media (max-width:420px){ .team { grid-template-columns:1fr; } }
    .member { margin:0; text-align:center; }
    .member img { width:118px; height:118px; border-radius:50%; object-fit:cover; border:3px solid #fff;
      box-shadow:0 6px 18px rgba(20,40,80,.15); background:#e2e8f0; }
    .member figcaption b { display:block; margin-top:12px; color:#1a202c; font-size:.98rem; }
    .member figcaption span { color:#718096; font-size:.85rem; }

    .cta-band { background:#2b6cb0; color:#fff; text-align:center; padding:56px 20px; }
    .cta-band h2 { color:#fff; margin-bottom:20px; }
    .cta-band button { background:#fff; color:#2b6cb0; font-size:1.05rem; padding:12px 24px; }
    .foot { text-align:center; padding:24px; color:#718096; font-size:.9rem; }
  `],
})
export class LandingComponent {
  features = [
    { img: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=520&q=80', title: 'AI Study Assistant', text: 'Chat with an assistant that answers from your course material — grounded, not guessed.' },
    { img: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=520&q=80', title: 'AI Practice Tests', text: 'Generate quizzes on any topic on demand, take them, and get scored instantly.' },
    { img: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=520&q=80', title: 'AI Flashcards', text: 'Turn lecture notes into study flashcards in one click.' },
    { img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=520&q=80', title: 'Mastery Tracking', text: 'See exactly which topics you have mastered and where your gaps are.' },
    { img: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=520&q=80', title: 'Professor Insights', text: 'Instructors see class analytics and spot struggling students early.' },
    { img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=520&q=80', title: 'Per-course & private', text: 'Your data is scoped per course — no cross-course leakage.' },
  ];
  gallery = [
    { src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=520&q=80', caption: 'Study together, powered by AI.' },
    { src: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=520&q=80', caption: 'Revise anywhere, on any device.' },
    { src: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=520&q=80', caption: 'Turn notes into practice in seconds.' },
  ];
  team = [
    { name: 'Sanchit Chhabra', role: 'Frontend, Backend & AI', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=220&h=220&fit=crop&crop=faces&q=80' },
    { name: 'Hafsa Shabbeer', role: 'Backend & DevOps', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=220&h=220&fit=crop&crop=faces&q=80' },
    { name: 'Surender (Sunny) Dagar', role: 'Full-stack, Backend, AI & DevOps', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=220&h=220&fit=crop&crop=faces&q=80' },
    { name: 'Arnold Babu', role: 'Frontend, Data & UX', img: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=220&h=220&fit=crop&crop=faces&q=80' },
    { name: 'Félicité Domgue', role: 'Data & OCR', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=220&h=220&fit=crop&crop=faces&q=80' },
  ];
  steps = [
    { title: 'Upload material', text: 'Your professor adds notes and slides; Learnify cleans, chunks and embeds them.' },
    { title: 'Ask anything', text: 'Learnify retrieves the most relevant chunks from the vector database (RAG).' },
    { title: 'Learn & track', text: 'Get grounded answers, practice tests and flashcards — while mastery updates live.' },
  ];
  techStack = [
    { icon: '🖥️', cat: 'Frontend', desc: 'The student & professor web portals.', items: ['Angular 17', 'Angular Material', 'RxJS', 'TypeScript'] },
    { icon: '⚙️', cat: 'Backend', desc: 'High-performance REST API + secure auth.', items: ['FastAPI (Python)', 'REST APIs', 'JWT + OAuth2', 'SQLAlchemy'] },
    { icon: '🧠', cat: 'AI / ML', desc: 'Turns course notes into grounded answers.', items: ['Sentence Transformers', 'Retrieval-Augmented Generation (RAG)', 'LLM (OpenAI / Ollama)', 'LangChain (planned)'] },
    { icon: '🗄️', cat: 'Data & Retrieval', desc: 'Meaning-based search + exact records.', items: ['ChromaDB (vector DB)', 'PostgreSQL', 'Redis cache (planned)'] },
    { icon: '🚀', cat: 'DevOps', desc: 'Containerized, reproducible, scalable.', items: ['Docker & Compose', 'Nginx', 'GitHub Actions CI/CD', 'AWS / GCP (planned)'] },
    { icon: '🔒', cat: 'Security & Privacy', desc: 'Per-course scoping keeps data safe.', items: ['RBAC', 'FERPA-aligned', 'Per-course data scoping'] },
  ];

  constructor(private router: Router, public brand: BrandService) {}
  go(path: string) { this.router.navigate(['/' + path]); }
  avatarFallback(e: Event, name: string) {
    const img = e.target as HTMLImageElement; img.onerror = null;
    const initials = name.replace(/\(.*?\)/g, '').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a90d9"/><stop offset="1" stop-color="#1a365d"/></linearGradient></defs><rect width="220" height="220" fill="url(#g)"/><text x="50%" y="53%" fill="#fff" font-family="sans-serif" font-size="84" font-weight="700" text-anchor="middle" dominant-baseline="middle">' + initials + '</text></svg>');
  }
  scrollTo(id: string) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); }
  scrollTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }
  imgError(e: Event) {
    const img = e.target as HTMLImageElement;
    img.onerror = null;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="520" height="300"><rect width="100%" height="100%" fill="#2b6cb0"/><text x="50%" y="50%" fill="#fff" font-family="sans-serif" font-size="26" text-anchor="middle" dominant-baseline="middle">Learnify</text></svg>'
    );
  }
}
