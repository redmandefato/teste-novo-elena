import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Badge, Btn, Card, Icon, IconBtn, Input, Page, Toggle } from '../../components/ui';
import { timeAgo } from '../../lib/util';

const EVENTS = ['message.received', 'message.sent', 'session.created', 'session.transferred', 'session.concluded', 'contact.updated', 'card.moved'];

export default function Integrations() {
  const st = useStore();
  const [show, setShow] = useState(false);
  const [hooks, setHooks] = useState([
    { id: 1, url: 'https://erp.vitta.com.br/webhooks/atendimento', events: ['session.concluded', 'card.moved'], active: true, last: Date.now() - 12 * 60e3, ok: true },
    { id: 2, url: 'https://hooks.zapier.com/hooks/catch/123456/abcde', events: ['message.received'], active: true, last: Date.now() - 3 * 60e3, ok: true },
    { id: 3, url: 'https://api.antigo.com/callback', events: ['contact.updated'], active: false, last: Date.now() - 9 * 86400e3, ok: false },
  ]);
  const token = 'elena_live_8f3a2c91d4b7e6f05a1c9e3d7b2f4a68';
  return (
    <Page title="Integrações" subtitle="API, webhooks e conexões com outros sistemas">
      <div className="grid lg:grid-cols-2 gap-5">
        <Card title="Token da API" icon="KeyRound" subtitle="Use no cabeçalho Authorization: Bearer <token>">
          <div className="flex gap-2"><Input readOnly value={show ? token : token.slice(0, 11) + '•'.repeat(22)} className="flex-1 font-mono" /><IconBtn icon={show ? 'EyeOff' : 'Eye'} onClick={() => setShow(!show)} /><IconBtn icon="Copy" onClick={() => { navigator.clipboard?.writeText(token); st.toast('Token copiado'); }} /></div>
          <div className="flex gap-2 mt-3"><Btn size="sm" icon="RefreshCw" onClick={() => st.toast('Novo token gerado (protótipo)')}>Gerar novo token</Btn><Btn size="sm" variant="link" icon="BookOpen" onClick={() => st.toast('Documentação da API: em breve')}>Ver documentação</Btn></div>
        </Card>
        <Card title="Exemplo: enviar mensagem pela API" icon="Code">
          <pre className="text-[11px] bg-slate-900 text-emerald-300 rounded-lg p-3 overflow-x-auto">{`POST /api/v1/messages
{
  "channelId": "c1",
  "to": "+5592999990000",
  "template": "pedido_saiu_entrega",
  "variables": ["Ana", "48213", "40 min"]
}`}</pre>
        </Card>
        <Card title="Webhooks" icon="Webhook" className="lg:col-span-2" actions={<Btn size="sm" variant="primary" icon="Plus" onClick={() => setHooks([...hooks, { id: Date.now(), url: 'https://seu-sistema.com/webhook', events: ['message.received'], active: true, last: Date.now(), ok: true }])}>Novo webhook</Btn>} bodyClass="!px-0">
          {hooks.map((h) => (
            <div key={h.id} className="flex items-center gap-4 px-5 py-3 border-t border-slate-100">
              <span className={`h-2.5 w-2.5 rounded-full ${h.active ? (h.ok ? 'bg-emerald-500' : 'bg-red-500') : 'bg-slate-300'}`} />
              <div className="flex-1 min-w-0"><p className="text-sm font-mono truncate">{h.url}</p><div className="flex flex-wrap gap-1 mt-1">{h.events.map((e) => <span key={e} className="text-[10px] font-mono bg-slate-100 rounded px-1.5 py-0.5">{e}</span>)}</div></div>
              <span className="text-xs text-slate-400">último envio {timeAgo(h.last)}</span>
              <Toggle checked={h.active} onChange={(v) => setHooks(hooks.map((x) => (x.id === h.id ? { ...x, active: v } : x)))} />
            </div>
          ))}
          <p className="px-5 pt-3 text-xs text-slate-400 border-t border-slate-100">Eventos disponíveis: {EVENTS.join(', ')}</p>
        </Card>
        <Card title="Apps conectados" icon="Puzzle" className="lg:col-span-2">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {st.apps.filter((a) => a.installed).map((a) => <div key={a.id} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3"><span className="h-9 w-9 rounded-lg grid place-items-center text-white" style={{ background: a.color }}><Icon name={a.icon} size={18} /></span><div className="flex-1"><p className="text-sm font-medium">{a.name}</p><Badge tone="green">Conectado</Badge></div></div>)}
          </div>
        </Card>
      </div>
    </Page>
  );
}
