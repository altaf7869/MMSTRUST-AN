import { Component, HostListener, OnDestroy, input, signal } from '@angular/core';

interface Item { image: string; caption: string }

@Component({
  selector: 'app-gallery', standalone: true,
  template: `
<div class="gx" (mouseenter)="paused = true" (mouseleave)="paused = false"
     (touchstart)="ts($event)" (touchend)="te($event)" tabindex="0" (keydown.arrowleft)="prev()" (keydown.arrowright)="next()">
  <div class="gx-stage">
    @for (g of items(); track g.image; let i = $index) {
      <figure class="gx-slide" [class.active]="off(i) === 0" [style.transform]="tf(i)" [style.zIndex]="10 - abs(i)" [style.opacity]="abs(i) > 2 ? 0 : 1 - abs(i) * .22"
              [style.pointerEvents]="abs(i) > 2 ? 'none' : 'auto'" (click)="off(i) === 0 ? open(i) : go(i)">
        <img [src]="src(g.image)" [alt]="g.caption" draggable="false" (error)="bad($event)">
        <figcaption><span>{{ g.caption }}</span><i class="fa-solid fa-expand"></i></figcaption>
      </figure>
    }
  </div>
  <button class="gx-btn gx-prev" type="button" aria-label="પાછળ" (click)="prev()"><i class="fa-solid fa-chevron-left"></i></button>
  <button class="gx-btn gx-next" type="button" aria-label="આગળ" (click)="next()"><i class="fa-solid fa-chevron-right"></i></button>
  <div class="gx-dots">
    @for (g of items(); track g.image; let i = $index) { <button type="button" [class.on]="i === idx()" [attr.aria-label]="'ચિત્ર ' + (i + 1)" (click)="go(i)"></button> }
  </div>
  <div class="gx-prog"><span [style.width.%]="((idx() + 1) / items().length) * 100"></span></div>
</div>

@if (lb() !== null) {
  <div class="gx-lb" (click)="close()">
    <button class="gx-x" type="button" aria-label="બંધ કરો" (click)="close()"><i class="fa-solid fa-xmark"></i></button>
    <button class="gx-btn gx-prev" type="button" (click)="lbMove(-1, $event)"><i class="fa-solid fa-chevron-left"></i></button>
    <img [src]="src(items()[lb()!].image)" [alt]="items()[lb()!].caption" (click)="$event.stopPropagation()">
    <button class="gx-btn gx-next" type="button" (click)="lbMove(1, $event)"><i class="fa-solid fa-chevron-right"></i></button>
    <div class="gx-lbcap">{{ items()[lb()!].caption }} &nbsp;·&nbsp; {{ lb()! + 1 }} / {{ items().length }}</div>
  </div>
}`,
  styles: [`
:host{display:block}
.gx{position:relative;outline:none;user-select:none;-webkit-user-select:none;padding:10px 0 46px}
.gx-stage{position:relative;height:clamp(250px,46vw,460px);perspective:1400px;overflow:hidden}
.gx-slide{position:absolute;top:0;left:50%;width:min(62%,640px);height:100%;margin:0 0 0 calc(min(62%,640px) / -2);border-radius:18px;overflow:hidden;cursor:pointer;
  box-shadow:0 14px 34px rgba(13,59,102,.22);transition:transform .7s cubic-bezier(.22,.8,.24,1),opacity .6s ease,filter .6s ease;filter:brightness(.7) saturate(.85);background:#dfe7ef}
.gx-slide.active{filter:none;box-shadow:0 22px 50px rgba(13,59,102,.35)}
.gx-slide img{width:100%;height:100%;object-fit:cover;display:block;transition:transform 6s ease}
.gx-slide.active img{transform:scale(1.06)}
.gx-slide figcaption{position:absolute;left:0;right:0;bottom:0;padding:34px 18px 14px;color:#fff;font-weight:700;font-size:1.05rem;display:flex;justify-content:space-between;align-items:center;
  background:linear-gradient(to top,rgba(8,30,55,.85),transparent);opacity:0;transform:translateY(10px);transition:.5s .15s}
.gx-slide.active figcaption{opacity:1;transform:none}
.gx-btn{position:absolute;top:calc(50% - 28px);width:46px;height:46px;border-radius:50%;border:0;background:#fff;color:#0d3b66;box-shadow:0 6px 18px rgba(0,0,0,.2);z-index:20;transition:.25s;display:flex;align-items:center;justify-content:center}
.gx-btn:hover{background:#0d3b66;color:#fff;transform:scale(1.08)}
.gx-prev{left:6px}.gx-next{right:6px}
.gx-dots{position:absolute;left:0;right:0;bottom:16px;display:flex;justify-content:center;gap:8px}
.gx-dots button{width:9px;height:9px;border-radius:99px;border:0;padding:0;background:#b7c4d3;transition:.35s}
.gx-dots button.on{width:28px;background:#0d3b66}
.gx-prog{position:absolute;left:12%;right:12%;bottom:0;height:3px;background:#dfe7ef;border-radius:3px;overflow:hidden}
.gx-prog span{display:block;height:100%;background:#f0c350;transition:width .6s}
.gx-lb{position:fixed;inset:0;z-index:2000;background:rgba(5,15,28,.92);display:flex;align-items:center;justify-content:center;padding:20px;animation:fi .25s}
.gx-lb>img{max-width:min(92vw,1100px);max-height:80vh;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.5)}
.gx-lb .gx-btn{position:fixed;top:50%}.gx-lb .gx-prev{left:14px}.gx-lb .gx-next{right:14px}
.gx-x{position:fixed;top:16px;right:16px;width:44px;height:44px;border-radius:50%;border:0;background:#fff;color:#0d3b66;font-size:18px}
.gx-lbcap{position:fixed;left:0;right:0;bottom:22px;text-align:center;color:#fff;font-weight:600}
@keyframes fi{from{opacity:0}to{opacity:1}}
@media (max-width:640px){.gx-slide{width:78%;margin-left:-39%}.gx-btn{width:38px;height:38px;top:calc(50% - 24px)}.gx-slide figcaption{font-size:.9rem}}
@media (prefers-reduced-motion:reduce){.gx-slide,.gx-slide img{transition:none!important}}
`]
})
export class GalleryComponent implements OnDestroy {
  items = input<Item[]>([]);
  idx = signal(0);
  lb = signal<number | null>(null);
  paused = false;
  private x0 = 0;
  private timer = window.setInterval(() => { if (!this.paused && this.lb() === null && !document.hidden && this.items().length > 1) this.next(); }, 4500);

