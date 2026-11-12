import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Badge, Btn, Card, Icon, Page, Progress, Stat, Toggle } from '../../components/ui';
import { num, pct, sum } from '../../lib/util';

export default function Sequences() {
  const st = useStore();
  const [sel, setSel] = useState(st.sequences[0]?.id);
  const s = st.sequences.find((x) => x.id === sel)!;
  const enrolledNow = st.contacts.filter((c) => c.sequenceIds.includes(s.id));
  return (
    <Page title="Sequências" subtitle="Mensagens automáticas em etapas (ex.: boas-vindas, pós-venda, recompra)" actions={<Btn variant="primary" icon="Plus" onClick={() => st.toast('Criador de sequências: próximo passo do projeto')}>Nova sequência</Btn>}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <Stat label="Sequências ativas" value={st.sequences.filter((x) => x.active).length} icon="ListOrdered" tone="brand" />
        <Stat label="Contatos inscritos" value={num(sum(st.sequences, (x) => x.enrolled))} icon="Users" tone="blue" />
        <Stat label="Concluíram" value={num(sum(st.sequences, (x) => x.completed))} icon="CircleCheck" tone="violet" />
        <Stat label="Conversão média" value={pct(sum(st.sequences, (x) => x.conversion) / st.sequences.length)} icon="TrendingUp" tone="amber" />
      </div>
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="space-y-3">
          {st.sequences.map((x) => (
            <button key={x.id} onClick={() => setSel(x.id)} className={`w-full text-left bg-white rounded-xl border p-4 shadow-card ${sel === x.id ? 'border-brand-500 ring-1 ring-brand-500' : 'border-slate-200 hover:bg-slate-50'}`}>
              <div className="flex items-center gap-2"><p className="font-semibold flex-1">{x.name}</p><Badge tone={x.active ? 'green' : 'slate'}>{x.active ? 'Ativa' : 'Pausada'}</Badge></div>
              <p className="text-xs text-slate-500 mt-1">{x.steps.length} etapas · {num(x.enrolled)} inscritos · conversão {pct(x.conversion)}</p>
              <Progress value={(x.completed / x.enrolled) * 100} className="mt-3" />
            </button>
          ))}
        </div>
        <Card className="lg:col-span-2" title={s.name} subtitle={`${num(s.enrolled)} inscritos · ${num(s.completed)} concluíram · ${enrolledNow.length} em andamento agora`} actions={<Toggle checked={s.active} onChange={(v) => st.upsert('sequences', { ...s, active: v })} label={s.active ? 'Ativa' : 'Pausada'} />}>
          <ol className="relative border-l-2 border-brand-200 ml-3 mt-2 space-y-5">
            {s.steps.map((step, i) => (
              <li key={i} className="ml-6">
                <span className="absolute -left-[13px] h-6 w-6 rounded-full bg-brand-600 text-white text-xs font-bold grid place-items-center">{i + 1}</span>
                <p className="text-xs font-semibold text-brand-700 flex items-center gap-1"><Icon name="Timer" size={12} />{step.delay}</p>
                <div className="mt-1 rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm">{step.text}</div>
                <p className="text-[11px] text-slate-400 mt-1">Taxa de leitura {pct(92 - i * 7)} · respostas {pct(18 - i * 2.5)}</p>
              </li>
            ))}
          </ol>
          {enrolledNow.length > 0 && <div className="mt-6"><p className="text-xs font-semibold text-slate-500 mb-2">Contatos em andamento nesta sequência</p><div className="flex flex-wrap gap-1.5">{enrolledNow.slice(0, 20).map((c) => <span key={c.id} className="text-xs bg-slate-100 rounded-full px-2.5 py-1">{c.name}</span>)}</div></div>}
        </Card>
      </div>
    </Page>
  );
}
