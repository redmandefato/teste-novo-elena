import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area } from 'recharts';
import { useStore } from '../../store/useStore';
import { Avatar, Card, Icon, Page, Segmented, Select, Badge } from '../../components/ui';
import { DataTable } from '../../components/DataTable';
import { CHART, axis, tooltipStyle } from '../../components/charts';
import { cx, fmtDuration, fmtShortDate, num, sum, hashNoise, fmtDate } from '../../lib/util';

const WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function Indicators() {
  const st = useStore();
  const [tab, setTab] = useState<'geral' | 'usuario' | 'resultados'>('geral');
  const [days, setDays] = useState(8);
  const [team, setTeam] = useState('');
  const share = team ? 0.08 + hashNoise(team) * 0.25 : 1;
  const data = useMemo(() => st.metrics.daily.slice(-days).map((d) => ({ ...d, label: fmtShortDate(d.date), novos: Math.round(d.novos * share), concluidos: Math.round(d.concluidos * share), pendentes: Math.round(d.pendentes * share), iniciados: Math.round(d.iniciados * share) })), [st.metrics.daily, days, share]);
  const before = Math.round(st.metrics.daily[st.metrics.daily.length - days - 1].pendentes * share);
  const novos = sum(data, (d) => d.novos), concl = sum(data, (d) => d.concluidos);
  const after = data[data.length - 1].pendentes;
  const espera = sum(data, (d) => d.esperaMin) / data.length;
  const dur = sum(data, (d) => d.duracaoH) / data.length;
  const csat = sum(data, (d) => d.csat) / data.length;
  const maxHeat = Math.max(...st.metrics.heatmap.flat());

  const agents = st.users.filter((u) => u.role !== 'admin' || true).map((u) => {
    const n = hashNoise(u.id + days);
    const at = Math.round((u.role === 'supervisor' ? 120 : 260) * (0.6 + n * 0.8) * (days / 8) * share);
    return { id: u.id, name: u.name, status: u.status, atendimentos: at, concluidos: Math.round(at * (0.85 + n * 0.12)), tmr: 60 + n * 600, tma: 1800 + n * 9000, csat: 4 + n * 0.95, mensagens: Math.round(at * (9 + n * 8)), online: `${Math.round(5 + n * 4)}h ${Math.round(n * 59)}min` };
  }).sort((a, b) => b.atendimentos - a.atendimentos);

  const KPI = ({ value, label, sub, color, icon }: any) => (
    <div className="rounded-xl p-4 text-white flex items-center gap-4 shadow-card" style={{ background: color }}>
      <span className="h-11 w-11 rounded-lg bg-white/20 grid place-items-center"><Icon name={icon} size={22} /></span>
      <div><p className="text-3xl font-extrabold leading-none">{num(value)}</p><p className="text-sm font-semibold mt-1">{label}</p><p className="text-xs opacity-80">{sub}</p></div>
    </div>
  );
  const Side = ({ items }: { items: { label: string; value: string; hint?: string; color?: string }[] }) => (
    <div className="space-y-3">{items.map((i) => <div key={i.label} className="rounded-xl border border-slate-200 p-3"><p className="text-xs text-slate-500 flex items-center gap-1">{i.label}<Icon name="Info" size={11} /></p><p className="text-2xl font-extrabold text-slate-900">{i.value}</p>{i.hint && <p className="text-xs" style={{ color: i.color ?? '#64748b' }}>{i.hint}</p>}</div>)}</div>
  );

  return (
    <Page wide title="Indicadores" subtitle={`${fmtDate(data[0].date)} – ${fmtDate(data[data.length - 1].date)} · ${team ? st.teams.find((t) => t.id === team)?.name : 'todas as equipes'}`} actions={<>
      <Segmented value={tab} onChange={setTab} options={[{ id: 'geral', label: 'Geral' }, { id: 'usuario', label: 'Usuário' }, { id: 'resultados', label: 'Resultados' }]} />
      <Select value={team} onChange={(e) => setTeam(e.target.value)}><option value="">Equipes: Todas</option>{st.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select>
      <Select value={days} onChange={(e) => setDays(Number(e.target.value))}><option value={8}>Últimos 8 dias</option><option value={15}>Últimos 15 dias</option><option value={30}>Últimos 30 dias</option><option value={60}>Últimos 60 dias</option></Select>
    </>}>
      {tab === 'geral' && <>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
          <KPI value={before} label="Pendentes" sub="antes do período" color="#475569" icon="LogIn" />
          <KPI value={novos} label="Novos" sub="no período" color="#16a34a" icon="Plus" />
          <KPI value={concl} label="Concluídos" sub="no período" color="#2563eb" icon="Check" />
          <KPI value={after} label="Pendentes" sub="após o período" color="#ea580c" icon="Equal" />
        </div>
        <div className="grid xl:grid-cols-[1fr_220px] gap-4 mb-5">
          <Card title="Capacidade de atendimento" subtitle="Número de atendimentos novos × concluídos">
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={data}><CartesianGrid vertical={false} stroke={CHART.grid} /><XAxis dataKey="label" {...axis} /><YAxis yAxisId="l" {...axis} /><YAxis yAxisId="r" orientation="right" {...axis} /><Tooltip {...tooltipStyle} /><Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="l" dataKey="novos" name="Novos" fill="#93c5fd" radius={[4, 4, 0, 0]} /><Bar yAxisId="l" dataKey="concluidos" name="Concluídos" fill={CHART.amber} radius={[4, 4, 0, 0]} />
                <Line yAxisId="r" dataKey="pendentes" name="Pendentes" stroke="#38bdf8" strokeWidth={3} dot={false} type="monotone" />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
          <Side items={[{ label: 'Novos', value: num(novos), hint: `média ${num(novos / days, 1)}/dia`, color: CHART.blue }, { label: 'Concluídos', value: num(concl), hint: `média ${num(concl / days, 1)}/dia`, color: CHART.orange }, { label: 'Desempenho', value: num(concl / Math.max(1, novos), 2), hint: concl >= novos ? 'fila diminuindo ✅' : 'fila crescendo ⚠️', color: concl >= novos ? CHART.brand : CHART.red }]} />
        </div>
        <div className="grid xl:grid-cols-[1fr_220px] gap-4 mb-5">
          <Card title="Tempo de espera" subtitle={<>Foram considerados <b>{num(sum(data, (d) => d.iniciados))}</b> atendimentos <b>iniciados pelos clientes</b> que tiveram a participação de um usuário.</>}>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={data}><CartesianGrid vertical={false} stroke={CHART.grid} /><XAxis dataKey="label" {...axis} /><YAxis yAxisId="l" {...axis} /><YAxis yAxisId="r" orientation="right" {...axis} unit=" min" /><Tooltip {...tooltipStyle} /><Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="l" dataKey="iniciados" name="Atendimentos iniciados" fill="#fdba74" radius={[4, 4, 0, 0]} /><Line yAxisId="r" dataKey="esperaMin" name="Tempo de espera (min)" stroke={CHART.red} strokeWidth={2.5} type="monotone" dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
          <Side items={[{ label: 'Tendência de espera', value: fmtDuration(espera * 60), hint: `SLA da conta: ${st.company.slaFirstResponseMin} min`, color: espera > st.company.slaFirstResponseMin ? CHART.red : CHART.brand }]} />
        </div>
        <div className="grid xl:grid-cols-[1fr_220px] gap-4 mb-5">
          <Card title="Duração do atendimento" subtitle="Atendimentos iniciados pelos clientes, com participação de um usuário e concluídos">
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={data}><CartesianGrid vertical={false} stroke={CHART.grid} /><XAxis dataKey="label" {...axis} /><YAxis {...axis} unit="h" /><Tooltip {...tooltipStyle} /><Area dataKey="duracaoH" name="Duração média (h)" stroke={CHART.violet} fill="#ddd6fe" strokeWidth={2} type="monotone" /></ComposedChart>
            </ResponsiveContainer>
          </Card>
          <Side items={[{ label: 'Tendência geral de duração', value: fmtDuration(dur * 3600) }, { label: 'Satisfação (CSAT)', value: `${num(csat, 1)} ★`, hint: 'média das avaliações', color: CHART.amber }]} />
        </div>
        <div className="grid lg:grid-cols-2 gap-4 mb-5">
          <Card title="Atendimentos por canal" subtitle="Total iniciado por canal no período">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={st.metrics.byChannel.map((c) => ({ ...c, value: Math.round(c.value * share * (days / 8)) }))} layout="vertical" margin={{ left: 20 }}><CartesianGrid horizontal={false} stroke={CHART.grid} /><XAxis type="number" {...axis} /><YAxis type="category" dataKey="name" {...axis} width={130} /><Tooltip {...tooltipStyle} />
                <Bar dataKey="value" name="Atendimentos" radius={[0, 4, 4, 0]}>{st.metrics.byChannel.map((_, i) => <Cell key={i} fill={CHART.series[i]} />)}</Bar></BarChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Etiquetas mais usadas" subtitle="Exibindo as etiquetas aplicadas no período">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={st.metrics.tagsUsage}><CartesianGrid vertical={false} stroke={CHART.grid} /><XAxis dataKey="name" {...axis} interval={0} angle={-25} textAnchor="end" height={60} /><YAxis {...axis} /><Tooltip {...tooltipStyle} />
                <Bar dataKey="value" name="Usos" radius={[4, 4, 0, 0]}>{st.metrics.tagsUsage.map((t, i) => <Cell key={i} fill={t.color} />)}</Bar></BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
        <Card title="Volume diário de atendimentos" subtitle="Mapa de calor por dia da semana e hora — use para dimensionar a escala da equipe">
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full border-separate" style={{ borderSpacing: 3 }}>
              <thead><tr><th />{Array.from({ length: 24 }, (_, h) => <th key={h} className="text-[10px] font-medium text-slate-400">{h}h</th>)}</tr></thead>
              <tbody>{st.metrics.heatmap.map((row, wd) => <tr key={wd}><td className="text-xs text-slate-500 pr-2">{WEEK[wd]}</td>{row.map((v, h) => <td key={h} title={`${WEEK[wd]} ${h}h: ${v} atendimentos`} className="heat-cell min-w-[22px]" style={{ background: `rgba(5,150,107,${0.06 + (v / maxHeat) * 0.94})` }} />)}</tr>)}</tbody>
            </table>
          </div>
        </Card>
      </>}

      {tab === 'usuario' && <>
        <Card title="Atendimentos por usuário" className="mb-5">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={agents.map((a) => ({ ...a, nome: a.name.split(' ')[0] }))}><CartesianGrid vertical={false} stroke={CHART.grid} /><XAxis dataKey="nome" {...axis} /><YAxis {...axis} /><Tooltip {...tooltipStyle} /><Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="atendimentos" name="Atendimentos" fill={CHART.blue} radius={[4, 4, 0, 0]} /><Bar dataKey="concluidos" name="Concluídos" fill={CHART.brand} radius={[4, 4, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </Card>
        <DataTable rows={agents} pageSize={15} initialSort={{ key: 'atendimentos', dir: 'desc' }} columns={[
          { key: 'name', label: 'Usuário', render: (a) => <span className="flex items-center gap-2"><Avatar name={a.name} size={28} status={a.status} />{a.name}</span> },
          { key: 'atendimentos', label: 'Atendimentos', align: 'right', render: (a) => num(a.atendimentos) },
          { key: 'concluidos', label: 'Concluídos', align: 'right', render: (a) => num(a.concluidos) },
          { key: 'tmr', label: 'Tempo médio 1ª resposta', align: 'right', render: (a) => <span className={cx(a.tmr > 600 ? 'text-red-600 font-semibold' : '')}>{fmtDuration(a.tmr)}</span> },
          { key: 'tma', label: 'Tempo médio de atendimento', align: 'right', render: (a) => fmtDuration(a.tma) },
          { key: 'mensagens', label: 'Mensagens enviadas', align: 'right', render: (a) => num(a.mensagens) },
          { key: 'csat', label: 'CSAT', align: 'right', render: (a) => <Badge tone={a.csat >= 4.5 ? 'green' : a.csat >= 4.2 ? 'amber' : 'red'}>{num(a.csat, 1)} ★</Badge> },
          { key: 'online', label: 'Tempo online/dia', align: 'right' },
        ]} />
      </>}

      {tab === 'resultados' && (
        <div className="grid lg:grid-cols-2 gap-5">
          <Card title="Classificação dos atendimentos concluídos">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart><Pie data={st.metrics.classifications} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={2}>{st.metrics.classifications.map((_, i) => <Cell key={i} fill={CHART.series[i]} />)}</Pie><Tooltip {...tooltipStyle} formatter={(v: number) => `${v}%`} /><Legend wrapperStyle={{ fontSize: 12 }} layout="vertical" align="right" verticalAlign="middle" /></PieChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Distribuição das avaliações (CSAT)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[5, 4, 3, 2, 1].map((s, i) => ({ nota: `${s} ★`, total: [612, 233, 61, 18, 9][i] }))} layout="vertical"><CartesianGrid horizontal={false} stroke={CHART.grid} /><XAxis type="number" {...axis} /><YAxis type="category" dataKey="nota" {...axis} width={40} /><Tooltip {...tooltipStyle} />
                <Bar dataKey="total" name="Avaliações" radius={[0, 4, 4, 0]}>{[0, 1, 2, 3, 4].map((i) => <Cell key={i} fill={[CHART.brand, '#34d399', CHART.amber, CHART.orange, CHART.red][i]} />)}</Bar></BarChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Vendas originadas no atendimento" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={data.map((d) => ({ ...d, vendas: Math.round(d.concluidos * 0.38), receita: Math.round(d.concluidos * 0.38 * (180 + hashNoise(String(d.date)) * 90)) }))}><CartesianGrid vertical={false} stroke={CHART.grid} /><XAxis dataKey="label" {...axis} /><YAxis yAxisId="l" {...axis} /><YAxis yAxisId="r" orientation="right" {...axis} tickFormatter={(v) => `R$${Math.round(v / 1000)}k`} /><Tooltip {...tooltipStyle} /><Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="l" dataKey="vendas" name="Vendas" fill={CHART.brandLight} radius={[4, 4, 0, 0]} /><Line yAxisId="r" dataKey="receita" name="Receita (R$)" stroke={CHART.brand} strokeWidth={2.5} dot={false} /></ComposedChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}
    </Page>
  );
}
