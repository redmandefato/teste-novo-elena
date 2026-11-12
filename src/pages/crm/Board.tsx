// Kanban do painel (arrastar e soltar) + visão em lista + modal do card.
import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Avatar, Btn, Icon, IconBtn, Input, Modal, Popover, Segmented, Select, TagChip, Textarea, Empty, Badge } from '../../components/ui';
import { DataTable } from '../../components/DataTable';
import { brl, cx, fmtDate, fmtDateTime, sum, timeAgo, byId, downloadCSV } from '../../lib/util';
import type { Card } from '../../types';

export default function Board() {
  const { id } = useParams();
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();
  const st = useStore();
  const panel = st.panels.find((p) => p.id === id);
  const [view, setView] = useState<'kanban' | 'lista'>('kanban');
  const [q, setQ] = useState('');
  const [owner, setOwner] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const C = useMemo(() => byId(st.contacts), [st.contacts]);
  const U = useMemo(() => byId(st.users), [st.users]);
  const TG = useMemo(() => byId(st.tags), [st.tags]);
  if (!panel) return <Empty title="Painel não encontrado" />;
  const cards = st.cards.filter((c) => c.panelId === panel.id && c.archived === showArchived && (!owner || c.ownerId === owner) && (!q || `${c.title} ${c.key} ${c.contactIds.map((x) => C[x]?.name).join(' ')}`.toLowerCase().includes(q.toLowerCase())));
  const openCard = st.cards.find((c) => c.id === sp.get('card'));
  const setOpen = (cid: string | null) => { if (cid) sp.set('card', cid); else sp.delete('card'); setSp(sp, { replace: true }); };
  const stageOf = (sid: string) => panel.stages.find((s) => s.id === sid)!;

  return (
    <div className="h-full flex flex-col">
      <div className="h-16 shrink-0 flex items-center gap-3 px-6 bg-white border-b border-slate-200">
        <IconBtn icon="ArrowLeft" onClick={() => nav('/crm/paineis')} />
        <Popover trigger={({ toggle }) => <button onClick={toggle} className="flex items-center gap-1.5 text-lg font-bold text-slate-900">{panel.name}<Icon name="ChevronDown" size={16} /></button>} className="w-64">
          {({ close }) => <>{st.panels.filter((p) => !p.deleted).map((p) => <button key={p.id} onClick={() => { nav(`/crm/paineis/${p.id}`); close(); }} className={cx('w-full text-left px-3 py-2 text-sm hover:bg-slate-50', p.id === panel.id && 'text-brand-700 font-medium')}>{p.name}{p.kind === 'Tarefas' && <span className="text-slate-400"> · {p.scope}</span>}</button>)}</>}
        </Popover>
        <Segmented size="sm" value={view} onChange={setView} options={[{ id: 'kanban', label: 'Kanban', icon: 'Columns3' }, { id: 'lista', label: 'Lista', icon: 'List' }]} />
        <div className="flex-1" />
        <Input icon="Search" placeholder="Pesquisar" className="w-56" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={owner} onChange={(e) => setOwner(e.target.value)}><option value="">Todos os responsáveis</option>{st.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>
        <IconBtn icon="Archive" title={showArchived ? 'Ver itens ativos' : 'Ver itens arquivados'} active={showArchived} onClick={() => setShowArchived(!showArchived)} />
        <Btn icon="Download" onClick={() => downloadCSV(`${panel.name}.csv`, [{ label: 'Código', key: 'key' }, { label: 'Título', key: 'title' }, { label: 'Etapa', csv: (c: Card) => stageOf(c.stageId).name }, { label: 'Valor', csv: (c: Card) => c.value.toFixed(2).replace('.', ',') }, { label: 'Responsável', csv: (c: Card) => U[c.ownerId]?.name }], cards)}>Exportar</Btn>
        <IconBtn icon="Settings" title="Configurar painel" onClick={() => st.toast('Configuração de etapas e campos (protótipo)')} />
      </div>

      {view === 'kanban' ? (
        <div className="flex-1 overflow-x-auto scroll-thin p-5">
          <div className="flex gap-4 h-full min-w-max">
            {panel.stages.map((s) => {
              const list = cards.filter((c) => c.stageId === s.id);
              const total = sum(list, (c) => c.value);
              return (
                <div key={s.id} onDragOver={(e) => { e.preventDefault(); setOver(s.id); }} onDragLeave={() => setOver(null)} onDrop={() => { if (dragId) { st.moveCard(dragId, s.id); st.toast(`Movido para ${s.name}`); } setDragId(null); setOver(null); }}
                  className={cx('w-72 shrink-0 flex flex-col rounded-xl bg-slate-100/80 transition', over === s.id && 'drag-over')}>
                  <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                    <p className="text-sm font-semibold text-slate-800 flex-1 truncate">{s.name} <span className="text-slate-400 font-normal">({list.length})</span></p>
                    {total > 0 && <span className="text-[11px] font-semibold text-slate-500 bg-white rounded px-1.5 py-0.5">{brl(total)}</span>}
                  </div>
                  <div className="flex-1 overflow-y-auto scroll-thin px-2 pb-2 space-y-2">
                    {list.map((c) => (
                      <div key={c.id} draggable onDragStart={() => setDragId(c.id)} onDragEnd={() => setDragId(null)} onClick={() => setOpen(c.id)}
                        className={cx('bg-white rounded-lg border border-slate-200 p-3 shadow-sm cursor-grab active:cursor-grabbing hover:border-brand-300', dragId === c.id && 'dragging')}>
                        <div className="flex items-start gap-2"><p className="text-[10px] font-semibold text-slate-400 flex-1">{c.key}</p>{c.dueAt && <span className={cx('text-[10px] font-semibold flex items-center gap-0.5', c.dueAt < Date.now() ? 'text-red-600' : 'text-slate-400')}><Icon name="Calendar" size={10} />{fmtDate(c.dueAt).slice(0, 5)}</span>}</div>
                        <p className="text-sm font-medium text-slate-800 mt-0.5">{c.contactIds[0] ? C[c.contactIds[0]]?.name : c.title}</p>
                        {c.contactIds[0] && <p className="text-xs text-slate-500 truncate">{c.title}</p>}
                        {c.tagIds.length > 0 && <div className="flex flex-wrap gap-1 mt-2">{c.tagIds.map((t) => TG[t] && <TagChip key={t} tag={TG[t]} small />)}</div>}
                        <div className="flex items-center gap-2 mt-2.5">
                          {c.value > 0 && <span className="text-xs font-semibold text-slate-700">{brl(c.value)}</span>}
                          <div className="flex-1" />
                          {c.notes.length > 0 && <span className="text-[11px] text-slate-400 flex items-center gap-0.5"><Icon name="MessageSquareText" size={12} />{c.notes.length}</span>}
                          <span title={U[c.ownerId]?.name}><Avatar name={U[c.ownerId]?.name ?? '?'} size={22} /></span>
                        </div>
                      </div>
                    ))}
                    {adding === s.id ? (
                      <form onSubmit={(e) => { e.preventDefault(); if (newTitle.trim()) { const nid = st.addCard({ panelId: panel.id, stageId: s.id, title: newTitle.trim() }); setNewTitle(''); setAdding(null); setOpen(nid); } }} className="bg-white rounded-lg border border-brand-300 p-2">
                        <input autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Título do item" className="w-full text-sm outline-none" onBlur={() => !newTitle && setAdding(null)} />
                      </form>
                    ) : <button onClick={() => setAdding(s.id)} className="w-full flex items-center gap-1.5 px-2 py-2 text-sm text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg"><Icon name="Plus" size={15} />Novo item</button>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto scroll-thin p-6">
          <DataTable rows={cards} onRowClick={(c) => setOpen(c.id)} pageSize={20} columns={[
            { key: 'key', label: 'Código', width: 90 },
            { key: 'title', label: 'Item', render: (c) => <div><p className="font-medium">{c.title}</p>{c.contactIds[0] && <p className="text-xs text-slate-500">{C[c.contactIds[0]]?.name}</p>}</div> },
            { key: 'stage', label: 'Etapa', sortValue: (c) => panel.stages.findIndex((s) => s.id === c.stageId), render: (c) => <span className="text-[11px] font-semibold rounded px-1.5 py-0.5 text-white" style={{ background: stageOf(c.stageId).color }}>{stageOf(c.stageId).name}</span> },
            { key: 'value', label: 'Valor', align: 'right', render: (c) => (c.value ? brl(c.value) : '—') },
            { key: 'owner', label: 'Responsável', sortValue: (c) => U[c.ownerId]?.name, render: (c) => <span className="flex items-center gap-2"><Avatar name={U[c.ownerId]?.name ?? '?'} size={22} />{U[c.ownerId]?.name}</span> },
            { key: 'dueAt', label: 'Vencimento', render: (c) => (c.dueAt ? fmtDate(c.dueAt) : '—') },
          ]} />
        </div>
      )}

      {openCard && <CardModal card={openCard} onClose={() => setOpen(null)} />}
    </div>
  );
}

function CardModal({ card, onClose }: { card: Card; onClose: () => void }) {
  const st = useStore();
  const nav = useNavigate();
  const panel = st.panels.find((p) => p.id === card.panelId)!;
  const stage = panel.stages.find((s) => s.id === card.stageId)!;
  const [tab, setTab] = useState<'notas' | 'historico'>('notas');
  const [note, setNote] = useState('');
  const owner = st.users.find((u) => u.id === card.ownerId);
  const idx = panel.stages.findIndex((s) => s.id === card.stageId);
  return (
    <Modal open onClose={onClose} size="xl">
      <div className="grid grid-cols-5 gap-6 pt-5">
        <div className="col-span-3 space-y-4">
          <div>
            <p className="text-[11px] font-semibold text-slate-400">{card.key}</p>
            <div className="flex items-center gap-2"><input className="text-xl font-bold text-slate-900 flex-1 outline-none rounded focus:bg-slate-50" value={card.title} onChange={(e) => st.updateCard(card.id, { title: e.target.value })} /><span className="text-xs font-semibold rounded-full px-2.5 py-1 text-white" style={{ background: stage.color }}>{stage.name}</span></div>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
              <label className="flex items-center gap-1.5 text-brand-700"><Icon name="Calendar" size={15} /><input type="date" className="outline-none bg-transparent" value={card.dueAt ? new Date(card.dueAt).toISOString().slice(0, 10) : ''} onChange={(e) => st.updateCard(card.id, { dueAt: e.target.value ? new Date(e.target.value + 'T12:00').getTime() : null })} /></label>
              <span className="flex items-center gap-1.5 text-brand-700"><Icon name="User" size={15} /><select className="bg-transparent outline-none" value={card.ownerId} onChange={(e) => st.updateCard(card.id, { ownerId: e.target.value })}>{st.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></span>
              <Popover className="w-56" trigger={({ toggle }) => <button onClick={toggle} className="flex items-center gap-1.5 text-brand-700"><Icon name="Tag" size={15} />Etiquetas</button>}>
                {st.tags.map((t) => <label key={t.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer"><input type="checkbox" className="accent-emerald-600" checked={card.tagIds.includes(t.id)} onChange={() => st.updateCard(card.id, { tagIds: card.tagIds.includes(t.id) ? card.tagIds.filter((x) => x !== t.id) : [...card.tagIds, t.id] })} /><TagChip tag={t} small /></label>)}
              </Popover>
            </div>
            {card.tagIds.length > 0 && <div className="flex gap-1 mt-2">{card.tagIds.map((t) => { const tg = st.tags.find((x) => x.id === t); return tg && <TagChip key={t} tag={tg} small />; })}</div>}
          </div>
          <div><p className="text-xs font-semibold text-slate-500 mb-1">Descrição</p><Textarea rows={3} value={card.description} onChange={(e) => st.updateCard(card.id, { description: e.target.value })} placeholder="Adicione detalhes…" /></div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1.5">Contatos</p>
            {card.contactIds.map((cid) => { const c = st.contacts.find((x) => x.id === cid); if (!c) return null; const s = st.sessions.find((x) => x.contactId === cid && x.status !== 'concluded'); return (
              <div key={cid} className="flex items-center gap-3 rounded-lg border border-slate-200 p-2.5">
                <Avatar name={c.name} size={36} /><div className="flex-1"><p className="text-sm font-medium">{c.name}</p><p className="text-xs text-slate-500">{c.phone}</p></div>
                <Btn size="sm" icon="MessageSquare" onClick={() => { const sid = s?.id ?? st.startConversation(c.phone); nav(`/atendimentos/${sid}`); }}>{s ? 'Ver atendimento' : 'Conversar'}</Btn>
              </div>
            ); })}
            {!card.contactIds.length && <p className="text-xs text-slate-400">Nenhum contato vinculado</p>}
          </div>
          {panel.kind !== 'Tarefas' && <div><p className="text-xs font-semibold text-slate-500 mb-1">Valor atribuído</p><Input icon="CircleDollarSign" type="number" className="w-56" value={card.value} onChange={(e) => st.updateCard(card.id, { value: Number(e.target.value) })} /></div>}
          <div className="flex items-center gap-1 pt-3 border-t border-slate-100">
            <IconBtn icon="Copy" title="Duplicar" onClick={() => { st.addCard({ ...card, id: undefined as any, key: undefined as any, title: card.title + ' (cópia)' }); st.toast('Item duplicado'); }} />
            <IconBtn icon="Archive" title="Arquivar" onClick={() => { st.updateCard(card.id, { archived: !card.archived }); st.toast(card.archived ? 'Item restaurado' : 'Item arquivado'); onClose(); }} />
            <IconBtn icon="Trash2" title="Excluir" className="hover:text-red-600" onClick={() => { st.removeCard(card.id); st.toast('Item excluído'); onClose(); }} />
            <div className="flex-1" /><span className="text-xs text-slate-400">Criado {timeAgo(card.createdAt)} · {owner?.name}</span>
          </div>
        </div>
        <div className="col-span-2 flex flex-col border-l border-slate-100 pl-6 min-h-[420px]">
          <Segmented size="sm" value={tab} onChange={setTab} options={[{ id: 'notas', label: 'Anotações' }, { id: 'historico', label: 'Histórico' }]} />
          <div className="flex-1 overflow-y-auto scroll-thin mt-3 space-y-2 max-h-72">
            {tab === 'notas' ? <>
              <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Adicionar anotação…" />
              <div className="flex justify-between"><IconBtn icon="Paperclip" size={16} title="Anexar arquivo" onClick={() => st.toast('Upload de anexos (protótipo)')} /><Btn size="sm" variant="primary" disabled={!note.trim()} onClick={() => { st.updateCard(card.id, { notes: [{ id: `n${Date.now()}`, userId: st.authUserId ?? 'u1', text: note.trim(), at: Date.now() }, ...card.notes] }); setNote(''); }}>Salvar</Btn></div>
              {card.notes.map((n) => <div key={n.id} className="rounded-lg bg-slate-50 p-2.5"><p className="text-sm">{n.text}</p><p className="text-[10px] text-slate-400 mt-1">{st.users.find((u) => u.id === n.userId)?.name} · {timeAgo(n.at)}</p></div>)}
            </> : [...card.history].reverse().map((h, i) => <div key={i} className="flex gap-2 text-xs"><Icon name="Dot" size={16} className="text-slate-400" /><div><p className="text-slate-700">{h.text}</p><p className="text-slate-400">{fmtDateTime(h.at)}</p></div></div>)}
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-4 mb-2">Mover item de fase</p>
          <div className="space-y-1.5">
            {panel.stages.map((s, i) => (
              <button key={s.id} onClick={() => st.moveCard(card.id, s.id)} className={cx('w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition', s.id === card.stageId ? 'ring-2 ring-offset-1' : 'hover:brightness-95')} style={{ background: s.color + '22', color: s.color, ['--tw-ring-color' as any]: s.color }}>
                {s.name}<Icon name={s.id === card.stageId ? 'CircleCheck' : i < idx ? 'ArrowLeft' : 'ArrowRight'} size={15} />
              </button>
            ))}
          </div>
          {stage.name.toLowerCase().includes('realizada') || stage.name === 'Fechado' ? <Badge tone="green" className="mt-3 self-start" icon="PartyPopper">Venda ganha!</Badge> : null}
        </div>
      </div>
    </Modal>
  );
}