  src = (p: string) => 'assets/' + String(p || '').replace(/^\/?(assets\/)?/, '');
  abs = (i: number) => Math.abs(this.off(i));
  off(i: number) { const n = this.items().length, h = Math.floor(n / 2); return ((i - this.idx() + n + h) % n) - h; }
  tf(i: number) {
    const o = this.off(i), a = Math.abs(o);
    const shift = window.innerWidth <= 640 ? 58 : 66;
    return `translateX(${o * shift}%) translateZ(${-a * 90}px) rotateY(${o * -8}deg) scale(${1 - a * .14})`;
  }
  next() { this.idx.update(v => (v + 1) % this.items().length); }
  prev() { this.idx.update(v => (v - 1 + this.items().length) % this.items().length); }
  go(i: number) { this.idx.set(i); }
  open(i: number) { this.lb.set(i); }
  close() { this.lb.set(null); }
  lbMove(d: number, e: Event) { e.stopPropagation(); const n = this.items().length; this.lb.update(v => ((v ?? 0) + d + n) % n); this.idx.set(this.lb()!); }
  ts(e: TouchEvent) { this.x0 = e.changedTouches[0].clientX; this.paused = true; }
  te(e: TouchEvent) { const dx = e.changedTouches[0].clientX - this.x0; if (Math.abs(dx) > 40) dx < 0 ? this.next() : this.prev(); this.paused = false; }
  bad(e: Event) { (e.target as HTMLImageElement).style.visibility = 'hidden'; }
  @HostListener('window:keydown', ['$event']) key(e: KeyboardEvent) {
    if (this.lb() === null) return;
    if (e.key === 'Escape') this.close();
    if (e.key === 'ArrowRight') this.lbMove(1, e);
    if (e.key === 'ArrowLeft') this.lbMove(-1, e);
  }
  ngOnDestroy() { clearInterval(this.timer); }
}
