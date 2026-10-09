import { Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { DataService } from './data.service';
import { PagerComponent } from './pager.component';
import { PdfService } from './pdf.service';
import { CountDirective, RevealDirective } from './directives';
import { Donor, Expense } from './models';
import { fmt, shownName, sum, ty } from './util';

@Component({
  selector: 'app-root', standalone: true, imports: [PagerComponent, RevealDirective, CountDirective],
  templateUrl: './app.component.html'
})
export class AppComponent {
  ds = inject(DataService); private pdf = inject(PdfService);
  fmt = fmt; ty = ty;
  t = this.ds.trust;
  privacy = computed(() => ({ shortNames: true, hideReceipt: true, anonymousLabel: 'ગુપ્ત દાતા', ...(this.t()['privacy'] || {}) }));
  assets = (p?: string) => p ? 'assets/' + p.replace(/^\/?/, '') : '';
  heroUrl = computed(() => `url('${this.assets(this.t()['images']?.hero)}')`);
  navLinks = [['home', 'હોમ'], ['about', 'અમારા વિશે'], ['gallery', 'ગેલેરી'], ['future-plans', 'ભવિષ્યની યોજનાઓ'], ['donors-report', 'દાતા અહેવાલ'], ['expense-report', 'ખર્ચ અહેવાલ'], ['contact', 'સંપર્ક']];

  dYear = signal('all'); eYear = signal('all'); q = signal('');
  dPage = signal(1); dSize = signal(10); ePage = signal(1); eSize = signal(10);
  scrolled = signal(false); showTop = signal(false); progress = signal(0); active = signal('home');
  toast = signal(''); word = signal('આશા'); barsOn = signal(false);

  years = computed(() => [...new Set([...(this.t()['years'] || []), ...this.ds.donors().map(d => d.year), ...this.ds.expenses().map(e => e.year)].filter(Boolean))].sort().reverse());
  dName = (d: Donor) => shownName(d, this.privacy().shortNames, this.privacy().anonymousLabel);
  dVillage = (d: Donor) => d.anonymous ? '—' : (d.village || '');

  dInYear = computed(() => this.ds.donors().filter(d => this.dYear() === 'all' || d.year === this.dYear()));
  dRows = computed(() => {
    const q = this.q().toLowerCase().trim();
    return this.dInYear().filter(d => !q || [this.dName(d), this.dVillage(d), d.type, ty(d.type), this.privacy().hideReceipt ? '' : d.receiptNo].some(v => String(v ?? '').toLowerCase().includes(q)))
      .sort((a, b) => b.date.localeCompare(a.date));
  });
  dPart = computed(() => this.dRows().slice((this.dPage() - 1) * this.dSize(), this.dPage() * this.dSize()));
  dTotal = computed(() => sum(this.dRows()));
  eRows = computed(() => this.ds.expenses().filter(e => this.eYear() === 'all' || e.year === this.eYear()).sort((a, b) => b.date.localeCompare(a.date)));
  ePart = computed(() => this.eRows().slice((this.ePage() - 1) * this.eSize(), this.ePage() * this.eSize()));
  collected = computed(() => sum(this.ds.donors().filter(d => this.eYear() === 'all' || d.year === this.eYear())));
  spent = computed(() => sum(this.eRows()));
  totalDonated = computed(() => sum(this.ds.donors())); totalSpent = computed(() => sum(this.ds.expenses()));
  donBars = computed(() => this.bars(this.dInYear(), 'type'));
  expBars = computed(() => this.bars(this.eRows(), 'category'));
  trackD = (_: number, d: Donor) => (d.receiptNo ?? '') + d.name + d.date;
  trackE = (_: number, e: Expense) => (e.voucherNo ?? '') + e.description + e.date;

  constructor() {
    effect(() => { const t = this.t(); if (t['defaultYear']) { this.dYear.set(t['defaultYear']); this.eYear.set(t['defaultYear']); } if (t['title']) document.title = t['title']; }, { allowSignalWrites: true });
    effect(() => { const w: string[] = this.t()['heroWords'] || ['આશા']; this.startTyping(w); }, { allowSignalWrites: true });
    effect(() => { if (this.ds.loaded()) setTimeout(() => this.barsOn.set(true), 500); }, { allowSignalWrites: true });
  }
  private typing = 0;
  private startTyping(words: string[]) {
    clearTimeout(this.typing);
    const seg = (s: string) => [...new Intl.Segmenter('gu', { granularity: 'grapheme' }).segment(s)].map(x => x.segment);
    const ws = words.map(seg); let w = 0, c = 0, del = false;
    const tick = () => {
      const word = ws[w]; this.word.set(word.slice(0, c).join(''));
      if (!del && c === word.length) { del = true; this.typing = window.setTimeout(tick, 1400); return; }
      if (del && c === 0) { del = false; w = (w + 1) % ws.length; }
      c += del ? -1 : 1; this.typing = window.setTimeout(tick, del ? 45 : 90);
    };
    this.typing = window.setTimeout(tick, 0);
  }
  private bars(rows: { amount: number; [k: string]: any }[], key: string) {
    const m: Record<string, number> = {}; rows.forEach(r => m[r[key]] = (m[r[key]] || 0) + +r.amount);
    const tot = sum(rows) || 1;
    return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ k: ty(k), v, pct: v / tot * 100 }));
  }

  @HostListener('window:scroll') onScroll() {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    this.scrolled.set(y > 60); this.showTop.set(y > 500); this.progress.set(h > 0 ? y / h * 100 : 0);
    let cur = 'home';
    for (const [id] of this.navLinks) { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top <= innerHeight * .45) cur = id; }
    this.active.set(cur);
  }
  toTop() { scrollTo({ top: 0, behavior: 'smooth' }); }
  closeNav() { document.getElementById('navbarNav')?.classList.remove('show'); }
  setDYear(v: string) { this.dYear.set(v); this.dPage.set(1); }
  setEYear(v: string) { this.eYear.set(v); this.ePage.set(1); }
  setQ(v: string) { this.q.set(v); this.dPage.set(1); }
  goto(key: 'donors-report' | 'expense-report') { document.getElementById(key)?.scrollIntoView({ behavior: 'smooth' }); }
  copy(v: string) {
    (navigator.clipboard?.writeText(v) ?? Promise.reject()).catch(() => { }).finally(() => { this.toast.set('કૉપિ થઈ ગયું!'); setTimeout(() => this.toast.set(''), 2200); });
  }
  upiLink = computed(() => `upi://pay?pa=${encodeURIComponent(this.t()['upiId'] || '')}&pn=${encodeURIComponent(this.t()['name'] || '')}&cu=INR`);
  telHref = computed(() => 'tel:' + String(this.t()['phone'] || '').replace(/[^+\d]/g, ''));

  private exportRows(key: 'donors' | 'expenses', money: boolean) {
    const A = (n: number) => money ? fmt(n) : n; const hr = this.privacy().hideReceipt;
    return key === 'donors'
      ? { title: 'દાતા અહેવાલ', year: this.dYear(), head: ['ક્રમ', 'દાતાનું નામ', 'પ્રકાર', 'ગામ/શહેર', 'રકમ', 'તારીખ', ...(hr ? [] : ['રસીદ નં.'])],
          rows: this.dRows().map((d, i) => [i + 1, this.dName(d), ty(d.type), this.dVillage(d), A(d.amount), d.date, ...(hr ? [] : [d.receiptNo || ''])]), total: fmt(sum(this.dRows())) }
      : { title: 'ખર્ચ અહેવાલ', year: this.eYear(), head: ['ક્રમ', 'વર્ણન', 'શ્રેણી', 'રકમ', 'તારીખ', 'વાઉચર નં.'],
          rows: this.eRows().map((e, i) => [i + 1, e.description, ty(e.category), A(e.amount), e.date, e.voucherNo || '']), total: fmt(this.spent()) };
  }
  downloadPdf(key: 'donors' | 'expenses') { this.pdf.print({ ...this.exportRows(key, true), trust: this.t() }); }
  downloadCsv(key: 'donors' | 'expenses') {
    const x = this.exportRows(key, false);
    const csv = [x.head, ...x.rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `${key}-${x.year}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  badge(t: string) { return ({ Corpus: 'bg-trust-primary text-white', CSR: 'bg-warning text-dark', Zakat: 'bg-success text-white', Medical: 'bg-info text-dark', Education: 'bg-info text-dark' } as Record<string, string>)[t] || 'bg-light text-dark border'; }
  hideImg(e: Event) { (e.target as HTMLImageElement).style.display = 'none'; }
}
