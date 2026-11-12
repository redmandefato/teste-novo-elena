// Área da conversa: cabeçalho com ações, mensagens e caixa de envio.
import { useEffect, useMemo, useRef, useState, Fragment, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, useMe } from '../../store/useStore';
import { onAgentMessage } from '../../store/simulator';
import { cx, fmtTime, fmtDayLabel, startOfDay, timeAgo, fmtClock, fmtDateTime, HOUR } from '../../lib/util';
import { Avatar, Badge, Btn, Icon, IconBtn, Modal, Popover, TagChip, ChannelGlyph, Textarea, Field, Input, Toggle } from '../../components/ui';
import type { Session, Message } from '../../types';
import ContactPanel from './ContactPanel';
import { TransferModal, ConcludeModal, PreferencesModal, TemplateModal, CallModal, ScheduleModal } from './modals';

const EMOJIS = ['😀', '😁', '😂', '😊', '😍', '🥰', '😉', '😎', '🤩', '🤔', '😅', '🙏', '👍', '👏', '🙌', '💪', '🔥', '✨', '🎉', '❤️', '💚', '✅', '⭐', '🚀', '📦', '🛵', '💰', '📷', '⏳', '👇', '😢', '😡'];

export function formatWa(text: string): ReactNode[] {
  return text.split(/(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~)/g).map((p, i) => {
    if (/^\*[^*]+\*$/.test(p)) return <b key={i}>{p.slice(1, -1)}</b>;
    if (/^_[^_]+_$/.test(p)) return <i key={i}>{p.slice(1, -1)}</i>;
    if (/^~[^~]+~$/.test(p)) return <s key={i}>{p.slice(1, -1)}</s>;
    return <Fragment key={i}>{p}</Fragment>;
  });
}

function Ticks({ status }: { status?: Message['status'] }) {
  if (!status) return null;
  return <Icon name={status === 'sent' ? 'Check' : 'CheckCheck'} size={14} className={status === 'read' ? 'text-sky-500' : 'text-slate-400'} />;
}

function AudioBubble({ duration = 15, mine }: { duration?: number; mine?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setPos((p) => { if (p + 0.25 >= duration) { setPlaying(false); return 0; } return p + 0.25; }), 250);
    return () => clearInterval(t);
  }, [playing, duration]);
  const bars = useMemo(() => Array.from({ length: 32 }, (_, i) => 6 + Math.round(Math.abs(Math.sin(i * 1.7 + duration)) * 16)), [duration]);
  return (
    <div className="flex items-center gap-3 w-64">
      <button onClick={() => setPlaying(!playing)} className={cx('h-9 w-9 rounded-full grid place-items-center shrink-0', mine ? 'bg-brand-600 text-white' : 'bg-slate-700 text-white')}><Icon name={playing ? 'Pause' : 'Play'} size={16} /></button>
      <div className="flex-1">
        <div className={cx('wave flex items-center h-6', mine ? 'text-brand-700' : 'text-slate-600')}>{bars.map((h, i) => <i key={i} className={i / bars.length <= pos / duration ? 'on' : ''} style={{ height: h }} />)}</div>
        <p className="text-[11px] text-slate-500 mt-0.5">{fmtClock(playing ? pos : duration)}</p>
      </div>
    </div>
  );
}

