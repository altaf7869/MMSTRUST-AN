import { Injectable } from '@angular/core';
import { Trust } from './models';
@Injectable({ providedIn: 'root' })
export class PdfService {
  private async toData(path: string): Promise<string> {
    try {
      const clean = path.replace(/^\/+/, '').replace(/^assets\//, '');
      const r = await fetch(new URL('assets/' + clean, document.baseURI).href);
      if (!r.ok || !(r.headers.get('content-type') || '').startsWith('image')) return '';
      const b = await r.blob();
      return await new Promise<string>(res => { const f = new FileReader(); f.onload = () => res(String(f.result)); f.onerror = () => res(''); f.readAsDataURL(b); });
    } catch { return ''; }
  }

  async print(o: { title: string; year: string; head: string[]; rows: (string | number)[][]; total: string; trust: Trust }) {
    const w = window.open('', '_blank');
    if (!w) { alert('કૃપા કરી પોપ-અપ મંજૂર કરો.'); return; }
    const sigs: string[] = await Promise.all(((o.trust as any)['signatories'] || []).map((g: any) => g.sign ? this.toData(g.sign) : Promise.resolve('')));
    const M: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
    const e = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, c => M[c]);
    const T = o.trust;
    const reg = [T['regNo'] && 'નોંધણી નં.: ' + T['regNo'], T['panNo'] && 'PAN: ' + T['panNo'], T['reg80G'] && '80G: ' + T['reg80G'], T['est'] && 'સ્થાપના: ' + T['est']].filter(Boolean);
    const contact = [T['address'], T['phone'], T['email'], T['website']].filter(Boolean);
    const sg: any[] = T['signatories']?.length ? T['signatories'] : [{ role: 'ખજાનચી' }, { role: 'પ્રમુખ' }];
    const sgHtml = sg.map((g, i) => `<div><div class="im">${sigs[i] ? `<img src="${sigs[i]}">` : ''}</div><div class="ln"><b>${e(g.name || '')}</b>${g.name ? '<br>' : ''}${e(g.role || '')}</div></div>`).join('');
    w.document.write(`<!DOCTYPE html><html lang="gu"><head><meta charset="UTF-8"><title>${e(o.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Gujarati:wght@400;700&display=swap" rel="stylesheet">
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" rel="stylesheet">
<style>@page{margin:14mm}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}body{font-family:'Noto Sans Gujarati',sans-serif;color:#222;margin:0;padding:8px}
.hd{display:flex;flex-direction:column;align-items:center;text-align:center;border-bottom:3px double #c9a227;padding-bottom:10px;margin-bottom:12px}
.lg{width:46px;height:46px;border-radius:50%;background:#0d3b66;color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;margin-bottom:6px}
.hd h1{margin:0 0 4px;font-size:24px;color:#0d3b66}.ct{font-size:12px;color:#555;line-height:1.6}.bdg{background:#f0c350;color:#0d3b66;font-size:11px;font-weight:700;padding:2px 12px;border-radius:99px;margin-bottom:4px}
.rg{font-size:12px;color:#0d3b66;font-weight:700}.tx{font-size:11px;color:#666;margin-top:3px}.rt{text-align:center;margin:10px 0 4px}.rt h2{margin:0;font-size:18px;color:#0d3b66}.rt div{font-size:12.5px;color:#444;margin-top:3px}
table{width:100%;border-collapse:collapse;margin-top:12px;font-size:12.5px}th{background:#0d3b66;color:#fff}th,td{border:1px solid #999;padding:6px 8px;text-align:left}tbody tr:nth-child(even){background:#f4f7fb}tr{page-break-inside:avoid}thead{display:table-header-group}
.sg{display:flex;justify-content:space-between;margin-top:36px;font-size:12px}.sg>div{width:200px;text-align:center}.im{height:56px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:3px}.im img{max-height:52px;max-width:150px;object-fit:contain}.ln{border-top:1px solid #444;padding-top:4px;line-height:1.5}.ft{text-align:center;font-size:11px;color:#666;margin-top:14px}</style></head><body>
<div class="hd"><div class="lg"><i class="fa-solid fa-hands-holding-child"></i></div><h1>${e(T['name'])}</h1>${T['badge'] ? `<div class="bdg">${e(T['badge'])}</div>` : ''}${reg.length ? `<div class="rg">${reg.map(e).join(' &nbsp;|&nbsp; ')}</div>` : ''}<div class="ct">${contact.map(e).join(' &nbsp;|&nbsp; ')}</div>${T['taxNote'] ? `<div class="tx">${e(T['taxNote'])}</div>` : ''}</div>
<div class="rt"><h2>${e(o.title)}</h2><div>નાણાકીય વર્ષ: ${o.year === 'all' ? 'બધા વર્ષ' : e(o.year)} &nbsp;·&nbsp; તારીખ: ${new Date().toLocaleDateString('en-IN')}</div><div>કુલ રેકોર્ડ: ${o.rows.length} &nbsp;·&nbsp; કુલ રકમ: <b>${e(o.total)}</b></div></div>
<table><thead><tr>${o.head.map(h => `<th>${e(h)}</th>`).join('')}</tr></thead><tbody>${o.rows.map(r => '<tr>' + r.map(c => `<td>${e(c)}</td>`).join('') + '</tr>').join('')}</tbody></table>
<div class="sg">${sgHtml}</div><div class="ft">આ અહેવાલ કમ્પ્યુટર દ્વારા તૈયાર કરવામાં આવ્યો છે.</div></body></html>`);
    w.document.close();
    const imgs = Array.from(w.document.images);
    const loaded = Promise.all(imgs.map(i => i.complete ? Promise.resolve() : new Promise<void>(r => { i.onload = () => r(); i.onerror = () => r(); })));
    Promise.race([loaded, new Promise<void>(r => setTimeout(r, 4000))]).then(() => setTimeout(() => w.print(), 800));
  }
}