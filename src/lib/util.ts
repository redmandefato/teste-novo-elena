// Utilitários gerais: formatação (pt-BR), datas, cores, CSV e RNG determinístico.

export const MIN = 60e3;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;

export const cx = (...a) => a.flat().filter(Boolean).join(' ');

export const brl = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const num = (v, d = 0) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
export const pct = (v, d = 1) => `${num(v, d)}%`;
export const round2 = (v) => Math.round((v + Number.EPSILON) * 100) / 100;

const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
export function timeAgo(ts, now = Date.now()) {
  const s = Math.round((ts - now) / 1000);
  const a = Math.abs(s);
  if (a < 45) return 'agora';
  if (a < 3600) return rtf.format(Math.round(s / 60), 'minute');
  if (a < 86400) return rtf.format(Math.round(s / 3600), 'hour');
  if (a < 86400 * 30) return rtf.format(Math.round(s / 86400), 'day');
  return rtf.format(Math.round(s / (86400 * 30)), 'month');
}

export const fmtTime = (ts) => new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
export const fmtDate = (ts) => (ts ? new Date(ts).toLocaleDateString('pt-BR') : '—');
export const fmtDateTime = (ts) => (ts ? `${fmtDate(ts)} ${fmtTime(ts)}` : '—');
export const fmtShortDate = (ts) => new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

export function startOfDay(ts) { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); }

export function fmtDayLabel(ts, now = Date.now()) {
  const d0 = startOfDay(ts), n0 = startOfDay(now);
  if (d0 === n0) return 'Hoje';
  if (n0 - d0 === DAY) return 'Ontem';
  return new Date(ts).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function fmtDuration(sec) {
  sec = Math.max(0, Math.round(sec));
  const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  if (d) return `${d} dia${d > 1 ? 's' : ''} ${h}h ${m}min`;
  if (h) return `${h}h ${m}min`;
  if (m) return `${m} min ${s} seg`;
  return `${s} seg`;
}

export const fmtClock = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

export function initials(name = '') {
  const parts = name.replace(/[^\p{L}\s]/gu, '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

const PALETTE = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#14b8a6', '#6366f1', '#f97316', '#84cc16', '#06b6d4', '#a855f7'];
export function colorFor(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

export function slug(s = '') {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export function maskPhone(v = '') {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function monthKey(ts) { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }
export function monthLabel(key, long = false) {
  const [y, m] = key.split('-').map(Number);
  const s = new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: long ? 'long' : 'short', year: 'numeric' });
  return s.replace('.', '').replace(' de ', ' ');
}
export function addMonths(key, n) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return monthKey(d.getTime());
}
export function monthRange(fromKey: string, toKey: string): string[] {
  const out: string[] = []; let k = fromKey;
  while (k <= toKey && out.length < 120) { out.push(k); k = addMonths(k, 1); }
  return out;
}

export function downloadCSV(filename, columns, rows) {
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = columns.map((c) => esc(c.label)).join(';');
  const body = rows.map((r) => columns.map((c) => esc(c.csv ? c.csv(r) : (typeof c.value === 'function' ? c.value(r) : r[c.key]))).join(';')).join('\n');
  const blob = new Blob(['﻿' + head + '\n' + body], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// RNG determinístico (os dados mockados ficam iguais a cada reset)
export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashNoise(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
}

export const sum = (arr, f = (x) => x) => arr.reduce((s, x) => s + (Number(f(x)) || 0), 0);
export const groupBy = (arr, f) => arr.reduce((m, x) => { const k = f(x); (m[k] ||= []).push(x); return m; }, {});
export const byId = (arr) => Object.fromEntries(arr.map((x) => [x.id, x]));
