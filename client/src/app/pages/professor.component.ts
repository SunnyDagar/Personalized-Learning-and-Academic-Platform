import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../api.service';
import { BrandService } from '../brand.service';

interface ChatMsg { role: 'user' | 'assistant'; content: string; ts?: string; }

@Component({
  selector: 'app-professor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="topbar">
      <span class="brand">{{ brand.name }} · Professor</span>
      <span class="me-chip">
        <img class="uavatar" *ngIf="user?.avatar" [src]="user.avatar" (error)="imgErr($event)" alt="">
        {{ user?.name }} <button (click)="logout()">Logout</button></span>
    </div>
    <div class="container">
      <div class="card">
        <label>Course</label>
        <select [(ngModel)]="courseId" (ngModelChange)="onCourse()">
          <option *ngFor="let c of courses" [value]="c.id">{{ c.code }} — {{ c.title }}</option>
        </select>
        <p class="muted" *ngIf="!courses.length">No courses yet.</p>
      </div>

      <div class="tabs">
        <button [class.active]="tab==='analytics'" (click)="tab='analytics'">📈 Analytics</button>
        <button [class.active]="tab==='materials'" (click)="openMaterials()">📚 Materials</button>
        <button [class.active]="tab==='tests'" (click)="openTests()">📝 Tests</button>
        <button [class.active]="tab==='appts'" (click)="openAppts()">📅 Appointments
          <span class="tab-badge" *ngIf="pendingCount()">{{ pendingCount() }}</span></button>
        <button [class.active]="tab==='assistant'" (click)="openAssistant()">🤖 AI Assistant</button>
      </div>

      <!-- ============ APPOINTMENTS ============ -->
      <div class="grid" *ngIf="tab==='appts'">
        <div class="card" style="grid-column:1 / -1;">
          <div class="top">
            <h3>📅 Student appointment requests</h3>
            <button class="ghost" (click)="loadAppts()">Refresh</button>
          </div>
          <p class="muted">Requests students booked through Lia. Confirm them to notify the student and
            add them to both calendars.</p>
          <table *ngIf="appts.length">
            <tr><th>Booked by</th><th>With</th><th>When · Topic</th><th>Status</th><th></th></tr>
            <tr *ngFor="let a of appts">
              <td><b>{{ bookedBy(a) }}</b><div class="muted small">{{ a.created_by==='professor' ? 'you booked this' : 'student requested' }}</div></td>
              <td>{{ withWhom(a) }}</td>
              <td>{{ a.when }}</td>
              <td><span class="pill" [class.badge-ok]="a.status==='confirmed'"
                        [class.badge-pend]="a.status!=='confirmed'">
                    {{ a.status==='confirmed' ? '✓ confirmed' : '⏳ awaiting confirmation' }}</span></td>
              <td style="text-align:right;">
                <button *ngIf="a.can_confirm" class="ok" (click)="confirm(a)">Confirm</button>
                <span class="muted" *ngIf="!a.can_confirm">—</span></td>
            </tr>
          </table>
          <p class="muted" *ngIf="!appts.length">No appointment requests yet.</p>

          <h4 style="margin:18px 0 8px;">🔔 Notifications</h4>
          <div class="note-item" *ngFor="let n of notes">
            <b>{{ n.from }}</b> <span class="muted">· {{ n.at }}</span><div>{{ n.body }}</div>
          </div>
          <p class="muted" *ngIf="!notes.length">No notifications.</p>
        </div>
      </div>

      <!-- ============ ANALYTICS ============ -->
      <div *ngIf="tab==='analytics'">
        <!-- KPI tiles -->
        <div class="kpis" *ngIf="analytics">
          <div class="card kpi"><div class="kpi-label">Class average</div>
            <div class="kpi-value">{{ analytics.class_average }}%</div></div>
          <div class="card kpi"><div class="kpi-label">Quiz results</div>
            <div class="kpi-value">{{ analytics.results_count }}</div></div>
          <div class="card kpi"><div class="kpi-label">Students at risk</div>
            <div class="kpi-value" [style.color]="analytics.at_risk_count ? '#d03b3b' : '#0b0b0b'">{{ analytics.at_risk_count }}</div>
            <div class="kpi-delta muted" *ngIf="!analytics.at_risk_count">✓ everyone on track</div></div>
        </div>
        <p class="muted" *ngIf="!analytics">Select a course to view analytics.</p>

        <div class="grid" *ngIf="analytics">
          <!-- Grade distribution -->
          <div class="card">
            <h3>📈 Grade distribution</h3>
            <svg viewBox="0 0 540 180" width="100%" height="180">
              <g *ngFor="let gy of gridLines()">
                <line x1="26" [attr.y1]="145-gy.f*125" x2="530" [attr.y2]="145-gy.f*125" stroke="#e1e0d9" stroke-width="1"/>
                <text x="20" [attr.y]="148-gy.f*125" font-size="9" fill="#898781" text-anchor="end">{{ gy.v }}</text>
              </g>
              <line x1="26" y1="145" x2="530" y2="145" stroke="#c3c2b7"/>
              <g *ngFor="let b of dist(); let i = index">
                <path *ngIf="b.v" [attr.d]="colPath(60 + i*95, 145 - b.v/distMax()*125, 24, b.v/distMax()*125)"
                      [attr.fill]="['#86b6ef','#5598e7','#2a78d6','#1c5cab','#104281'][i]">
                  <title>{{ b.k }}: {{ b.v }} results</title></path>
                <text *ngIf="b.v" [attr.x]="72 + i*95" [attr.y]="139 - b.v/distMax()*125" font-size="10" font-weight="600" fill="#0b0b0b" text-anchor="middle">{{ b.v }}</text>
                <text [attr.x]="72 + i*95" y="160" font-size="9" fill="#898781" text-anchor="middle">{{ b.k }}</text>
              </g>
            </svg>
          </div>

          <!-- Student averages -->
          <div class="card">
            <h3>🎯 Student averages</h3>
            <div *ngIf="analytics?.students?.length; else noStu">
              <svg [attr.viewBox]="'0 0 540 ' + (analytics.students.length*42 + 8)" width="100%" [attr.height]="analytics.students.length*42 + 8">
                <g *ngFor="let s of analytics.students; let i = index">
                  <text x="0" [attr.y]="i*42 + 17" font-size="11" font-weight="600" fill="#0b0b0b">{{ s.student.slice(0,16) }}</text>
                  <rect x="130" [attr.y]="i*42 + 6" width="340" height="16" fill="#f0efec"/>
                  <path [attr.d]="rowPath(130, i*42 + 6, s.average/100*340, 16)" [attr.fill]="s.at_risk ? '#d03b3b' : '#2a78d6'">
                    <title>{{ s.student }} — {{ s.average }}%{{ s.at_risk ? ' (at risk)' : '' }}</title></path>
                  <text [attr.x]="134 + s.average/100*340" [attr.y]="i*42 + 18" font-size="10" font-weight="600" fill="#0b0b0b">{{ s.average }}%</text>
                  <text x="530" [attr.y]="i*42 + 18" font-size="9" [attr.fill]="s.at_risk ? '#d03b3b' : '#006300'" text-anchor="end" font-weight="700">{{ s.at_risk ? '⚠ at risk' : '✓ on track' }}</text>
                </g>
              </svg>
            </div>
            <ng-template #noStu><p class="muted">No quiz results yet for this course.</p></ng-template>
          </div>
        </div>

        <!-- Monitoring table -->
        <div class="card" *ngIf="analytics?.students?.length">
          <h3>🚨 Students (Performance Monitoring)</h3>
          <table>
            <tr><th>Student</th><th>Average</th><th>Status</th></tr>
            <tr *ngFor="let s of analytics.students">
              <td><img class="uavatar sm" *ngIf="s.avatar" [src]="s.avatar" (error)="imgErr($event)" alt="">
                <span *ngIf="!s.avatar">🧑‍🎓</span> {{ s.student }}</td>
              <td>{{ s.average }}%</td>
              <td><span class="pill" [class.badge-risk]="s.at_risk">{{ s.at_risk ? '⚠ At risk' : '✓ On track' }}</span></td>
            </tr>
          </table>
        </div>
      </div>

      <!-- ============ MATERIALS ============ -->
      <div class="grid" *ngIf="tab==='materials'">
        <!-- Upload a file -->
        <div class="card">
          <h3>📥 Upload material (PDF / Word / text)</h3>
          <p class="muted">Lecture slides, readings — or your <b>appointment/meeting notes</b> so the AI
            assistant knows what you discussed offline and where the student struggles.</p>
          <label>Study material name</label>
          <input [(ngModel)]="upName" placeholder="e.g. Lecture 4 — CNNs">
          <label>Week / module</label>
          <input [(ngModel)]="upWeek" placeholder="e.g. Week 4">
          <label>File</label>
          <input type="file" accept=".pdf,.docx,.txt,.md" (change)="onFile($event)" />
          <div style="margin-top:10px;">
            <button (click)="uploadFile()" [disabled]="!file || busyUpload">{{ busyUpload ? 'Uploading…' : 'Upload & index' }}</button>
          </div>
          <p class="muted" *ngIf="uploadMsg">{{ uploadMsg }}</p>
          <hr style="margin:16px 0;border:0;border-top:1px solid #e2e8f0;" />
          <h4 style="margin:0 0 6px;">…or paste notes as text</h4>
          <label>Title</label>
          <input [(ngModel)]="docTitle" placeholder="Lecture 3 — Trees · or · Meeting notes — Sam, 12 Aug" />
          <label>Text</label>
          <textarea [(ngModel)]="docText" placeholder="Paste lecture notes or the meeting script here..."></textarea>
          <div style="margin-top:10px;"><button (click)="ingest()" [disabled]="busyIngest">Ingest material</button></div>
          <p class="muted" *ngIf="ingestMsg">{{ ingestMsg }}</p>
        </div>

        <!-- Course material list (only the professor's own uploads), grouped by week -->
        <div class="card">
          <h3>📚 My uploaded material</h3>
          <p class="muted small">Everything you shared with this class, organised week by week.
            Download any file to keep a copy. (Student self-uploads stay private to the student.)</p>
          <div *ngFor="let g of docsByWeek()" class="week-group">
            <h4 class="week-h">📅 {{ g.week }} <span class="muted small">· {{ g.docs.length }} item{{ g.docs.length>1?'s':'' }}</span></h4>
            <table>
              <tr><th>Material / topic</th><th>Uploaded</th><th></th></tr>
              <tr *ngFor="let d of g.docs">
                <td>{{ d.title }}
                  <div class="muted small">{{ d.chunks }} chunks<span *ngIf="d.filename && d.filename!==d.title"> · {{ d.filename }}</span></div></td>
                <td class="muted small">{{ d.created_at | date:'d MMM y' }}</td>
                <td style="text-align:right;">
                  <button *ngIf="d.downloadable" (click)="download(d)">⬇ Download</button>
                  <span class="muted" *ngIf="!d.downloadable">text note</span></td>
              </tr>
            </table>
          </div>
          <p class="muted" *ngIf="!myDocs().length">You haven't uploaded any material for this course yet.</p>
        </div>
      </div>

      <!-- ============ TESTS ============ -->
      <div class="grid" *ngIf="tab==='tests'">
        <!-- Create test -->
        <div class="card">
          <h3>📝 Create a test / question paper</h3>
          <div class="mode-tabs">
            <button type="button" [class.on]="createMode==='ai'" (click)="setMode('ai')">✨ Generate with AI</button>
            <button type="button" [class.on]="createMode==='manual'" (click)="setMode('manual')">✍️ Create manually</button>
          </div>
          <label>Title</label>
          <input [(ngModel)]="tTitle" placeholder="Quiz 1 — Recursion basics">
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <div style="flex:1;min-width:150px;"><label>Question type</label>
              <select [(ngModel)]="tType" (ngModelChange)="applyType()">
                <option value="mcq">Multiple choice</option>
                <option value="short">Short answer</option>
              </select></div>
            <div style="flex:1;min-width:120px;"><label>Number of questions</label>
              <select [(ngModel)]="qCount" (ngModelChange)="onCountChange()">
                <option [ngValue]="2">2</option>
                <option [ngValue]="5">5</option>
                <option [ngValue]="10">10</option>
                <option [ngValue]="15">15</option>
                <option [ngValue]="20">20</option>
                <option [ngValue]="25">25</option>
              </select></div>
            <div style="flex:1;min-width:120px;"><label>Time limit (min)</label><input type="number" min="1" [(ngModel)]="tLimit"></div>
            <div style="flex:1;min-width:120px;"><label>Due date (optional)</label><input type="date" [(ngModel)]="tDue"></div>
          </div>
          <p class="muted small">This test is all <b>{{ tType==='mcq' ? 'multiple-choice' : 'short-answer' }}</b> questions.</p>

          <!-- AI generation (default mode) -->
          <div class="ai-gen" *ngIf="createMode==='ai'">
            <div class="qrow">
              <input [(ngModel)]="aiTopic" placeholder="Topic for AI to generate (e.g. recursion, CNNs)" class="grow">
              <button type="button" (click)="aiGenerate()" [disabled]="!aiTopic || aiBusy">
                {{ aiBusy ? 'Generating…' : '✨ Generate with AI' }}</button>
            </div>
            <p class="muted small">The AI drafts {{ qCount }} {{ tType==='mcq' ? 'multiple-choice' : 'short-answer' }}
              questions from your course material — review and edit them below, then Create test.</p>
            <p *ngIf="aiMsg" [style.color]="aiErr ? '#c53030' : '#006300'" class="small">{{ aiMsg }}</p>
          </div>
          <hr style="margin:14px 0;border:0;border-top:1px solid #e2e8f0;">
          <div *ngFor="let q of tQs; let i=index" class="qedit">
            <div class="top"><b>Q{{ i+1 }}</b>
              <button class="danger mini" (click)="tQs.splice(i,1)">✕ remove</button></div>
            <input [(ngModel)]="q.q" placeholder="Question text" style="width:100%;">
            <div *ngIf="tType==='mcq'" class="opts-wrap">
              <div *ngFor="let o of q.options; let oi=index; trackBy: trackIndex" class="optrow">
                <input type="radio" [name]="'ans'+i" [checked]="q.answer===q.options[oi]" (change)="q.answer=q.options[oi]" title="Mark as the correct answer" class="opt-radio">
                <input type="text" [(ngModel)]="q.options[oi]" placeholder="Option {{ oi+1 }}" class="grow">
                <button type="button" class="mini" (click)="q.options.splice(oi,1)" *ngIf="q.options.length>2" title="remove option">✕</button>
              </div>
              <div class="opts-actions">
                <button type="button" class="mini" (click)="q.options.push('')">+ option</button>
                <span class="muted small">Select the ⦿ next to the correct option.</span>
              </div>
            </div>
            <div *ngIf="tType==='short'" style="margin-top:6px;">
              <label>Model answer (what a correct 1–2 line answer says)</label>
              <input [(ngModel)]="q.answer" placeholder="e.g. A base case stops the recursion" style="width:100%;">
            </div>
            <div style="margin-top:6px;"><label>Points</label>
              <input type="number" min="1" [(ngModel)]="q.points" style="width:90px;"></div>
          </div>
          <div style="margin-top:8px;" *ngIf="createMode==='manual' || tQs.length">
            <button (click)="addQ()">+ Add question</button>
          </div>
          <div style="margin-top:12px;">
            <button class="ok" (click)="createTest()" [disabled]="!tTitle || !tQs.length || busyTest">Create test</button></div>
          <p [style.color]="tErr ? '#c53030' : '#006300'" *ngIf="tMsg">{{ tMsg }}</p>
        </div>

        <!-- Your tests -->
        <div class="card">
          <h3>📋 Your tests</h3>
          <table *ngIf="tests.length">
            <tr><th>Test</th><th>Completed</th><th></th></tr>
            <tr *ngFor="let t of tests">
              <td><b>{{ t.title }}</b><div class="muted">{{ t.questions }} Qs · {{ t.time_limit_min }} min{{ t.due_at ? ' · due ' + (t.due_at | slice:0:10) : '' }}</div></td>
              <td><b>{{ t.submitted }}</b>/{{ t.assigned }}
                <span class="pill badge-pend" *ngIf="t.pending">{{ t.pending }} pending</span></td>
              <td><button (click)="openResults(t)">Results</button></td>
            </tr>
          </table>
          <p class="muted" *ngIf="!tests.length">No tests yet — create one on the left.</p>
        </div>

        <!-- Results -->
        <div class="card" style="grid-column:1 / -1;" *ngIf="results">
          <div class="top"><h3>Results — {{ results.title }}</h3>
            <button class="ghost" (click)="results=null">Close</button></div>
          <p>
            <span class="pill badge-ok">{{ results.done }} completed</span>
            <span class="pill badge-pend">{{ results.pending }} not done</span>
            <span class="pill badge-late">{{ results.delayed }} delayed (past due)</span>
          </p>
          <p class="muted small">Completed tests are <b>auto-graded on submit</b> — MCQs automatically, short
            answers by the AI — so a provisional score is ready right away. Click a student's name to
            open their paper, mark each answer right/wrong, and save your final grade.</p>
          <table>
            <tr><th>Student</th><th>Status</th><th>Score</th><th>Graded by</th><th></th></tr>
            <tr *ngFor="let r of results.rows">
              <td><a *ngIf="r.submission_id" href="javascript:" (click)="openGrade(r)" class="stu-link">{{ r.student }}</a>
                  <span *ngIf="!r.submission_id">{{ r.student }}</span></td>
              <td><span class="pill" [ngClass]="{'badge-ok':r.status==='done','badge-pend':r.status==='pending','badge-late':r.status==='delayed'}">{{ r.status }}</span></td>
              <td>{{ r.score != null ? r.score + '/' + r.max_score : '—' }}</td>
              <td>
                <span class="pill" *ngIf="r.graded_by==='professor'" style="background:#c6f6d5;color:#22543d;">✓ you graded</span>
                <span class="pill" *ngIf="r.graded_by==='ai' || r.graded_by==='auto'" style="background:#e9d8fd;color:#553c9a;">🤖 AI — review</span>
                <span *ngIf="!r.graded_by">—</span>
              </td>
              <td style="text-align:right;"><button class="mini" *ngIf="r.submission_id" (click)="openGrade(r)">✎ grade</button></td>
            </tr>
          </table>
          <p class="muted small">Click a student's name to open their paper and mark each answer.</p>
        </div>
      </div>

      <!-- ============ GRADING MODAL ============ -->
      <div class="modal-back" *ngIf="grade" (click)="grade=null">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="top">
            <h3 style="margin:0;">{{ grade.title }} — {{ grade.student }}</h3>
            <button class="ghost" (click)="grade=null">✕</button>
          </div>
          <p><b>Score: {{ liveScore() }}/{{ grade.max_score }}</b>
            <span class="muted">· auto-updates as you mark</span></p>
          <div *ngFor="let it of grade.items; let i=index" class="qgrade">
            <div class="q-title">{{ i+1 }}. {{ it.q }} <span class="muted">({{ it.points }} pt)</span></div>
            <div class="ans-row"><span class="lbl">Student answer:</span>
              <span [style.color]="it.awarded>0 ? '#22543d' : '#742a2a'">{{ it.response || '—' }}</span></div>
            <div class="ans-row" *ngIf="it.type!=='mcq' || true"><span class="lbl">Correct / model:</span>
              <span class="muted">{{ it.correct_answer }}</span></div>
            <div class="ans-row" *ngIf="it.feedback"><span class="lbl">AI note:</span><span class="muted">{{ it.feedback }}</span></div>
            <div class="mark-row">
              <button class="markbtn" [class.on-right]="awards[i] >= it.points" (click)="awards[i]=it.points">✓ Correct ({{ it.points }})</button>
              <button class="markbtn" [class.on-wrong]="awards[i] === 0" (click)="awards[i]=0">✗ Wrong (0)</button>
              <span class="muted small">or points:</span>
              <input type="number" min="0" [max]="it.points" [(ngModel)]="awards[i]" style="width:70px;">
            </div>
          </div>
          <div class="test-foot">
            <button class="ok" (click)="saveGrade()" [disabled]="busyGrade">{{ busyGrade ? 'Saving…' : 'Save grade' }}</button>
            <button class="ghost" (click)="grade=null">Cancel</button>
          </div>
        </div>
      </div>

      <!-- ============ AI ASSISTANT ============ -->
      <div class="card chatpanel" *ngIf="tab==='assistant'">
        <div class="agent-head">
          <img class="avatar" [src]="liaImg" alt="Lia" (error)="liaFallback($event)" />
          <span><b>Lia</b> <span class="agent-sub">(AI Assistant)</span><br>
            <small>Ask about your course content, or schedule a student appointment —
              e.g. <i>"book an appointment on 14 Aug at 2pm about recursion"</i></small></span>
        </div>
        <div class="chat-thread">
          <div *ngFor="let m of messages" class="bubble" [class.you]="m.role==='user'" [class.ai]="m.role==='assistant'">
            <div class="bubble-role" *ngIf="m.role==='assistant'">Lia (AI Agent)</div>
            <div class="bubble-text" *ngIf="m.role==='assistant'" [innerHTML]="md(m.content)"></div>
            <div class="bubble-text" *ngIf="m.role!=='assistant'">{{ m.content }}</div>
            <div class="ts">{{ m.ts }}</div>
          </div>
          <div *ngIf="busyChat" class="thinking">
            <img class="avatar sm" [src]="liaImg" alt="Lia" (error)="liaFallback($event)" />
            <span class="think-pill">Lia is thinking <span class="d"></span><span class="d"></span><span class="d"></span></span>
          </div>
        </div>
        <div class="chat-input">
          <input [(ngModel)]="question" (keyup.enter)="send()" placeholder="Type a short message…" [disabled]="busyChat" />
          <button (click)="send()" [disabled]="busyChat || !question.trim()">➤</button>
        </div>
        <p class="ai-note">Replies are generated by an AI assistant.</p>
      </div>
    </div>
  `,
  styles: [`
    .tabs { display:flex; gap:8px; margin-bottom:16px; flex-wrap:wrap; }
    .tabs button { background:#edf2f7; color:#2b6cb0; }
    .tabs button.active { background:#2b6cb0; color:#fff; }
    .kpis { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:14px; }
    @media (max-width:820px){ .kpis { grid-template-columns:1fr; } }
    .kpi { padding:16px 18px; margin-bottom:0; }
    .kpi-label { font-size:.8rem; color:#898781; margin-bottom:4px; }
    .kpi-value { font-size:1.9rem; font-weight:700; color:#0b0b0b; line-height:1.1; }
    .kpi-delta { font-size:.8rem; font-weight:600; margin-top:4px; }
    .tab-badge { background:#d03b3b; color:#fff; border-radius:999px; font-size:.72rem; font-weight:700; padding:1px 7px; margin-left:4px; }
    .top { display:flex; justify-content:space-between; align-items:center; }
    .badge-ok { background:#c6f6d5; color:#22543d; }
    .badge-pend { background:#fef3c7; color:#92400e; }
    .note-item { border-bottom:1px solid #e2e8f0; padding:8px 0; font-size:.92rem; }
    button.ok { background:#047857; } button.ok:hover { background:#065f46; }
    button.danger { background:#b91c1c; } button.danger:hover { background:#991b1b; }
    button.mini { padding:4px 9px; font-size:.78rem; }
    .small { font-size:.78rem; }
    .badge-late { background:#fed7d7; color:#742a2a; }
    .qedit { background:#f8f9fa; border:1px solid #e2e8f0; border-radius:10px; padding:12px; margin-bottom:10px; }
    .qedit input, .qedit select { width:100%; }
    .qrow { display:flex; gap:8px; align-items:center; }
    .qtype { flex:0 0 150px; width:150px; }
    .grow { flex:1 1 auto; min-width:0; width:auto; }
    .opts-wrap { margin-top:8px; padding-left:2px; }
    .optrow { display:flex; gap:8px; align-items:center; margin-bottom:6px; }
    .opt-radio { flex:0 0 18px; width:18px; height:18px; margin:0; }
    .optrow .mini { flex:0 0 auto; }
    .opts-actions { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-top:2px; }
    @media (max-width:560px){ .qrow { flex-wrap:wrap; } .qtype { flex:1 1 100%; width:100%; } }
    .stu-link { color:#2b6cb0; font-weight:700; cursor:pointer; text-decoration:underline; }
    .week-group { margin-bottom:14px; }
    .week-h { margin:6px 0 4px; color:#2b6cb0; border-bottom:1px solid #edf2f7; padding-bottom:4px; }
    .mode-tabs { display:flex; gap:8px; margin:2px 0 12px; }
    .mode-tabs button { flex:1; background:#f1f5f9; color:#475569; border:1px solid #e2e8f0; font-weight:600; }
    .mode-tabs button.on { background:#7c3aed; color:#fff; border-color:#7c3aed; }
    .ai-gen { background:#f5f3ff; border:1px solid #ddd6fe; border-radius:10px; padding:12px; margin-top:10px; }
    .ai-gen button { background:#7c3aed; } .ai-gen button:hover { background:#6d28d9; }
    .ai-gen button:disabled { opacity:.6; }
    /* grading modal */
    .modal-back { position:fixed; inset:0; background:rgba(15,23,42,.55); display:flex;
      align-items:flex-start; justify-content:center; padding:32px 16px; z-index:50; overflow-y:auto; }
    .modal { background:#fff; border-radius:14px; padding:22px; width:100%; max-width:680px; box-shadow:0 20px 60px rgba(0,0,0,.3); }
    .qgrade { border:1px solid #e2e8f0; border-radius:10px; padding:12px; margin-bottom:10px; }
    .ans-row { font-size:.9rem; margin:3px 0; } .ans-row .lbl { display:inline-block; width:120px; color:#718096; }
    .mark-row { display:flex; gap:8px; align-items:center; margin-top:8px; flex-wrap:wrap; }
    .markbtn { background:#edf2f7; color:#2d3748; border:1px solid #e2e8f0; }
    .markbtn.on-right { background:#c6f6d5; border-color:#38a169; color:#22543d; }
    .markbtn.on-wrong { background:#fed7d7; border-color:#c53030; color:#742a2a; }
    .test-foot { display:flex; gap:10px; align-items:center; margin-top:12px; }
    .chatpanel { padding:0; overflow:hidden; }
    .agent-head { display:flex; gap:10px; align-items:center; background:#2b6cb0; color:#fff; padding:12px 16px; }
    .agent-sub { opacity:.8; font-size:.85rem; } .agent-head small { opacity:.85; }
    .avatar { width:38px; height:38px; border-radius:50%; background:#fff; object-fit:cover;
      border:2px solid rgba(255,255,255,.85); flex:none; }
    .avatar.sm { width:28px; height:28px; border:1px solid #e2e8f0; }
    .chat-thread { min-height:200px; max-height:380px; overflow-y:auto; padding:14px; }
    .bubble { margin-bottom:12px; padding:10px 14px; border-radius:14px; max-width:86%; }
    .bubble.you { background:#2b6cb0; color:#fff; margin-left:auto; border-bottom-right-radius:4px; }
    .bubble.ai { background:#f1f5f9; border-bottom-left-radius:4px; }
    .bubble-role { font-size:.78rem; color:#2b6cb0; margin-bottom:2px; font-weight:700; }
    .bubble-text :first-child { margin-top:0; }
    .bubble-text :last-child { margin-bottom:0; }
    .bubble-text p { margin:.4em 0; line-height:1.5; }
    .bubble-text ul, .bubble-text ol { margin:.4em 0; padding-left:1.3em; }
    .bubble-text li { margin:.2em 0; line-height:1.45; }
    .bubble-text h4 { margin:.6em 0 .3em; font-size:.98rem; font-weight:700; }
    .bubble-text code { background:#e2e8f0; padding:.05em .35em; border-radius:4px; font-size:.9em; }
    .bubble-text strong { font-weight:700; }
    .bubble-text hr { border:none; border-top:1px solid #d9e2ec; margin:.6em 0; }
    .ts { font-size:.7rem; opacity:.6; margin-top:4px; }
    .thinking { display:flex; align-items:center; gap:8px; margin:4px 0 10px; }
    .think-pill { background:#eef6ff; color:#0e7490; font-weight:700; font-size:.9rem;
      border-radius:999px; padding:8px 16px; display:inline-flex; align-items:center; gap:4px; }
    .think-pill .d { width:6px; height:6px; border-radius:50%; background:#0e7490; display:inline-block;
      animation:pulse 1.2s infinite; }
    .think-pill .d:nth-child(2) { animation-delay:.2s; } .think-pill .d:nth-child(3) { animation-delay:.4s; }
    @keyframes pulse { 0%,100%{opacity:.25; transform:scale(.85);} 50%{opacity:1; transform:scale(1.15);} }
    .chat-input { display:flex; gap:8px; padding:12px 14px; border-top:1px solid #e2e8f0; }
    .chat-input input { flex:1; border-radius:12px; }
    .ai-note { text-align:center; color:#a0aec0; font-size:.78rem; margin:0; padding:6px 0 10px; }
  `],
})
export class ProfessorComponent implements OnInit {
  user: any = null;
  courses: any[] = [];
  courseId = 0;
  analytics: any = null;
  private _tab: 'analytics' | 'materials' | 'tests' | 'appts' | 'assistant' = 'analytics';
  get tab() { return this._tab; }
  set tab(v: any) { this._tab = v; try { localStorage.setItem('prof_tab', v); } catch { /* ignore */ } }
  appts: any[] = []; notes: any[] = [];
  docTitle = ''; docText = ''; busyIngest = false; ingestMsg = '';
  file: File | null = null; busyUpload = false; uploadMsg = ''; upName = ''; upWeek = '';
  docs: any[] = [];
  messages: ChatMsg[] = []; question = ''; busyChat = false;
  liaImg = 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=96&h=96&fit=crop&crop=faces&q=80';
  liaFallback(e: Event) {
    const img = e.target as HTMLImageElement;
    img.onerror = null;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#63b3ed"/><stop offset="1" stop-color="#2b6cb0"/></linearGradient></defs><rect width="96" height="96" fill="url(#g)"/><text x="50%" y="54%" fill="#fff" font-family="sans-serif" font-size="42" font-weight="700" text-anchor="middle" dominant-baseline="middle">L</text></svg>');
  }

  constructor(private api: ApiService, private router: Router, public brand: BrandService) {}

  ngOnInit() {
    if (!localStorage.getItem('token')) { this.router.navigate(['/login']); return; }
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    if (this.user?.role !== 'professor') {           // staff area: professors only
      this.router.navigate([this.user ? '/student' : '/login']);
      return;
    }
    this.api.courses().subscribe((cs) => {
      this.courses = cs;
      if (cs.length) { this.courseId = cs[0].id; this.loadAnalytics(); this.restoreTab(); }
    });
    this.loadAppts();   // so the tab badge shows pending count immediately
  }

  restoreTab() {
    const saved = localStorage.getItem('prof_tab') || 'analytics';
    switch (saved) {
      case 'materials': this.openMaterials(); break;
      case 'tests': this.openTests(); break;
      case 'appts': this.openAppts(); break;
      case 'assistant': this.openAssistant(); break;
      default: this.tab = 'analytics';
    }
  }

  // ---- appointments ----
  openAppts() { this.tab = 'appts'; this.loadAppts(); }
  loadAppts() {
    this.api.appointments().subscribe((a) => (this.appts = a));
    this.api.notifications().subscribe((n) => (this.notes = n));
  }
  pendingCount() { return this.appts.filter((a) => a.can_confirm).length; }
  bookedBy(a: any) { return a.created_by === 'professor' ? a.professor : a.student; }
  withWhom(a: any) { return a.created_by === 'professor' ? a.student : a.professor; }
  confirm(a: any) {
    this.api.confirmAppointment(a.id).subscribe(() => { a.status = 'confirmed'; this.loadAppts(); });
  }

  // ---- tests ----
  tTitle = ''; tLimit = 10; tDue = ''; tType: 'mcq' | 'short' = 'mcq';
  tQs: any[] = []; tMsg = ''; tErr = false; busyTest = false;
  qCount = 2; createMode: 'ai' | 'manual' = 'ai'; tests: any[] = []; results: any = null;
  trackIndex(i: number) { return i; }
  setMode(m: 'ai' | 'manual') {
    this.createMode = m;
    if (m === 'manual' && !this.tQs.length) this.applyQCount();   // give manual its empty slots
  }
  onCountChange() { if (this.createMode === 'manual') this.applyQCount(); }
  addQ() {
    this.tQs.push({ q: '', type: this.tType, options: this.tType === 'mcq' ? ['', '', '', ''] : [], answer: '', points: 1 });
  }
  applyType() {   // switch the whole test between MCQ and short answer
    for (const q of this.tQs) {
      q.type = this.tType;
      if (this.tType === 'mcq' && (!q.options || !q.options.length)) q.options = ['', '', '', ''];
    }
  }
  applyQCount() {
    const n = +this.qCount;
    while (this.tQs.length < n) this.addQ();
    if (this.tQs.length > n) this.tQs = this.tQs.slice(0, n);
  }

  // AI-drafted question paper -> fills the editor for review before saving.
  aiTopic = ''; aiBusy = false; aiMsg = ''; aiErr = false;
  aiGenerate() {
    if (!this.aiTopic || !this.courseId) return;
    this.aiBusy = true; this.aiMsg = ''; this.aiErr = false;
    this.api.aiGenerate(+this.courseId, this.aiTopic, +this.qCount, this.tType).subscribe({
      next: (r) => {
        this.aiBusy = false;
        if (r.questions?.length) {
          this.tQs = r.questions;
          if (!this.tTitle) this.tTitle = this.aiTopic.charAt(0).toUpperCase() + this.aiTopic.slice(1) + ' quiz';
          this.aiMsg = `✓ Drafted ${r.generated} question${r.generated > 1 ? 's' : ''} — review & edit below, then Create test.`;
        } else {
          this.aiErr = true; this.aiMsg = 'The AI could not draft questions — try a clearer topic, or add questions manually.';
        }
      },
      error: (e) => { this.aiBusy = false; this.aiErr = true; this.aiMsg = e?.error?.detail || 'Generation failed.'; },
    });
  }
  openTests() { this.tab = 'tests'; this.loadTests(); }   // AI mode is default: no empty slots pre-filled
  loadTests() { if (this.courseId) this.api.assessments(+this.courseId).subscribe((t) => (this.tests = t)); }
  createTest() {
    this.busyTest = true; this.tMsg = ''; this.tErr = false;
    const due = this.tDue ? new Date(this.tDue + 'T09:00:00').toISOString() : null;
    this.api.createAssessment({ course_id: +this.courseId, title: this.tTitle,
      time_limit_min: +this.tLimit, due_at: due, questions: this.tQs }).subscribe({
      next: () => { this.busyTest = false; this.tMsg = '✓ Test created and assigned to your students.';
        this.tTitle = ''; this.tQs = []; this.tDue = ''; this.aiTopic = ''; this.aiMsg = '';
        if (this.createMode === 'manual') this.applyQCount(); this.loadTests(); },
      error: (e) => { this.busyTest = false; this.tErr = true; this.tMsg = e?.error?.detail || 'Failed to create test.'; },
    });
  }
  openResults(t: any) { this.api.assessmentResults(t.id).subscribe((r) => (this.results = r)); }

  // ---- per-question grading modal ----
  grade: any = null; awards: number[] = []; busyGrade = false;
  openGrade(r: any) {
    if (!r.submission_id) return;
    this.api.submission(r.submission_id).subscribe((g) => {
      this.grade = g;
      this.awards = g.items.map((it: any) => it.awarded);
    });
  }
  liveScore() {
    return Math.round((this.awards.reduce((a, b) => a + (+b || 0), 0)) * 10) / 10;
  }
  saveGrade() {
    if (!this.grade) return;
    this.busyGrade = true;
    this.api.gradeSubmission(this.grade.submission_id, this.awards.map((a) => +a || 0)).subscribe({
      next: () => {
        this.busyGrade = false; this.grade = null;
        if (this.results) this.api.assessmentResults(this.results.id).subscribe((rr) => (this.results = rr));
      },
      error: () => { this.busyGrade = false; },
    });
  }

  onCourse() {
    this.loadAnalytics(); this.loadDocs(); this.messages = []; this.results = null;
    if (this.tab === 'assistant') this.loadHistory();
    if (this.tab === 'tests') this.loadTests();
  }

  loadAnalytics() {
    if (!this.courseId) return;
    this.api.courseAnalytics(+this.courseId).subscribe((a) => (this.analytics = a));
  }

  dist(): { k: string; v: number }[] {
    const d = this.analytics?.distribution || {};
    return Object.keys(d).map((k) => ({ k, v: d[k] }));
  }
  distMax(): number { return Math.max(1, ...this.dist().map((x) => x.v)); }
  gridLines() {
    const m = this.distMax();
    return [0, 0.5, 1].map((f) => ({ f, v: Math.round(f * m) }));
  }
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

  // ---- materials ----
  openMaterials() { this.tab = 'materials'; this.loadDocs(); }
  loadDocs() {
    if (!this.courseId) return;
    this.api.documents(+this.courseId).subscribe((d) => (this.docs = d));
  }
  // Only material the professor/staff uploaded — student self-uploads stay private to them.
  myDocs() { return this.docs.filter((d) => d.uploader_role !== 'student'); }
  // Group the professor's material by week (sorted numerically), newest files first within a week.
  docsByWeek() {
    const groups: { [k: string]: any[] } = {};
    for (const d of this.myDocs()) {
      const w = d.week || 'Unsorted';
      (groups[w] = groups[w] || []).push(d);
    }
    const num = (w: string) => { const m = w.match(/(\d+)/); return m ? +m[1] : 9999; };
    return Object.keys(groups).sort((a, b) => num(a) - num(b))
      .map((w) => ({ week: w, docs: groups[w] }));
  }
  onFile(e: Event) { this.file = (e.target as HTMLInputElement).files?.[0] || null; }
  uploadFile() {
    if (!this.file || !this.courseId) return;
    this.busyUpload = true; this.uploadMsg = '';
    this.api.uploadFile(+this.courseId, this.file, this.upName, this.upWeek).subscribe({
      next: (r) => { this.busyUpload = false; this.uploadMsg = `✓ Indexed "${r.title}" (${r.chunks} chunks).`; this.file = null; this.upName = ''; this.upWeek = ''; this.loadDocs(); },
      error: (e) => { this.busyUpload = false; this.uploadMsg = e?.error?.detail || 'Upload failed'; },
    });
  }
  ingest() {
    if (!this.docTitle || !this.docText || !this.courseId) return;
    this.busyIngest = true; this.ingestMsg = '';
    this.api.ingest(+this.courseId, this.docTitle, this.docText).subscribe({
      next: (r) => { this.busyIngest = false; this.ingestMsg = `✓ Indexed ${r.chunks} chunks.`; this.docText = ''; this.loadDocs(); },
      error: (e) => { this.busyIngest = false; this.ingestMsg = e?.error?.detail || 'Ingest failed'; },
    });
  }
  download(d: any) {
    this.api.downloadDocument(d.id).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = d.title; a.click();
      URL.revokeObjectURL(url);
    });
  }

  // ---- AI assistant ----
  private fmtTs(iso: string | null): string {
    const d = iso ? new Date(iso) : new Date();
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric' }) + ' at ' +
           d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  private now(): string { return this.fmtTs(null); }
  private scrollBottom() {
    setTimeout(() => {
      const el = document.querySelector('.chat-thread');
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }
  openAssistant() { this.tab = 'assistant'; this.loadHistory(); }
  // ---- markdown (safe: escape then apply a small subset) ----
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

  imgErr(e: Event) { (e.target as HTMLImageElement).style.display = 'none'; }

  loadHistory() {
    if (!this.courseId) return;
    this.api.chatHistory(+this.courseId).subscribe((rows) => {
      this.messages = [];
      for (const r of rows) {
        this.messages.push({ role: 'user', content: r.question, ts: this.fmtTs(r.at) });
        this.messages.push({ role: 'assistant', content: r.answer, ts: this.fmtTs(r.at) });
      }
      this.scrollBottom();
    });
  }
  send() {
    const text = this.question.trim();
    if (!text || !this.courseId || this.busyChat) return;
    this.messages.push({ role: 'user', content: text, ts: this.now() });
    this.question = ''; this.busyChat = true; this.scrollBottom();
    const history = this.messages.slice(0, -1).map((m) => ({ role: m.role, content: m.content }));
    this.api.chat(+this.courseId, text, history).subscribe({
      next: (r) => { this.busyChat = false; this.messages.push({ role: 'assistant', content: r.answer, ts: this.now() }); this.scrollBottom(); },
      error: (e) => { this.busyChat = false; this.messages.push({ role: 'assistant', content: e?.error?.detail || 'Could not reach the assistant.', ts: this.now() }); this.scrollBottom(); },
    });
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
