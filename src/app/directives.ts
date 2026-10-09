import { AfterViewInit, Directive, ElementRef, OnDestroy, effect, inject, input } from '@angular/core';

/** Adds class "in" when the element scrolls into view (pairs with .reveal / .img-fx / .timeline-item CSS). */
@Directive({ selector: '[appReveal]', standalone: true })
export class RevealDirective implements AfterViewInit, OnDestroy {
  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  private io?: IntersectionObserver;
  ngAfterViewInit() {
    this.io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { this.el.nativeElement.classList.add('in'); this.io?.disconnect(); }
    }), { threshold: .05, rootMargin: '0px 0px -4% 0px' });
    this.io.observe(this.el.nativeElement);
  }
  ngOnDestroy() { this.io?.disconnect(); }
}

/** Animates a number from its previous value to the new one. */
@Directive({ selector: '[appCount]', standalone: true })
export class CountDirective {
  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  value = input.required<number>({ alias: 'appCount' });
  prefix = input('');
  private cur = 0;
  constructor() {
    effect(() => {
      const to = +this.value() || 0, pre = this.prefix(), from = this.cur, t0 = performance.now();
      this.cur = to;
      const step = (now: number) => {
        const p = Math.min((now - t0) / 900, 1), e = 1 - Math.pow(1 - p, 3);
        this.el.nativeElement.textContent = pre + Math.round(from + (to - from) * e).toLocaleString('en-IN');
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }
}
