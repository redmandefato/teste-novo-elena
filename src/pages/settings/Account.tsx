import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Btn, Card, Field, Input, Page, Select, Textarea, Toggle } from '../../components/ui';

export default function Account() {
  const st = useStore();
  const [c, setC] = useState(st.company);
  const dirty = JSON.stringify(c) !== JSON.stringify(st.company);
  return (
    <Page title="Conta" subtitle="Dados da empresa, horário de atendimento e mensagens automáticas" actions={<Btn variant="primary" icon="Save" disabled={!dirty} onClick={() => { st.patch('company', c); st.toast('Configurações salvas', { tone: 'success' }); }}>Salvar alterações</Btn>}>
      <div className="grid lg:grid-cols-2 gap-5">
        <Card title="Dados da empresa" icon="Building2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nome fantasia" className="col-span-2"><Input value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} /></Field>
            <Field label="Razão social" className="col-span-2"><Input value={c.legalName} onChange={(e) => setC({ ...c, legalName: e.target.value })} /></Field>
            <Field label="CNPJ"><Input value={c.cnpj} onChange={(e) => setC({ ...c, cnpj: e.target.value })} /></Field>
            <Field label="Fuso horário"><Select className="w-full" value={c.timezone} onChange={(e) => setC({ ...c, timezone: e.target.value })}><option value="America/Manaus">Manaus (GMT-4)</option><option value="America/Sao_Paulo">Brasília (GMT-3)</option><option value="America/Rio_Branco">Rio Branco (GMT-5)</option></Select></Field>
          </div>
        </Card>
        <Card title="Regras de atendimento" icon="Timer">
          <div className="grid grid-cols-2 gap-3">
            <Field label="SLA de 1ª resposta (min)" hint="Usado nos alertas da fila e nos indicadores"><Input type="number" value={c.slaFirstResponseMin} onChange={(e) => setC({ ...c, slaFirstResponseMin: Number(e.target.value) })} /></Field>
            <Field label="Concluir inativos após (h)" hint="Atendimentos sem resposta do cliente"><Input type="number" value={c.autoCloseHours} onChange={(e) => setC({ ...c, autoCloseHours: Number(e.target.value) })} /></Field>
          </div>
        </Card>
        <Card title="Horário de atendimento" icon="Clock">
          <div className="space-y-2">
            {c.businessHours.map((h, i) => (
              <div key={h.day} className="flex items-center gap-3">
                <div className="w-28"><Toggle checked={h.enabled} onChange={(v) => setC({ ...c, businessHours: c.businessHours.map((x, k) => (k === i ? { ...x, enabled: v } : x)) })} label={h.day} /></div>
                <Input type="time" className="w-28" value={h.open} disabled={!h.enabled} onChange={(e) => setC({ ...c, businessHours: c.businessHours.map((x, k) => (k === i ? { ...x, open: e.target.value } : x)) })} />
                <span className="text-slate-400 text-sm">até</span>
                <Input type="time" className="w-28" value={h.close} disabled={!h.enabled} onChange={(e) => setC({ ...c, businessHours: c.businessHours.map((x, k) => (k === i ? { ...x, close: e.target.value } : x)) })} />
              </div>
            ))}
          </div>
        </Card>
        <Card title="Mensagens automáticas" icon="MessageSquareText">
          <Field label="Saudação"><Textarea rows={2} value={c.greetingMessage} onChange={(e) => setC({ ...c, greetingMessage: e.target.value })} /></Field>
          <Field label="Fora do horário" className="mt-3"><Textarea rows={4} value={c.awayMessage} onChange={(e) => setC({ ...c, awayMessage: e.target.value })} /></Field>
        </Card>
      </div>
    </Page>
  );
}
