// Tabela genérica com busca, ordenação e paginação.
import { useMemo, useState, type ReactNode } from 'react';
import { cx } from '../lib/util';
import { Icon, Input, Empty } from './ui';

export interface Column<T> {
  key: string;
  label: ReactNode;
  render?: (row: T) => ReactNode;
  sortValue?: (row: T) => any;
  align?: 'left' | 'right' | 'center';
  width?: number | string;
  className?: string;
}

export function DataTable<T extends { id: string }>({
  columns, rows, onRowClick, pageSize = 15, search, searchPlaceholder = 'Pesquisar', toolbar, emptyTitle = 'Nenhum registro encontrado', emptyIcon, dense, initialSort, stickyFirst,
}: {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  pageSize?: number;
  search?: (row: T) => string;
  searchPlaceholder?: string;
  toolbar?: ReactNode;
  emptyTitle?: string;
  emptyIcon?: string;
  dense?: boolean;
  initialSort?: { key: string; dir: 'asc' | 'desc' };
  stickyFirst?: boolean;
}) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState(initialSort ?? null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let r = s && search ? rows.filter((x) => search(x).toLowerCase().includes(s)) : rows;
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      const val = (x: T) => (col?.sortValue ? col.sortValue(x) : (x as any)[sort.key]);
      r = [...r].sort((a, b) => {
        const va = val(a), vb = val(b);
        const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va ?? '').localeCompare(String(vb ?? ''), 'pt-BR');
        return sort.dir === 'asc' ? cmp : -cmp;
      });
    }
    return r;
  }, [rows, q, sort, columns, search]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const p = Math.min(page, pages - 1);
  const slice = filtered.slice(p * pageSize, p * pageSize + pageSize);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
      {(search || toolbar) && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-slate-100">
          {search && <Input icon="Search" placeholder={searchPlaceholder} value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} className="w-72 max-w-full" />}
          <div className="flex-1" />
          {toolbar}
        </div>
      )}
      <div className="overflow-x-auto scroll-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 border-b border-slate-100">
              {columns.map((c, i) => (
                <th key={c.key} style={{ width: c.width }} className={cx('px-4 py-2.5 whitespace-nowrap select-none', c.align === 'right' && 'text-right', c.align === 'center' && 'text-center', stickyFirst && i === 0 && 'sticky left-0 bg-slate-50 z-10')}>
                  <button className={cx('inline-flex items-center gap-1 hover:text-slate-800', c.align === 'right' && 'flex-row-reverse')} onClick={() => setSort((s) => (s?.key === c.key ? { key: c.key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: c.key, dir: 'asc' }))}>
                    {c.label}
                    {sort?.key === c.key && <Icon name={sort.dir === 'asc' ? 'ArrowUp' : 'ArrowDown'} size={12} />}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((r) => (
              <tr key={r.id} onClick={() => onRowClick?.(r)} className={cx('border-b border-slate-100 last:border-0 transition', onRowClick && 'cursor-pointer hover:bg-slate-50')}>
                {columns.map((c, i) => (
                  <td key={c.key} className={cx('px-4 text-slate-700', dense ? 'py-2' : 'py-3', c.align === 'right' && 'text-right tabular-nums', c.align === 'center' && 'text-center', c.className, stickyFirst && i === 0 && 'sticky left-0 bg-white z-10')}>
                    {c.render ? c.render(r) : (r as any)[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!slice.length && <Empty icon={emptyIcon} title={emptyTitle} />}
      </div>
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 text-xs text-slate-500">
        <span>{filtered.length ? `${p * pageSize + 1}–${Math.min(filtered.length, (p + 1) * pageSize)} de ${filtered.length}` : '0 registros'}</span>
        <div className="flex items-center gap-1">
          <button disabled={p === 0} onClick={() => setPage(p - 1)} className="h-7 w-7 grid place-items-center rounded-md hover:bg-slate-100 disabled:opacity-30"><Icon name="ChevronLeft" size={16} /></button>
          <span className="px-2">{p + 1} / {pages}</span>
          <button disabled={p >= pages - 1} onClick={() => setPage(p + 1)} className="h-7 w-7 grid place-items-center rounded-md hover:bg-slate-100 disabled:opacity-30"><Icon name="ChevronRight" size={16} /></button>
        </div>
      </div>
    </div>
  );
}
