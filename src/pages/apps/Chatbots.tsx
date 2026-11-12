import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Badge, Btn, ChannelGlyph, Icon, IconBtn, Input, Modal, Page, Segmented, Toggle } from '../../components/ui';
import { cx, num, timeAgo } from '../../lib/util';
import type { Chatbot, FlowNode } from '../../types';

const NODE: Record<FlowNode['type'], { icon: string; color: string; label: string }> = {
  start: { icon: 'Play', color: '#10b981', label: 'Gatilho' }, message: { icon: 'MessageSquare', color: '#3b82f6', label: 'Mensagem' }, menu: { icon: 'ListOrdered', color: '#8b5cf6', label: 'Menu de opções' },
  transfer: { icon: 'ArrowLeftRight', color: '#f59e0b', label: 'Transferir' }, ai: { icon: 'Sparkles', color: '#ec4899', label: 'Inteligência artificial' }, condition: { icon: 'GitBranch', color: '#0ea5e9', label: 'Condição' },
  end: { icon: 'CircleStop', color: '#64748b', label: 'Fim' }, wait: { icon: 'Timer', color: '#94a3b8', label: 'Aguardar' },
};

export default function Chatbots() {
  const st = useStore();
  const [kind, setKind] = useState<'service' | 'automation'>('service');
  const [arch, setArch] = useState<'op' | 'arq'>('op');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<Chatbot | null>(null);
  const list = st.chatbots.filter((b) => b.kind === kind && b.archived === (arch === 'arq') && b.name.toLowerCase().includes(q.toLowerCase()));
  const chLabel = (t: string) => (t === 'instagram' ? 'Instagram / Messenger' : t === 'whatsapp_qr' ? 'WhatsApp (não oficial)' : 'WhatsApp');
  return (
    <div className="h-full flex">
      <aside className="w-72 shrink-0 border-r border-slate-200 bg-white p-4 space-y-2">
        <h1 className="text-xl font-bold px-2 mb-3">Chatbots</h1>
        {([['service', 'Chatbots para atendimento', 'Acionados quando um cliente entra em contato por um dos canais', 'MessagesSquare'], ['automation', 'Chatbots para automação', 'Enviados durante uma conversa, por sequências, campanhas ou via API', 'Workflow']] as const).map(([k, t, d, i]) => (
          <button key={k} onClick={() => setKind(k)} className={cx('w-full text-left rounded-xl p-3 flex gap-3', kind === k ? 'bg-brand-50' : 'hover:bg-slate-50')}>
            <Icon name={i} size={20} className={kind === k ? 'text-brand-600' : 'text-slate-400'} /><span><span className={cx('block text-sm font-semibold', kind === k && 'text-brand-700')}>{t}</span><span className="block text-xs text-slate-500 mt-0.5">{d}</span></span>
          </button>
        ))}
      </aside>
      <div className="flex-1 overflow-y-auto scroll-thin p-6">
        <h2 className="text-xl font-bold">{kind === 'service' ? 'Chatbots para atendimento' : 'Chatbots para automação'}</h2>
        <p className="text-sm text-slate-500 mb-5">{kind === 'service' ? 'Configure os chatbots acionados quando um cliente entra em contato por um dos seus canais.' : 'Fluxos disparados por eventos: conclusão, carrinho abandonado, datas e integrações.'}</p>
        {kind === 'service' && (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 mb-6">
            {st.channels.map((c) => { const b = st.chatbots.find((x) => x.id === c.chatbotId); return (
              <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-3 shadow-card">
                <div className="flex items-center gap-2"><ChannelGlyph type={c.type} size={20} /><span className="text-sm font-medium flex-1">{c.name}</span><button className="text-xs text-brand-700 font-medium" onClick={() => st.toast('Seleção de chatbot do canal (protótipo)')}>Editar</button></div>
                <p className="text-sm font-semibold mt-1.5">{c.identifier}</p>
                <span className={cx('inline-block mt-2 text-[11px] font-semibold rounded px-2 py-0.5', b ? 'bg-sky-50 text-sky-700' : 'bg-slate-100 text-slate-500')}>{b ? b.name : 'Sem chatbot — vai direto para a equipe'}</span>
              </div>
            ); })}
          </div>
        )}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card">
          <div className="flex items-center gap-3 p-4 border-b border-slate-100"><span className="font-semibold">Chatbots</span><Segmented size="sm" value={arch} onChange={setArch} options={[{ id: 'op', label: 'Operacionais' }, { id: 'arq', label: 'Arquivados' }]} /><div className="flex-1" /><Input icon="Search" placeholder="Pesquisar chatbot" className="w-60" value={q} onChange={(e) => setQ(e.target.value)} /><Btn variant="primary" icon="Plus" onClick={() => st.toast('Editor visual de fluxos: próximo passo do projeto')}>Novo</Btn></div>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-slate-500 bg-slate-50"><th className="px-4 py-2.5 w-12" /><th className="px-4 py-2.5">Nome</th><th className="px-4 py-2.5">Tipo do canal</th><th className="px-4 py-2.5">Equipe padrão</th><th className="px-4 py-2.5 text-right">Execuções</th><th className="px-4 py-2.5">Atualizado</th><th className="px-4 py-2.5">Status</th><th /></tr></thead>
            <tbody>{list.map((b) => (
              <tr key={b.id} onClick={() => setOpen(b)} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer">
                <td className="px-4 py-3"><span className="h-8 w-8 rounded-lg bg-sky-50 text-sky-600 grid place-items-center"><Icon name="Workflow" size={16} /></span></td>
                <td className="px-4 py-3 font-medium">{b.name}</td>
                <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5 text-xs"><ChannelGlyph type={b.channelType} size={16} />{chLabel(b.channelType)}</span></td>
                <td className="px-4 py-3">{st.teams.find((t) => t.id === b.teamId)?.name}</td>
                <td className="px-4 py-3 text-right tabular-nums">{num(b.runs)}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{timeAgo(b.updatedAt)}</td>
                <td className="px-4 py-3">{b.status === 'active' ? <Badge tone="blue">Em uso</Badge> : <Badge>Pausado</Badge>}</td>
                <td className="px-2"><IconBtn icon="EllipsisVertical" size={16} /></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      <Modal open={!!open} onClose={() => setOpen(null)} size="lg" title={open?.name} subtitle={open && `${chLabel(open.channelType)} · ${num(open.runs)} execuções`} icon="Workflow"
        footer={open && <><Toggle checked={open.status === 'active'} onChange={(v) => { const nb = { ...open, status: v ? 'active' : 'paused' } as Chatbot; st.upsert('chatbots', nb); setOpen(nb); }} label="Ativo" /><div className="flex-1" /><Btn icon="Archive" onClick={() => { st.upsert('chatbots', { ...open, archived: !open.archived }); setOpen(null); }}>{open.archived ? 'Desarquivar' : 'Arquivar'}</Btn><Btn variant="primary" icon="Pencil" onClick={() => st.toast('Editor visual de fluxos: próximo passo do projeto')}>Editar fluxo</Btn></>}>
        {open && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-6 flex flex-col items-center">
            {open.flow.map((n, i) => (
              <div key={n.id} className="flex flex-col items-center w-full">
                <div className="w-full max-w-md bg-white rounded-xl border-2 shadow-sm p-3" style={{ borderColor: NODE[n.type].color + '55' }}>
                  <div className="flex items-center gap-2"><span className="h-7 w-7 rounded-lg grid place-items-center text-white" style={{ background: NODE[n.type].color }}><Icon name={NODE[n.type].icon} size={14} /></span><div><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{NODE[n.type].label}</p><p className="text-sm font-semibold">{n.title}</p></div></div>
                  {n.text && <p className="text-xs text-slate-600 mt-2 whitespace-pre-wrap bg-slate-50 rounded-lg p-2">{n.text}</p>}
                  {n.options && <div className="grid grid-cols-2 gap-1.5 mt-2">{n.options.map((o) => <div key={o.key} className="text-xs rounded-lg border border-violet-200 bg-violet-50 px-2 py-1.5"><b>{o.key}</b> · {o.label}<span className="block text-[10px] text-violet-600">→ {o.target}</span></div>)}</div>}
                </div>
                {i < open.flow.length - 1 && <div className="h-6 w-0.5 bg-slate-300" />}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
