import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Badge, Btn, Field, Icon, IconBtn, Input, Modal, Page, Select, Toggle } from '../../components/ui';
import { brl, cx, sum, uid } from '../../lib/util';
import type { Panel } from '../../types';

export default function Panels() {
  const st = useStore();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', kind: 'Vendas' as Panel['kind'], scope: 'Toda a empresa' });
  const list = st.panels.filter((p) => p.deleted === showDeleted && p.name.toLowerCase().includes(q.toLowerCase()));
  const main = list.filter((p) => p.kind !== 'Tarefas');
  const tasks = list.filter((p) => p.kind === 'Tarefas');

  const PanelCard = ({ p }: { p: Panel }) => {
    const cards = st.cards.filter((c) => c.panelId === p.id && !c.archived);
    const total = sum(cards, (c) => c.value);
    const tone = p.kind === 'Vendas' ? 'blue' : p.kind === 'Gestão' ? 'violet' : 'amber';
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-card flex flex-col overflow-hidden hover:shadow-md transition">
        <div className="p-4 flex-1">
          <div className="flex items-start gap-2"><div className="flex-1 min-w-0"><p className="font-semibold text-slate-900 truncate">{p.name}</p><p className="text-xs text-slate-500 truncate">{p.description}</p></div><Badge tone={tone}>{p.kind}</Badge></div>
          <div className="flex gap-1 mt-4">{p.stages.map((s) => { const n = cards.filter((c) => c.stageId === s.id).length; return <div key={s.id} title={`${s.name}: ${n}`} className="h-1.5 rounded-full flex-1" style={{ background: s.color, opacity: n ? 1 : 0.25 }} />; })}</div>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500"><span className="flex items-center gap-1"><Icon name="Users" size={13} />{p.scope}</span><span>{cards.length} itens</span>{total > 0 && <span className="font-semibold text-slate-700">{brl(total)}</span>}</div>
        </div>
        <div className={cx('flex items-center gap-1 px-3 py-2 border-t', p.kind === 'Tarefas' ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-50 border-slate-100')}>
          <IconBtn icon="Settings" size={15} title="Configurar painel" onClick={() => st.toast('Configuração de etapas e campos personalizados (protótipo)')} />
          <IconBtn icon={p.pinned ? 'PinOff' : 'Pin'} size={15} title={p.pinned ? 'Desafixar' : 'Fixar'} active={p.pinned} onClick={() => st.upsert('panels', { ...p, pinned: !p.pinned })} />
          {p.deleted && <IconBtn icon="ArchiveRestore" size={15} title="Restaurar" onClick={() => st.upsert('panels', { ...p, deleted: false })} />}
          <div className="flex-1" />
          <Btn size="sm" iconRight="ArrowRight" onClick={() => nav(`/crm/paineis/${p.id}`)}>Abrir</Btn>
        </div>
      </div>
    );
  };

  return (
    <Page title="Painéis" subtitle="Controle suas vendas, crie funis, tarefas e atividades utilizando os painéis" actions={<Btn variant="primary" icon="Plus" onClick={() => setCreating(true)}>Novo painel</Btn>}>
      <div className="flex items-center gap-4 mb-5"><Input icon="Search" placeholder="Pesquisar por painel" className="w-72" value={q} onChange={(e) => setQ(e.target.value)} /><Toggle checked={showDeleted} onChange={setShowDeleted} label="Ver painéis excluídos" /></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...main].sort((a, b) => Number(b.pinned) - Number(a.pinned)).map((p) => <PanelCard key={p.id} p={p} />)}</div>
      {tasks.length > 0 && <>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mt-8 mb-3">Tarefas da equipe</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{tasks.map((p) => <PanelCard key={p.id} p={p} />)}</div>
      </>}
      <Modal open={creating} onClose={() => setCreating(false)} title="Novo painel" icon="Kanban" footer={<><Btn onClick={() => setCreating(false)}>Cancelar</Btn><Btn variant="primary" disabled={!form.name} onClick={() => {
        const id = uid('p');
        st.upsert('panels', { id, ...form, prefix: form.name.slice(0, 2).toUpperCase(), pinned: false, deleted: false, stages: ['Novo', 'Em andamento', 'Concluído'].map((n, i) => ({ id: `${id}s${i}`, name: n, color: ['#64748b', '#0ea5e9', '#10b981'][i] })) });
        setCreating(false); nav(`/crm/paineis/${id}`);
      }}>Criar painel</Btn></>}>
        <div className="space-y-3">
          <Field label="Nome"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Funil de vendas atacado" /></Field>
          <Field label="Descrição"><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo"><Select className="w-full" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as any })}><option>Vendas</option><option>Gestão</option><option>Tarefas</option></Select></Field>
            <Field label="Visível para"><Select className="w-full" value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })}><option>Toda a empresa</option>{st.teams.map((t) => <option key={t.id}>{t.name}</option>)}</Select></Field>
          </div>
        </div>
      </Modal>
    </Page>
  );
}
