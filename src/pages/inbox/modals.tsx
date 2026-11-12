// Modais do atendimento: transferir, concluir, preferências, modelo, ligação e agendamento.
import { useEffect, useState } from 'react';
import { useStore, useMe } from '../../store/useStore';
import { cx, fmtClock, brl } from '../../lib/util';
import { Avatar, Btn, Field, Icon, Input, Modal, Segmented, Select, Textarea, Toggle, Badge } from '../../components/ui';
import type { Session, MessageTemplate } from '../../types';

export function TransferModal({ open, onClose, session, onDone }: { open: boolean; onClose: () => void; session: Session; onDone: (away: boolean) => void }) {
  const { teams, users, transfer, toast } = useStore();
  const me = useMe();
  const [mode, setMode] = useState<'team' | 'user'>('team');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<string | null>(null);
  const [note, setNote] = useState('');
  useEffect(() => { if (open) { setSel(null); setQ(''); setNote(''); } }, [open]);
  const tList = teams.filter((t) => !t.isBot && t.name.toLowerCase().includes(q.toLowerCase()));
  const uList = users.filter((u) => u.id !== me.id && u.name.toLowerCase().includes(q.toLowerCase()));
  const confirm = () => {
    if (!sel) return;
    transfer(session.id, mode === 'team' ? { teamId: sel } : { userId: sel }, note || undefined);
    const target = mode === 'team' ? teams.find((t) => t.id === sel)?.name : users.find((u) => u.id === sel)?.name;
    toast(`Atendimento transferido para ${target}`, { tone: 'success', icon: 'ArrowLeftRight' });
    onDone(true);
  };
  return (
    <Modal open={open} onClose={onClose} title="Transferir atendimento" icon="ArrowLeftRight"
      footer={<><Btn onClick={onClose}>Cancelar</Btn><Btn variant="primary" icon="ArrowLeftRight" disabled={!sel} onClick={confirm}>Transferir</Btn></>}>
      <div className="flex justify-center mb-3"><Segmented value={mode} onChange={(v) => { setMode(v); setSel(null); }} options={[{ id: 'team', label: 'Para uma equipe' }, { id: 'user', label: 'Para um usuário' }]} /></div>
      <Input icon="Search" placeholder={mode === 'team' ? 'Pesquisar equipe' : 'Pesquisar usuário'} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mt-2 max-h-72 overflow-y-auto scroll-thin -mx-2">
        {mode === 'team' ? tList.map((t) => {
          const online = t.members.filter((m) => users.find((u) => u.id === m.userId)?.status === 'online').length;
          return (
            <button key={t.id} onClick={() => setSel(t.id)} className={cx('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left', sel === t.id ? 'bg-brand-50 ring-1 ring-brand-500' : 'hover:bg-slate-50')}>
              <Avatar name={t.name} size={36} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium flex items-center gap-1.5">{t.name}{t.restricted && <Icon name="Lock" size={12} className="text-slate-400" />}{t.distribution && <Icon name="RefreshCw" size={12} className="text-slate-400" />}</p>
                <p className="text-xs text-slate-500">{t.members.length} usuário(s) · {online} online</p>
              </div>
              {t.id === session.teamId && <Badge>Equipe atual</Badge>}
            </button>
          );
        }) : uList.map((u) => (
          <button key={u.id} onClick={() => setSel(u.id)} className={cx('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left', sel === u.id ? 'bg-brand-50 ring-1 ring-brand-500' : 'hover:bg-slate-50')}>
            <Avatar name={u.name} size={36} status={u.status} />
            <div className="flex-1 min-w-0"><p className="text-sm font-medium">{u.name}</p><p className="text-xs text-slate-500 truncate">{teams.filter((t) => t.members.some((m) => m.userId === u.id)).map((t) => t.name).join(', ') || 'Sem equipe'}</p></div>
            <span className={cx('text-xs', u.status === 'online' ? 'text-emerald-600' : u.status === 'away' ? 'text-amber-600' : 'text-slate-400')}>{u.status === 'online' ? 'Online' : u.status === 'away' ? 'Ausente' : 'Offline'}</span>
          </button>
        ))}
      </div>
      <Field label="Mensagem para o próximo atendente (opcional)" className="mt-3"><Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: cliente quer fechar no Pix, já enviei a tabela" /></Field>
      <p className="text-[11px] text-slate-400 mt-2 flex gap-3"><span className="flex items-center gap-1"><Icon name="Lock" size={11} />Equipe restrita</span><span className="flex items-center gap-1"><Icon name="RefreshCw" size={11} />Distribuição automática</span></p>
    </Modal>
  );
}

const CLASSES = ['Venda realizada', 'Dúvida esclarecida', 'Pedido / entrega', 'Reclamação resolvida', 'Financeiro', 'Sem resposta do cliente', 'Outro'];

