import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  private auth() {
    const t = localStorage.getItem('token');
    return { headers: new HttpHeaders(t ? { Authorization: `Bearer ${t}` } : {}) };
  }

  // ---- auth ----
  login(email: string, password: string): Observable<any> {
    const body = new URLSearchParams();
    body.set('username', email);
    body.set('password', password);
    return this.http.post('/api/auth/login', body.toString(), {
      headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }),
    });
  }
  register(name: string, email: string, password: string, role: string): Observable<any> {
    return this.http.post('/api/auth/register', { name, email, password, role });
  }

  // ---- data ----
  courses(): Observable<any[]> {
    return this.http.get<any[]>('/api/courses', this.auth());
  }
  professorsCourses(): Observable<any[]> {
    return this.http.get<any[]>('/api/courses/by-professor', this.auth());
  }
  documents(course_id: number): Observable<any[]> {
    return this.http.get<any[]>('/api/documents?course_id=' + course_id, this.auth());
  }
  downloadDocument(doc_id: number): Observable<Blob> {
    const t = localStorage.getItem('token');
    return this.http.get(`/api/documents/${doc_id}/download`, {
      headers: new HttpHeaders(t ? { Authorization: `Bearer ${t}` } : {}),
      responseType: 'blob',
    });
  }
  chat(course_id: number, question: string, history: any[] = []): Observable<any> {
    return this.http.post('/api/chat', { course_id, question, history }, this.auth());
  }
  chatHistory(course_id: number): Observable<any[]> {
    return this.http.get<any[]>('/api/chat/history?course_id=' + course_id, this.auth());
  }
  quiz(course_id: number, topic: string, num_questions = 5): Observable<any> {
    return this.http.post('/api/quiz/generate', { course_id, topic, num_questions }, this.auth());
  }
  saveResult(course_id: number, topic: string, score: number): Observable<any> {
    return this.http.post('/api/quiz/result', { course_id, topic, score }, this.auth());
  }
  flashcards(course_id: number, topic: string, num_questions = 6): Observable<any> {
    return this.http.post('/api/flashcards/generate', { course_id, topic, num_questions }, this.auth());
  }
  myMastery(): Observable<any[]> {
    return this.http.get<any[]>('/api/analytics/my-mastery', this.auth());
  }
  courseAnalytics(course_id: number): Observable<any> {
    return this.http.get('/api/analytics/course/' + course_id, this.auth());
  }
  ingest(course_id: number, title: string, text: string): Observable<any> {
    return this.http.post('/api/documents/ingest', { course_id, title, text }, this.auth());
  }
  uploadFile(course_id: number, file: File, name = '', week = ''): Observable<any> {
    const fd = new FormData();
    fd.append('course_id', String(course_id));
    fd.append('file', file);
    fd.append('name', name);
    fd.append('week', week);
    return this.http.post('/api/documents/upload', fd, this.auth());
  }
  myTrend(): Observable<any> {
    return this.http.get('/api/analytics/my-trend', this.auth());
  }
  myStats(): Observable<any> {
    return this.http.get('/api/analytics/my-stats', this.auth());
  }

  // ---- assessments / tests ----
  createAssessment(body: any): Observable<any> {
    return this.http.post('/api/assessments', body, this.auth());
  }
  aiGenerate(course_id: number, topic: string, count: number, type: string): Observable<any> {
    return this.http.post('/api/assessments/ai-generate', { course_id, topic, count, type }, this.auth());
  }
  assessments(course_id?: number): Observable<any[]> {
    const q = course_id ? '?course_id=' + course_id : '';
    return this.http.get<any[]>('/api/assessments' + q, this.auth());
  }
  takeAssessment(id: number): Observable<any> {
    return this.http.get('/api/assessments/' + id + '/take', this.auth());
  }
  submitAssessment(id: number, answers: string[], started_at: string): Observable<any> {
    return this.http.post(`/api/assessments/${id}/submit`, { answers, started_at }, this.auth());
  }
  assessmentResults(id: number): Observable<any> {
    return this.http.get('/api/assessments/' + id + '/results', this.auth());
  }
  overrideScore(sid: number, score: number): Observable<any> {
    return this.http.post(`/api/assessments/submissions/${sid}/score`, { score }, this.auth());
  }
  submission(sid: number): Observable<any> {
    return this.http.get(`/api/assessments/submissions/${sid}`, this.auth());
  }
  gradeSubmission(sid: number, awards: number[]): Observable<any> {
    return this.http.post(`/api/assessments/submissions/${sid}/grade`, { awards }, this.auth());
  }

  // ---- appointments & notifications ----
  appointments(): Observable<any[]> {
    return this.http.get<any[]>('/api/appointments', this.auth());
  }
  confirmAppointment(id: number): Observable<any> {
    return this.http.post(`/api/appointments/${id}/confirm`, {}, this.auth());
  }
  notifications(): Observable<any[]> {
    return this.http.get<any[]>('/api/notifications', this.auth());
  }
  notify(to_id: number, body: string): Observable<any> {
    return this.http.post('/api/notify', { to_id, body }, this.auth());
  }
}
