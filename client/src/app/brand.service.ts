import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class BrandService {
  name = 'Learnify';
  program = '';
  constructor(private http: HttpClient) { this.load(); }
  load() {
    this.http.get<any>('/api/public/brand').subscribe((r) => {
      if (r?.brand) { this.name = r.brand; document.title = r.brand; }
      if (r?.program) { this.program = r.program; }
    });
  }
}
