import { Donor } from './models';
export const fmt = (n: number) => '₹' + Number(n || 0).toLocaleString('en-IN');
export const sum = (r: { amount: number }[]) => r.reduce((a, x) => a + (+x.amount || 0), 0);
const TY: Record<string, string> = { Corpus: 'કોર્પસ', General: 'સામાન્ય', CSR: 'CSR', Zakat: 'ઝકાત', Medical: 'તબીબી', Education: 'શિક્ષણ', Infrastructure: 'માળખાકીય સુવિધા', Administrative: 'વહીવટી' };
export const ty = (v: string) => TY[v] || v;
export function shownName(d: Donor, shortNames = true, label = 'ગુપ્ત દાતા'): string {
  if (d.anonymous) return label;
  const n = (d.name || '').trim(), w = n.split(/\s+/);
  if (!shortNames || w.length < 2 || /\.$/.test(w[w.length - 1])) return n;
  const l = w[w.length - 1]; let g = l[0];
  try { g = [...new Intl.Segmenter('gu', { granularity: 'grapheme' }).segment(l)][0].segment; } catch { /* older browsers */ }
  return w[0] + ' ' + g + '.';
}