function MessageBody({ m, onImage }: { m: Message; onImage: (src: string) => void }) {
  const mine = m.dir === 'out';
  switch (m.type) {
    case 'image':
      return (
        <div>
          <button onClick={() => onImage(m.media?.src ?? '')} className="block overflow-hidden rounded-lg"><img src={m.media?.src} alt="" className="w-64 max-h-72 object-cover hover:opacity-95" /></button>
          {m.media?.caption && m.media.caption !== 'Comprovante' && <p className="mt-1.5 whitespace-pre-wrap">{m.media.caption}</p>}
        </div>
      );
    case 'audio':
      return <AudioBubble duration={m.media?.duration} mine={mine} />;
    case 'document':
      return (
        <div className="flex items-center gap-3 w-64 rounded-lg bg-black/[.04] p-2.5">
          <span className="h-10 w-10 rounded-lg bg-red-500 text-white grid place-items-center text-[10px] font-bold">PDF</span>
          <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{m.media?.fileName ?? m.body}</p><p className="text-[11px] text-slate-500">{m.media?.fileSize ?? '—'} · PDF</p></div>
          <button onClick={() => useStore.getState().toast('Download simulado no protótipo')} className="text-slate-500 hover:text-slate-800"><Icon name="Download" size={18} /></button>
        </div>
      );
    case 'location':
      return (
        <div className="w-64">
          <div className="h-28 rounded-lg bg-[linear-gradient(135deg,#d1fae9_25%,#ecfdf7_25%,#ecfdf7_50%,#d1fae9_50%,#d1fae9_75%,#ecfdf7_75%)] bg-[length:24px_24px] grid place-items-center"><Icon name="MapPin" size={30} className="text-red-500" /></div>
          <p className="text-sm font-medium mt-1.5">{m.body}</p>
          <p className="text-xs text-slate-500">{m.media?.address}</p>
        </div>
      );
    case 'template':
      return (
        <div className="w-72">
          <p className="text-[10px] font-bold uppercase tracking-wide text-brand-700 mb-1 flex items-center gap-1"><Icon name="FileText" size={11} />Modelo · {m.template?.name}</p>
          <p className="whitespace-pre-wrap">{formatWa(m.body)}</p>
          {m.template?.buttons && <div className="mt-2 -mx-1 border-t border-black/5 pt-1">{m.template.buttons.map((b) => <p key={b} className="text-center text-sky-600 text-sm py-1">{b}</p>)}</div>}
        </div>
      );
    default:
      return <p className="whitespace-pre-wrap break-words">{formatWa(m.body)}</p>;
  }
}

const EVENT_ICON: Record<string, string> = { bot: 'Bot', distributed: 'Shuffle', expired: 'TimerOff', transferred: 'ArrowLeftRight', concluded: 'CircleCheck', reopened: 'RotateCcw', assigned: 'UserCheck', created: 'MessageSquarePlus' };

