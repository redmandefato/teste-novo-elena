import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Funnel, FunnelChart, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { useStore } from '../../store/useStore';
import { Avatar, Card, Page, Select, Stat } from '../../components/ui';
import { CHART, axis, tooltipStyle } from '../../components/charts';
import { brl, pct, sum, mulberry32 } from '../../lib/util';

export default function CrmDashboard() {
  const st = useStore();
  const [panelId, setPanelId] = useState('p1');
  const panel = st.panels.find((p) => p.id === panelId)!;
  const cards = st.cards.filter((c) => c.panelId === panelId && !c.archived);
  const won = panel.stages[panel.stages.length - 2];
  const lost = panel.stages[panel.stages.length - 1];
  const wonCards = cards.filter((c) => c.stageId === won.id);
  const lostCards = cards.filter((c) => c.stageId === lost.id);
  const openCards = cards.filter((c) => c.stageId !== won.id && c.stageId !== lost.id);
  const conv = (wonCards.length / Math.max(1, wonCards.length + lostCards.length)) * 100;
  const funnel = panel.stages.slice(0, -1).map((s, i) => ({ name: s.name, value: cards.filter((c) => panel.stages.findIndex((x) => x.id === c.stageId) >= i && c.stageId !== lost.id).length, fill: CHART.series[i] }));
  const byOwner = st.users.map((u) => ({ name: u.name.split(' ')[0], ganho: sum(wonCards.filter((c) => c.ownerId === u.id), (c) => c.value), aberto: sum(openCards.filter((c) => c.ownerId === u.id), (c) => c.value) })).filter((x) => x.ganho + x.aberto > 0).sort((a, b) => b.ganho - a.ganho);
  const trend = useMemo(() => { const r = mulberry32(panelId.length * 97); return Array.from({ length: 12 }, (_, i) => ({ semana: `S${i + 1}`, ganhas: Math.round(4 + r() * 10 + i * 0.6), perdidas: Math.round(1 + r() * 5) })); }, [panelId]);
  return (
    <Page title="Dashboard do CRM" subtitle="Desempenho dos funis de venda" actions={<Select value={panelId} onChange={(e) => setPanelId(e.target.value)}>{st.panels.filter((p) => p.kind !== 'Tarefas' && !p.deleted).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <Stat label="Em negociação" value={brl(sum(openCards, (c) => c.value))} hint={`${openCards.length} oportunidades`} icon="Handshake" tone="blue" />
        <Stat label="Vendas ganhas" value={brl(sum(wonCards, (c) => c.value))} hint={`${wonCards.length} negócios`} icon="Trophy" tone="brand" trend={8.2} />
        <Stat label="Taxa de conversão" value={pct(conv)} hint="ganhas ÷ encerradas" icon="Percent" tone="violet" />
        <Stat label="Ticket médio" value={brl(sum(wonCards, (c) => c.value) / Math.max(1, wonCards.length))} icon="Receipt" tone="amber" />
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <Card title="Funil" subtitle="Quantidade de itens que chegaram a cada etapa">
          <ResponsiveContainer width="100%" height={280}>
            <FunnelChart><Tooltip {...tooltipStyle} /><Funnel dataKey="value" data={funnel} isAnimationActive><LabelList position="right" fill="#334155" stroke="none" dataKey="name" fontSize={12} /><LabelList position="center" fill="#fff" stroke="none" dataKey="value" fontSize={13} fontWeight={700} /></Funnel></FunnelChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Valor por vendedor" subtitle="Ganho × em aberto">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byOwner} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid horizontal={false} stroke={CHART.grid} />
              <XAxis type="number" {...axis} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" {...axis} width={70} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => brl(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="ganho" name="Ganho" stackId="a" fill={CHART.brand} radius={[0, 0, 0, 0]} />
              <Bar dataKey="aberto" name="Em aberto" stackId="a" fill={CHART.brandLight} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Ganhas × perdidas por semana" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trend}><CartesianGrid vertical={false} stroke={CHART.grid} /><XAxis dataKey="semana" {...axis} /><YAxis {...axis} /><Tooltip {...tooltipStyle} /><Legend wrapperStyle={{ fontSize: 12 }} />
              <Line dataKey="ganhas" name="Ganhas" stroke={CHART.brand} strokeWidth={2.5} dot={false} /><Line dataKey="perdidas" name="Perdidas" stroke={CHART.red} strokeWidth={2} dot={false} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Próximos vencimentos" className="lg:col-span-2" bodyClass="!px-0">
          {openCards.filter((c) => c.dueAt).sort((a, b) => a.dueAt! - b.dueAt!).slice(0, 6).map((c) => {
            const u = st.users.find((x) => x.id === c.ownerId);
            const late = c.dueAt! < Date.now();
            return <div key={c.id} className="flex items-center gap-3 px-5 py-2.5 border-t border-slate-100 text-sm"><Avatar name={u?.name ?? '?'} size={28} /><span className="flex-1 truncate">{c.title}</span><span className="text-slate-500">{brl(c.value)}</span><span className={late ? 'text-red-600 font-semibold w-28 text-right' : 'text-slate-500 w-28 text-right'}>{late ? 'Atrasado' : new Date(c.dueAt!).toLocaleDateString('pt-BR')}</span></div>;
          })}
        </Card>
      </div>
      <span className="hidden">{Cell.name}</span>
    </Page>
  );
}
