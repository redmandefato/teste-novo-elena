// Relatório de faturamento do parceiro (white label) — equivalente ao "Faturamento Parceiros"
// do sistema de referência, com melhorias: KPIs, evolução mensal, detalhamento por conta e exportação.
import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useStore } from '../../store/useStore';
import { Badge, Btn, Card, Drawer, Icon, Page, Select, Stat } from '../../components/ui';
import { DataTable } from '../../components/DataTable';
import { CHART, axis, tooltipStyle } from '../../components/charts';
import { computeConsolidated, type AccountBill } from '../../lib/pricing';
import { brl, downloadCSV, fmtDate, fmtDateTime, monthKey, monthLabel, monthRange, num, pct, round2, sum } from '../../lib/util';

export default function Billing() {
  const st = useStore();
  const { partner, accounts, qrInstances, pricing, infraCost } = st.admin;
  const months = monthRange(partner.startBillingAt.slice(0, 7), monthKey(Date.now())).reverse();
  const [period, setPeriod] = useState(months[1] ?? months[0]);
  const [detail, setDetail] = useState<AccountBill | null>(null);
  const cons = useMemo(() => computeConsolidated(period, accounts, qrInstances, partner, pricing, infraCost), [period, accounts, qrInstances, partner, pricing, infraCost]);
  const history = useMemo(() => [...months].reverse().map((m) => { const c = computeConsolidated(m, accounts, qrInstances, partner, pricing, infraCost); return { m, label: monthLabel(m), contas: c.accountsCharged, zapi: c.qrTotal, infra: c.infra, total: c.total }; }), [accounts, qrInstances, partner, pricing, infraCost]);
  const prevTotal = history[history.findIndex((h) => h.m === period) - 1]?.total;
  const pie = useMemo(() => {
    const sorted = [...cons.rows].sort((a, b) => b.total - a.total);
    const top = sorted.slice(0, 10).map((r) => ({ name: r.name, value: r.total }));
    const rest = sum(sorted.slice(10), (r) => r.total);
    return rest > 0 ? [...top, { name: 'Outros', value: round2(rest) }] : top;
  }, [cons]);
  const partial = period === monthKey(Date.now());

  const exportAll = () => downloadCSV(`faturamento-${period}.csv`, [
    { label: 'Período', key: 'period' }, { label: 'Conta', key: 'name' }, { label: 'Início faturamento', csv: (r: AccountBill) => r.startBillingAt }, { label: 'Fim faturamento', csv: (r: AccountBill) => r.endBillingAt ?? '' },
    { label: 'Qtde usuários', key: 'users' }, ...pricing.userTiers.map((t, i) => ({ label: `Usuários ${t.label}`, csv: (r: AccountBill) => r.usersTiers[i] })),
    { label: 'Qtde canais', key: 'channels' }, ...pricing.channelTiers.map((t, i) => ({ label: `Canais ${t.label}`, csv: (r: AccountBill) => r.channelsTiers[i] })),
    { label: 'Chatbot IA', csv: (r: AccountBill) => r.chatbotAI.toFixed(2).replace('.', ',') }, { label: 'Transcrição', csv: (r: AccountBill) => r.transcription.toFixed(2).replace('.', ',') }, { label: 'App Asaas', csv: (r: AccountBill) => r.asaas.toFixed(2).replace('.', ',') }, { label: 'Ligações', csv: (r: AccountBill) => r.calling.toFixed(2).replace('.', ',') }, { label: 'Total', csv: (r: AccountBill) => r.total.toFixed(2).replace('.', ',') },
  ], cons.rows);

  return (
    <Page wide title="Faturamento do parceiro" subtitle={`${partner.name} · início do faturamento em ${fmtDate(new Date(partner.startBillingAt + 'T12:00').getTime())}`} actions={<>
      <div className="flex items-center gap-2 h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm"><Icon name="Calendar" size={15} className="text-slate-400" />Data referência:
        <select className="outline-none font-semibold text-brand-700 bg-transparent" value={period} onChange={(e) => setPeriod(e.target.value)}>{months.map((m) => <option key={m} value={m}>{monthLabel(m)}{m === monthKey(Date.now()) ? ' (parcial)' : ''}</option>)}</select>
      </div>
      <Btn icon="Download" onClick={exportAll}>Exportar CSV</Btn>
    </>}>
      {partial && <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-2.5 flex items-center gap-2"><Icon name="Info" size={16} />Mês em andamento: os valores são parciais e mudam até o fechamento.</div>}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-5">
        <Stat label="Total do período" value={brl(cons.total)} trend={prevTotal ? ((cons.total - prevTotal) / prevTotal) * 100 : undefined} hint="vs. mês anterior" icon="Receipt" tone="brand" />
        <Stat label="Contas faturadas" value={cons.rows.length} hint={`${cons.rows.filter((r) => r.factor < 1).length} com pró-rata`} icon="Building" tone="blue" />
        <Stat label="Usuários" value={num(cons.users)} icon="Users" tone="violet" />
        <Stat label="Canais" value={num(cons.channels)} icon="Smartphone" tone="amber" />
        <Stat label="Instâncias QR (Z-API)" value={cons.instances.length} hint={brl(cons.qrTotal)} icon="QrCode" tone="slate" />
      </div>

      <div className="grid xl:grid-cols-[340px_1fr] gap-5 mb-5">
        <Card title="Consolidado" icon="FileSpreadsheet">
          <dl className="text-sm divide-y divide-slate-100">
            {[
              ['Período', monthLabel(period, true)],
              ['Parceiro', partner.name],
              ['Início faturamento', fmtDate(new Date(partner.startBillingAt + 'T12:00').getTime())],
              ['Aplicativo', brl(cons.app) + (partner.app ? ` · ${partner.app}` : '')],
              ['Domínio', brl(cons.domain) + (partner.customDomain ? ` · ${partner.customDomain}` : '')],
              ['Contas', <span key="c">{brl(cons.accountsCharged)}{cons.minimumApplied && <Badge tone="amber" className="ml-1">Licenciamento mínimo</Badge>}</span>],
              ['Custo instâncias Z-API', brl(cons.qrTotal)],
              ['Custo infraestrutura', brl(cons.infra)],
              ['Desconto por volume', cons.discount ? `− ${brl(cons.discount)}` : brl(0)],
            ].map(([k, v]) => <div key={k as string} className="flex justify-between gap-3 py-2"><dt className="text-slate-500">{k}</dt><dd className="font-medium text-right text-slate-800">{v}</dd></div>)}
            <div className="flex justify-between py-3"><dt className="font-semibold">Total</dt><dd className="text-xl font-extrabold text-brand-700">{brl(cons.total)}</dd></div>
          </dl>
          {cons.minimumApplied && <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2">A soma das contas ({brl(cons.accountsTotal)}) ficou abaixo do licenciamento mínimo de {brl(cons.minimum)}, que foi cobrado no lugar.</p>}
        </Card>
        <Card title="Evolução mensal" subtitle="Composição do valor faturado por mês">
          <ResponsiveContainer width="100%" height={330}>
            <BarChart data={history}><CartesianGrid vertical={false} stroke={CHART.grid} /><XAxis dataKey="label" {...axis} /><YAxis {...axis} tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`} /><Tooltip {...tooltipStyle} formatter={(v: number) => brl(v)} /><Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="contas" name="Contas" stackId="a" fill={CHART.brand}>{history.map((h) => <Cell key={h.m} fill={CHART.brand} fillOpacity={h.m === period ? 1 : 0.5} />)}</Bar>
              <Bar dataKey="zapi" name="Instâncias Z-API" stackId="a" fill={CHART.blue}>{history.map((h) => <Cell key={h.m} fill={CHART.blue} fillOpacity={h.m === period ? 1 : 0.5} />)}</Bar>
              <Bar dataKey="infra" name="Infraestrutura" stackId="a" fill={CHART.amber} radius={[4, 4, 0, 0]}>{history.map((h) => <Cell key={h.m} fill={CHART.amber} fillOpacity={h.m === period ? 1 : 0.5} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <h2 className="font-semibold text-slate-900 mb-2 flex items-center gap-2"><Icon name="Building" size={18} className="text-brand-600" />Contas <span className="text-sm font-normal text-slate-400">({cons.rows.length} linhas · clique para ver o cálculo)</span></h2>
      <div className="mb-5">
        <DataTable rows={cons.rows.map((r) => ({ ...r, id: r.accountId }))} onRowClick={setDetail} pageSize={10} stickyFirst initialSort={{ key: 'total', dir: 'desc' }} columns={[
          { key: 'name', label: 'Conta', render: (r) => <span className="font-medium whitespace-nowrap">{r.name}{r.isPartnerAccount && <Badge tone="brand" className="ml-1">Parceiro</Badge>}</span> },
          { key: 'startBillingAt', label: 'Início', render: (r) => <span className="whitespace-nowrap">{fmtDate(new Date(r.startBillingAt + 'T12:00').getTime())}</span> },
          { key: 'endBillingAt', label: 'Fim', render: (r) => (r.endBillingAt ? fmtDate(new Date(r.endBillingAt + 'T12:00').getTime()) : '—') },
          { key: 'days', label: 'Dias', align: 'right', render: (r) => (r.factor < 1 ? <span className="text-amber-600 font-semibold">{r.days}/30</span> : 'mês') },
          { key: 'users', label: 'Usuários', align: 'right' },
          ...pricing.userTiers.map((t, i) => ({ key: `u${i}`, label: `U. ${t.label}`, align: 'right' as const, sortValue: (r: AccountBill) => r.usersTiers[i], render: (r: AccountBill) => r.usersTiers[i] || <span className="text-slate-300">0</span> })),
          { key: 'channels', label: 'Canais', align: 'right' },
          ...pricing.channelTiers.map((t, i) => ({ key: `c${i}`, label: `C. ${t.label}`, align: 'right' as const, sortValue: (r: AccountBill) => r.channelsTiers[i], render: (r: AccountBill) => r.channelsTiers[i] || <span className="text-slate-300">0</span> })),
          { key: 'chatbotAI', label: 'Chatbot IA', align: 'right', render: (r) => (r.chatbotAI ? brl(r.chatbotAI) : '—') },
          { key: 'transcription', label: 'Transcrição', align: 'right', render: (r) => (r.transcription ? brl(r.transcription) : '—') },
          { key: 'asaas', label: 'Asaas', align: 'right', render: (r) => (r.asaas ? brl(r.asaas) : '—') },
          { key: 'total', label: 'Total', align: 'right', render: (r) => <b>{brl(r.total)}</b> },
        ]} />
      </div>

      <div className="grid xl:grid-cols-[1fr_420px] gap-5">
        <div>
          <h2 className="font-semibold text-slate-900 mb-2 flex items-center gap-2"><Icon name="QrCode" size={18} className="text-brand-600" />Instâncias QRCode <span className="text-sm font-normal text-slate-400">(cobradas por dia: {brl(pricing.qrInstanceMonthly / pricing.daysBase)}/dia · menos de 24h não é cobrado)</span></h2>
          <DataTable rows={cons.instances.map((i) => ({ ...i, id: i.instance.id }))} pageSize={8} initialSort={{ key: 'cost', dir: 'desc' }} columns={[
            { key: 'accountName', label: 'Empresa', render: (r) => <span className="whitespace-nowrap">{r.accountName}</span> },
            { key: 'inst', label: 'Instância', sortValue: (r) => r.instance.instanceId, render: (r) => <span className="font-mono text-[11px]">{r.instance.instanceId.slice(0, 16)}…</span> },
            { key: 'num', label: 'Número', render: (r) => <span className="whitespace-nowrap">{r.instance.number}</span> },
            { key: 'start', label: 'Início', sortValue: (r) => r.instance.startAt, render: (r) => <span className="whitespace-nowrap text-xs">{fmtDateTime(r.instance.startAt)}</span> },
            { key: 'end', label: 'Fim', sortValue: (r) => r.instance.endAt ?? Infinity, render: (r) => (r.instance.endAt ? <span className="whitespace-nowrap text-xs">{fmtDateTime(r.instance.endAt)}</span> : <Badge tone="green">Conectada</Badge>) },
            { key: 'days', label: 'Uso (dias)', align: 'right' },
            { key: 'cost', label: 'Valor', align: 'right', render: (r) => brl(r.cost) },
          ]} />
        </div>
        <Card title="Maiores clientes" subtitle={`Participação no total de contas (${brl(cons.accountsTotal)})`}>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart><Pie data={pie} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={1}>{pie.map((_, i) => <Cell key={i} fill={CHART.series[i % CHART.series.length]} />)}</Pie><Tooltip {...tooltipStyle} formatter={(v: number) => brl(v)} /></PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">{pie.map((p, i) => <div key={p.name} className="flex items-center gap-2 text-xs"><span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: CHART.series[i % CHART.series.length] }} /><span className="flex-1 truncate">{p.name}</span><span className="font-semibold">{pct((p.value / Math.max(1, cons.accountsTotal)) * 100, 2)}</span></div>)}</div>
        </Card>
      </div>

      <Drawer open={!!detail} onClose={() => setDetail(null)} title={detail?.name} width={460}>
        {detail && <>
          <p className="text-sm text-slate-500 mb-4">Memória de cálculo de {monthLabel(period, true)}{detail.factor < 1 ? ` · ${detail.days} dias ativos (pró-rata ${pct(detail.factor * 100, 1)})` : ' · mês cheio'}</p>
          <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 text-sm">
            {[
              [`Plano base (inclui ${pricing.includedUsers} usuários e ${pricing.includedChannels} canal)`, detail.base],
              ...pricing.userTiers.map((t, i) => [`Usuários ${t.label}: ${detail.usersTiers[i]} × ${brl(t.price)}`, round2(detail.usersTiers[i] * t.price * detail.factor)]),
              ...pricing.channelTiers.map((t, i) => [`Canais ${t.label}: ${detail.channelsTiers[i]} × ${brl(t.price)}`, round2(detail.channelsTiers[i] * t.price * detail.factor)]),
              ['Chatbot com IA', detail.chatbotAI], ['App Asaas', detail.asaas], ['Transcrição de áudio (uso)', detail.transcription], ['Ligações (uso)', detail.calling],
            ].map(([l, v]) => <div key={l as string} className="flex justify-between px-3 py-2"><span className="text-slate-600">{l}</span><span className={(v as number) ? 'font-medium' : 'text-slate-300'}>{brl(v as number)}</span></div>)}
            <div className="flex justify-between px-3 py-3 bg-slate-50"><span className="font-semibold">Total</span><span className="font-extrabold text-brand-700">{brl(detail.total)}</span></div>
          </div>
          {detail.isPartnerAccount && <p className="text-xs text-slate-500 mt-3">Conta do parceiro: isenta de plano base e de usuários; paga apenas canais extras e adicionais.</p>}
          <p className="text-xs text-slate-400 mt-3">Regras e preços editáveis em Admin → Planos.</p>
        </>}
      </Drawer>
    </Page>
  );
}
