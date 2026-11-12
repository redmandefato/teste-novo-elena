// Painel lateral com os dados do contato (abas: dados, histórico, arquivos, atendimentos, CRM, pagamentos).
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { cx, fmtDate, fmtDateTime, timeAgo, brl } from '../../lib/util';
import { Avatar, Badge, Btn, Field, Icon, IconBtn, Input, Modal, Popover, TagChip, Textarea } from '../../components/ui';
import type { Session } from '../../types';

type PTab = 'dados' | 'historico' | 'arquivos' | 'atendimentos' | 'crm' | 'pagamentos';

export default function ContactPanel({ contactId, session, onClose, onSchedule, embedded }: { contactId: string; session?: Session; onClose?: () => void; onSchedule?: () => void; embedded?: boolean }) {
  const st = useStore();
  const nav = useNavigate();
  const c = st.contacts.find((x) => x.id === contactId)!;
  const [tab, setTab] = useState<PTab>('dados');
  const [noteText, setNoteText] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(c);
  const [notesOpen, setNotesOpen] = useState(true);
  const owner = st.users.find((u) => u.id === c.ownerId);
  const sessions = useMemo(() => st.sessions.filter((s) => s.contactId === c.id).sort((a, b) => b.lastAt - a.lastAt), [st.sessions, c.id]);
  const sids = new Set(sessions.map((s) => s.id));
  const media = st.messages.filter((m) => sids.has(m.sessionId) && (m.type === 'image' || m.type === 'document' || m.type === 'audio'));
  const cards = st.cards.filter((k) => k.contactIds.includes(c.id));
  const payments = st.payments.filter((p) => p.contactId === c.id);
  const isGroup = c.id.startsWith('ctg');

  const toggleTag = (id: string) => st.updateContact(c.id, { tagIds: c.tagIds.includes(id) ? c.tagIds.filter((t) => t !== id) : [...c.tagIds, id] });

  const tabs: { id: PTab; icon: string; title: string; n?: number }[] = [
    { id: 'dados', icon: 'IdCard', title: 'Dados' }, { id: 'historico', icon: 'History', title: 'Histórico' }, { id: 'arquivos', icon: 'Folder', title: 'Arquivos', n: media.length },
    { id: 'atendimentos', icon: 'MessagesSquare', title: 'Atendimentos', n: sessions.length }, { id: 'crm', icon: 'Kanban', title: 'CRM', n: cards.length }, { id: 'pagamentos', icon: 'CreditCard', title: 'Pagamentos', n: payments.length },
  ];

  const timeline = [
    ...sessions.map((s) => ({ at: s.startedAt, icon: 'MessageSquare', text: `Atendimento #${s.protocol} iniciado (${st.teams.find((t) => t.id === s.teamId)?.name})` })),
    ...sessions.filter((s) => s.concludedAt).map((s) => ({ at: s.concludedAt!, icon: 'CircleCheck', text: `Atendimento #${s.protocol} concluído${s.classification ? ` · ${s.classification}` : ''}` })),
    ...cards.flatMap((k) => k.history.map((h) => ({ at: h.at, icon: 'Kanban', text: `${k.key}: ${h.text}` }))),
    ...payments.map((p) => ({ at: p.paidAt ?? p.dueAt, icon: 'CreditCard', text: `Cobrança ${brl(p.value)} · ${p.status}` })),
    { at: c.createdAt, icon: 'UserPlus', text: `Contato criado via ${c.origin}` },
  ].sort((a, b) => b.at - a.at);

  return (
    <aside className={cx('bg-white flex flex-col min-h-0', embedded ? 'h-full' : 'w-[340px] shrink-0 border-l border-slate-200 anim-right')}>
      <div className="h-16 shrink-0 flex items-center gap-1 px-3 border-b border-slate-100">
        {onClose && <IconBtn icon="X" onClick={onClose} size={16} />}
        <p className="font-semibold flex-1 text-sm">Dados do contato</p>
        {!isGroup && <>
          <IconBtn icon="Ban" size={16} title={c.blocked ? 'Desbloquear contato' : 'Bloquear contato'} className={c.blocked ? 'text-red-600' : ''} onClick={() => { st.updateContact(c.id, { blocked: !c.blocked }); st.toast(c.blocked ? 'Contato desbloqueado' : 'Contato bloqueado'); }} />
          {onSchedule && <IconBtn icon="CalendarClock" size={16} title="Agendar mensagem" onClick={onSchedule} />}
          <IconBtn icon="Pencil" size={16} title="Editar contato" onClick={() => { setForm(c); setEditing(true); }} />
        </>}
      </div>
      <div className="flex border-b border-slate-100 px-2">
        {tabs.map((t) => (
          <button key={t.id} title={t.title} onClick={() => setTab(t.id)} className={cx('relative flex-1 h-10 grid place-items-center border-b-2 -mb-px', tab === t.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-400 hover:text-slate-700')}>
            <Icon name={t.icon} size={17} />
            {!!t.n && <span className="absolute top-1 right-1 text-[9px] font-bold text-slate-400">{t.n}</span>}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto scroll-thin p-4 text-sm">
        {tab === 'dados' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name={c.name} size={56} group={isGroup} />
              <div className="min-w-0"><p className="font-semibold text-base truncate">{c.name}</p><p className="text-xs text-slate-500">Cliente desde {fmtDate(c.createdAt)}</p>{c.blocked && <Badge tone="red" icon="Ban">Bloqueado</Badge>}</div>
            </div>
            <Row label="Telefone" value={c.phone} action={<Icon name="MessageCircle" size={16} className="text-emerald-500" />} />
            {c.email && <Row label="E-mail" value={c.email} />}
            {c.instagram && <Row label="Instagram" value={c.instagram} />}
            {!isGroup && <>
              <div>
                <div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-500">Etiquetas</p>
                  <Popover align="right" className="w-60 max-h-72 overflow-y-auto" trigger={({ toggle }) => <IconBtn icon="Pencil" size={14} onClick={toggle} />}>
                    {st.tags.map((t) => <label key={t.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer"><input type="checkbox" checked={c.tagIds.includes(t.id)} onChange={() => toggleTag(t.id)} className="accent-emerald-600" /><TagChip tag={t} small /></label>)}
                  </Popover>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">{c.tagIds.length ? c.tagIds.map((id) => { const t = st.tags.find((x) => x.id === id); return t && <TagChip key={id} tag={t} onRemove={() => toggleTag(id)} />; }) : <span className="text-xs text-slate-400">Nenhuma etiqueta</span>}</div>
              </div>
              <div>
                <div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-500">Carteirização</p>
                  <Popover align="right" className="w-56" trigger={({ toggle }) => <IconBtn icon="Pencil" size={14} onClick={toggle} />}>
                    {({ close }) => <>{[{ id: null as any, name: 'Sem responsável' }, ...st.users].map((u) => <button key={u.id ?? 'none'} onClick={() => { st.updateContact(c.id, { ownerId: u.id }); close(); }} className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50">{u.name}</button>)}</>}
                  </Popover>
                </div>
                {owner ? <span className="inline-flex items-center gap-1.5 mt-1 text-xs font-semibold bg-slate-100 rounded-full pl-0.5 pr-2.5 py-0.5"><Avatar name={owner.name} size={20} />{owner.name.toUpperCase()}</span> : <p className="text-xs text-slate-400 mt-1">Sem carteira</p>}
              </div>
              <div>
                <div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-500">Sequências</p>
                  <Popover align="right" className="w-64" trigger={({ toggle }) => <IconBtn icon="Plus" size={14} onClick={toggle} />}>
                    {({ close }) => <>{st.sequences.filter((s) => s.active).map((s) => <button key={s.id} onClick={() => { if (!c.sequenceIds.includes(s.id)) st.updateContact(c.id, { sequenceIds: [...c.sequenceIds, s.id] }); st.toast(`Contato inscrito em "${s.name}"`); close(); }} className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50">{s.name}</button>)}</>}
                  </Popover>
                </div>
                {c.sequenceIds.length ? c.sequenceIds.map((sid) => <p key={sid} className="text-xs mt-1 flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{st.sequences.find((s) => s.id === sid)?.name}<button className="ml-auto text-slate-400 hover:text-red-500" onClick={() => st.updateContact(c.id, { sequenceIds: c.sequenceIds.filter((x) => x !== sid) })}><Icon name="X" size={12} /></button></p>) : <p className="text-xs text-slate-400 mt-1">Nenhuma sequência em execução</p>}
              </div>
            </>}
            <div className="rounded-xl border border-slate-200">
              <button className="w-full flex items-center px-3 py-2.5" onClick={() => setNotesOpen(!notesOpen)}><p className="text-xs font-semibold text-slate-600 flex-1 text-left">Notas internas ({c.notes.length})</p><Icon name={notesOpen ? 'ChevronUp' : 'ChevronDown'} size={14} /></button>
              {notesOpen && (
                <div className="px-3 pb-3 space-y-2">
                  {c.notes.map((n) => <div key={n.id} className="rounded-lg bg-amber-50 border border-amber-100 p-2"><p className="text-xs text-slate-700">{n.text}</p><p className="text-[10px] text-slate-400 mt-1">{st.users.find((u) => u.id === n.userId)?.name} · {timeAgo(n.at)}</p></div>)}
                  {!c.notes.length && <p className="text-xs text-slate-400">Nenhuma nota cadastrada</p>}
                  <Textarea rows={2} value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Escreva uma nota sobre o cliente…" />
                  <Btn size="sm" variant="soft" disabled={!noteText.trim()} onClick={() => { st.addContactNote(c.id, noteText.trim()); setNoteText(''); }}>Salvar nota</Btn>
                </div>
              )}
            </div>
            {!isGroup && (
              <div className="rounded-xl border border-slate-200 p-3 space-y-2">
                <p className="text-xs font-semibold text-slate-600">Campos personalizados</p>
                <Row label="CPF" value={c.cpf || '—'} /><Row label="Cidade" value={c.city || '—'} /><Row label="Aniversário" value={c.birthday || '—'} /><Row label="Origem" value={c.origin} />
                <button className="text-xs text-brand-700 font-medium hover:underline" onClick={() => { setForm(c); setEditing(true); }}>Adicionar/alterar campos personalizados</button>
              </div>
            )}
          </div>
        )}
        {tab === 'historico' && (
          <ol className="relative border-l border-slate-200 ml-2 space-y-4">
            {timeline.map((e, i) => <li key={i} className="ml-4"><span className="absolute -left-[9px] h-4 w-4 rounded-full bg-white border border-slate-300 grid place-items-center"><Icon name={e.icon} size={9} className="text-slate-500" /></span><p className="text-xs text-slate-700">{e.text}</p><p className="text-[10px] text-slate-400">{fmtDateTime(e.at)}</p></li>)}
          </ol>
        )}
        {tab === 'arquivos' && (media.length ? (
          <div className="grid grid-cols-3 gap-2">
            {media.map((m) => m.type === 'image' ? <img key={m.id} src={m.media?.src} className="aspect-square object-cover rounded-lg border border-slate-200" alt="" /> : (
              <div key={m.id} className="aspect-square rounded-lg border border-slate-200 bg-slate-50 grid place-items-center text-center p-1"><Icon name={m.type === 'audio' ? 'AudioLines' : 'FileText'} size={22} className="text-slate-400" /><p className="text-[9px] text-slate-500 truncate w-full">{m.type === 'audio' ? 'Áudio' : m.media?.fileName}</p></div>
            ))}
          </div>
        ) : <p className="text-xs text-slate-400 text-center py-8">Nenhum arquivo trocado</p>)}
        {tab === 'atendimentos' && (
          <div className="space-y-2">
            {sessions.map((s) => (
              <button key={s.id} onClick={() => nav(`/atendimentos/${s.id}`)} className={cx('w-full text-left rounded-lg border p-3 hover:bg-slate-50', s.id === session?.id ? 'border-brand-500' : 'border-slate-200')}>
                <div className="flex items-center gap-2"><p className="text-xs font-semibold flex-1">#{s.protocol}</p><Badge tone={s.status === 'concluded' ? 'green' : s.status === 'new' ? 'amber' : 'blue'}>{s.status === 'concluded' ? 'Concluído' : s.status === 'new' ? 'Na fila' : 'Em andamento'}</Badge></div>
                <p className="text-xs text-slate-500 mt-1">{st.teams.find((t) => t.id === s.teamId)?.name} · {st.users.find((u) => u.id === s.assigneeId)?.name ?? 'Sem atendente'}</p>
                <p className="text-[11px] text-slate-400">{fmtDateTime(s.startedAt)}{s.classification ? ` · ${s.classification}` : ''}</p>
              </button>
            ))}
          </div>
        )}
        {tab === 'crm' && (
          <div className="space-y-2">
            {cards.map((k) => {
              const p = st.panels.find((x) => x.id === k.panelId)!;
              const stage = p.stages.find((x) => x.id === k.stageId)!;
              return (
                <button key={k.id} onClick={() => nav(`/crm/paineis/${p.id}?card=${k.id}`)} className="w-full text-left rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                  <p className="text-[10px] text-slate-400">{k.key} · {p.name}</p><p className="text-sm font-medium">{k.title}</p>
                  <div className="flex items-center gap-2 mt-1.5"><span className="text-[11px] font-semibold rounded px-1.5 py-0.5 text-white" style={{ background: stage.color }}>{stage.name}</span>{k.value > 0 && <span className="text-xs text-slate-600 ml-auto">{brl(k.value)}</span>}</div>
                </button>
              );
            })}
            <Btn size="sm" variant="soft" icon="Plus" className="w-full" onClick={() => { const id = st.addCard({ panelId: 'p1', stageId: 'p1s1', title: `Oportunidade — ${c.name.split(' ')[0]}`, contactIds: [c.id] }); st.toast('Card criado no Funil de Vendas'); nav(`/crm/paineis/p1?card=${id}`); }}>Adicionar ao Funil de Vendas</Btn>
          </div>
        )}
        {tab === 'pagamentos' && (
          <div className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center"><p className="text-sm font-semibold flex-1">{brl(p.value)}</p><Badge tone={p.status === 'Pago' ? 'green' : p.status === 'Pendente' ? 'amber' : p.status === 'Vencido' ? 'red' : 'slate'}>{p.status}</Badge></div>
                <p className="text-xs text-slate-500">{p.description} · {p.method}</p><p className="text-[11px] text-slate-400">Vencimento {fmtDate(p.dueAt)}</p>
              </div>
            ))}
            {!payments.length && <p className="text-xs text-slate-400 text-center py-4">Nenhuma cobrança para este contato</p>}
            <Btn size="sm" variant="soft" icon="Plus" className="w-full" onClick={() => nav('/apps/pagamentos?novo=' + c.id)}>Nova cobrança</Btn>
          </div>
        )}
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Editar contato" icon="Pencil" footer={<><Btn onClick={() => setEditing(false)}>Cancelar</Btn><Btn variant="primary" onClick={() => { st.updateContact(c.id, form); setEditing(false); st.toast('Contato atualizado', { tone: 'success' }); }}>Salvar</Btn></>}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome" className="col-span-2"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Telefone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="E-mail"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Instagram"><Input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} /></Field>
          <Field label="CPF"><Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} /></Field>
          <Field label="Cidade"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
          <Field label="Aniversário"><Input value={form.birthday} placeholder="dd/mm/aaaa" onChange={(e) => setForm({ ...form, birthday: e.target.value })} /></Field>
        </div>
      </Modal>
    </aside>
  );
}

function Row({ label, value, action }: { label: string; value: string; action?: React.ReactNode }) {
  return <div className="flex items-center gap-2"><div className="flex-1 min-w-0"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="text-sm text-slate-800 truncate">{value}</p></div>{action}</div>;
}