export function ConcludeModal({ open, onClose, session }: { open: boolean; onClose: () => void; session: Session }) {
  const { conclude, toast } = useStore();
  const [cls, setCls] = useState('');
  const [value, setValue] = useState('');
  const [csat, setCsat] = useState(true);
  useEffect(() => { if (open) { setCls(''); setValue(''); } }, [open]);
  return (
    <Modal open={open} onClose={onClose} title="Concluir atendimento" subtitle="As classificações alimentam os relatórios e podem ser usadas em campanhas" icon="CircleCheck"
      footer={<><Btn onClick={onClose}>Cancelar</Btn><Btn variant="primary" disabled={!cls} onClick={() => { conclude(session.id, { classification: cls, saleValue: value ? Number(value.replace(',', '.')) : null, csat }); toast('Atendimento concluído', { tone: 'success' }); onClose(); }}>Concluir</Btn></>}>
      <p className="text-xs font-semibold text-slate-600 mb-2">Como foi este atendimento?</p>
      <div className="grid grid-cols-2 gap-2">
        {CLASSES.map((c) => <button key={c} onClick={() => setCls(c)} className={cx('rounded-lg border px-3 py-2.5 text-sm text-left', cls === c ? 'border-brand-500 bg-brand-50 text-brand-800 font-medium' : 'border-slate-200 hover:bg-slate-50')}>{c}</button>)}
      </div>
      {cls === 'Venda realizada' && <Field label="Valor da venda (R$)" className="mt-3"><Input icon="CircleDollarSign" placeholder="0,00" value={value} onChange={(e) => setValue(e.target.value)} /></Field>}
      <div className="mt-4"><Toggle checked={csat} onChange={setCsat} label="Enviar pesquisa de satisfação (CSAT)" hint="O cliente recebe uma pergunta de 1 a 5 estrelas" /></div>
    </Modal>
  );
}

export function PreferencesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { prefs, setPrefs, toast } = useStore();
  const [mode, setMode] = useState(prefs.concludeMode);
  const [cls, setCls] = useState(prefs.classifyOnConclude);
  useEffect(() => { if (open) { setMode(prefs.concludeMode); setCls(prefs.classifyOnConclude); } }, [open]);
  const Opt = ({ id, title, text }: { id: 'immediate' | '12h'; title: string; text: React.ReactNode }) => (
    <button onClick={() => setMode(id)} className={cx('w-full flex gap-3 rounded-xl border p-3 text-left', mode === id ? 'border-brand-500 bg-brand-50/60' : 'border-slate-200 hover:bg-slate-50')}>
      <span className={cx('mt-0.5 h-4 w-4 rounded-full border-2 grid place-items-center', mode === id ? 'border-brand-600' : 'border-slate-300')}>{mode === id && <span className="h-2 w-2 rounded-full bg-brand-600" />}</span>
      <span><span className="block text-sm font-semibold">{title}</span><span className="block text-xs text-slate-500 mt-0.5">{text}</span></span>
    </button>
  );
  return (
    <Modal open={open} onClose={onClose} title="Preferências ao concluir" subtitle="Escolha o que deve acontecer ao concluir um atendimento" icon="Settings2"
      footer={<><Btn onClick={onClose}>Cancelar</Btn><Btn variant="primary" onClick={() => { setPrefs({ concludeMode: mode, classifyOnConclude: cls }); toast('Preferências salvas', { tone: 'success' }); onClose(); }}>Salvar</Btn></>}>
      <div className="space-y-2">
        <Opt id="12h" title="Arquivar em 12 horas (padrão)" text={<>Se o contato enviar nova mensagem em até <b>12 horas</b>, o atendimento é reaberto para o atendente responsável.</>} />
        <Opt id="immediate" title="Arquivar imediatamente" text="Se o contato enviar nova mensagem, um novo atendimento é criado na fila da equipe." />
      </div>
      <div className="mt-4 rounded-xl border border-slate-200 p-3"><Toggle checked={cls} onChange={setCls} label="Classificar atendimento ao concluir" hint="Os dados de classificação podem ser usados nos relatórios e na criação de campanhas" /></div>
    </Modal>
  );
}

