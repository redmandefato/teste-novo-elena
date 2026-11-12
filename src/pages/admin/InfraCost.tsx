import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useStore } from '../../store/useStore';
import { Card, Page, Stat } from '../../components/ui';
import { DataTable } from '../../components/DataTable';
import { CHART, axis, tooltipStyle } from '../../components/charts';
import { computeAccount } from '../../lib/pricing';
import { brl, monthKey, monthLabel, monthRange, round2, sum } from '../../lib/util';

export default function InfraCost() {
  const st = useStore();
  const { infraCost, accounts, pricing, partner } = st.admin;
  const cur = monthKey(Date.now());
  const months = monthRange(partner.startBillingAt.slice(0, 7), cur);
  const series = months.map((m) => ({ m, label: monthLabel(m), custo: infraCost[m] ?? 0 }));
  const rows = useMemo(() => {
    const bills = accounts.map((a) => computeAccount(a, cur, pricing)).filter(Boolean) as any[];
    const total = sum(bills, (b) => b.users * pricing.infraPerUser + b.channels * pricing.infraPerChannel);
    return bills.map((b) => { const w = b.users * pricing.infraPerUser + b.channels * pricing.infraPerChannel; return { id: b.accountId, name: b.name, users: b.users, channels: b.channels, share: w / total, cost: round2((w / total) * (infraCost[cur] ?? 0)), revenue: b.total }; });
  }, [accounts, pricing, infraCost, cur]);
  return (
    <Page title="Custo de infraestrutura" subtitle="Servidores, armazenamento e processamento rateados por conta">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <Stat label="Custo do mês" value={brl(infraCost[cur] ?? 0)} icon="Server" tone="brand" />
        <Stat label="Média mensal" value={brl(sum(series, (s) => s.custo) / series.length)} icon="ChartLine" tone="blue" />
        <Stat label="Por usuário" value={brl(pricing.infraPerUser)} hint="base do rateio" icon="User" tone="violet" />
        <Stat label="Por canal" value={brl(pricing.infraPerChannel)} hint="base do rateio" icon="Smartphone" tone="amber" />
      </div>
      <Card title="Evolução do custo" className="mb-5">
        <ResponsiveContainer width="100%" height={240}><AreaChart data={series}><CartesianGrid vertical={false} stroke={CHART.grid} /><XAxis dataKey="label" {...axis} /><YAxis {...axis} tickFormatter={(v) => `R$${v}`} /><Tooltip {...tooltipStyle} formatter={(v: number) => brl(v)} /><Area dataKey="custo" name="Custo" stroke={CHART.amber} fill="#fde68a" strokeWidth={2} /></AreaChart></ResponsiveContainer>
      </Card>
      <DataTable rows={rows} initialSort={{ key: 'cost', dir: 'desc' }} columns={[
        { key: 'name', label: 'Conta' }, { key: 'users', label: 'Usuários', align: 'right' }, { key: 'channels', label: 'Canais', align: 'right' },
        { key: 'share', label: 'Rateio', align: 'right', render: (r) => `${(r.share * 100).toFixed(1).replace('.', ',')}%` },
        { key: 'cost', label: 'Custo infra', align: 'right', render: (r) => brl(r.cost) },
        { key: 'revenue', label: 'Receita da conta', align: 'right', render: (r) => brl(r.revenue) },
        { key: 'margin', label: 'Margem', align: 'right', sortValue: (r) => r.revenue - r.cost, render: (r) => <b className={r.revenue - r.cost < 0 ? 'text-red-600' : 'text-emerald-700'}>{brl(r.revenue - r.cost)}</b> },
      ]} />
    </Page>
  );
}
