import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing.component';
import { LoginComponent } from './pages/login.component';
import { StudentComponent } from './pages/student.component';
import { ProfessorComponent } from './pages/professor.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'student', component: StudentComponent },
  { path: 'professor', component: ProfessorComponent },
  { path: '**', redirectTo: '' },
];
