// Estrutura do app: barra superior com menus + trilho direito (chat interno) + conteúdo.
import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useStore, useMe } from '../store/useStore';
import { cx, timeAgo, fmtTime } from '../lib/util';
import { Avatar, Badge, Icon, IconBtn, MenuItem, Modal, Popover, Toaster, Toggle } from './ui';
import ErrorBoundary from './ErrorBoundary';

interface NavItem { label: string; icon: string; to?: string; badge?: string; items?: ({ label: string; icon: string; to: string; badge?: string } | 'sep')[]; roles?: string[] }

export const NAV: NavItem[] = [
  { label: 'Atendimentos', icon: 'MessageSquare', to: '/atendimentos' },
  { label: 'CRM', icon: 'Workflow', items: [
    { label: 'Contatos', icon: 'Contact', to: '/crm/contatos' }, { label: 'Painéis', icon: 'Kanban', to: '/crm/paineis' },
    { label: 'Carteiras', icon: 'Wallet', to: '/crm/carteiras' }, { label: 'Dashboard', icon: 'ChartPie', to: '/crm/dashboard' },
  ] },
  { label: 'Apps', icon: 'LayoutGrid', badge: 'NOVO', items: [
    { label: 'Campanhas', icon: 'Megaphone', to: '/apps/campanhas' }, { label: 'Pagamentos', icon: 'CreditCard', to: '/apps/pagamentos' },
    { label: 'Chatbot', icon: 'Bot', to: '/apps/chatbots' }, { label: 'Sequências', icon: 'ListOrdered', to: '/apps/sequencias' },
    { label: 'Mensagens agendadas', icon: 'CalendarClock', to: '/apps/agendadas' }, { label: 'Meus apps', icon: 'Puzzle', to: '/apps/meus-apps', badge: 'NOVO' },
  ] },
  { label: 'Relatórios', icon: 'ChartColumn', items: [
    { label: 'Indicadores', icon: 'Gauge', to: '/relatorios/indicadores' }, { label: 'Atendimentos', icon: 'ClipboardList', to: '/relatorios/atendimentos' },
    { label: 'Consumo de infraestrutura', icon: 'Cloud', to: '/relatorios/infraestrutura' },
  ] },
  { label: 'Ajustes', icon: 'Settings', roles: ['admin', 'supervisor'], items: [
    { label: 'Usuários', icon: 'Users', to: '/ajustes/usuarios' }, { label: 'Equipes', icon: 'UsersRound', to: '/ajustes/equipes' },
    { label: 'Modelos de mensagens', icon: 'MessageSquareText', to: '/ajustes/modelos' }, { label: 'Conta', icon: 'Building2', to: '/ajustes/conta' },
    { label: 'Consumo de mensagens', icon: 'Receipt', to: '/ajustes/consumo' }, { label: 'Integrações', icon: 'Plug', to: '/ajustes/integracoes', badge: 'NOVO' },
  ] },
  { label: 'Admin', icon: 'SlidersHorizontal', roles: ['admin'], items: [
    { label: 'Contas', icon: 'Building', to: '/admin/contas' }, { label: 'Planos', icon: 'CircleDollarSign', to: '/admin/planos' }, { label: 'Canais', icon: 'Smartphone', to: '/admin/canais' }, 'sep',
    { label: 'Usuários ADM', icon: 'ShieldCheck', to: '/admin/usuarios' }, { label: 'Configurações da plataforma', icon: 'Settings2', to: '/admin/configuracoes', badge: 'NOVO' }, 'sep',
    { label: 'Ações e menus personalizados', icon: 'SquareMousePointer', to: '/admin/acoes' }, { label: 'Avisos personalizados', icon: 'TriangleAlert', to: '/admin/avisos' }, 'sep',
    { label: 'Auditoria', icon: 'ScrollText', to: '/admin/auditoria' }, { label: 'Relatório de faturamento', icon: 'FileSpreadsheet', to: '/admin/faturamento' },
    { label: 'Custo de infraestrutura', icon: 'Server', to: '/admin/infraestrutura' }, { label: 'Consumo de mensagens', icon: 'MessagesSquare', to: '/admin/consumo' },
    { label: 'Relatório de conexões', icon: 'Activity', to: '/admin/conexoes' }, { label: 'Portal de parceiros', icon: 'Handshake', to: '/admin/parceiros' },
  ] },
];

