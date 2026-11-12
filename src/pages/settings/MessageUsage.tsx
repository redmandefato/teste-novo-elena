import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useStore } from '../../store/useStore';
import { Card, Page, Stat } from '../../components/ui';
import { DataTable } from '../../components/DataTable';
import { CHART, axis, tooltipStyle } from '../../components/charts';
import { brl, monthLabel, num } from '../../lib/util';

// Preço aproximado por conversa (Meta, Brasil) — editável quando ligar no backend
export const META_PRICE = { marketing: 0.35, utility: 0.045, service: 0, authentication: 0.175 };

export function UsageView({ scale = 1 }: { scale?: number }) {
  const st = useStore();
  const rows = st.metrics.messageUsage.map((m) => {
    const r = { ...m, marketing: Math.round(m.marketing * scale), utility: Math.round(m.utility * scale), service: Math.round(m.service * scale), authentication: Math.round(m.authentication * scale) };
    return { ...r, id: m.month, label: monthLabel(m.month), cost: r.marketing * META_PRICE.marketing + r.utility * META_PRICE.utility + r.authentication * META_PRICE.authentication };
  });
  const cur = rows[rows.length - 1];
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <Stat label="Conversas de marketing" value={num(cur.marketing)} hint={`${brl(META_PRICE.marketing)} cada`} icon="Megaphone" tone="violet" />
        <Stat label="Conversas de utilidade" value={num(cur.utility)} hint={`${brl(META_PRICE.utility)} cada`} icon="Bell" tone="blue" />
        <Stat label="Conversas de serviço" value={num(cur.service)} hint="gratuitas (iniciadas pelo cliente)" icon="Headphones" tone="brand" />
        <Stat label="Custo estimado do mês" value={brl(cur.cost)} icon="Receipt" tone="amber" />
      </div>
      <Card title="Conversas por categoria (Meta)" className="mb-5">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={rows}><CartesianGrid vertical={false} stroke={CHART.grid} /><XAxis dataKey="label" {...axis} /><YAxis {...axis} tickFormatter={(v) => `${Math.round(v / 1000)}k`} /><Tooltip {...tooltipStyle} /><Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="service" name="Serviço" stackId="a" fill={CHART.brand} /><Bar dataKey="utility" name="Utilidade" stackId="a" fill={CHART.blue} /><Bar dataKey="marketing" name="Marketing" stackId="a" fill={CHART.violet} /><Bar dataKey="authentication" name="Autenticação" stackId="a" fill={CHART.amber} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <DataTable rows={[...rows].reverse()} columns={[
        { key: 'label', label: 'Mês' }, { key: 'service', label: 'Serviço', align: 'right', render: (r) => num(r.service) }, { key: 'utility', label: 'Utilidade', align: 'right', render: (r) => num(r.utility) },
        { key: 'marketing', label: 'Marketing', align: 'right', render: (r) => num(r.marketing) }, { key: 'authentication', label: 'Autenticação', align: 'right', render: (r) => num(r.authentication) }, { key: 'cost', label: 'Custo estimado', align: 'right', render: (r) => <b>{brl(r.cost)}</b> },
      ]} />
    </>
  );
}

export default function MessageUsage() {
  return <Page title="Consumo de mensagens" subtitle="Conversas cobradas pela Meta no WhatsApp oficial, por categoria"><UsageView /></Page>;
}
