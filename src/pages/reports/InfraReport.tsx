import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useStore } from '../../store/useStore';
import { Card, Page, Progress, Stat } from '../../components/ui';
import { CHART, axis, tooltipStyle } from '../../components/charts';
import { monthLabel, num } from '../../lib/util';

export default function InfraReport() {
  const st = useStore();
  const rows = st.metrics.infra.map((r) => ({ ...r, label: monthLabel(r.month) }));
  const cur = rows[rows.length - 1], prev = rows[rows.length - 2];
  const delta = (a: number, b: number) => ((a - b) / b) * 100;
  return (
    <Page title="Consumo de infraestrutura" subtitle="Uso de armazenamento, mensagens, IA e transcrição da sua conta">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <Stat label="Armazenamento de mídia" value={`${num(cur.storageGb, 1)} GB`} trend={delta(cur.storageGb, prev.storageGb)} hint="vs. mês anterior" icon="HardDrive" tone="brand" />
        <Stat label="Mensagens trafegadas" value={num(cur.messages)} trend={delta(cur.messages, prev.messages)} icon="MessagesSquare" tone="blue" />
        <Stat label="Tokens de IA" value={`${num(cur.aiTokens / 1e6, 2)} mi`} trend={delta(cur.aiTokens, prev.aiTokens)} icon="Sparkles" tone="violet" />
        <Stat label="Minutos transcritos" value={num(cur.transcriptionMin)} trend={delta(cur.transcriptionMin, prev.transcriptionMin)} icon="AudioLines" tone="amber" />
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <Card title="Armazenamento (GB)">
          <ResponsiveContainer width="100%" height={240}><AreaChart data={rows}><CartesianGrid vertical={false} stroke={CHART.grid} /><XAxis dataKey="label" {...axis} /><YAxis {...axis} /><Tooltip {...tooltipStyle} /><Area dataKey="storageGb" name="GB" stroke={CHART.brand} fill="#d1fae9" strokeWidth={2} /></AreaChart></ResponsiveContainer>
        </Card>
        <Card title="Mensagens por mês">
          <ResponsiveContainer width="100%" height={240}><BarChart data={rows}><CartesianGrid vertical={false} stroke={CHART.grid} /><XAxis dataKey="label" {...axis} /><YAxis {...axis} tickFormatter={(v) => `${Math.round(v / 1000)}k`} /><Tooltip {...tooltipStyle} /><Bar dataKey="messages" name="Mensagens" fill={CHART.blue} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
        </Card>
        <Card title="Limites do plano" className="lg:col-span-2">
          <div className="grid md:grid-cols-2 gap-x-10 gap-y-5">
            {[['Armazenamento', cur.storageGb, 100, 'GB'], ['Mensagens no mês', cur.messages, 250000, ''], ['Tokens de IA', cur.aiTokens, 5e6, ''], ['Minutos de transcrição', cur.transcriptionMin, 3000, 'min']].map(([l, v, max, u]: any) => (
              <div key={l}><div className="flex justify-between text-sm mb-1.5"><span className="font-medium text-slate-700">{l}</span><span className="text-slate-500">{num(v)} {u} de {num(max)} {u}</span></div><Progress value={(v / max) * 100} color={v / max > 0.8 ? CHART.red : CHART.brand} /></div>
            ))}
          </div>
        </Card>
      </div>
    </Page>
  );
}