export function TemplateModal({ open, onClose, onSend, contactName }: { open: boolean; onClose: () => void; onSend: (t: MessageTemplate, body: string) => void; contactName: string }) {
  const all = useStore((s) => s.templates);
  const templates = all.filter((t) => t.status === 'Aprovado');
  const [sel, setSel] = useState<MessageTemplate | null>(null);
  const [vars, setVars] = useState<string[]>([]);
  useEffect(() => { if (open) { setSel(null); } }, [open]);
  useEffect(() => { if (sel) { const n = (sel.body.match(/\{\{\d\}\}/g) || []).length; setVars(Array.from({ length: n }, (_, i) => (i === 0 ? contactName.split(' ')[0] : ''))); } }, [sel]);
  const body = sel ? sel.body.replace(/\{\{(\d)\}\}/g, (_, d) => vars[Number(d) - 1] || `{{${d}}}`) : '';
  return (
    <Modal open={open} onClose={onClose} size="lg" title="Enviar modelo de mensagem" subtitle="Modelos aprovados pela Meta podem ser enviados mesmo fora da janela de 24h" icon="FileText"
      footer={<><Btn onClick={onClose}>Cancelar</Btn><Btn variant="primary" icon="SendHorizontal" disabled={!sel} onClick={() => sel && onSend(sel, (sel.header ? `*${sel.header}*\n` : '') + body)}>Enviar modelo</Btn></>}>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 max-h-80 overflow-y-auto scroll-thin pr-1">
          {templates.map((t) => (
            <button key={t.id} onClick={() => setSel(t)} className={cx('w-full text-left rounded-lg border p-3', sel?.id === t.id ? 'border-brand-500 bg-brand-50/60' : 'border-slate-200 hover:bg-slate-50')}>
              <div className="flex items-center gap-2"><p className="text-sm font-semibold flex-1 truncate">{t.name}</p><Badge tone={t.category === 'Marketing' ? 'violet' : t.category === 'Utilidade' ? 'blue' : 'slate'}>{t.category}</Badge></div>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t.body}</p>
            </button>
          ))}
        </div>
        <div>
          {sel ? (
            <>
              {vars.map((v, i) => <Field key={i} label={`Variável {{${i + 1}}}`} className="mb-2"><Input value={v} onChange={(e) => setVars(vars.map((x, k) => (k === i ? e.target.value : x)))} /></Field>)}
              <p className="text-xs font-semibold text-slate-600 mt-3 mb-1.5">Pré-visualização</p>
              <div className="rounded-xl chat-bg p-3"><div className="bg-white rounded-xl rounded-tl-md p-3 text-sm shadow-sm">{sel.header && <p className="font-bold mb-1">{sel.header}</p>}<p className="whitespace-pre-wrap">{body}</p>{sel.buttons?.map((b) => <p key={b} className="text-center text-sky-600 border-t border-slate-100 mt-2 pt-1.5">{b}</p>)}</div></div>
            </>
          ) : <div className="h-full grid place-items-center text-sm text-slate-400 border border-dashed border-slate-200 rounded-xl p-6 text-center">Selecione um modelo à esquerda</div>}
        </div>
      </div>
    </Modal>
  );
}

export function CallModal({ open, onClose, name, phone, onEnd }: { open: boolean; onClose: () => void; name: string; phone: string; onEnd: (sec: number) => void }) {
  const [sec, setSec] = useState(0);
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  useEffect(() => {
    if (!open) { setSec(0); setConnected(false); return; }
    const c = setTimeout(() => setConnected(true), 2500);
    return () => clearTimeout(c);
  }, [open]);
  useEffect(() => { if (!connected) return; const t = setInterval(() => setSec((s) => s + 1), 1000); return () => clearInterval(t); }, [connected]);
  const end = () => { if (connected) onEnd(sec); onClose(); };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 anim-fade">
      <div className="w-80 rounded-3xl bg-gradient-to-b from-slate-800 to-slate-900 text-white p-8 text-center shadow-2xl anim-pop">
        <Avatar name={name} size={88} className="mx-auto ring-4 ring-white/10" />
        <p className="mt-4 text-lg font-semibold">{name}</p>
        <p className="text-sm text-slate-400">{phone}</p>
        <p className="mt-3 text-sm text-emerald-400 font-medium">{connected ? fmtClock(sec) : 'Chamando…'}</p>
        <div className="mt-8 flex justify-center gap-5">
          <button onClick={() => setMuted(!muted)} className={cx('h-14 w-14 rounded-full grid place-items-center', muted ? 'bg-white text-slate-900' : 'bg-white/10')}><Icon name={muted ? 'MicOff' : 'Mic'} size={22} /></button>
          <button onClick={end} className="h-14 w-14 rounded-full bg-red-500 grid place-items-center hover:bg-red-600"><Icon name="PhoneOff" size={22} /></button>
        </div>
        <p className="mt-6 text-[11px] text-slate-500">Ligação simulada no protótipo</p>
      </div>
    </div>
  );
}

export function ScheduleModal({ open, onClose, contactId, channelId }: { open: boolean; onClose: () => void; contactId: string; channelId: string }) {
  const { upsert, toast, contacts } = useStore();
  const me = useMe();
  const c = contacts.find((x) => x.id === contactId);
  const [body, setBody] = useState('');
  const [when, setWhen] = useState('');
  useEffect(() => {
    if (open) {
      const d = new Date(Date.now() + 24 * 3600e3); d.setMinutes(0);
      setWhen(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
      setBody(`Oi ${c?.name.split(' ')[0]}! Passando para lembrar do seu pedido 😉`);
    }
  }, [open]);
  return (
    <Modal open={open} onClose={onClose} title="Agendar mensagem" subtitle={`Para ${c?.name}`} icon="CalendarClock"
      footer={<><Btn onClick={onClose}>Cancelar</Btn><Btn variant="primary" disabled={!body || !when} onClick={() => { upsert('scheduled', { id: `sm_${Date.now()}`, contactId, channelId, body, sendAt: new Date(when).getTime(), status: 'Agendada', createdBy: me.id }); toast('Mensagem agendada', { tone: 'success' }); onClose(); }}>Agendar</Btn></>}>
      <Field label="Mensagem"><Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} /></Field>
      <Field label="Enviar em" className="mt-3"><Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /></Field>
    </Modal>
  );
}

export { brl, Select };
