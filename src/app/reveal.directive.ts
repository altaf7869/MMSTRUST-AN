import { Directive, ElementRef, Input, OnChanges, OnDestroy, OnInit, inject } from '@angular/core';

/** Adds the "in" class when the element scrolls into view (fade-up / left / right / zoom). */
@Directive({ selector: '[appReveal]', standalone: true })
export class RevealDirective implements OnInit, OnDestroy {
  @Input('appReveal') anim = '';
  @Input() revealDelay = 0;
  private el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private io?: IntersectionObserver;
  ngOnInit() {
    if (this.anim) { this.el.classList.add('reveal'); this.el.setAttribute('data-anim', this.anim); }
    if (this.revealDelay) this.el.style.setProperty('--d', this.revealDelay + 's');
    if (typeof IntersectionObserver === 'undefined') { this.el.classList.add('in'); return; }
    this.io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { this.el.classList.add('in'); this.io?.disconnect(); }
    }), { threshold: 0.05, rootMargin: '0px 0px -4% 0px' });
    this.io.observe(this.el);
  }
  ngOnDestroy() { this.io?.disconnect(); }
}

/** Animates a number from its previous value to the new one. */
@Directive({ selector: '[appCount]', standalone: true })
export class CountDirective implements OnChanges, OnDestroy {
  @Input('appCount') value = 0;
  @Input() prefix = '';
  private el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private from = 0; private raf = 0;
  ngOnChanges() {
    cancelAnimationFrame(this.raf);
    const to = Number(this.value) || 0, from = this.from, t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - t0) / 900, 1), e = 1 - Math.pow(1 - p, 3);
      const v = Math.round(from + (to - from) * e);
      this.el.textContent = this.prefix + v.toLocaleString('en-IN');
      this.from = v;
      if (p < 1) this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }
  ngOnDestroy() { cancelAnimationFrame(this.raf); }
}
