import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { Donor, Expense, Trust } from './models';
@Injectable({ providedIn: 'root' })
export class DataService {
  private http = inject(HttpClient);
  donors = signal<Donor[]>([]); expenses = signal<Expense[]>([]); trust = signal<Trust>({}); error = signal(false); loaded = signal(false);
  constructor() {
    forkJoin({
      d: this.http.get<Donor[]>('assets/data/donors.json'),
      e: this.http.get<Expense[]>('assets/data/expenses.json'),
      t: this.http.get<Trust>('assets/data/trust-data.json')
    }).subscribe({
      next: ({ d, e, t }) => { this.donors.set(d); this.expenses.set(e); this.trust.set(t); this.loaded.set(true); },
      error: () => { this.error.set(true); this.loaded.set(true); }
    });
  }
}
