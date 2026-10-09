import { Component, computed, input, output } from '@angular/core';
@Component({
  selector: 'app-pager', standalone: true,
  template: `
@if (total() > 0) {
<div class="d-flex flex-column flex-md-row justify-content-center justify-content-md-between align-items-center text-center gap-3 px-2 mt-3">
  <label class="small text-muted d-flex align-items-center justify-content-center gap-2 mb-0">દર પેજ
    <select class="form-select form-select-sm rounded-pill w-auto" (change)="sizeChange.emit(+$any($event.target).value)">
      @for (n of sizes; track n) { <option [selected]="n === size()">{{ n }}</option> }
    </select></label>
  <ul class="pagination pagination-sm mb-0 flex-wrap justify-content-center">
    <li class="page-item" [class.disabled]="page() === 1"><button class="page-link" (click)="go(page() - 1)">‹</button></li>
    @for (p of win(); track $index) {
      @if (p === 0) { <li class="page-item disabled"><span class="page-link">…</span></li> }
      @else { <li class="page-item" [class.active]="p === page()"><button class="page-link" (click)="go(p)">{{ p }}</button></li> }
    }
    <li class="page-item" [class.disabled]="page() === pages()"><button class="page-link" (click)="go(page() + 1)">›</button></li>
  </ul>
  <span class="small text-muted d-flex align-items-center justify-content-center gap-2">પેજ {{ page() }} / {{ pages() }}
    @if (pages() > 7) { <input type="number" min="1" [max]="pages()" placeholder="જાઓ" class="form-control form-control-sm rounded-pill" style="width:76px" (change)="go(+$any($event.target).value || 1)"> }
  </span>
</div>
}`
})
export class PagerComponent {
  page = input(1); total = input(0); size = input(10);
  pageChange = output<number>(); sizeChange = output<number>();
  sizes = [5, 10, 25, 50, 100];
  pages = computed(() => Math.max(1, Math.ceil(this.total() / this.size())));
  win = computed(() => {
    const n = this.pages(), c = this.page(), s = [...new Set([1, c - 1, c, c + 1, n])].filter(p => p >= 1 && p <= n).sort((a, b) => a - b);
    const o: number[] = []; let l = 0;
    for (const p of s) { if (p - l > 1) o.push(0); o.push(p); l = p; }
    return o;
  });
  go(p: number) { this.pageChange.emit(Math.min(Math.max(1, p), this.pages())); }
}