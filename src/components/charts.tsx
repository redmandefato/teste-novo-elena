// Paleta e utilitários de gráficos (Recharts).
export const CHART = {
  brand: '#05966b',
  brandLight: '#6ee7bd',
  blue: '#3b82f6',
  sky: '#0ea5e9',
  amber: '#f59e0b',
  orange: '#f97316',
  red: '#ef4444',
  violet: '#8b5cf6',
  slate: '#94a3b8',
  grid: '#eef2f6',
  series: ['#05966b', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#0ea5e9', '#ec4899', '#84cc16', '#f97316', '#14b8a6', '#6366f1', '#94a3b8'],
};

export const axis = { tick: { fontSize: 11, fill: '#64748b' }, axisLine: false, tickLine: false } as const;
export const tooltipStyle = { contentStyle: { borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 8px 24px rgba(15,23,42,.08)' } } as const;
