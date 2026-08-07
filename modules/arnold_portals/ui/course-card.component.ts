import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Course {
  id: number;
  code: string;
  title: string;
  professor?: string;
  professorAvatar?: string;
  materialCount?: number;
  progress?: number | null;
}

/**
 * A course tile — portals (slides 10–12).
 *
 * The main navigation object in both portals. Two details that came out of using it: a course with
 * no material uploaded says so plainly, because a student otherwise assumes the assistant is
 * broken when it refuses everything; and a broken professor photo hides itself rather than showing
 * the browser's placeholder, which looks like a bug on an otherwise finished page.
 */
@Component({
  selector: 'app-course-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="course" (click)="open.emit(course)" tabindex="0"
             (keydown.enter)="open.emit(course)" role="button"
             [attr.aria-label]="course.code + ' ' + course.title">
      <header>
        <span class="code">{{ course.code }}</span>
        <span class="materials" [class.none]="!course.materialCount">
          {{ course.materialCount || 0 }} {{ course.materialCount === 1 ? 'file' : 'files' }}
        </span>
      </header>

      <h3>{{ course.title }}</h3>

      <div class="prof" *ngIf="course.professor">
        <img *ngIf="course.professorAvatar && !imgFailed"
             [src]="course.professorAvatar" alt="" (error)="imgFailed = true" />
        <span>{{ course.professor }}</span>
      </div>

      <div class="progress" *ngIf="hasProgress">
        <span class="track"><span class="fill" [style.width.%]="course.progress"></span></span>
        <span class="pct">{{ course.progress }}%</span>
      </div>

      <p class="warn" *ngIf="!course.materialCount">
        No material uploaded yet — the assistant has nothing to answer from.
      </p>
    </article>
  `,
  styles: [`
    .course { border: 1px solid #dfe1e6; border-radius: 10px; padding: .9rem 1rem;
              display: flex; flex-direction: column; gap: .4rem; background: #fff;
              cursor: pointer; transition: box-shadow .15s ease; }
    .course:hover, .course:focus { box-shadow: 0 2px 8px rgba(9,30,66,.12); outline: none; }
    header { display: flex; justify-content: space-between; align-items: center; }
    .code { font-size: .68rem; font-weight: 800; letter-spacing: .06em; color: #0052cc; }
    .materials { font-size: .68rem; color: #7a869a; }
    .materials.none { color: #bf6a02; }
    h3 { margin: 0; font-size: .95rem; line-height: 1.3; }
    .prof { display: flex; align-items: center; gap: .4rem; font-size: .78rem; color: #5e6c84; }
    .prof img { width: 20px; height: 20px; border-radius: 50%; object-fit: cover; }
    .progress { display: flex; align-items: center; gap: .5rem; }
    .track { flex: 1; height: 5px; background: #ebecf0; border-radius: 3px; overflow: hidden; }
    .fill { display: block; height: 100%; background: #36b37e; }
    .pct { font-size: .7rem; color: #5e6c84; font-variant-numeric: tabular-nums; }
    .warn { margin: 0; font-size: .7rem; color: #bf6a02; }
  `],
})
export class CourseCardComponent {
  @Input() course!: Course;
  @Output() open = new EventEmitter<Course>();

  imgFailed = false;

  get hasProgress(): boolean {
    return this.course?.progress !== null && this.course?.progress !== undefined;
  }
}
