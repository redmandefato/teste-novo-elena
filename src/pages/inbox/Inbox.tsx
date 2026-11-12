// Tela principal de atendimentos: lista (Novos/Meus/Outros/Grupos/Concluídos) + conversa + painel do contato.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useStore, useMe } from '../../store/useStore';
import { cx, timeAgo, maskPhone, byId } from '../../lib/util';
import { Avatar, Icon, IconBtn, Popover, Segmented, Select, TagChip, Empty, Btn } from '../../components/ui';
import type { Session, Message } from '../../types';
import ChatView from './ChatView';

type Tab = 'novos' | 'meus' | 'outros' | 'grupos' | 'concluidos';

export function previewOf(m?: Message) {
  if (!m) return '';
  const p = m.dir === 'out' ? 'Você: ' : m.dir === 'bot' ? '🤖 ' : m.senderName ? `${m.senderName}: ` : '';
  const body = m.type === 'image' ? '📷 Imagem' : m.type === 'audio' ? '🎤 Áudio' : m.type === 'document' ? `📄 ${m.media?.fileName ?? 'Documento'}` : m.type === 'location' ? '📍 Localização' : m.type === 'template' ? `📋 ${m.body}` : m.body;
  return p + body;
}

export default function Inbox() {
  const { id } = useParams();
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();
  const me = useMe();
  const sessions = useStore((s) => s.sessions);
  const messages = useStore((s) => s.messages);
  const contacts = useStore((s) => s.contacts);
  const teams = useStore((s) => s.teams);
  const channels = useStore((s) => s.channels);
  const tags = useStore((s) => s.tags);
  const users = useStore((s) => s.users);
  const prefs = useStore((s) => s.prefs);
  const setPrefs = useStore((s) => s.setPrefs);
  const startConversation = useStore((s) => s.startConversation);
  const markRead = useStore((s) => s.markRead);
  const toast = useStore((s) => s.toast);
  const typing = useStore((s) => s.typing);

  const current = sessions.find((s) => s.id === id);
  const defaultTab: Tab = current ? (current.isGroup ? 'grupos' : current.status === 'concluded' ? 'concluidos' : current.status === 'new' ? 'novos' : current.assigneeId === me.id ? 'meus' : 'outros') : 'meus';
  const tab = (sp.get('aba') as Tab) || defaultTab;
  const setTab = (t: Tab) => { sp.set('aba', t); setSp(sp, { replace: true }); };
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [q, setQ] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filters, setFilters] = useState({ team: '', channel: '', tag: '', agent: '' });
  const [phone, setPhone] = useState('');

  const C = useMemo(() => byId(contacts), [contacts]);
  const T = useMemo(() => byId(teams), [teams]);
  const CH = useMemo(() => byId(channels), [channels]);
  const TG = useMemo(() => byId(tags), [tags]);
  const lastMsg = useMemo(() => {
    const m: Record<string, Message> = {};
    for (const x of messages) if (x.dir !== 'event' && x.dir !== 'note' && (!m[x.sessionId] || m[x.sessionId].at <= x.at)) m[x.sessionId] = x;
    return m;
  }, [messages]);

  const isSupervisor = me.role !== 'agent';
  const myTeams = new Set(teams.filter((t) => t.members.some((m) => m.userId === me.id)).map((t) => t.id));
  const visible = sessions.filter((s) => isSupervisor || myTeams.has(s.teamId) || s.assigneeId === me.id);
  const buckets: Record<Tab, Session[]> = {
    novos: visible.filter((s) => s.status === 'new' && !s.isGroup),
    meus: visible.filter((s) => s.status === 'open' && s.assigneeId === me.id && !s.isGroup),
    outros: visible.filter((s) => s.status === 'open' && s.assigneeId !== me.id && !s.isGroup),
    grupos: visible.filter((s) => s.isGroup && s.status !== 'concluded'),
    concluidos: visible.filter((s) => s.status === 'concluded'),
  };
  const count = (t: Tab) => buckets[t].filter((s) => s.unread > 0).length || buckets[t].length;

  let list = buckets[tab];
  if (unreadOnly) list = list.filter((s) => s.unread > 0);
  if (filters.team) list = list.filter((s) => s.teamId === filters.team);
  if (filters.channel) list = list.filter((s) => s.channelId === filters.channel);
  if (filters.agent) list = list.filter((s) => s.assigneeId === filters.agent);
  if (filters.tag) list = list.filter((s) => C[s.contactId]?.tagIds.includes(filters.tag));
  if (q.trim()) { const k = q.toLowerCase(); list = list.filter((s) => C[s.contactId]?.name.toLowerCase().includes(k) || C[s.contactId]?.phone.replace(/\D/g, '').includes(k.replace(/\D/g, '') || '#') || s.protocol.includes(k)); }
  list = [...list].sort((a, b) => (prefs.sort === 'recent' ? b.lastAt - a.lastAt : a.lastAt - b.lastAt));
  const activeFilters = Object.values(filters).filter(Boolean).length;

  useEffect(() => { if (current && current.unread && current.status !== 'new') markRead(current.id); }, [current?.id, current?.unread]);

  const open = (s: Session) => nav(`/atendimentos/${s.id}?aba=${tab}`);

  return (
    <div className="h-full flex">
      {/* ------------------------------------------------ Lista */}
      <section className="w-[360px] shrink-0 border-r border-slate-200 bg-white flex flex-col">
        {prefs.notificationsBanner && (
          <div className="flex items-center gap-2 bg-brand-600 text-white text-xs font-medium px-3 py-2">
            <Icon name="BellRing" size={14} /><span className="flex-1">Ative as notificações no navegador</span>
            <button className="underline" onClick={() => { Notification?.requestPermission?.(); setPrefs({ notificationsBanner: false }); }}>Ativar</button>
            <button onClick={() => setPrefs({ notificationsBanner: false })}><Icon name="X" size={14} /></button>
          </div>
        )}
        <div className="flex items-center gap-1 px-3 pt-3">
          <Segmented size="sm" value={['novos', 'meus', 'outros'].includes(tab) ? tab : ('' as any)} onChange={(v) => setTab(v as Tab)} options={[
            { id: 'novos', label: 'Novos', count: buckets.novos.length },
            { id: 'meus', label: 'Meus', count: buckets.meus.filter((s) => s.unread).length },
            ...(isSupervisor ? [{ id: 'outros' as const, label: 'Outros', count: buckets.outros.length }] : []),
          ]} />
          <div className="flex-1" />
          <IconBtn icon="Users" title={`Grupos (${buckets.grupos.length})`} active={tab === 'grupos'} onClick={() => setTab('grupos')} badge={buckets.grupos.filter((s) => s.unread).length || undefined} />
          <IconBtn icon="Archive" title="Concluídos" active={tab === 'concluidos'} onClick={() => setTab('concluidos')} />
          <Popover align="right" className="w-60" trigger={({ toggle }) => <IconBtn icon="EllipsisVertical" onClick={toggle} />}>
            {({ close }) => (
              <div className="py-1">
                <button className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex gap-2 items-center" onClick={() => { list.forEach((s) => markRead(s.id)); close(); toast('Todas marcadas como lidas'); }}><Icon name="CheckCheck" size={16} className="text-slate-400" />Marcar todas como lidas</button>
                <button className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex gap-2 items-center" onClick={() => { setPrefs({ notificationsBanner: true }); close(); }}><Icon name="Bell" size={16} className="text-slate-400" />Configurar notificações</button>
              </div>
            )}
          </Popover>
        </div>
        <div className="flex items-center gap-1 px-3 py-2">
          <div className="flex items-center gap-1 text-xs">
            <button onClick={() => setUnreadOnly(false)} className={cx('px-2.5 py-1 rounded-full font-medium', !unreadOnly ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-100')}>Todas</button>
            <button onClick={() => setUnreadOnly(true)} className={cx('px-2.5 py-1 rounded-full font-medium', unreadOnly ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-100')}>Não lidas</button>
          </div>
          <div className="flex-1" />
          <IconBtn icon="Search" size={16} active={showSearch} onClick={() => setShowSearch(!showSearch)} title="Pesquisar" />
          <Popover align="right" className="w-72 p-3" trigger={({ toggle }) => <IconBtn icon="ListFilter" size={16} onClick={toggle} badge={activeFilters || undefined} title="Filtros" />}>
            <div className="space-y-2.5 p-1">
              <p className="text-xs font-semibold text-slate-500 uppercase">Filtrar atendimentos</p>
              <Select className="w-full" value={filters.team} onChange={(e) => setFilters({ ...filters, team: e.target.value })}><option value="">Todas as equipes</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select>
              <Select className="w-full" value={filters.channel} onChange={(e) => setFilters({ ...filters, channel: e.target.value })}><option value="">Todos os canais</option>{channels.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.identifier}</option>)}</Select>
              <Select className="w-full" value={filters.tag} onChange={(e) => setFilters({ ...filters, tag: e.target.value })}><option value="">Todas as etiquetas</option>{tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select>
              <Select className="w-full" value={filters.agent} onChange={(e) => setFilters({ ...filters, agent: e.target.value })}><option value="">Todos os atendentes</option>{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>
              <button className="text-xs text-brand-700 font-medium" onClick={() => setFilters({ team: '', channel: '', tag: '', agent: '' })}>Limpar filtros</button>
            </div>
          </Popover>
          <IconBtn icon={prefs.sort === 'recent' ? 'ArrowDownWideNarrow' : 'ArrowUpNarrowWide'} size={16} title={prefs.sort === 'recent' ? 'Mais recentes primeiro' : 'Mais antigos primeiro'} onClick={() => setPrefs({ sort: prefs.sort === 'recent' ? 'oldest' : 'recent' })} />
        </div>
        {showSearch && <div className="px-3 pb-2"><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome, telefone ou protocolo" className="w-full h-9 rounded-lg bg-slate-100 px-3 text-sm outline-none focus:ring-2 focus:ring-brand-100" /></div>}
        {(tab === 'grupos' || tab === 'concluidos') && <div className="px-4 pb-1 text-xs font-semibold text-slate-500 flex items-center gap-1.5"><Icon name={tab === 'grupos' ? 'Users' : 'Archive'} size={13} />{tab === 'grupos' ? 'Grupos do WhatsApp' : 'Atendimentos concluídos'}</div>}

        <div className="flex-1 overflow-y-auto scroll-thin">
          {list.map((s) => {
            const c = C[s.contactId];
            const lm = lastMsg[s.id];
            const team = T[s.teamId];
            const waitMin = (Date.now() - s.lastAt) / 60000;
            const late = s.status === 'new' && waitMin > 10;
            return (
              <button key={s.id} onClick={() => open(s)} className={cx('w-full text-left flex gap-3 px-3 py-3 border-b border-slate-100 transition anim-fade', s.id === id ? 'bg-brand-50' : 'hover:bg-slate-50')}>
                <Avatar name={c?.name ?? '?'} size={42} channel={CH[s.channelId]?.type} group={s.isGroup} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cx('flex-1 truncate text-sm', s.unread ? 'font-bold text-slate-900' : 'font-semibold text-slate-800')}>{c?.name}</p>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">{timeAgo(s.lastAt)}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 min-h-[16px] overflow-hidden">
                    {c?.tagIds.slice(0, 2).map((t) => TG[t] && <TagChip key={t} tag={TG[t]} small />)}
                    {c && c.tagIds.length > 2 && <span className="text-[10px] text-slate-400">+{c.tagIds.length - 2}</span>}
                    <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 truncate max-w-[120px]">{team?.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className={cx('flex-1 truncate text-xs', typing[s.id] ? 'text-brand-600 font-medium' : s.unread ? 'text-slate-800 font-medium' : 'text-slate-500')}>{typing[s.id] ? 'digitando…' : previewOf(lm)}</p>
                    {late && <span title="Aguardando há mais de 10 min" className="text-[10px] font-bold text-red-600 flex items-center gap-0.5"><Icon name="Clock" size={11} />{Math.round(waitMin)}m</span>}
                    {s.unread > 0 && <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold grid place-items-center">{s.unread}</span>}
                    {s.status === 'concluded' && s.csat && <span className="text-[11px] text-amber-500">{'★'.repeat(s.csat)}</span>}
                  </div>
                </div>
              </button>
            );
          })}
          {!list.length && <Empty icon={tab === 'novos' ? 'PartyPopper' : 'Inbox'} title={tab === 'novos' ? 'Fila zerada!' : 'Nenhum atendimento encontrado'} text={tab === 'novos' ? 'Nenhum cliente aguardando agora.' : 'Ajuste os filtros ou a busca.'} />}
        </div>

        <form className="p-3 border-t border-slate-200 flex gap-2" onSubmit={(e) => {
          e.preventDefault();
          if (phone.replace(/\D/g, '').length < 10) { toast('Informe um telefone válido com DDD', { tone: 'error' }); return; }
          const sid = startConversation(phone); setPhone(''); nav(`/atendimentos/${sid}?aba=meus`);
        }}>
          <span className="h-9 px-2.5 rounded-lg border border-slate-200 text-sm grid place-items-center text-slate-600">🇧🇷 +55</span>
          <input value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} placeholder="(00) 00000-0000" className="flex-1 min-w-0 h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500" />
          <Btn type="submit" variant="soft" size="md">Conversar</Btn>
        </form>
      </section>

      {/* ------------------------------------------------ Conversa */}
      {current ? <ChatView key={current.id} session={current} /> : (
        <div className="flex-1 chat-bg flex flex-col items-center justify-center text-center p-8">
          <div className="h-20 w-20 rounded-3xl bg-white shadow-card grid place-items-center text-brand-600 mb-4"><Icon name="MessageSquareDashed" size={38} /></div>
          <p className="text-lg font-semibold text-slate-700">Escolha um atendimento para iniciar a conversa</p>
          <p className="text-sm text-slate-500 mt-1 max-w-md">Há <b>{buckets.novos.length}</b> cliente(s) aguardando na fila e <b>{buckets.meus.filter((s) => s.unread).length}</b> conversa(s) suas com mensagens não lidas.</p>
          {buckets.novos[0] && <Btn variant="primary" icon="Zap" className="mt-5" onClick={() => nav(`/atendimentos/${[...buckets.novos].sort((a, b) => a.lastAt - b.lastAt)[0].id}?aba=novos`)}>Atender o próximo da fila</Btn>}
        </div>
      )}
    </div>
  );
}
