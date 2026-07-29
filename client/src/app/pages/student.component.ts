import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../api.service';
import { BrandService } from '../brand.service';

interface ChatMsg { role: 'user' | 'assistant'; content: string; sources?: any[]; ts?: string; }

@Component({
  selector: 'app-student',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="topbar">
      <span class="brand">{{ brand.name }} — Student</span>
      <span class="me-chip">
        <img class="uavatar" *ngIf="user?.avatar" [src]="user.avatar" (error)="imgErr($event)" alt="">
        {{ user?.name }} <button (click)="logout()">Logout</button></span>
    </div>

    <div class="container">
      <div class="tabs">
        <button [class.active]="tab==='chat'" (click)="go('chat')" class="lia-tab">
          <img [src]="liaImg" (error)="liaFallback($event)" alt="Lia"> Student Lia AI Assistant
        </button>
        <button [class.active]="tab==='materials'" (click)="openMaterials()">📚 Study Material</button>
        <button [class.active]="tab==='tests'" (click)="openTests2()">📋 Tests
          <span class="tab-badge" *ngIf="pendingTests()">{{ pendingTests() }}</span></button>
        <button [class.active]="tab==='quiz'" (click)="go('quiz')">📝 Practice (AI)</button>
        <button [class.active]="tab==='cards'" (click)="go('cards')">🎴 Flashcards</button>
        <button [class.active]="tab==='progress'" (click)="openProgress()">📊 My Progress</button>
        <button [class.active]="tab==='appts'" (click)="openAppts()">📅 Appointments</button>
        <button [class.active]="tab==='upload'" (click)="go('upload')">📎 Upload</button>
      </div>

      <!-- ============ CHAT (sidebar: professor -> course, panel: assistant) ============ -->
      <div class="chat-layout" *ngIf="tab==='chat'">
        <!-- Left: pick who & what to study -->
        <aside class="side card">
          <div class="program" *ngIf="brand.program">
            <div class="program-label">MY PROGRAM</div>
            <div class="program-name">{{ brand.program }}</div>
            <div class="muted small">{{ profGroups.length }} professor{{ profGroups.length===1?'':'s' }} · {{ subjectCount() }} subjects</div>
          </div>
          <h4 class="side-h">Today I want to study…</h4>
          <div *ngFor="let g of profGroups" class="prof-group">
            <div class="prof-name">
              <img class="uavatar" *ngIf="g.professor_avatar" [src]="g.professor_avatar" (error)="imgErr($event)" alt="">
              <span *ngIf="!g.professor_avatar">👨‍🏫</span>
              {{ g.professor_name }}
              <span class="muted small" *ngIf="g.materials"> · {{ g.materials }} material{{ g.materials===1?'':'s' }}</span>
            </div>
            <button *ngFor="let c of g.courses" class="course-btn"
                    [class.sel]="courseId == c.id"
                    (click)="chooseCourse(c, g)">
              {{ c.code }}<span class="course-title">{{ c.title }}</span>
            </button>
          </div>
          <p class="muted" *ngIf="!profGroups.length">No courses yet — ask your professor to enrol you.</p>
        </aside>

        <!-- Right: the assistant, styled like a live-agent chat -->
        <div class="chatpanel card">
          <div class="agent-head">
            <img class="avatar" [src]="liaImg" alt="Lia" (error)="liaFallback($event)" />
            <span>
              <b>Lia</b> <span class="agent-sub">(AI Study Assistant)</span><br>
              <small *ngIf="currentCourse()">Studying <b>{{ currentCourse()?.code }}</b> with {{ currentProf }} — ask me anything</small>
              <small *ngIf="!currentCourse()">Pick a professor & course on the left to start</small>
            </span>
          </div>

          <div class="chat-thread" id="thread">
            <div *ngIf="!messages.length" class="chat-empty">
              <p class="muted">Ask me anything about <b>{{ currentCourse()?.code || 'your course' }}</b> — or book an appointment, e.g.
                <i>"book an appointment on 7th August at 12pm about recursion"</i>. Try:</p>
              <button class="chip" *ngFor="let s of suggestions" (click)="send(s)">{{ s }}</button>
            </div>
            <div *ngFor="let m of messages" class="bubble" [class.you]="m.role==='user'" [class.ai]="m.role==='assistant'">
              <div class="bubble-role" *ngIf="m.role==='assistant'">Lia (AI Agent)</div>
              <div class="bubble-text" [innerHTML]="md(m.content)"></div>
              <div class="ts">{{ m.ts }}</div>
              <div *ngIf="m.sources?.length" class="muted src">
                Sources: <span class="pill" *ngFor="let s of m.sources">{{ s.title }} #{{ s.chunk }}</span>
              </div>
            </div>
            <div *ngIf="busyChat" class="thinking">
              <img class="avatar sm" [src]="liaImg" alt="Lia" (error)="liaFallback($event)" />
              <span class="think-pill">Lia is thinking <span class="d"></span><span class="d"></span><span class="d"></span></span>
            </div>
          </div>

          <div class="chat-input">
            <input [(ngModel)]="question" (keyup.enter)="send()" placeholder="Type a short message…" [disabled]="busyChat || !courseId" />
            <button class="sendbtn" (click)="send()" [disabled]="busyChat || !question.trim() || !courseId">➤</button>
            <button class="ghost" (click)="clearChat()" *ngIf="messages.length">Clear</button>
          </div>
          <p class="ai-note">Replies are generated by an AI assistant.</p>
        </div>
      </div>

      <!-- ============ STUDY MATERIAL (browse + download per professor/course) ============ -->
      <div class="chat-layout" *ngIf="tab==='materials'">
        <aside class="side card">
          <h4 class="side-h">My professors & courses</h4>
          <div *ngFor="let g of profGroups" class="prof-group">
            <div class="prof-name">👨‍🏫 {{ g.professor_name }}</div>
            <button *ngFor="let c of g.courses" class="course-btn"
                    [class.sel]="courseId == c.id"
                    (click)="chooseCourse(c, g); loadDocs()">
              {{ c.code }}<span class="course-title">{{ c.title }}</span>
            </button>
          </div>
        </aside>
        <div style="min-width:0;">
          <h3 style="margin:2px 0 12px;">📚 Study material — {{ currentCourse()?.code }} <span class="muted">({{ currentProf }})</span></h3>
          <div class="mat-grid">
            <!-- From the professor -->
            <div class="card mat-card">
              <h4 class="mat-h">👨‍🏫 From your professor</h4>
              <p class="muted small">Official course material shared by {{ currentProf }}.</p>
              <table *ngIf="profDocs().length">
                <tr><th>Week</th><th>Material</th><th></th></tr>
                <tr *ngFor="let d of profDocs()">
                  <td><span class="pill" *ngIf="d.week">{{ d.week }}</span></td>
                  <td>{{ d.title }} <span class="muted small">{{ d.chunks }} chunks</span></td>
                  <td style="text-align:right;"><button *ngIf="d.downloadable" (click)="download(d)">⬇</button>
                      <span class="muted" *ngIf="!d.downloadable">note</span></td>
                </tr>
              </table>
              <p class="muted" *ngIf="!profDocs().length">Your professor hasn't shared material yet.</p>
            </div>
            <!-- The student's own uploads -->
            <div class="card mat-card">
              <h4 class="mat-h">🧑‍🎓 My uploads</h4>
              <p class="muted small">Notes and files you added yourself — Lia studies these too.</p>
              <table *ngIf="myDocs().length">
                <tr><th>Week</th><th>Material</th><th></th></tr>
                <tr *ngFor="let d of myDocs()">
                  <td><span class="pill" *ngIf="d.week">{{ d.week }}</span></td>
                  <td>{{ d.title }} <span class="muted small">{{ d.chunks }} chunks</span></td>
                  <td style="text-align:right;"><button *ngIf="d.downloadable" (click)="download(d)">⬇</button>
                      <span class="muted" *ngIf="!d.downloadable">note</span></td>
                </tr>
              </table>
              <p class="muted" *ngIf="!myDocs().length">You haven't uploaded anything for this course yet — use the 📎 Upload tab.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ============ ASSIGNED TESTS (with timer) ============ -->
      <div *ngIf="tab==='tests'">
        <!-- Taking a test -->
        <div class="card" *ngIf="taking">
          <div class="test-head">
            <div><h3 style="margin:0;">{{ taking.title }}</h3>
              <span class="muted small">{{ taking.questions.length }} questions · answer all, then submit</span></div>
            <div class="timer" [class.low]="timeLeft <= 30">⏱ {{ fmtClock() }}</div>
          </div>
          <div *ngFor="let q of taking.questions; let i=index" class="q">
            <div class="q-title">{{ i+1 }}. {{ q.q }} <span class="muted">({{ q.points }} pt)</span></div>
            <div *ngIf="q.type==='mcq'" class="opts">
              <button *ngFor="let o of q.options" class="opt" [class.sel]="answers[i]===o" (click)="answers[i]=o">{{ o }}</button>
            </div>
            <input *ngIf="q.type==='short'" [(ngModel)]="answers[i]" placeholder="Your 1–2 line answer…" class="short-in">
          </div>
          <div class="test-foot">
            <button class="ok" (click)="submitTest(false)" [disabled]="busyTest">{{ busyTest ? 'Submitting…' : 'Submit test' }}</button>
            <span class="muted small">Auto-submits when the timer hits 0.</span>
          </div>
        </div>

        <!-- Result right after submit -->
        <div class="card" *ngIf="testResult">
          <h3>✅ Submitted — Score {{ testResult.score }}/{{ testResult.max_score }}
            <span class="muted" style="font-size:.9rem;">({{ pctScore() }}%)</span></h3>
          <p class="muted">Graded by {{ testResult.graded_by === 'ai' ? 'AI' : testResult.graded_by }}.</p>
          <div *ngFor="let b of testResult.breakdown; let i=index" class="brk">
            <b>Q{{ i+1 }}</b>
            <span class="pill" [style.background]="b.awarded>0 ? '#c6f6d5' : '#fed7d7'"
                  [style.color]="b.awarded>0 ? '#22543d' : '#742a2a'">{{ b.awarded }} pt</span>
            <span class="muted"> — {{ b.feedback }}</span>
          </div>
          <button style="margin-top:12px;" (click)="testResult=null; loadAssigned()">Back to tests</button>
        </div>

        <!-- List of assigned tests -->
        <div class="card" *ngIf="!taking && !testResult">
          <h3>📋 Tests from your professors</h3>
          <table *ngIf="assigned.length">
            <tr><th>Test</th><th>Course</th><th>Status</th><th></th></tr>
            <tr *ngFor="let t of assigned">
              <td><b>{{ t.title }}</b><div class="muted small">{{ t.questions }} Qs · {{ t.time_limit_min }} min{{ t.due_at ? ' · due ' + (t.due_at | slice:0:10) : '' }}</div></td>
              <td>{{ t.course }}</td>
              <td><span class="pill" [ngClass]="{'badge-ok':t.status==='done','badge-pend':t.status==='pending','badge-late':t.status==='delayed'}">{{ t.status }}</span>
                  <span class="muted small" *ngIf="t.score != null"> · {{ t.score }}/{{ t.max_score }}</span></td>
              <td style="text-align:right;">
                <button class="ok" *ngIf="t.status!=='done'" (click)="startTest(t)">Start</button>
                <span class="muted" *ngIf="t.status==='done'">done ✓</span></td>
            </tr>
          </table>
          <p class="muted" *ngIf="!assigned.length">No tests assigned yet — your professor hasn't set any.</p>
        </div>
      </div>

      <!-- ============ QUIZ ============ -->
      <div class="card" *ngIf="tab==='quiz'">
        <h3>AI-Generated Practice Test <span class="muted">— {{ currentCourse()?.code }}</span></h3>
        <div class="row">
          <input [(ngModel)]="quizTopic" placeholder="Topic (e.g. recursion)" (keyup.enter)="makeQuiz()" />
          <button (click)="makeQuiz()" [disabled]="busyQuiz">{{ busyQuiz ? 'Generating…' : 'Generate quiz' }}</button>
        </div>
        <div *ngIf="quiz.length" class="quiz">
          <div *ngFor="let q of quiz; let i = index" class="q">
            <div class="q-title">{{ i + 1 }}. {{ q.question }}</div>
            <div class="opts">
              <button *ngFor="let o of q.options" class="opt"
                [class.sel]="q._sel === o && !quizSubmitted"
                [class.correct]="quizSubmitted && o === q.answer"
                [class.wrong]="quizSubmitted && q._sel === o && o !== q.answer"
                (click)="pick(q, o)">{{ o }}</button>
            </div>
          </div>
          <div class="quiz-foot">
            <button *ngIf="!quizSubmitted" (click)="submitQuiz()" [disabled]="!allAnswered()">Submit answers</button>
            <div *ngIf="quizSubmitted" class="result">
              <b>Score: {{ quizScore }}%</b><span class="muted"> — saved to your progress ✓</span>
              <button class="ghost" (click)="makeQuiz()">Try another</button>
            </div>
            <span class="muted" *ngIf="!quizSubmitted && !allAnswered()">Answer all questions to submit.</span>
          </div>
        </div>
        <p class="muted" *ngIf="!quiz.length && !busyQuiz">Enter a topic to generate a quiz from your course material.</p>
      </div>

      <!-- ============ FLASHCARDS ============ -->
      <div class="card" *ngIf="tab==='cards'">
        <h3>AI-Generated Flashcards <span class="muted">— {{ currentCourse()?.code }}</span></h3>
        <div class="row">
          <input [(ngModel)]="flashTopic" placeholder="Topic (e.g. algorithms)" (keyup.enter)="makeFlashcards()" />
          <button (click)="makeFlashcards()" [disabled]="busyFlash">{{ busyFlash ? 'Generating…' : 'Generate' }}</button>
        </div>
        <p class="muted" *ngIf="flashcards.length">Tap a card to flip it.</p>
        <div class="flashcard" *ngFor="let c of flashcards" (click)="c._f = !c._f" [class.flipped]="c._f">
          <b>{{ c.front }}</b><div class="back">{{ c.back }}</div>
        </div>
      </div>

      <!-- ============ PROGRESS (live dashboard) ============ -->
      <div *ngIf="tab==='progress'">
        <div class="dash-head">
          <h3 style="margin:0;">My Progress (Knowledge Tracking)</h3>
          <span class="live"><span class="live-dot"></span> LIVE <span class="muted small" *ngIf="stats?.as_of">· updated {{ stats.as_of }}</span></span>
        </div>

        <!-- KPI tiles -->
        <div class="kpis" *ngIf="stats">
          <div class="card kpi"><div class="kpi-label">Average mastery</div>
            <div class="kpi-value">{{ stats.kpis.avg }}%</div>
            <div class="kpi-delta" *ngIf="stats.kpis.delta !== null"
                 [style.color]="stats.kpis.delta >= 0 ? '#006300' : '#d03b3b'">
              {{ stats.kpis.delta >= 0 ? '▲' : '▼' }} {{ abs(stats.kpis.delta) }} vs last week</div></div>
          <div class="card kpi"><div class="kpi-label">Quizzes taken</div>
            <div class="kpi-value">{{ stats.kpis.quizzes }}</div></div>
          <div class="card kpi"><div class="kpi-label">Questions asked</div>
            <div class="kpi-value">{{ stats.kpis.chats }}</div></div>
          <div class="card kpi"><div class="kpi-label">Day streak</div>
            <div class="kpi-value">{{ stats.kpis.streak }}<span class="kpi-unit"> {{ stats.kpis.streak === 1 ? 'day' : 'days' }}</span> 🔥</div></div>
        </div>

        <div class="rec" *ngIf="weakest()">
          <b>Focus area:</b> your weakest topic is <b>{{ weakest().topic }}</b> ({{ weakest().mastery }}%).
          <button (click)="practice(weakest().topic)">Practice this now</button>
        </div>

        <div class="dash-grid">
          <!-- Learning over time -->
          <div class="card">
            <h4 class="chart-h">Learning over time (weekly)</h4>
            <div *ngIf="trend.weeks?.length; else noTrend">
              <svg viewBox="0 0 540 190" width="100%" height="190">
                <g *ngFor="let gy of [0,25,50,75,100]">
                  <line x1="30" [attr.y1]="160-gy*1.5" x2="520" [attr.y2]="160-gy*1.5" stroke="#e1e0d9" stroke-width="1"/>
                  <text x="24" [attr.y]="163-gy*1.5" font-size="9" fill="#898781" text-anchor="end">{{ gy }}</text>
                </g>
                <line x1="30" y1="160" x2="520" y2="160" stroke="#c3c2b7"/>
                <polyline [attr.points]="line('mastery')" fill="none" stroke="#2a78d6" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
                <polyline [attr.points]="line('gap')" fill="none" stroke="#e34948" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
                <g *ngFor="let w of trend.weeks; let i = index">
                  <circle [attr.cx]="xPos(i)" [attr.cy]="160-w.mastery*1.5" r="4" fill="#2a78d6" stroke="#fff" stroke-width="2"><title>{{ w.label }} — mastery {{ w.mastery }}%</title></circle>
                  <circle [attr.cx]="xPos(i)" [attr.cy]="160-w.gap*1.5" r="4" fill="#e34948" stroke="#fff" stroke-width="2"><title>{{ w.label }} — gap {{ w.gap }}%</title></circle>
                  <text [attr.x]="xPos(i)" y="177" font-size="9" fill="#898781" text-anchor="middle">{{ w.label }}</text>
                </g>
              </svg>
              <div class="legend"><span class="dot" style="background:#2a78d6;"></span> Mastery &nbsp;&nbsp; <span class="dot" style="background:#e34948;"></span> Knowledge gap</div>
            </div>
            <ng-template #noTrend><p class="muted">Take a few quizzes over time to see your trend.</p></ng-template>
          </div>

          <!-- Topic radar -->
          <div class="card">
            <h4 class="chart-h">Mastery radar (top topics)</h4>
            <div *ngIf="stats?.radar?.length >= 3; else noRadar">
              <svg viewBox="0 0 300 220" width="100%" height="220">
                <g *ngFor="let ring of [25,50,75,100]">
                  <polygon [attr.points]="radarRing(ring)" fill="none" stroke="#e1e0d9" stroke-width="1"/>
                </g>
                <line *ngFor="let p of radarSpokes()" x1="150" y1="100" [attr.x2]="p.x" [attr.y2]="p.y" stroke="#e1e0d9" stroke-width="1"/>
                <polygon [attr.points]="radarData()" fill="rgba(42,120,214,0.10)" stroke="#2a78d6" stroke-width="2" stroke-linejoin="round"/>
                <g *ngFor="let p of radarPoints()">
                  <circle [attr.cx]="p.x" [attr.cy]="p.y" r="4" fill="#2a78d6" stroke="#fff" stroke-width="2"><title>{{ p.topic }} — {{ p.mastery }}%</title></circle>
                </g>
                <text *ngFor="let p of radarLabels()" [attr.x]="p.x" [attr.y]="p.y" font-size="9.5" fill="#52514e" [attr.text-anchor]="p.anchor">{{ p.topic }}</text>
              </svg>
            </div>
            <ng-template #noRadar><p class="muted">Practice at least 3 topics to unlock the radar.</p></ng-template>
          </div>

          <!-- Recent quiz scores -->
          <div class="card">
            <h4 class="chart-h">Recent quiz scores</h4>
            <div *ngIf="stats?.recent?.length; else noRecent">
              <svg viewBox="0 0 540 170" width="100%" height="170">
                <g *ngFor="let gy of [0,50,100]">
                  <line x1="26" [attr.y1]="140-gy*1.3" x2="530" [attr.y2]="140-gy*1.3" stroke="#e1e0d9" stroke-width="1"/>
                  <text x="20" [attr.y]="143-gy*1.3" font-size="9" fill="#898781" text-anchor="end">{{ gy }}</text>
                </g>
                <line x1="26" y1="140" x2="530" y2="140" stroke="#c3c2b7"/>
                <g *ngFor="let r of stats.recent; let i = index">
                  <path [attr.d]="colPath(30 + i*(500/stats.recent.length), 140 - r.score*1.3, colW(stats.recent.length), r.score*1.3)" fill="#2a78d6">
                    <title>{{ r.topic }} — {{ r.score }}% ({{ r.at }})</title></path>
                  <text *ngIf="i === stats.recent.length-1 || r.score === recentMax()"
                        [attr.x]="30 + i*(500/stats.recent.length) + colW(stats.recent.length)/2"
                        [attr.y]="134 - r.score*1.3" font-size="9.5" font-weight="600" fill="#0b0b0b" text-anchor="middle">{{ r.score }}</text>
                  <text [attr.x]="30 + i*(500/stats.recent.length) + colW(stats.recent.length)/2" y="153"
                        font-size="8.5" fill="#898781" text-anchor="middle">{{ r.topic.slice(0,9) }}</text>
                </g>
              </svg>
            </div>
            <ng-template #noRecent><p class="muted">No quizzes yet — generate one in Practice Test.</p></ng-template>
          </div>

          <!-- Daily activity -->
          <div class="card">
            <h4 class="chart-h">Daily activity (last 14 days)</h4>
            <div *ngIf="stats?.daily?.length">
              <svg viewBox="0 0 540 170" width="100%" height="170">
                <line x1="26" y1="140" x2="530" y2="140" stroke="#c3c2b7"/>
                <g *ngFor="let d of stats.daily; let i = index">
                  <path *ngIf="d.quizzes" [attr.d]="colPath(30 + i*36, 140 - scaleAct(d.quizzes), 12, scaleAct(d.quizzes))" fill="#2a78d6"><title>{{ d.day }} — {{ d.quizzes }} quizzes</title></path>
                  <path *ngIf="d.chats" [attr.d]="colPath(30 + i*36 + 14, 140 - scaleAct(d.chats), 12, scaleAct(d.chats))" fill="#1baf7a"><title>{{ d.day }} — {{ d.chats }} questions</title></path>
                  <text *ngIf="d.quizzes" [attr.x]="30 + i*36 + 6" [attr.y]="134 - scaleAct(d.quizzes)" font-size="8.5" fill="#52514e" text-anchor="middle">{{ d.quizzes }}</text>
                  <text *ngIf="d.chats" [attr.x]="30 + i*36 + 20" [attr.y]="134 - scaleAct(d.chats)" font-size="8.5" fill="#52514e" text-anchor="middle">{{ d.chats }}</text>
                  <text [attr.x]="30 + i*36 + 13" y="153" font-size="8.5" fill="#898781" text-anchor="middle">{{ d.label }}</text>
                </g>
              </svg>
              <div class="legend"><span class="dot" style="background:#2a78d6;"></span> Quizzes &nbsp;&nbsp; <span class="dot" style="background:#1baf7a;"></span> Questions to Lia</div>
            </div>
          </div>

          <!-- Score distribution -->
          <div class="card">
            <h4 class="chart-h">Score distribution</h4>
            <div *ngIf="stats">
              <svg viewBox="0 0 540 170" width="100%" height="170">
                <line x1="26" y1="140" x2="530" y2="140" stroke="#c3c2b7"/>
                <g *ngFor="let b of distBuckets(); let i = index">
                  <path *ngIf="b.v" [attr.d]="colPath(60 + i*95, 140 - scaleDist(b.v), 24, scaleDist(b.v))" [attr.fill]="['#86b6ef','#5598e7','#2a78d6','#1c5cab','#104281'][i]">
                    <title>{{ b.k }}: {{ b.v }} quizzes</title></path>
                  <text *ngIf="b.v" [attr.x]="72 + i*95" [attr.y]="134 - scaleDist(b.v)" font-size="9.5" font-weight="600" fill="#0b0b0b" text-anchor="middle">{{ b.v }}</text>
                  <text [attr.x]="72 + i*95" y="153" font-size="9" fill="#898781" text-anchor="middle">{{ b.k }}</text>
                </g>
              </svg>
            </div>
          </div>

          <!-- Per-course average -->
          <div class="card">
            <h4 class="chart-h">Average by course</h4>
            <div *ngIf="stats?.per_course?.length">
              <svg [attr.viewBox]="'0 0 540 ' + (stats.per_course.length*44 + 10)" width="100%" [attr.height]="stats.per_course.length*44 + 10">
                <g *ngFor="let c of stats.per_course; let i = index">
                  <text x="0" [attr.y]="i*44 + 18" font-size="11" font-weight="600" fill="#0b0b0b">{{ c.code }}</text>
                  <rect x="90" [attr.y]="i*44 + 6" width="380" height="18" fill="#f0efec" rx="0"/>
                  <path [attr.d]="rowPath(90, i*44 + 6, c.avg/100*380, 18)" fill="#2a78d6"><title>{{ c.code }} — average {{ c.avg }}% over {{ c.quizzes }} quizzes</title></path>
                  <text [attr.x]="94 + c.avg/100*380" [attr.y]="i*44 + 19" font-size="10" font-weight="600" fill="#0b0b0b">{{ c.avg }}%</text>
                  <text x="470" [attr.y]="i*44 + 19" font-size="9" fill="#898781" text-anchor="end">{{ c.quizzes }} quizzes</text>
                </g>
              </svg>
            </div>
          </div>
        </div>

        <!-- Knowledge gap by subject (status-colored) -->
        <div class="card">
          <h4 class="chart-h">Knowledge gap by subject</h4>
          <div *ngIf="trend.topics?.length">
            <svg [attr.viewBox]="'0 0 540 ' + (trend.topics.length*38 + 10)" width="100%" [attr.height]="trend.topics.length*38 + 10">
              <g *ngFor="let t of trend.topics; let i = index">
                <text x="0" [attr.y]="i*38 + 16" font-size="11" fill="#0b0b0b">{{ t.topic }}
                  <tspan fill="#898781" font-size="9"> · {{ t.gap > 40 ? '⚠ needs work' : (t.gap > 20 ? 'improving' : '✓ on track') }}</tspan></text>
                <rect x="0" [attr.y]="i*38 + 22" width="520" height="12" fill="#f0efec"/>
                <path [attr.d]="rowPath(0, i*38 + 22, t.gap/100*520, 12)" [attr.fill]="t.gap > 40 ? '#d03b3b' : (t.gap > 20 ? '#ec835a' : '#0ca30c')">
                  <title>{{ t.topic }} — {{ t.gap }}% gap</title></path>
                <text [attr.x]="t.gap/100*520 + 6" [attr.y]="i*38 + 32" font-size="10" fill="#52514e">{{ t.gap }}% gap</text>
              </g>
            </svg>
          </div>
        </div>

        <!-- Mastery by topic -->
        <div class="card">
          <h4 class="chart-h">Current mastery by topic</h4>
          <div *ngFor="let m of mastery" class="mastery-row">
            <div class="mastery-head"><span>{{ m.topic }}</span><span>{{ m.mastery }}% <span class="muted">· {{ m.attempts }} tries</span></span></div>
            <div class="track"><div class="bar" [style.width.%]="m.mastery" [style.background]="m.mastery < 60 ? '#d03b3b' : (m.mastery < 80 ? '#ec835a' : '#0ca30c')"></div></div>
          </div>
        </div>
      </div>

      <!-- ============ APPOINTMENTS ============ -->
      <div class="card" *ngIf="tab==='appts'">
        <h3>📅 Appointments</h3>
        <p class="muted">Tip: book from the chat — e.g. <i>"book an appointment on 7th August at 12pm about recursion"</i>.</p>
        <button class="ghost" (click)="loadEngage()">Refresh</button>
        <table *ngIf="appointments.length" style="margin-top:10px;">
          <tr><th>Booked by</th><th>With</th><th>When · Topic</th><th>Status</th><th></th></tr>
          <tr *ngFor="let a of appointments">
            <td>{{ a.created_by==='professor' ? a.professor : a.student }}
              <div class="muted small">{{ a.created_by==='professor' ? 'booked for you' : 'you requested' }}</div></td>
            <td>{{ a.created_by==='professor' ? a.student : a.professor }}</td>
            <td>{{ a.when }}</td>
            <td><span class="pill" [class.badge-ok]="a.status==='confirmed'" [class.badge-pend]="a.status!=='confirmed'">{{ a.status==='confirmed' ? '✓ confirmed' : '⏳ awaiting' }}</span></td>
            <td style="text-align:right;"><button class="ok" *ngIf="a.can_confirm" (click)="confirmAppt(a)">Confirm</button>
              <span class="muted" *ngIf="!a.can_confirm">—</span></td>
          </tr>
        </table>
        <p class="muted" *ngIf="!appointments.length">No appointments yet.</p>

        <h4 style="margin-top:18px;">🔔 Notifications</h4>
        <div class="note-item" *ngFor="let n of notifications">
          <b>{{ n.from }}</b> <span class="muted">· {{ n.at }}</span><div>{{ n.body }}</div>
        </div>
        <p class="muted" *ngIf="!notifications.length">No notifications.</p>
      </div>

      <!-- ============ UPLOAD ============ -->
      <div class="card" *ngIf="tab==='upload'">
        <h3>📎 Upload my study material</h3>
        <p class="muted">Add a <b>PDF, Word (.docx) or .txt</b> file. Lia reads and indexes it, and you can
          download it later from Study Material → My uploads.</p>
        <label>Study material name</label>
        <input [(ngModel)]="upName" placeholder="e.g. My recursion notes">
        <label>Week / module</label>
        <input [(ngModel)]="upWeek" placeholder="e.g. Week 3">
        <label>File</label>
        <input type="file" accept=".pdf,.docx,.txt,.md" (change)="onFile($event)" />
        <label class="consent"><input type="checkbox" [(ngModel)]="upConsent">
          <span>I confirm I have the right to share this material and it complies with copyright. I understand it will be stored and processed to power AI study features.</span></label>
        <div class="notice">🔗 <span><b>Coming soon:</b> import course content directly from <b>Canvas / Blackboard</b> — no manual uploads.</span></div>
        <div style="margin-top:12px;"><button (click)="upload()" [disabled]="!file || !upConsent || busyUpload">{{ busyUpload ? 'Uploading…' : 'Upload & index' }}</button></div>
        <p [class.muted]="!uploadErr" [style.color]="uploadErr ? '#c53030' : ''" *ngIf="uploadMsg">{{ uploadMsg }}</p>
      </div>
    </div>
  `,
  styles: [`
    .tabs { display:flex; gap:8px; margin-bottom:16px; flex-wrap:wrap; }
    .tabs button { background:#edf2f7; color:#2b6cb0; }
    .tabs button.active { background:#2b6cb0; color:#fff; }
    .row { display:flex; gap:8px; } .row input { flex:1; }
    .lia-tab { display:inline-flex; align-items:center; gap:7px; }
    .lia-tab img { width:22px; height:22px; border-radius:50%; object-fit:cover; border:1.5px solid #fff; }
    .small { font-size:.8rem; }
    .tab-badge { background:#d03b3b; color:#fff; border-radius:999px; font-size:.72rem; font-weight:700; padding:1px 7px; margin-left:4px; }
    .badge-pend { background:#fef3c7; color:#92400e; }
    .badge-late { background:#fed7d7; color:#742a2a; }
    button.ok { background:#047857; } button.ok:hover { background:#065f46; }
    /* test-taking */
    .test-head { display:flex; justify-content:space-between; align-items:flex-start; gap:12px;
      border-bottom:1px solid #e2e8f0; padding-bottom:10px; margin-bottom:12px; }
    .timer { font-size:1.5rem; font-weight:800; color:#2b6cb0; background:#ebf8ff; border-radius:10px;
      padding:6px 14px; font-variant-numeric:tabular-nums; white-space:nowrap; }
    .timer.low { color:#c53030; background:#fff5f5; animation:tick 1s infinite; }
    @keyframes tick { 0%,100%{opacity:1;} 50%{opacity:.55;} }
    .short-in { width:100%; margin-top:4px; }
    .test-foot { display:flex; gap:12px; align-items:center; margin-top:14px; }
    .brk { padding:6px 0; border-bottom:1px solid #f1f5f9; font-size:.92rem; }

    /* --- materials split --- */
    .mat-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    @media (max-width:820px){ .mat-grid { grid-template-columns:1fr; } }
    .mat-card { min-width:0; }
    .mat-h { margin:0 0 4px; color:#2b6cb0; }

    /* --- live progress dashboard --- */
    .dash-head { display:flex; align-items:center; gap:14px; margin-bottom:12px; flex-wrap:wrap; }
    .live { display:inline-flex; align-items:center; gap:6px; font-weight:700; font-size:.78rem; color:#006300; letter-spacing:.06em; }
    .live-dot { width:8px; height:8px; border-radius:50%; background:#0ca30c; animation:livepulse 1.6s infinite; }
    @keyframes livepulse { 0%,100%{opacity:1; box-shadow:0 0 0 0 rgba(12,163,12,.35);} 50%{opacity:.55; box-shadow:0 0 0 5px rgba(12,163,12,0);} }
    .kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:14px; }
    @media (max-width:820px){ .kpis { grid-template-columns:repeat(2,1fr); } }
    .kpi { padding:16px 18px; }
    .kpi-label { font-size:.8rem; color:#898781; margin-bottom:4px; }
    .kpi-value { font-size:1.9rem; font-weight:700; color:#0b0b0b; line-height:1.1; }
    .kpi-unit { font-size:1rem; font-weight:600; color:#52514e; }
    .kpi-delta { font-size:.8rem; font-weight:600; margin-top:4px; }
    .dash-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
    @media (max-width:900px){ .dash-grid { grid-template-columns:1fr; } }
    .dash-grid .card { margin-bottom:0; min-width:0; }

    /* --- chat layout with sidebar --- */
    .chat-layout { display:grid; grid-template-columns:250px 1fr; gap:16px; align-items:start; }
    @media (max-width:760px){ .chat-layout { grid-template-columns:1fr; } }
    .side { padding:14px; }
    .side-h { margin:0 0 10px; color:#2b6cb0; }
    .prof-group { margin-bottom:12px; }
    .prof-name { font-weight:700; font-size:.9rem; color:#2d3748; margin-bottom:6px; }
    .course-btn { display:block; width:100%; text-align:left; background:#f7fafc; color:#2b6cb0;
      border:1px solid #e2e8f0; margin-bottom:6px; font-weight:700; }
    .course-btn .course-title { display:block; font-weight:400; font-size:.78rem; color:#718096; }
    .course-btn.sel { background:#2b6cb0; color:#fff; border-color:#2b6cb0; }
    .course-btn.sel .course-title { color:#e2e8f0; }

    /* --- agent-style chat panel --- */
    .chatpanel { padding:0; overflow:hidden; }
    .agent-head { display:flex; gap:10px; align-items:center; background:#2b6cb0; color:#fff; padding:12px 16px; }
    .agent-head small { opacity:.85; }
    .agent-sub { opacity:.8; font-size:.85rem; }
    .avatar { width:38px; height:38px; border-radius:50%; background:#fff; object-fit:cover;
      border:2px solid rgba(255,255,255,.85); flex:none; }
    .avatar.sm { width:28px; height:28px; border:1px solid #e2e8f0; }
    .chat-thread { min-height:260px; max-height:440px; overflow-y:auto; padding:14px; }
    .chat-empty { padding:8px 2px; }
    .chip { background:#ebf8ff; color:#2b6cb0; margin:4px 4px 0 0; font-weight:500; }
    .bubble { margin-bottom:12px; padding:10px 14px; border-radius:14px; max-width:86%; }
    .bubble.you { background:#2b6cb0; color:#fff; margin-left:auto; border-bottom-right-radius:4px; }
    .bubble.ai { background:#f1f5f9; border-bottom-left-radius:4px; }
    .bubble-role { font-size:.78rem; color:#2b6cb0; margin-bottom:2px; font-weight:700; }
    .ts { font-size:.7rem; opacity:.6; margin-top:4px; }
    .bubble-text p { margin:0 0 8px; } .bubble-text p:last-child { margin-bottom:0; }
    .bubble-text ul, .bubble-text ol { margin:6px 0 8px; padding-left:20px; }
    .bubble-text li { margin-bottom:4px; }
    .bubble-text h4 { margin:8px 0 4px; color:#2c5282; font-size:1rem; }
    .bubble.ai .bubble-text strong { background:#fff3bf; padding:0 3px; border-radius:3px; font-weight:700; color:#1a202c; }
    .bubble.ai .bubble-text em { color:#2b6cb0; font-style:italic; }
    .bubble-text code { background:#e2e8f0; color:#b83280; padding:1px 5px; border-radius:4px; font-size:.9em; }
    .bubble-text hr { border:0; border-top:1px solid #cbd5e0; margin:8px 0; }
    .src { margin-top:6px; }

    /* --- "Lia is thinking •••" --- */
    .thinking { display:flex; align-items:center; gap:8px; margin:4px 0 10px; }
    .think-pill { background:#eef6ff; color:#0e7490; font-weight:700; font-size:.9rem;
      border-radius:999px; padding:8px 16px; display:inline-flex; align-items:center; gap:4px; }
    .think-pill .d { width:6px; height:6px; border-radius:50%; background:#0e7490; display:inline-block;
      animation:pulse 1.2s infinite; }
    .think-pill .d:nth-child(2) { animation-delay:.2s; } .think-pill .d:nth-child(3) { animation-delay:.4s; }
    @keyframes pulse { 0%,100%{opacity:.25; transform:scale(.85);} 50%{opacity:1; transform:scale(1.15);} }

    .chat-input { display:flex; gap:8px; padding:12px 14px; border-top:1px solid #e2e8f0; }
    .chat-input input { flex:1; border-radius:12px; }
    .sendbtn { border-radius:12px; font-size:1.05rem; }
    .ai-note { text-align:center; color:#a0aec0; font-size:.78rem; margin:0; padding:6px 0 10px; }

    .quiz { margin-top:14px; } .q { margin-bottom:16px; } .q-title { font-weight:600; margin-bottom:8px; }
    .opts { display:flex; flex-direction:column; gap:6px; }
    .opt { text-align:left; background:#fff; color:#2d3748; border:1px solid #e2e8f0; }
    .opt.sel { border-color:#2b6cb0; background:#ebf8ff; }
    .opt.correct { background:#c6f6d5; border-color:#38a169; color:#22543d; }
    .opt.wrong { background:#fed7d7; border-color:#c53030; color:#742a2a; }
    .quiz-foot { margin-top:8px; } .result { display:flex; gap:12px; align-items:center; }
    .rec { background:#fffaf0; border:1px solid #feebc8; border-left:4px solid #dd6b20; padding:12px 14px; border-radius:6px; margin-bottom:14px; display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
    .chart-h { margin:18px 0 8px; color:#2b6cb0; }
    .chartbox { background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:10px; }
    .legend { font-size:.8rem; color:#718096; margin-top:4px; }
    .dot { display:inline-block; width:10px; height:10px; border-radius:50%; vertical-align:middle; }
    .dot.g { background:#38a169; } .dot.r { background:#e53e3e; }
    .mastery-row { margin-bottom:12px; }
    .mastery-head { display:flex; justify-content:space-between; font-size:.9rem; margin-bottom:4px; }
    .track { background:#edf2f7; border-radius:5px; overflow:hidden; } .track .bar { height:10px; }
    .badge-ok { background:#c6f6d5; color:#22543d; }
    .note-item { border-bottom:1px solid #e2e8f0; padding:8px 0; font-size:.92rem; }
  `],
})
export class StudentComponent implements OnInit, OnDestroy {
  user: any = null;
  courses: any[] = [];
  profGroups: any[] = [];
  currentProf = '';
  courseId = 0;
  // Persisted across refresh so the student stays on the tab they were using.
  private _tab: 'chat' | 'materials' | 'tests' | 'quiz' | 'cards' | 'progress' | 'appts' | 'upload' = 'chat';
  get tab() { return this._tab; }
  set tab(v: any) { this._tab = v; try { localStorage.setItem('student_tab', v); } catch { /* ignore */ } }

  messages: ChatMsg[] = [];
  question = ''; busyChat = false; typing = false;
  suggestions = ['What is recursion?', 'Explain binary search', 'Book an appointment on 7th August at 12pm about recursion'];
  // Lia's avatar — friendly stock headshot, with an inline-SVG fallback if offline.
  liaImg = 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=96&h=96&fit=crop&crop=faces&q=80';
  liaFallback(e: Event) {
    const img = e.target as HTMLImageElement;
    img.onerror = null;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#63b3ed"/><stop offset="1" stop-color="#2b6cb0"/></linearGradient></defs><rect width="96" height="96" fill="url(#g)"/><text x="50%" y="54%" fill="#fff" font-family="sans-serif" font-size="42" font-weight="700" text-anchor="middle" dominant-baseline="middle">L</text></svg>');
  }

  quizTopic = ''; quiz: any[] = []; busyQuiz = false; quizSubmitted = false; quizScore = 0;
  flashTopic = ''; flashcards: any[] = []; busyFlash = false;
  mastery: any[] = [];
  trend: any = { weeks: [], topics: [] };
  appointments: any[] = []; notifications: any[] = [];
  docs: any[] = [];
  file: File | null = null; busyUpload = false; uploadMsg = ''; uploadErr = false; upConsent = false;
  upName = ''; upWeek = '';

  constructor(private api: ApiService, private router: Router, public brand: BrandService) {}

  ngOnInit() {
    if (!localStorage.getItem('token')) { this.router.navigate(['/login']); return; }
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    if (this.user?.role !== 'student') {             // student area: students only
      this.router.navigate([this.user ? '/professor' : '/login']);
      return;
    }
    this.api.courses().subscribe((cs) => { this.courses = cs; if (cs.length && !this.courseId) this.courseId = cs[0].id; });
    this.api.professorsCourses().subscribe((g) => {
      this.profGroups = g;
      if (g.length && g[0].courses.length) {
        this.currentProf = g[0].professor_name;
        if (!this.courseId) this.courseId = g[0].courses[0].id;
      }
      this.restoreTab();   // re-open the tab the student was last on (survives refresh)
    });
    this.loadMastery();
  }

  // Reopen the saved tab and load its data (so a page refresh doesn't dump you back to chat).
  restoreTab() {
    const saved = localStorage.getItem('student_tab') || 'chat';
    switch (saved) {
      case 'materials': this.openMaterials(); break;
      case 'tests': this.openTests2(); break;
      case 'progress': this.openProgress(); break;
      case 'appts': this.openAppts(); break;
      case 'quiz': this.tab = 'quiz'; break;
      case 'cards': this.tab = 'cards'; break;
      case 'upload': this.tab = 'upload'; break;
      default: this.tab = 'chat'; this.loadHistory();
    }
  }

  currentCourse() { return this.courses.find((c) => c.id == this.courseId); }
  chooseCourse(c: any, g: any) {
    const changed = this.courseId != c.id;
    this.courseId = c.id;
    this.currentProf = g.professor_name;
    if (changed) { this.messages = []; this.quiz = []; this.loadHistory(); }
  }

  // Load today's messages (or the latest 5 earlier ones) from the DB into the chat box.
  loadHistory() {
    if (!this.courseId) return;
    this.api.chatHistory(+this.courseId).subscribe((rows) => {
      this.messages = [];
      for (const r of rows) {
        this.messages.push({ role: 'user', content: r.question, ts: this.fmtTs(r.at) });
        this.messages.push({ role: 'assistant', content: r.answer, ts: this.fmtTs(r.at) });
      }
      this.scrollBottom();   // open at the latest message, input ready below
    });
  }
  private scrollBottom() {
    setTimeout(() => {
      const el = document.querySelector('.chat-thread');
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }
  private fmtTs(iso: string | null): string {
    const d = iso ? new Date(iso) : new Date();
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric' }) + ' at ' +
           d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  private now(): string { return this.fmtTs(null); }

  // ---- markdown (safe: escape then apply) ----
  md(src: string): string {
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const inline = (s: string) => esc(s)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
    const lines = (src || '').split('\n');
    let html = ''; let ul = false, ol = false;
    const close = () => { if (ul) { html += '</ul>'; ul = false; } if (ol) { html += '</ol>'; ol = false; } };
    for (const raw of lines) {
      const line = raw.replace(/\s+$/, '');
      let m: RegExpMatchArray | null;
      if (/^\s*---\s*$/.test(line)) { close(); html += '<hr/>'; }
      else if ((m = line.match(/^\s*[-*]\s+(.*)$/))) { if (ol) { html += '</ol>'; ol = false; } if (!ul) { html += '<ul>'; ul = true; } html += '<li>' + inline(m[1]) + '</li>'; }
      else if ((m = line.match(/^\s*\d+\.\s+(.*)$/))) { if (ul) { html += '</ul>'; ul = false; } if (!ol) { html += '<ol>'; ol = true; } html += '<li>' + inline(m[1]) + '</li>'; }
      else if ((m = line.match(/^\s*#{1,4}\s+(.*)$/))) { close(); html += '<h4>' + inline(m[1]) + '</h4>'; }
      else if (line.trim() === '') { close(); }
      else { close(); html += '<p>' + inline(line) + '</p>'; }
    }
    close();
    return html;
  }

  // ---- chat ----
  send(preset?: string) {
    const text = (preset ?? this.question).trim();
    if (!text || !this.courseId || this.busyChat) return;
    this.messages.push({ role: 'user', content: text, ts: this.now() });
    this.question = '';
    this.busyChat = true;
    const history = this.messages.slice(0, -1).map((m) => ({ role: m.role, content: m.content }));
    this.api.chat(+this.courseId, text, history).subscribe({
      next: (r) => {
        this.busyChat = false;
        const msg: ChatMsg = { role: 'assistant', content: '', sources: r.sources, ts: this.now() };
        this.messages.push(msg);
        this.typeOut(msg, r.answer || '');
      },
      error: (e) => {
        this.busyChat = false;
        const detail = e?.error?.detail || 'Sorry — I could not reach the assistant.';
        this.messages.push({ role: 'assistant', content: detail, ts: this.now() });
      },
    });
  }
  private typeOut(msg: ChatMsg, full: string) {
    const tokens = full.split(/(\s+)/);
    let i = 0; this.typing = true;
    const step = () => {
      if (i >= tokens.length) { this.typing = false; return; }
      msg.content += tokens[i++];
      const el = document.querySelector('.chat-thread');
      if (el) el.scrollTop = el.scrollHeight;
      setTimeout(step, 18);
    };
    step();
  }
  clearChat() { this.messages = []; }

  // ---- study material ----
  openMaterials() { this.tab = 'materials'; this.loadDocs(); }
  loadDocs() {
    if (!this.courseId) return;
    this.api.documents(+this.courseId).subscribe((d) => (this.docs = d));
  }
  download(d: any) {
    this.api.downloadDocument(d.id).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = d.title; a.click();
      URL.revokeObjectURL(url);
    });
  }

  // ---- quiz ----
  makeQuiz() {
    if (!this.quizTopic || !this.courseId) return;
    this.busyQuiz = true; this.quiz = []; this.quizSubmitted = false; this.quizScore = 0;
    this.api.quiz(+this.courseId, this.quizTopic).subscribe({
      next: (r) => { this.busyQuiz = false; this.quiz = (r.questions || []).map((q: any) => ({ ...q, _sel: null })); },
      error: () => { this.busyQuiz = false; },
    });
  }
  pick(q: any, o: string) { if (!this.quizSubmitted) q._sel = o; }
  allAnswered() { return this.quiz.length > 0 && this.quiz.every((q) => q._sel != null); }
  submitQuiz() {
    const correct = this.quiz.filter((q) => q._sel === q.answer).length;
    this.quizScore = Math.round((correct / this.quiz.length) * 100);
    this.quizSubmitted = true;
    this.api.saveResult(+this.courseId, this.quizTopic, this.quizScore).subscribe(() => { this.loadMastery(); });
  }

  // ---- flashcards ----
  makeFlashcards() {
    if (!this.flashTopic || !this.courseId) return;
    this.busyFlash = true;
    this.api.flashcards(+this.courseId, this.flashTopic).subscribe({
      next: (r) => { this.busyFlash = false; this.flashcards = r.cards; },
      error: () => { this.busyFlash = false; },
    });
  }

  // ---- progress (live dashboard) ----
  stats: any = null;
  private liveTimer: any = null;
  loadMastery() { this.api.myMastery().subscribe((m) => (this.mastery = m)); }
  refreshProgress() {
    this.loadMastery();
    this.api.myTrend().subscribe((t) => (this.trend = t));
    this.api.myStats().subscribe((s) => (this.stats = s));
  }
  openProgress() {
    this.tab = 'progress';
    this.refreshProgress();
    this.stopLive();
    this.liveTimer = setInterval(() => { if (this.tab === 'progress') this.refreshProgress(); }, 12000);
  }
  stopLive() { if (this.liveTimer) { clearInterval(this.liveTimer); this.liveTimer = null; } }
  go(t: any) { this.tab = t; this.stopLive(); }
  ngOnDestroy() { this.stopLive(); this.stopTestTimer(); }
  abs(v: number) { return Math.abs(v); }

  // ---- svg chart helpers ----
  colW(n: number) { return Math.min(24, Math.max(10, 500 / n - 8)); }
  colPath(x: number, y: number, w: number, h: number): string {  // rounded top, square baseline
    if (h <= 0) return '';
    const r = Math.min(4, h, w / 2);
    return `M ${x} ${y + h} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} L ${x + w - r} ${y} Q ${x + w} ${y} ${x + w} ${y + r} L ${x + w} ${y + h} Z`;
  }
  rowPath(x: number, y: number, w: number, h: number): string {  // rounded right end, square left
    if (w <= 0) return '';
    const r = Math.min(4, w, h / 2);
    return `M ${x} ${y} L ${x + w - r} ${y} Q ${x + w} ${y} ${x + w} ${y + r} L ${x + w} ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} L ${x} ${y + h} Z`;
  }
  recentMax() { return Math.max(...(this.stats?.recent || []).map((r: any) => r.score)); }
  actMax() { return Math.max(1, ...(this.stats?.daily || []).flatMap((d: any) => [d.quizzes, d.chats])); }
  scaleAct(v: number) { return v / this.actMax() * 120; }
  distMax() { return Math.max(1, ...Object.values(this.stats?.distribution || {1: 1}) as number[]); }
  scaleDist(v: number) { return v / this.distMax() * 120; }
  distBuckets() { const d = this.stats?.distribution || {}; return Object.keys(d).map((k) => ({ k, v: d[k] })); }

  // radar (centre 150,100, radius 78)
  private radarPt(i: number, n: number, r: number) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return { x: 150 + r * Math.cos(a), y: 100 + r * Math.sin(a) };
  }
  radarRing(pct: number): string {
    const n = this.stats?.radar?.length || 3;
    return Array.from({ length: n }, (_, i) => { const p = this.radarPt(i, n, pct / 100 * 78); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(' ');
  }
  radarSpokes() {
    const n = this.stats?.radar?.length || 0;
    return Array.from({ length: n }, (_, i) => this.radarPt(i, n, 78));
  }
  radarPoints() {
    const rd = this.stats?.radar || [];
    return rd.map((t: any, i: number) => ({ ...this.radarPt(i, rd.length, t.mastery / 100 * 78), topic: t.topic, mastery: t.mastery }));
  }
  radarData(): string {
    return this.radarPoints().map((p: any) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  }
  radarLabels() {
    const rd = this.stats?.radar || [];
    return rd.map((t: any, i: number) => {
      const p = this.radarPt(i, rd.length, 92);
      return { x: p.x, y: p.y + 3, topic: t.topic.slice(0, 14), anchor: p.x < 140 ? 'end' : (p.x > 160 ? 'start' : 'middle') };
    });
  }

  // ---- materials split ----
  profDocs() { return this.docs.filter((d) => d.uploader_role !== 'student'); }
  myDocs() { return this.docs.filter((d) => d.uploaded_by_id === this.user?.id); }
  imgErr(e: Event) { (e.target as HTMLImageElement).style.display = 'none'; }
  subjectCount() { return this.profGroups.reduce((n, g) => n + (g.courses?.length || 0), 0); }
  avgMastery(): number | null {
    if (!this.mastery.length) return null;
    return Math.round(this.mastery.reduce((a, m) => a + m.mastery, 0) / this.mastery.length);
  }
  weakest() { return this.mastery.length ? [...this.mastery].sort((a, b) => a.mastery - b.mastery)[0] : null; }
  practice(topic: string) { this.tab = 'quiz'; this.quizTopic = topic; this.makeQuiz(); }
  xPos(i: number): number {
    const n = this.trend.weeks.length; return 30 + (n <= 1 ? 245 : (i / (n - 1)) * 490);
  }
  line(key: string): string {
    const w = this.trend.weeks || [];
    return w.map((d: any, i: number) => `${this.xPos(i).toFixed(1)},${(160 - (d[key] / 100) * 150).toFixed(1)}`).join(' ');
  }

  // ---- appointments ----
  openAppts() { this.go('appts'); this.loadEngage(); }
  loadEngage() {
    this.api.appointments().subscribe((a) => (this.appointments = a));
    this.api.notifications().subscribe((n) => (this.notifications = n));
  }
  confirmAppt(a: any) {
    this.api.confirmAppointment(a.id).subscribe(() => { a.status = 'confirmed'; a.can_confirm = false; });
  }

  // ---- assigned tests (with countdown timer) ----
  assigned: any[] = []; taking: any = null; answers: string[] = [];
  timeLeft = 0; private testTimer: any = null; startedAt = ''; testResult: any = null; busyTest = false;
  openTests2() { this.go('tests'); this.taking = null; this.testResult = null; this.loadAssigned(); }
  loadAssigned() { this.api.assessments().subscribe((a) => (this.assigned = a)); }
  pendingTests() { return this.assigned.filter((a) => a.status !== 'done').length; }
  startTest(t: any) {
    this.api.takeAssessment(t.id).subscribe({
      next: (d) => {
        this.taking = d; this.testResult = null;
        this.answers = new Array(d.questions.length).fill('');
        this.startedAt = new Date().toISOString();
        this.timeLeft = d.time_limit_min * 60; this.startTestTimer();
      },
      error: (e) => alert(e?.error?.detail || 'Cannot start this test.'),
    });
  }
  private startTestTimer() {
    this.stopTestTimer();
    this.testTimer = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) { this.stopTestTimer(); this.submitTest(true); }
    }, 1000);
  }
  private stopTestTimer() { if (this.testTimer) { clearInterval(this.testTimer); this.testTimer = null; } }
  fmtClock() { const m = Math.floor(Math.max(0, this.timeLeft) / 60), s = Math.max(0, this.timeLeft) % 60; return `${m}:${s < 10 ? '0' : ''}${s}`; }
  submitTest(auto: boolean) {
    if (!this.taking || this.busyTest) return;
    this.busyTest = true; this.stopTestTimer();
    const id = this.taking.id;
    this.api.submitAssessment(id, this.answers, this.startedAt).subscribe({
      next: (r) => { this.busyTest = false; this.testResult = r; this.taking = null; this.loadAssigned(); },
      error: (e) => { this.busyTest = false; if (!auto) alert(e?.error?.detail || 'Submit failed.'); this.taking = null; this.loadAssigned(); },
    });
  }
  pctScore() { return this.testResult?.max_score ? Math.round(this.testResult.score / this.testResult.max_score * 100) : 0; }

  // ---- upload ----
  onFile(e: Event) { this.file = (e.target as HTMLInputElement).files?.[0] || null; }
  upload() {
    if (!this.file || !this.courseId) return;
    this.busyUpload = true; this.uploadMsg = ''; this.uploadErr = false;
    this.api.uploadFile(+this.courseId, this.file, this.upName, this.upWeek).subscribe({
      next: (r) => { this.busyUpload = false; this.uploadMsg = `✓ Indexed "${r.title}" (${r.chunks} chunks). The assistant can now use it.`; this.file = null; this.upName = ''; this.upWeek = ''; },
      error: (e) => { this.busyUpload = false; this.uploadErr = true; this.uploadMsg = e?.error?.detail || 'Upload failed'; },
    });
  }

  logout() { localStorage.clear(); this.router.navigate(['/login']); }
}
