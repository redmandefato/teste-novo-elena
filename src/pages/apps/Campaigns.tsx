import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useStore, useMe } from '../../store/useStore';
import { Badge, Btn, Card, Drawer, Field, Icon, Input, Modal, Page, Progress, Select, Stat } from '../../components/ui';
import { CHART, axis, tooltipStyle } from '../../components/charts';
import { fmtDateTime, num, pct, uid, sum } from '../../lib/util';
import type { Campaign } from '../../types';

const TONE: Record<Campaign['status'], string> = { Rascunho: 'slate', Agendada: 'violet', Enviando: 'blue', Concluída: 'green', Pausada: 'amber' };

export default function Campaigns() {
  const st = useStore();
  const me = useMe();
  const [open, setOpen] = useState<Campaign | null>(null);
  const [creating, setCreating] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', channelId: 'c1', templateId: 'tp4', segment: 'Clientes ativos (últimos 180 dias)', when: 'now' });
  const all = st.campaigns;
  const sent = sum(all, (c) => c.sent), read = sum(all, (c) => c.read), replied = sum(all, (c) => c.replied);
  const segments: Record<string, number> = { 'Clientes ativos (últimos 180 dias)': 4820, 'Etiqueta: Recompra': 1250, 'Etiqueta: Atacado': 86, 'Sem compra há 90+ dias': 2300, 'Aniversário em novembro': 312, 'Todos os contatos': 5100 };

  return (
    <Page title="Campanhas" subtitle="Disparos em massa com modelos aprovados pela Meta, com acompanhamento de entrega, leitura e respostas" actions={<Btn variant="primary" icon="Plus" onClick={() => { setCreating(true); setStep(1); }}>Nova campanha</Btn>}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <Stat label="Mensagens enviadas" value={num(sent)} icon="Send" tone="brand" />
        <Stat label="Taxa de leitura" value={pct((read / sent) * 100)} icon="Eye" tone="blue" />
        <Stat label="Taxa de resposta" value={pct((replied / sent) * 100)} icon="Reply" tone="violet" />
        <Stat label="Campanhas ativas" value={all.filter((c) => c.status === 'Enviando' || c.status === 'Agendada').length} icon="Megaphone" tone="amber" />
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {all.map((c) => {
          const tpl = st.templates.find((t) => t.id === c.templateId);
          const ch = st.channels.find((x) => x.id === c.channelId);
          return (
            <button key={c.id} onClick={() => setOpen(c)} className="text-left bg-white rounded-xl border border-slate-200 shadow-card p-4 hover:shadow-md transition">
              <div className="flex items-start gap-2"><p className="font-semibold flex-1">{c.name}</p><Badge tone={TONE[c.status]}>{c.status}</Badge></div>
              <p className="text-xs text-slate-500 mt-1">{ch?.name} · modelo <b>{tpl?.name}</b></p>
              <p className="text-xs text-slate-500">{c.segment} · {num(c.audience)} contatos</p>
              <div className="mt-4 space-y-2">
                {[['Enviadas', c.sent, c.audience, CHART.slate], ['Entregues', c.delivered, c.audience, CHART.blue], ['Lidas', c.read, c.audience, CHART.brand], ['Respostas', c.replied, c.audience, CHART.violet]].map(([l, v, t, col]: any) => (
                  <div key={l}><div className="flex justify-between text-[11px] text-slate-500 mb-0.5"><span>{l}</span><span>{num(v)} · {pct(t ? (v / t) * 100 : 0, 0)}</span></div><Progress value={t ? (v / t) * 100 : 0} color={col} /></div>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1"><Icon name="Calendar" size={12} />{c.status === 'Agendada' || c.status === 'Rascunho' ? 'Agendada para ' : 'Iniciada em '}{fmtDateTime(c.scheduledAt)}</p>
            </button>
          );
        })}
      </div>

      <Drawer open={!!open} onClose={() => setOpen(null)} title={open?.name} width={520} footer={open && <>
        {open.status === 'Enviando' && <Btn icon="Pause" onClick={() => { st.upsert('campaigns', { ...open, status: 'Pausada' }); setOpen({ ...open, status: 'Pausada' }); }}>Pausar</Btn>}
        {open.status === 'Pausada' && <Btn icon="Play" onClick={() => { st.upsert('campaigns', { ...open, status: 'Enviando' }); setOpen({ ...open, status: 'Enviando' }); }}>Retomar</Btn>}
        <Btn icon="Copy" onClick={() => { st.upsert('campaigns', { ...open, id: uid('cp'), name: open.name + ' (cópia)', status: 'Rascunho', sent: 0, delivered: 0, read: 0, replied: 0, failed: 0 }); st.toast('Campanha duplicada'); setOpen(null); }}>Duplicar</Btn>
      </>}>
        {open && <>
          <div className="flex gap-2 mb-4"><Badge tone={TONE[open.status]}>{open.status}</Badge><Badge>{open.segment}</Badge></div>
          <Card title="Funil da campanha" className="mb-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[{ n: 'Público', v: open.audience }, { n: 'Enviadas', v: open.sent }, { n: 'Entregues', v: open.delivered }, { n: 'Lidas', v: open.read }, { n: 'Respostas', v: open.replied }]}><CartesianGrid vertical={false} stroke={CHART.grid} /><XAxis dataKey="n" {...axis} /><YAxis {...axis} /><Tooltip {...tooltipStyle} />
                <Bar dataKey="v" name="Contatos" radius={[4, 4, 0, 0]}>{[0, 1, 2, 3, 4].map((i) => <Cell key={i} fill={CHART.series[i]} />)}</Bar></BarChart>
            </ResponsiveContainer>
          </Card>
          <p className="text-xs font-semibold text-slate-500 mb-2">Mensagem enviada</p>
          <div className="rounded-xl chat-bg p-4"><div className="bg-white rounded-xl rounded-tl-md p-3 text-sm shadow-sm max-w-xs">{st.templates.find((t) => t.id === open.templateId)?.header && <p className="font-bold">{st.templates.find((t) => t.id === open.templateId)?.header}</p>}<p>{st.templates.find((t) => t.id === open.templateId)?.body}</p></div></div>
          <p className="text-xs text-slate-500 mt-4">Falhas de envio: <b>{num(open.failed)}</b> (números inválidos ou sem WhatsApp)</p>
        </>}
      </Drawer>

      <Modal open={creating} onClose={() => setCreating(false)} size="lg" title="Nova campanha" subtitle={`Passo ${step} de 3`} icon="Megaphone" footer={<>
        {step > 1 && <Btn onClick={() => setStep(step - 1)}>Voltar</Btn>}
        {step < 3 ? <Btn variant="primary" disabled={step === 1 && !form.name} onClick={() => setStep(step + 1)}>Continuar</Btn> : <Btn variant="primary" icon="Send" onClick={() => {
          const aud = segments[form.segment];
          st.upsert('campaigns', { id: uid('cp'), name: form.name, channelId: form.channelId, templateId: form.templateId, segment: form.segment, audience: aud, status: form.when === 'now' ? 'Enviando' : 'Agendada', sent: form.when === 'now' ? Math.round(aud * 0.05) : 0, delivered: 0, read: 0, replied: 0, failed: 0, scheduledAt: Date.now() + (form.when === 'now' ? 0 : 86400e3), createdBy: me.id });
          st.toast('Campanha criada', { tone: 'success' }); setCreating(false);
        }}>{form.when === 'now' ? 'Enviar agora' : 'Agendar'}</Btn>}
      </>}>
        <div className="flex gap-2 mb-5">{['Configuração', 'Público', 'Revisão'].map((s, i) => <div key={s} className={`flex-1 h-1.5 rounded-full ${i < step ? 'bg-brand-600' : 'bg-slate-200'}`} />)}</div>
        {step === 1 && <div className="space-y-3">
          <Field label="Nome da campanha"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Promoção de Natal" /></Field>
          <Field label="Canal de envio"><Select className="w-full" value={form.channelId} onChange={(e) => setForm({ ...form, channelId: e.target.value })}>{st.channels.filter((c) => c.type.startsWith('whatsapp')).map((c) => <option key={c.id} value={c.id}>{c.name} · {c.identifier}</option>)}</Select></Field>
          <Field label="Modelo de mensagem (aprovado)"><Select className="w-full" value={form.templateId} onChange={(e) => setForm({ ...form, templateId: e.target.value })}>{st.templates.filter((t) => t.status === 'Aprovado').map((t) => <option key={t.id} value={t.id}>{t.name} ({t.category})</option>)}</Select></Field>
        </div>}
        {step === 2 && <div className="space-y-2">{Object.entries(segments).map(([s, n]) => <button key={s} onClick={() => setForm({ ...form, segment: s })} className={`w-full flex items-center rounded-lg border px-4 py-3 text-left ${form.segment === s ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:bg-slate-50'}`}><span className="flex-1 text-sm font-medium">{s}</span><span className="text-sm text-slate-500">{num(n)} contatos</span></button>)}</div>}
        {step === 3 && <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-sm"><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Público</p><p className="font-bold">{num(segments[form.segment])}</p></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Custo estimado (Meta)</p><p className="font-bold">R$ {num(segments[form.segment] * 0.35, 2)}</p></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Velocidade</p><p className="font-bold">~80 msg/min</p></div></div>
          <Field label="Quando enviar"><Select className="w-full" value={form.when} onChange={(e) => setForm({ ...form, when: e.target.value })}><option value="now">Agora</option><option value="later">Amanhã às 10h</option></Select></Field>
          <p className="text-xs text-slate-500 flex gap-1.5"><Icon name="Info" size={14} />As respostas dos clientes chegam na fila da equipe padrão do canal e podem acionar o chatbot da campanha.</p>
        </div>}
      </Modal>
    </Page>
  );
}
