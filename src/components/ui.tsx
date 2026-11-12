// Componentes de interface reutilizáveis (design system do Elena).
import { useEffect, useRef, useState, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { icons } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cx, colorFor, initials } from '../lib/util';
import { useStore } from '../store/useStore';
import type { Tag, ChannelType } from '../types';

// ------------------------------------------------------------------ Ícones
export type IconName = keyof typeof icons;
export function Icon({ name, size = 18, className, strokeWidth = 2 }: { name: IconName | string; size?: number; className?: string; strokeWidth?: number }) {
  const C = (icons as any)[name] ?? icons.Circle;
  return <C size={size} className={className} strokeWidth={strokeWidth} />;
}

// ------------------------------------------------------------------ Botões
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft' | 'link'; size?: 'xs' | 'sm' | 'md' | 'lg'; icon?: string; iconRight?: string };
export function Btn({ variant = 'secondary', size = 'md', icon, iconRight, className, children, ...rest }: BtnProps) {
  const v = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
    ghost: 'text-slate-600 hover:bg-slate-100',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
    link: 'text-brand-700 hover:underline !px-0 !h-auto',
  }[variant];
  const s = { xs: 'h-7 px-2.5 text-xs gap-1', sm: 'h-8 px-3 text-xs gap-1.5', md: 'h-9 px-4 text-sm gap-2', lg: 'h-11 px-6 text-sm gap-2' }[size];
  return (
    <button type="button" className={cx('inline-flex items-center justify-center rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap', v, s, className)} {...rest}>
      {icon && <Icon name={icon} size={size === 'xs' || size === 'sm' ? 14 : 16} />}
      {children}
      {iconRight && <Icon name={iconRight} size={14} />}
    </button>
  );
}

export function IconBtn({ icon, title, onClick, className, active, size = 18, badge, disabled }: { icon: string; title?: string; onClick?: (e: any) => void; className?: string; active?: boolean; size?: number; badge?: number | string; disabled?: boolean }) {
  return (
    <button type="button" title={title} disabled={disabled} onClick={onClick} className={cx('relative h-9 w-9 grid place-items-center rounded-lg transition text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40', active && 'bg-brand-50 text-brand-700', className)}>
      <Icon name={icon} size={size} />
      {badge ? <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold grid place-items-center">{badge}</span> : null}
    </button>
  );
}

// ------------------------------------------------------------------ Badges
const TONES: Record<string, string> = {
  slate: 'bg-slate-100 text-slate-600', brand: 'bg-brand-50 text-brand-700', blue: 'bg-sky-50 text-sky-700', amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700', green: 'bg-emerald-50 text-emerald-700', violet: 'bg-violet-50 text-violet-700', dark: 'bg-slate-800 text-white',
};
export function Badge({ tone = 'slate', children, className, icon }: { tone?: keyof typeof TONES | string; children: ReactNode; className?: string; icon?: string }) {
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap', TONES[tone] ?? TONES.slate, className)}>{icon && <Icon name={icon} size={12} />}{children}</span>;
}

export function TagChip({ tag, onRemove, small }: { tag: Tag; onRemove?: () => void; small?: boolean }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded font-bold uppercase tracking-wide text-white whitespace-nowrap', small ? 'px-1.5 py-[1px] text-[9px]' : 'px-2 py-0.5 text-[10px]')} style={{ background: tag.color }}>
      {tag.name}
      {onRemove && <button onClick={onRemove} className="opacity-70 hover:opacity-100"><Icon name="X" size={10} /></button>}
    </span>
  );
}

// ------------------------------------------------------------------ Avatar
const CH_ICON: Record<ChannelType, { icon: string; bg: string }> = {
  whatsapp: { icon: 'MessageCircle', bg: '#22c55e' }, whatsapp_qr: { icon: 'MessageCircle', bg: '#16a34a' }, instagram: { icon: 'Instagram', bg: '#e1306c' },
  messenger: { icon: 'Facebook', bg: '#0866ff' }, webchat: { icon: 'Globe', bg: '#6366f1' },
};
export function ChannelGlyph({ type, size = 16 }: { type: ChannelType; size?: number }) {
  const c = CH_ICON[type];
  return <span className="inline-grid place-items-center rounded-full text-white ring-2 ring-white" style={{ background: c.bg, width: size, height: size }}><Icon name={c.icon} size={size * 0.62} strokeWidth={2.5} /></span>;
}
export function Avatar({ name, size = 36, channel, status, group, className }: { name: string; size?: number; channel?: ChannelType; status?: 'online' | 'away' | 'offline'; group?: boolean; className?: string }) {
  return (
    <span className={cx('relative inline-grid place-items-center rounded-full font-semibold text-white shrink-0', className)} style={{ width: size, height: size, background: colorFor(name), fontSize: size * 0.36 }}>
      {group ? <Icon name="Users" size={size * 0.48} /> : initials(name)}
      {channel && <span className="absolute -bottom-0.5 -right-0.5"><ChannelGlyph type={channel} size={Math.max(14, size * 0.42)} /></span>}
      {status && <span className={cx('absolute bottom-0 right-0 rounded-full ring-2 ring-white', status === 'online' ? 'bg-emerald-500' : status === 'away' ? 'bg-amber-400' : 'bg-slate-300')} style={{ width: size * 0.3, height: size * 0.3 }} />}
    </span>
  );
}