function NavMenu({ item }: { item: NavItem }) {
  const loc = useLocation();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = item.to ? loc.pathname.startsWith(item.to) : item.items?.some((i) => i !== 'sep' && loc.pathname.startsWith(i.to));
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  useEffect(() => setOpen(false), [loc.pathname]);
  const cls = cx('flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium transition', active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900');
  if (item.to) return <NavLink to={item.to} className={cls}><Icon name={item.icon} size={17} />{item.label}</NavLink>;
  return (
    <div className="relative" ref={ref}>
      <button className={cls} onClick={() => setOpen((o) => !o)}>
        <Icon name={item.icon} size={17} />{item.label}
        {item.badge && <Badge tone="dark" className="!text-[9px] !px-1.5 !py-0">{item.badge}</Badge>}
        <Icon name="ChevronDown" size={14} className={cx('transition', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 anim-pop">
          {item.items!.map((i, k) => i === 'sep' ? <div key={k} className="my-1.5 border-t border-slate-100" /> : (
            <MenuItem key={i.to} icon={i.icon} badge={i.badge} active={loc.pathname.startsWith(i.to)} onClick={() => nav(i.to)}>{i.label}</MenuItem>
          ))}
        </div>
      )}
    </div>
  );
}

function Notifications() {
  const list = useStore((s) => s.notifications);
  const markAll = useStore((s) => s.markNotificationsRead);
  const nav = useNavigate();
  const unread = list.filter((n) => !n.read).length;
  return (
    <Popover align="right" className="w-96" trigger={({ toggle }) => <IconBtn icon="Bell" title="Notificações" onClick={toggle} badge={unread || undefined} />}>
      {({ close }) => (
        <div>
          <div className="flex items-center px-4 py-2 border-b border-slate-100"><p className="font-semibold text-sm flex-1">Notificações</p><button className="text-xs text-brand-700 hover:underline" onClick={markAll}>Marcar todas como lidas</button></div>
          <div className="max-h-96 overflow-y-auto scroll-thin">
            {list.map((n) => (
              <button key={n.id} onClick={() => { if (n.link) nav(n.link); close(); }} className={cx('w-full text-left flex gap-3 px-4 py-3 hover:bg-slate-50 border-b border-slate-50', !n.read && 'bg-brand-50/40')}>
                <span className="h-8 w-8 rounded-lg bg-slate-100 text-slate-600 grid place-items-center shrink-0"><Icon name={n.icon} size={16} /></span>
                <span className="flex-1 min-w-0"><span className="block text-sm font-medium text-slate-800">{n.title}</span><span className="block text-xs text-slate-500 truncate">{n.body}</span><span className="block text-[11px] text-slate-400 mt-0.5">{timeAgo(n.at)}</span></span>
                {!n.read && <span className="h-2 w-2 rounded-full bg-brand-500 mt-1.5" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </Popover>
  );
}

function ProfileMenu() {
  const me = useMe();
  const prefs = useStore((s) => s.prefs);
  const setPrefs = useStore((s) => s.setPrefs);
  const users = useStore((s) => s.users);
  const login = useStore((s) => s.login);
  const logout = useStore((s) => s.logout);
  const reset = useStore((s) => s.reset);
  const toast = useStore((s) => s.toast);
  const patch = useStore((s) => s.patch);
  const [confirm, setConfirm] = useState(false);
  const setStatus = (status: 'online' | 'away' | 'offline') => patch('users', users.map((u) => (u.id === me.id ? { ...u, status } : u)));
  return (
    <>
      <Popover align="right" className="w-80" trigger={({ toggle }) => <button onClick={toggle} className="ml-1 rounded-full"><Avatar name={me.name} size={34} status={me.status} /></button>}>
        {({ close }) => (
          <div>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
              <Avatar name={me.name} size={40} status={me.status} />
              <div className="min-w-0"><p className="font-semibold text-sm truncate">{me.name}</p><p className="text-xs text-slate-500 truncate">{me.title} · {me.email}</p></div>
            </div>
            <div className="px-4 py-2.5 flex gap-1.5 border-b border-slate-100">
              {(['online', 'away', 'offline'] as const).map((s) => (
                <button key={s} onClick={() => setStatus(s)} className={cx('flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium border', me.status === s ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600')}>
                  <span className={cx('h-2 w-2 rounded-full', s === 'online' ? 'bg-emerald-500' : s === 'away' ? 'bg-amber-400' : 'bg-slate-300')} />{s === 'online' ? 'Online' : s === 'away' ? 'Ausente' : 'Offline'}
                </button>
              ))}
            </div>
            <div className="px-4 py-3 space-y-3 border-b border-slate-100">
              <Toggle checked={prefs.simulation} onChange={(v) => { setPrefs({ simulation: v }); toast(v ? 'Simulação ao vivo ligada' : 'Simulação ao vivo pausada'); }} label="Simulação ao vivo" hint="Clientes e mensagens chegando sozinhos" />
            </div>
            <p className="px-4 pt-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Ver como (perfil de teste)</p>
            {users.filter((u) => ['u1', 'u4', 'u2'].includes(u.id)).map((u) => (
              <MenuItem key={u.id} icon={u.role === 'admin' ? 'ShieldCheck' : u.role === 'supervisor' ? 'UserCog' : 'User'} active={u.id === me.id} onClick={() => { login(u.id); close(); toast(`Agora você está vendo como ${u.name}`); }}>
                {u.name} <span className="text-slate-400">· {u.role === 'admin' ? 'Admin' : u.role === 'supervisor' ? 'Supervisor' : 'Atendente'}</span>
              </MenuItem>
            ))}
            <div className="my-1.5 border-t border-slate-100" />
            <MenuItem icon="RotateCcw" onClick={() => { setConfirm(true); close(); }}>Restaurar dados de exemplo</MenuItem>
            <MenuItem icon="LogOut" danger onClick={logout}>Sair</MenuItem>
          </div>
        )}
      </Popover>
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Restaurar dados de exemplo?" icon="RotateCcw" size="sm"
        footer={<><button className="h-9 px-4 rounded-lg border border-slate-200 text-sm" onClick={() => setConfirm(false)}>Cancelar</button><button className="h-9 px-4 rounded-lg bg-brand-600 text-white text-sm font-medium" onClick={() => { reset(); setConfirm(false); toast('Dados de exemplo restaurados', { tone: 'success' }); }}>Restaurar</button></>}>
        <p className="text-sm text-slate-600">Todas as alterações feitas no protótipo (mensagens enviadas, cards movidos, contatos criados) serão descartadas e os dados mockados voltam ao estado inicial.</p>
      </Modal>
    </>
  );
}

function CompanySwitch() {
  const [open, setOpen] = useState(false);
  const accounts = useStore((s) => s.admin.accounts);
  const company = useStore((s) => s.company);
  const toast = useStore((s) => s.toast);
  return (
    <>
      <IconBtn icon="ArrowLeftRight" title="Trocar de conta" onClick={() => setOpen(true)} />
      <Modal open={open} onClose={() => setOpen(false)} title="Trocar de conta" subtitle="Você tem acesso às contas abaixo como parceiro" icon="Building2">
        <div className="space-y-1.5">
          {[{ id: 'cur', name: company.name, status: 'Ativa' }, ...accounts.filter((a) => !a.name.startsWith('Vitta')).slice(0, 8)].map((a: any) => (
            <button key={a.id} onClick={() => { setOpen(false); if (a.id !== 'cur') toast(`No protótipo, todas as contas exibem os dados da ${company.name}`); }} className={cx('w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left hover:bg-slate-50', a.id === 'cur' ? 'border-brand-500 bg-brand-50/50' : 'border-slate-200')}>
              <Avatar name={a.name} size={32} />
              <span className="flex-1 text-sm font-medium">{a.name}</span>
              {a.id === 'cur' ? <Badge tone="brand">Atual</Badge> : <Badge tone={a.status === 'Ativa' ? 'green' : 'slate'}>{a.status}</Badge>}
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}

function InternalChatPanel() {
  const open = useStore((s) => s.railOpen);
  const setRail = useStore((s) => s.setRail);
  const chat = useStore((s) => s.internalChat);
  const users = useStore((s) => s.users);
  const teams = useStore((s) => s.teams);
  const send = useStore((s) => s.sendInternal);
  const me = useMe();
  const [room, setRoom] = useState<string | null>(null);
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const msgs = useMemo(() => chat.filter((m) => m.room === room), [chat, room]);
  useEffect(() => { const el = endRef.current?.parentElement; if (el) el.scrollTop = el.scrollHeight; }, [msgs.length, room]);
  if (!open) return null;
  const rooms = [{ id: 'all', name: 'Todos', sub: 'Canal geral da empresa', icon: 'Megaphone' }, ...teams.filter((t) => !t.isBot).map((t) => ({ id: t.id, name: t.name, sub: 'Equipe', icon: '' }))];
  const cur = rooms.find((r) => r.id === room);
  const last = (id: string) => [...chat].reverse().find((m) => m.room === id);
  return (
    <aside className="w-[360px] border-l border-slate-200 bg-white flex flex-col anim-right">
      <div className="h-14 flex items-center gap-2 px-3 border-b border-slate-100">
        {room && <IconBtn icon="ArrowLeft" onClick={() => setRoom(null)} />}
        <p className="font-semibold flex-1 truncate">{cur ? cur.name : 'Chat interno'}</p>
        <IconBtn icon="X" onClick={() => setRail(false)} />
      </div>
      {!room ? (
        <div className="flex-1 overflow-y-auto scroll-thin">
          {rooms.map((r) => {
            const l = last(r.id);
            return (
              <button key={r.id} onClick={() => setRoom(r.id)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left">
                {r.icon ? <span className="h-9 w-9 rounded-full bg-brand-600 text-white grid place-items-center"><Icon name={r.icon} size={16} /></span> : <Avatar name={r.name} size={36} />}
                <span className="flex-1 min-w-0"><span className="block text-sm font-medium truncate">{r.name}</span><span className="block text-xs text-slate-500 truncate">{l ? `${users.find((u) => u.id === l.userId)?.name.split(' ')[0]}: ${l.text}` : r.sub}</span></span>
                {l && <span className="text-[11px] text-slate-400">{timeAgo(l.at)}</span>}
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto scroll-thin p-4 space-y-3 bg-slate-50">
            {msgs.map((m) => {
              const u = users.find((x) => x.id === m.userId)!;
              const mine = m.userId === me.id;
              return (
                <div key={m.id} className={cx('flex gap-2', mine && 'flex-row-reverse')}>
                  {!mine && <Avatar name={u.name} size={28} />}
                  <div className={cx('max-w-[78%] rounded-xl px-3 py-2 text-sm shadow-sm', m.pinned ? 'bg-amber-50 border border-amber-200' : mine ? 'bg-brand-600 text-white' : 'bg-white')}>
                    {m.pinned && <p className="text-[10px] font-bold text-amber-700 uppercase mb-1 flex items-center gap-1"><Icon name="Pin" size={10} />Fixado</p>}
                    {!mine && <p className="text-[11px] font-semibold text-brand-700 mb-0.5">{u.name}</p>}
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    <p className={cx('text-[10px] mt-1 text-right', mine ? 'text-brand-100' : 'text-slate-400')}>{fmtTime(m.at)}</p>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
          <form className="p-3 border-t border-slate-100 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) { send(room, text.trim()); setText(''); } }}>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder={`Mensagem para ${cur?.name}`} className="flex-1 h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500" />
            <button className="h-9 w-9 rounded-lg bg-brand-600 text-white grid place-items-center"><Icon name="SendHorizontal" size={16} /></button>
          </form>
        </>
      )}
    </aside>
  );
}

export default function Layout() {
  const me = useMe();
  const loc = useLocation();
  const railOpen = useStore((s) => s.railOpen);
  const setRail = useStore((s) => s.setRail);
  const chat = useStore((s) => s.internalChat);
  const sessions = useStore((s) => s.sessions);
  const unreadTotal = sessions.filter((s) => s.status !== 'concluded' && (s.assigneeId === me.id || s.status === 'new')).reduce((a, s) => a + s.unread, 0);
  useEffect(() => { document.title = unreadTotal ? `(${unreadTotal}) Elena · Atendimento` : 'Elena · Atendimento'; }, [unreadTotal]);
  const recentInternal = chat.filter((m) => m.room === 'all' && Date.now() - m.at < 60 * 60e3 && m.userId !== me.id).length;
  return (
    <div className="h-full flex flex-col">
      <header className="h-14 shrink-0 bg-white border-b border-slate-200 flex items-center gap-1 px-4 z-30">
        <NavLink to="/atendimentos" className="flex items-center gap-2 mr-4">
          <img src="logo.svg" alt="" className="h-8 w-8" />
          <span className="font-extrabold text-lg tracking-tight text-slate-900">elena</span>
        </NavLink>
        {NAV.filter((n) => !n.roles || n.roles.includes(me.role)).map((n) => <NavMenu key={n.label} item={n} />)}
        <div className="flex-1" />
        <Notifications />
        <CompanySwitch />
        <IconBtn icon="CircleHelp" title="Central de ajuda" onClick={() => useStore.getState().toast('Central de ajuda: em breve 😉')} />
        <IconBtn icon="MessagesSquare" title="Chat interno" active={railOpen} onClick={() => setRail(!railOpen)} badge={!railOpen && recentInternal ? recentInternal : undefined} />
        <ProfileMenu />
      </header>
      <div className="flex-1 flex min-h-0">
        <main className="flex-1 min-w-0 min-h-0">
          <ErrorBoundary resetKey={loc.pathname}><Outlet /></ErrorBoundary>
        </main>
        <InternalChatPanel />
      </div>
      <Toaster />
    </div>
  );
}