export default function ChatView({ session }: { session: Session }) {
  const nav = useNavigate();
  const me = useMe();
  const st = useStore();
  const { contacts, channels, teams, users, tags, messages, quickReplies, prefs, typing } = st;
  const contact = contacts.find((c) => c.id === session.contactId)!;
  const channel = channels.find((c) => c.id === session.channelId)!;
  const team = teams.find((t) => t.id === session.teamId);
  const assignee = users.find((u) => u.id === session.assigneeId);
  const msgs = useMemo(() => messages.filter((m) => m.sessionId === session.id).sort((a, b) => a.at - b.at), [messages, session.id]);
  const previous = useMemo(() => st.sessions.filter((s) => s.contactId === contact.id && s.id !== session.id && s.status === 'concluded').sort((a, b) => b.lastAt - a.lastAt), [st.sessions, contact.id, session.id]);
  const [showPrev, setShowPrev] = useState(false);
  const prevMsgs = useMemo(() => (showPrev && previous[0] ? messages.filter((m) => m.sessionId === previous[0].id).sort((a, b) => a.at - b.at) : []), [showPrev, previous, messages]);

  const [text, setText] = useState('');
  const [noteMode, setNoteMode] = useState(false);
  const [panel, setPanel] = useState(true);
  const [modal, setModal] = useState<null | 'transfer' | 'conclude' | 'prefs' | 'template' | 'call' | 'schedule'>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [recording, setRecording] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { const el = scrollRef.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: msgs.length ? 'smooth' : 'auto' }); }, [msgs.length, typing[session.id]]);
  useEffect(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight; }, []);
  useEffect(() => { if (recording === null) return; const t = setInterval(() => setRecording((r) => (r ?? 0) + 1), 1000); return () => clearInterval(t); }, [recording !== null]);

  const windowClosed = channel.type === 'whatsapp' && !session.isGroup && (!session.lastInboundAt || Date.now() - session.lastInboundAt > 24 * HOUR);
  const slash = text.startsWith('/') ? quickReplies.filter((q) => q.shortcut.startsWith(text.slice(1).toLowerCase())) : [];
  const fill = (t: string) => t.replace('{agente}', me.name.split(' ')[0]).replace('{nome}', contact.name.split(' ')[0]);

  const send = (body = text, extra: Partial<Message> = {}) => {
    if (!body.trim() && !extra.type) return;
    if (noteMode) { st.sendMessage(session.id, { dir: 'note', body: body.trim(), status: undefined }); setText(''); return; }
    st.sendMessage(session.id, { body: body.trim(), ...extra });
    setText('');
    onAgentMessage(session.id, body);
    inputRef.current?.focus();
  };
  const sendMedia = (type: Message['type'], body: string, media: Message['media']) => { st.sendMessage(session.id, { type, body, media }); onAgentMessage(session.id, body); };

  // Agrupa por dia
  const grouped: { day: number; items: Message[] }[] = [];
  msgs.forEach((m) => { const d = startOfDay(m.at); const g = grouped[grouped.length - 1]; if (!g || g.day !== d) grouped.push({ day: d, items: [m] }); else g.items.push(m); });

  const renderMsg = (m: Message, i: number, arr: Message[]) => {
    if (m.dir === 'event') return (
      <div key={m.id} className="flex justify-center my-3">
        <div className="max-w-md flex items-start gap-2 rounded-xl bg-white/90 border border-slate-200 px-3 py-2 text-xs text-slate-600 shadow-sm">
          <Icon name={EVENT_ICON[m.event ?? 'bot'] ?? 'Info'} size={14} className="text-brand-600 mt-0.5 shrink-0" />
          <span className="flex-1">{m.body}</span><span className="text-slate-400 shrink-0">{fmtTime(m.at)}</span>
        </div>
      </div>
    );
    const out = m.dir === 'out' || m.dir === 'bot' || m.dir === 'note';
    const prev = arr[i - 1];
    const first = !prev || prev.dir !== m.dir || prev.senderName !== m.senderName || m.at - prev.at > 5 * 60e3;
    const author = m.dir === 'out' ? users.find((u) => u.id === m.userId)?.name.split(' ')[0] : m.dir === 'bot' ? 'Vitta Bot' : m.dir === 'note' ? `Nota interna · ${users.find((u) => u.id === m.userId)?.name.split(' ')[0]}` : m.senderName;
    return (
      <div key={m.id} className={cx('flex anim-fade', out ? 'justify-end' : 'justify-start', first ? 'mt-3' : 'mt-1')}>
        <div className={cx('relative max-w-[70%] rounded-2xl px-3.5 py-2 text-sm shadow-sm',
          m.dir === 'in' && 'bg-white text-slate-800 rounded-tl-md',
          m.dir === 'out' && 'bg-brand-100 text-slate-800 rounded-tr-md',
          m.dir === 'bot' && 'bg-slate-200/80 text-slate-800 rounded-tr-md',
          m.dir === 'note' && 'bg-amber-100 border border-amber-200 text-amber-900 rounded-tr-md')}>
          {first && author && <p className={cx('text-[11px] font-semibold mb-0.5 flex items-center gap-1', m.dir === 'bot' ? 'text-slate-600' : m.dir === 'note' ? 'text-amber-700' : m.dir === 'out' ? 'text-brand-700' : 'text-violet-600')}>{m.dir === 'bot' && <Icon name="Bot" size={12} />}{m.dir === 'note' && <Icon name="StickyNote" size={12} />}{author}</p>}
          <MessageBody m={m} onImage={setLightbox} />
          <p className="flex items-center justify-end gap-1 text-[10px] text-slate-400 mt-0.5 -mb-0.5">{fmtTime(m.at)}{(m.dir === 'out' || m.dir === 'bot') && <Ticks status={m.status} />}</p>
        </div>
      </div>
    );
  };

  const contactTags = contact.tagIds.map((t) => tags.find((x) => x.id === t)).filter(Boolean) as any[];
  const watching = session.watchers.includes(me.id);

  return (
    <div className="flex-1 flex min-w-0">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Cabeçalho */}
        <div className="h-16 shrink-0 bg-white border-b border-slate-200 flex items-center gap-3 px-4">
          <button onClick={() => setPanel(!panel)} className="flex items-center gap-3 min-w-0 flex-1 text-left">
            <Avatar name={contact.name} size={40} channel={channel.type} group={session.isGroup} />
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 truncate flex items-center gap-1.5">{contact.name}</p>
              <div className="flex items-center gap-1 mt-0.5">{contactTags.slice(0, 3).map((t) => <TagChip key={t.id} tag={t} small />)}<span className="text-[11px] text-slate-400 ml-1">#{session.protocol}</span></div>
            </div>
          </button>
          <IconBtn icon={watching ? 'Eye' : 'EyeOff'} size={16} className="shrink-0" title={watching ? 'Deixar de acompanhar' : 'Acompanhar atendimento'} active={watching} onClick={() => st.toggleWatch(session.id)} />
          <IconBtn icon="History" size={16} className="shrink-0" title="Atendimentos anteriores" onClick={() => setShowPrev(!showPrev)} active={showPrev} />
          {assignee && <span title={`Atendente: ${assignee.name}`} className="shrink-0"><Avatar name={assignee.name} size={28} status={assignee.status} /></span>}
          <span className={cx('items-center gap-1.5 text-xs text-slate-600 bg-slate-100 rounded-full pl-1 pr-2.5 py-1 whitespace-nowrap', panel ? 'hidden 2xl:flex' : 'hidden xl:flex')}><ChannelGlyph type={channel.type} size={18} />{channel.identifier}</span>
          <span className={cx('text-xs font-semibold rounded-full px-2.5 py-1 whitespace-nowrap shrink-0',session.status === 'new' ? 'bg-amber-50 text-amber-700' : session.status === 'open' ? 'bg-sky-50 text-sky-700' : 'bg-emerald-50 text-emerald-700')}>{session.status === 'new' ? 'Na fila' : session.status === 'open' ? 'Em andamento' : 'Concluído'}</span>
          {!session.isGroup && (
            <Popover align="right" className="w-56" trigger={({ toggle }) => <button onClick={toggle} className="h-9 px-2.5 rounded-lg border border-slate-200 flex items-center gap-1 text-emerald-600 hover:bg-slate-50"><Icon name="Phone" size={16} /><Icon name="ChevronDown" size={14} className="text-slate-400" /></button>}>
              {({ close }) => (<>
                <button className="w-full px-3 py-2 text-sm text-left hover:bg-slate-50 flex gap-2" onClick={() => { setModal('call'); close(); }}><Icon name="PhoneCall" size={16} className="text-slate-400" />Ligar pelo WhatsApp</button>
                <button className="w-full px-3 py-2 text-sm text-left hover:bg-slate-50 flex gap-2" onClick={() => { setModal('call'); close(); }}><Icon name="Headset" size={16} className="text-slate-400" />Ligação VoIP</button>
              </>)}
            </Popover>
          )}
          {session.status !== 'concluded' && <Btn icon="ArrowLeftRight" title="Transferir" className="shrink-0" onClick={() => setModal('transfer')}><span className={panel ? 'hidden 2xl:inline' : 'hidden lg:inline'}>Transferir</span></Btn>}
          {session.status !== 'concluded' ? (
            <div className="flex shrink-0">
              <Btn variant="primary" className="rounded-r-none" icon="CircleCheck" onClick={() => (prefs.classifyOnConclude ? setModal('conclude') : st.conclude(session.id, {}))}>Concluir</Btn>
              <Btn variant="primary" className="rounded-l-none border-l border-brand-700 !px-2" onClick={() => setModal('prefs')}><Icon name="ChevronDown" size={16} /></Btn>
            </div>
          ) : <Btn variant="soft" icon="RotateCcw" onClick={() => st.reopen(session.id)}>Reabrir</Btn>}
          <IconBtn icon={panel ? 'PanelRightClose' : 'PanelRightOpen'} title="Dados do contato" onClick={() => setPanel(!panel)} />
        </div>

        {/* Mensagens */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-thin chat-bg px-6 py-4">
          {previous.length > 0 && (
            <div className="flex justify-center mb-2">
              <button onClick={() => setShowPrev(!showPrev)} className="text-xs font-medium text-brand-700 bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-sm hover:bg-brand-50">
                {showPrev ? 'Ocultar conversa anterior' : `Ver conversa anterior (${previous.length})`}
              </button>
            </div>
          )}
          {showPrev && prevMsgs.length > 0 && (
            <div className="opacity-70 border-b-2 border-dashed border-slate-300 pb-4 mb-4">
              <p className="text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Atendimento #{previous[0].protocol} · {fmtDateTime(previous[0].startedAt)}</p>
              {prevMsgs.map((m, i, a) => renderMsg(m, i, a))}
            </div>
          )}
          {grouped.map((g) => (
            <div key={g.day}>
              <div className="flex justify-center my-3 sticky top-0 z-10"><span className="text-[11px] font-semibold text-slate-500 bg-white/90 border border-slate-200 rounded-full px-3 py-1 shadow-sm">{fmtDayLabel(g.day)}</span></div>
              {g.items.map((m, i, a) => renderMsg(m, i, a))}
            </div>
          ))}
          {typing[session.id] && (
            <div className="flex mt-3"><div className="rounded-2xl rounded-tl-md bg-white px-4 py-3 shadow-sm typing"><span /><span /><span /></div></div>
          )}
          <div ref={endRef} />
        </div>

        {/* Rodapé / composer */}
        {session.status === 'new' ? (
          <div className="border-t border-slate-200 bg-white p-4 flex items-center gap-4">
            <span className="h-10 w-10 rounded-full bg-amber-50 text-amber-600 grid place-items-center"><Icon name="Hourglass" size={18} /></span>
            <div className="flex-1"><p className="text-sm font-semibold text-slate-800">Aguardando na fila da equipe {team?.name}</p><p className="text-xs text-slate-500">Cliente esperando {timeAgo(session.lastAt).replace('há ', 'há ')} · ao atender, o atendimento passa para a sua aba "Meus".</p></div>
            <Btn icon="ArrowLeftRight" onClick={() => setModal('transfer')}>Transferir</Btn>
            <Btn variant="primary" size="lg" icon="Headphones" onClick={() => { st.assignToMe(session.id); st.markRead(session.id); nav(`/atendimentos/${session.id}?aba=meus`); }}>Atender</Btn>
          </div>
        ) : session.status === 'concluded' ? (
          <div className="border-t border-slate-200 bg-white p-4 flex items-center gap-4">
            <span className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 grid place-items-center"><Icon name="CircleCheck" size={18} /></span>
            <div className="flex-1"><p className="text-sm font-semibold text-slate-800">Atendimento concluído {session.classification && `· ${session.classification}`}</p><p className="text-xs text-slate-500">Concluído {timeAgo(session.concludedAt ?? session.lastAt)}{session.csat ? ` · avaliação do cliente: ${'★'.repeat(session.csat)}` : ''}</p></div>
            <Btn variant="primary" icon="RotateCcw" onClick={() => st.reopen(session.id)}>Reabrir atendimento</Btn>
          </div>
        ) : windowClosed && !noteMode ? (
          <div className="border-t border-slate-200 bg-white p-4 flex items-center gap-4">
            <span className="h-10 w-10 rounded-full bg-sky-50 text-sky-600 grid place-items-center"><Icon name="Clock4" size={18} /></span>
            <div className="flex-1"><p className="text-sm font-semibold text-slate-800">Janela de 24h encerrada</p><p className="text-xs text-slate-500">No WhatsApp oficial, só é possível retomar a conversa com um modelo de mensagem aprovado pela Meta.</p></div>
            <Btn icon="StickyNote" onClick={() => setNoteMode(true)}>Nota interna</Btn>
            <Btn variant="primary" icon="FileText" onClick={() => setModal('template')}>Enviar modelo</Btn>
          </div>
        ) : (
          <div className={cx('border-t p-3 relative', noteMode ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200')}>
            {slash.length > 0 && (
              <div className="absolute bottom-full left-3 right-3 mb-2 bg-white rounded-xl shadow-xl border border-slate-200 py-1 anim-pop max-h-64 overflow-y-auto">
                <p className="px-3 py-1 text-[11px] font-semibold uppercase text-slate-400">Respostas rápidas</p>
                {slash.map((q) => <button key={q.id} onClick={() => setText(fill(q.text))} className="w-full text-left px-3 py-2 hover:bg-slate-50"><span className="text-xs font-bold text-brand-700">/{q.shortcut}</span><p className="text-sm text-slate-600 truncate">{fill(q.text)}</p></button>)}
              </div>
            )}
            {noteMode && <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1.5"><Icon name="StickyNote" size={13} />Nota interna — visível apenas para a sua equipe<button className="ml-auto underline" onClick={() => setNoteMode(false)}>voltar para mensagem</button></p>}
            <div className="flex items-end gap-1">
              <Popover up className="w-96" trigger={({ toggle }) => <IconBtn icon="Zap" title="Respostas rápidas (ou digite /)" onClick={toggle} badge={quickReplies.length} />}>
                {({ close }) => (
                  <div className="max-h-80 overflow-y-auto">
                    <p className="px-3 py-1 text-[11px] font-semibold uppercase text-slate-400">Respostas rápidas</p>
                    {quickReplies.map((q) => <button key={q.id} onClick={() => { setText(fill(q.text)); close(); inputRef.current?.focus(); }} className="w-full text-left px-3 py-2 hover:bg-slate-50"><span className="text-xs font-bold text-brand-700">/{q.shortcut}</span><p className="text-sm text-slate-600 line-clamp-2">{fill(q.text)}</p></button>)}
                  </div>
                )}
              </Popover>
              <Popover up className="w-56" trigger={({ toggle }) => <IconBtn icon="Paperclip" title="Anexar" onClick={toggle} />}>
                {({ close }) => (<>
                  {[
                    ['Image', 'Imagem do catálogo', () => sendMedia('image', 'Confira esse produto 👇', { src: ['products/whey.svg', 'products/creatina.svg', 'products/pretreino.svg'][Math.floor(Math.random() * 3)] })],
                    ['FileText', 'Documento', () => sendMedia('document', 'Catálogo', { fileName: 'Catalogo-Vitta-Nov-2026.pdf', fileSize: '2,4 MB' })],
                    ['MapPin', 'Localização da loja', () => sendMedia('location', 'Vitta Suplementos — Centro', { address: 'Av. Eduardo Ribeiro, 520 — Centro, Manaus/AM' })],
                    ['LayoutTemplate', 'Modelo de mensagem', () => setModal('template')],
                    ['CalendarClock', 'Agendar mensagem', () => setModal('schedule')],
                    ['CreditCard', 'Cobrança (Asaas)', () => send(`Segue o link para pagamento: https://pay.vitta.com.br/c/${Math.random().toString(36).slice(2, 10)} 💳`)],
                  ].map(([icon, label, fn]: any) => <button key={label} className="w-full px-3 py-2 text-sm text-left hover:bg-slate-50 flex gap-2.5 items-center" onClick={() => { fn(); close(); }}><Icon name={icon} size={16} className="text-slate-400" />{label}</button>)}
                </>)}
              </Popover>
              <Popover up className="w-72 p-2" trigger={({ toggle }) => <IconBtn icon="Smile" title="Emojis" onClick={toggle} />}>
                <div className="grid grid-cols-8 gap-1">{EMOJIS.map((e) => <button key={e} onClick={() => setText((t) => t + e)} className="h-8 rounded hover:bg-slate-100 text-lg">{e}</button>)}</div>
              </Popover>
              <IconBtn icon="StickyNote" title="Nota interna" active={noteMode} onClick={() => setNoteMode(!noteMode)} />
              {recording !== null ? (
                <div className="flex-1 h-11 rounded-xl border border-red-200 bg-red-50 flex items-center gap-3 px-4 text-sm text-red-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500 rec-dot" />Gravando áudio… {fmtClock(recording)}
                  <div className="flex-1" />
                  <button onClick={() => setRecording(null)} className="text-slate-500 hover:text-slate-800"><Icon name="Trash2" size={16} /></button>
                </div>
              ) : (
                <textarea ref={inputRef} rows={1} value={text} onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (slash.length && text.length > 1) { setText(fill(slash[0].text)); return; } send(); } }}
                  placeholder={noteMode ? 'Escreva uma nota interna…' : 'Digite uma mensagem ou / para respostas rápidas'}
                  className={cx('flex-1 resize-none max-h-40 min-h-[44px] rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2', noteMode ? 'border-amber-300 bg-white focus:ring-amber-100' : 'border-slate-200 focus:border-brand-500 focus:ring-brand-100')} />
              )}
              {text.trim() || noteMode ? (
                <button onClick={() => send()} className={cx('h-11 w-11 rounded-xl text-white grid place-items-center shrink-0', noteMode ? 'bg-amber-500 hover:bg-amber-600' : 'bg-brand-600 hover:bg-brand-700')}><Icon name="SendHorizontal" size={18} /></button>
              ) : recording !== null ? (
                <button onClick={() => { sendMedia('audio', '', { duration: Math.max(1, recording) }); setRecording(null); }} className="h-11 w-11 rounded-xl bg-brand-600 text-white grid place-items-center shrink-0"><Icon name="SendHorizontal" size={18} /></button>
              ) : (
                <button onClick={() => setRecording(0)} title="Gravar áudio" className="h-11 w-11 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 grid place-items-center shrink-0"><Icon name="Mic" size={18} /></button>
              )}
            </div>
          </div>
        )}
      </div>

      {panel && <ContactPanel contactId={contact.id} session={session} onClose={() => setPanel(false)} onSchedule={() => setModal('schedule')} />}

      <TransferModal open={modal === 'transfer'} onClose={() => setModal(null)} session={session} onDone={(away) => { setModal(null); if (away) nav('/atendimentos?aba=meus'); }} />
      <ConcludeModal open={modal === 'conclude'} onClose={() => setModal(null)} session={session} />
      <PreferencesModal open={modal === 'prefs'} onClose={() => setModal(null)} />
      <TemplateModal open={modal === 'template'} onClose={() => setModal(null)} contactName={contact.name} onSend={(t, body) => { st.sendMessage(session.id, { type: 'template', body, template: { name: t.name, buttons: t.buttons } }); setModal(null); onAgentMessage(session.id, body); }} />
      <CallModal open={modal === 'call'} onClose={() => setModal(null)} name={contact.name} phone={contact.phone} onEnd={(sec) => st.addEvent(session.id, `Ligação de voz encerrada · duração ${fmtClock(sec)}`, 'created')} />
      <ScheduleModal open={modal === 'schedule'} onClose={() => setModal(null)} contactId={contact.id} channelId={channel.id} />
      <Modal open={!!lightbox} onClose={() => setLightbox(null)} size="lg"><img src={lightbox ?? ''} className="w-full rounded-lg mt-5" alt="" /></Modal>
    </div>
  );
}