// ------------------------------------------------------------- Overlays
export function Modal({ open, onClose, title, icon, children, footer, size = 'md', subtitle }: { open: boolean; onClose: () => void; title?: ReactNode; subtitle?: ReactNode; icon?: string; children: ReactNode; footer?: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  const w = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-3xl', xl: 'max-w-5xl' }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 anim-fade" onClick={onClose} />
      <div className={cx('relative w-full bg-white rounded-2xl shadow-2xl anim-pop max-h-[90vh] flex flex-col', w)}>
        {title && (
          <div className="flex items-start gap-3 px-6 pt-5 pb-3">
            {icon && <span className="h-9 w-9 rounded-lg bg-brand-50 text-brand-700 grid place-items-center shrink-0"><Icon name={icon} size={18} /></span>}
            <div className="flex-1 min-w-0"><h3 className="text-base font-semibold text-slate-900">{title}</h3>{subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}</div>
            <IconBtn icon="X" onClick={onClose} title="Fechar" />
          </div>
        )}
        <div className="px-6 pb-5 overflow-y-auto scroll-thin">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/60 rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, title, children, width = 440, footer }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; width?: number; footer?: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/30 anim-fade" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full bg-white shadow-2xl anim-right flex flex-col" style={{ width }}>
        <div className="flex items-center gap-2 px-5 h-14 border-b border-slate-100"><h3 className="font-semibold flex-1 truncate">{title}</h3><IconBtn icon="X" onClick={onClose} /></div>
        <div className="flex-1 overflow-y-auto scroll-thin p-5">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-slate-100 flex justify-end gap-2">{footer}</div>}
      </aside>
    </div>
  );
}

export function Popover({ trigger, children, align = 'left', className, up }: { trigger: (p: { open: boolean; toggle: () => void }) => ReactNode; children: ReactNode | ((p: { close: () => void }) => ReactNode); align?: 'left' | 'right'; className?: string; up?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div className={cx('absolute z-40 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 anim-pop', align === 'right' ? 'right-0' : 'left-0', up ? 'bottom-full mb-2' : 'mt-2', className)}>
          {typeof children === 'function' ? children({ close: () => setOpen(false) }) : children}
        </div>
      )}
    </div>
  );
}

export function MenuItem({ icon, children, onClick, danger, badge, right, active }: { icon?: string; children: ReactNode; onClick?: () => void; danger?: boolean; badge?: string; right?: ReactNode; active?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={cx('w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-slate-50 transition', danger ? 'text-red-600' : 'text-slate-700', active && 'bg-brand-50 text-brand-700')}>
      {icon && <Icon name={icon} size={16} className={danger ? '' : 'text-slate-400'} />}
      <span className="flex-1 truncate">{children}</span>
      {badge && <Badge tone="dark" className="!text-[9px] !px-1.5">{badge}</Badge>}
      {right}
    </button>
  );
}

// ------------------------------------------------------------- Controles
export function Tabs<T extends string>({ tabs, value, onChange, className }: { tabs: { id: T; label: ReactNode; count?: number; icon?: string }[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={cx('flex items-center gap-1 border-b border-slate-200', className)}>
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)} className={cx('flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition', value === t.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800')}>
          {t.icon && <Icon name={t.icon} size={15} />}{t.label}{t.count !== undefined && <span className="text-xs text-slate-400">({t.count})</span>}
        </button>
      ))}
    </div>
  );
}

