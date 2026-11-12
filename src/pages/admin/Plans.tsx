import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Btn, Card, Field, Input, Page, Toggle, Icon } from '../../components/ui';
import { DEFAULT_PRICING, simulatePrice } from '../../lib/pricing';
import { brl } from '../../lib/util';
import type { Pricing } from '../../types';

export default function Plans() {
  const st = useStore();
  const [P, setP] = useState<Pricing>(st.admin.pricing);
  const [sim, setSim] = useState({ users: 12, channels: 4, chatbot: true, asaas: false });
  const result = simulatePrice(sim.users, sim.channels, sim.chatbot, sim.asaas, P);
  const dirty = JSON.stringify(P) !== JSON.stringify(st.admin.pricing);
  const NumIn = ({ value, onChange, prefix = 'R$' }: { value: number; onChange: (v: number) => void; prefix?: string }) => (
    <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{prefix}</span><input type="number" step="0.01" value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full h-9 rounded-lg border border-slate-200 pl-9 pr-2 text-sm outline-none focus:border-brand-500" /></div>
  );
  return (
    <Page title="Planos e preços" subtitle="Tabela usada no relatório de faturamento dos parceiros. Alterações recalculam todos os meses." actions={<>
      <Btn icon="RotateCcw" onClick={() => setP(DEFAULT_PRICING)}>Restaurar padrão</Btn>
      <Btn variant="primary" icon="Save" disabled={!dirty} onClick={() => { st.patch('admin', { ...st.admin, pricing: P }); st.toast('Tabela de preços salva', { tone: 'success' }); }}>Salvar</Btn>
    </>}>
      <div className="grid xl:grid-cols-[1fr_380px] gap-5">
        <div className="space-y-5">
          <Card title="Plano base" icon="Package">
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Mensalidade por conta"><NumIn value={P.basePlan} onChange={(v) => setP({ ...P, basePlan: v })} /></Field>
              <Field label="Usuários inclusos"><NumIn prefix="#" value={P.includedUsers} onChange={(v) => setP({ ...P, includedUsers: v })} /></Field>
              <Field label="Canais inclusos"><NumIn prefix="#" value={P.includedChannels} onChange={(v) => setP({ ...P, includedChannels: v })} /></Field>
            </div>
          </Card>
          <div className="grid md:grid-cols-2 gap-5">
            <Card title="Usuários adicionais (por faixa)" icon="Users">
              {P.userTiers.map((t, i) => <div key={i} className="grid grid-cols-[1fr_120px] gap-2 items-center mb-2"><span className="text-sm">{t.label}: do {t.from}º {t.to ? `ao ${t.to}º` : 'em diante'}</span><NumIn value={t.price} onChange={(v) => setP({ ...P, userTiers: P.userTiers.map((x, k) => (k === i ? { ...x, price: v } : x)) })} /></div>)}
            </Card>
            <Card title="Canais adicionais (por faixa)" icon="Smartphone">
              {P.channelTiers.map((t, i) => <div key={i} className="grid grid-cols-[1fr_120px] gap-2 items-center mb-2"><span className="text-sm">{t.label}: do {t.from}º {t.to ? `ao ${t.to}º` : 'em diante'}</span><NumIn value={t.price} onChange={(v) => setP({ ...P, channelTiers: P.channelTiers.map((x, k) => (k === i ? { ...x, price: v } : x)) })} /></div>)}
            </Card>
          </div>
          <Card title="Adicionais e custos do parceiro" icon="Plus">
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Chatbot com IA (mês)"><NumIn value={P.chatbotAI} onChange={(v) => setP({ ...P, chatbotAI: v })} /></Field>
              <Field label="App Asaas (mês)"><NumIn value={P.asaas} onChange={(v) => setP({ ...P, asaas: v })} /></Field>
              <Field label="Instância QR (mês)" hint={`= ${brl(P.qrInstanceMonthly / P.daysBase)}/dia`}><NumIn value={P.qrInstanceMonthly} onChange={(v) => setP({ ...P, qrInstanceMonthly: v })} /></Field>
              <Field label="Licenciamento mínimo (mês)"><NumIn value={P.minimumLicense} onChange={(v) => setP({ ...P, minimumLicense: v })} /></Field>
              <Field label="Domínio personalizado"><NumIn value={P.customDomain} onChange={(v) => setP({ ...P, customDomain: v })} /></Field>
              <Field label="App personalizado"><NumIn value={P.appCustom} onChange={(v) => setP({ ...P, appCustom: v })} /></Field>
            </div>
            <p className="text-xs text-slate-500 mt-4 font-semibold">Desconto por volume (sobre o total de contas)</p>
            <div className="flex gap-4 mt-2">{P.volumeDiscount.map((d, i) => <div key={i} className="flex items-center gap-2 text-sm">acima de <div className="w-28"><NumIn value={d.above} onChange={(v) => setP({ ...P, volumeDiscount: P.volumeDiscount.map((x, k) => (k === i ? { ...x, above: v } : x)) })} /></div><div className="w-20"><NumIn prefix="%" value={d.pct} onChange={(v) => setP({ ...P, volumeDiscount: P.volumeDiscount.map((x, k) => (k === i ? { ...x, pct: v } : x)) })} /></div></div>)}</div>
          </Card>
          <Card title="Regras de cálculo" icon="BookOpen">
            <ul className="text-sm text-slate-600 space-y-1.5 list-disc pl-5">
              <li>Conta ativa no mês inteiro paga o valor cheio; entrada ou saída no meio do mês paga <b>pró-rata</b> (dias ÷ 30).</li>
              <li>Usuários e canais além dos inclusos são cobrados por <b>faixa progressiva</b> (ex.: 24 usuários = 17 na faixa 1 + 4 na faixa 2).</li>
              <li>A <b>conta do próprio parceiro</b> é isenta de plano base e de usuários.</li>
              <li>Transcrição de áudio e ligações são cobradas pelo <b>uso</b>, sem pró-rata.</li>
              <li>Instâncias QR são cobradas por <b>dia de uso</b>; instâncias com menos de 24h de vida não são cobradas.</li>
              <li>Se a soma das contas ficar abaixo do <b>licenciamento mínimo</b>, cobra-se o mínimo (pró-rata no 1º mês do parceiro).</li>
            </ul>
          </Card>
        </div>
        <Card title="Simulador de preço" subtitle="Quanto uma conta paga por mês" icon="Calculator" className="h-fit sticky top-0">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Usuários"><Input type="number" min={1} value={sim.users} onChange={(e) => setSim({ ...sim, users: Number(e.target.value) })} /></Field>
            <Field label="Canais"><Input type="number" min={1} value={sim.channels} onChange={(e) => setSim({ ...sim, channels: Number(e.target.value) })} /></Field>
          </div>
          <div className="flex flex-col gap-2 mt-3"><Toggle checked={sim.chatbot} onChange={(v) => setSim({ ...sim, chatbot: v })} label="Chatbot com IA" /><Toggle checked={sim.asaas} onChange={(v) => setSim({ ...sim, asaas: v })} label="App Asaas" /></div>
          <div className="mt-4 rounded-xl bg-slate-50 divide-y divide-slate-200 text-sm">{result.lines.map((l) => <div key={l.label} className="flex justify-between gap-2 px-3 py-2"><span className="text-slate-600">{l.label}</span><span className="font-medium whitespace-nowrap">{brl(l.value)}</span></div>)}</div>
          <div className="mt-3 flex items-end justify-between"><span className="text-sm text-slate-500">Total mensal</span><span className="text-3xl font-extrabold text-brand-700">{brl(result.total)}</span></div>
          <p className="text-xs text-slate-400 mt-2 flex gap-1"><Icon name="Info" size={13} />Preço por usuário: {brl(result.total / Math.max(1, sim.users))}</p>
        </Card>
      </div>
    </Page>
  );
}