export function Segmented<T extends string>({ options, value, onChange, size = 'md' }: { options: { id: T; label: ReactNode; icon?: string; count?: number }[]; value: T; onChange: (v: T) => void; size?: 'sm' | 'md' }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5">
      {options.map((o) => (
        <button key={o.id} onClick={() => onChange(o.id)} className={cx('flex items-center gap-1.5 rounded-md font-medium transition', size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm', value === o.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')}>
          {o.icon && <Icon name={o.icon} size={14} />}{o.label}
          {o.count !== undefined && <span className={cx('min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold grid place-items-center', o.count > 0 ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-500')}>{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode; hint?: ReactNode }) {
  return (
    <label className="inline-flex items-start gap-2.5 cursor-pointer select-none">
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={cx('relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition', checked ? 'bg-brand-600' : 'bg-slate-300')}>
        <span className={cx('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', checked ? 'left-[18px]' : 'left-0.5')} />
      </button>
      {(label || hint) && <span><span className="text-sm text-slate-700">{label}</span>{hint && <span className="block text-xs text-slate-500">{hint}</span>}</span>}
    </label>
  );
}

export function Input({ icon, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { icon?: string }) {
  return (
    <div className={cx('relative', className)}>
      {icon && <Icon name={icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />}
      <input className={cx('w-full h-9 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 placeholder:text-slate-400', icon ? 'pl-9 pr-3' : 'px-3')} {...rest} />
    </div>
  );
}
export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx('h-9 rounded-lg border border-slate-200 bg-white px-3 pr-8 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100', className)} {...rest}>{children}</select>;
}
export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx('w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 placeholder:text-slate-400', className)} {...rest} />;
}
export function Field({ label, children, hint, className }: { label: ReactNode; children: ReactNode; hint?: ReactNode; className?: string }) {
  return <label className={cx('block', className)}><span className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</span>{children}{hint && <span className="block text-[11px] text-slate-400 mt-1">{hint}</span>}</label>;
}

// --------------------------------------------------------------- Layout
export function Page({ title, subtitle, actions, children, className, wide }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; wide?: boolean }) {
  return (
    <div className="h-full overflow-y-auto scroll-thin">
      <div className={cx('mx-auto px-6 py-6', wide ? 'max-w-[1500px]' : 'max-w-7xl', className)}>
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div className="flex-1 min-w-[240px]">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
        {children}
      </div>
    </div>
  );
}

export function Card({ title, subtitle, actions, children, className, bodyClass, icon }: { title?: ReactNode; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; bodyClass?: string; icon?: string }) {
  return (
    <section className={cx('bg-white rounded-xl border border-slate-200 shadow-card', className)}>
      {(title || actions) && (
        <header className="flex items-start gap-3 px-5 pt-4 pb-2">
          {icon && <Icon name={icon} size={18} className="text-brand-600 mt-0.5" />}
          <div className="flex-1 min-w-0"><h3 className="font-semibold text-slate-900">{title}</h3>{subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}</div>
          {actions}
        </header>
      )}
      <div className={cx('px-5 pb-5', !title && !actions && 'pt-5', bodyClass)}>{children}</div>
    </section>
  );
}

export function Stat({ label, value, hint, icon, tone = 'slate', trend }: { label: ReactNode; value: ReactNode; hint?: ReactNode; icon?: string; tone?: 'slate' | 'brand' | 'blue' | 'amber' | 'red' | 'violet'; trend?: number }) {
  const t = { slate: 'bg-slate-100 text-slate-600', brand: 'bg-brand-50 text-brand-700', blue: 'bg-sky-50 text-sky-700', amber: 'bg-amber-50 text-amber-700', red: 'bg-red-50 text-red-600', violet: 'bg-violet-50 text-violet-700' }[tone];
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card p-4 flex items-start gap-3">
      {icon && <span className={cx('h-10 w-10 rounded-lg grid place-items-center shrink-0', t)}><Icon name={icon} size={20} /></span>}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500 truncate">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">{value}</p>
        {(hint || trend !== undefined) && (
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
            {trend !== undefined && <span className={cx('inline-flex items-center font-semibold', trend >= 0 ? 'text-emerald-600' : 'text-red-600')}><Icon name={trend >= 0 ? 'TrendingUp' : 'TrendingDown'} size={12} />{Math.abs(trend).toFixed(1)}%</span>}
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

export function Empty({ icon = 'Inbox', title, text, action }: { icon?: string; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <span className="h-14 w-14 rounded-2xl bg-slate-100 text-slate-400 grid place-items-center mb-3"><Icon name={icon} size={26} /></span>
      <p className="font-semibold text-slate-700">{title}</p>
      {text && <p className="text-sm text-slate-500 mt-1 max-w-sm">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Progress({ value, color = '#05966b', className }: { value: number; color?: string; className?: string }) {
  return <div className={cx('h-1.5 rounded-full bg-slate-100 overflow-hidden', className)}><div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }} /></div>;
}

// ---------------------------------------------------------------- Toasts
export function Toaster() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);
  const nav = useNavigate();
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} onClick={() => { if (t.link) nav(t.link); dismiss(t.id); }} className={cx('pointer-events-auto anim-up flex items-center gap-2.5 rounded-xl px-4 py-2.5 shadow-xl text-sm max-w-md', t.link && 'cursor-pointer', t.tone === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white')}>
          <Icon name={t.icon ?? (t.tone === 'success' ? 'CircleCheck' : 'Info')} size={16} className={t.tone === 'success' ? 'text-emerald-400' : 'text-slate-300'} />
          <span className="truncate">{t.text}</span>
        </div>
      ))}
    </div>
  );
}
