import { useMemo, useState } from 'react';
import { useStore } from '../../store/useStore';
import { Avatar, Badge, Btn, Card, Icon, Modal, Page, Progress, Select, Stat, TagChip, Field } from '../../components/ui';
import { DataTable } from '../../components/DataTable';
import { byId, fmtDate, pct } from '../../lib/util';

export default function Portfolios() {
  const st = useStore();
  const [sel, setSel] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const [target, setTarget] = useState('');
  const TG = useMemo(() => byId(st.tags), [st.tags]);
  const real = st.contacts.filter((c) => !c.id.startsWith('ctg'));
  const owners = st.users.map((u) => ({ u, contacts: real.filter((c) => c.ownerId === u.id) })).filter((x) => x.contacts.length).sort((a, b) => b.contacts.length - a.contacts.length);
  const withOwner = real.filter((c) => c.ownerId).length;
  const current = owners.find((o) => o.u.id === sel) ?? owners[0];
  const lastSession = (cid: string) => st.sessions.filter((s) => s.contactId === cid).sort((a, b) => b.lastAt - a.lastAt)[0];

  return (
    <Page title="Carteiras" subtitle="Carteirização: cada cliente tem um vendedor responsável, que recebe os atendimentos dele primeiro" actions={<Btn variant="primary" icon="ArrowLeftRight" onClick={() => setMoving(true)}>Transferir carteira</Btn>}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <Stat label="Contatos carteirizados" value={withOwner} hint={`${pct((withOwner / real.length) * 100)} da base`} icon="Wallet" tone="brand" />
        <Stat label="Sem responsável" value={real.length - withOwner} icon="UserX" tone="amber" />
        <Stat label="Vendedores com carteira" value={owners.length} icon="Users" tone="blue" />
        <Stat label="Média por vendedor" value={Math.round(withOwner / Math.max(1, owners.length))} icon="ChartBar" tone="violet" />
      </div>
      <div className="grid lg:grid-cols-3 gap-5">
        <Card title="Vendedores" subtitle="Clique para ver a carteira" bodyClass="!px-2">
          {owners.map(({ u, contacts }) => (
            <button key={u.id} onClick={() => setSel(u.id)} className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left ${current?.u.id === u.id ? 'bg-brand-50' : 'hover:bg-slate-50'}`}>
              <Avatar name={u.name} size={36} status={u.status} />
              <div className="flex-1 min-w-0"><p className="text-sm font-medium">{u.name}</p><Progress value={(contacts.length / owners[0].contacts.length) * 100} className="mt-1.5" /></div>
              <span className="text-sm font-semibold text-slate-700">{contacts.length}</span>
            </button>
          ))}
        </Card>
        <div className="lg:col-span-2">
          {current && (
            <DataTable key={current.u.id} rows={current.contacts} search={(c) => c.name + c.phone} pageSize={10}
              toolbar={<span className="flex items-center gap-2 text-sm font-semibold"><Avatar name={current.u.name} size={24} />Carteira de {current.u.name}</span>}
              columns={[
                { key: 'name', label: 'Cliente', render: (c) => <div><p className="font-medium">{c.name}</p><p className="text-xs text-slate-400">{c.phone}</p></div> },
                { key: 'tags', label: 'Etiquetas', render: (c) => <div className="flex flex-wrap gap-1">{c.tagIds.slice(0, 2).map((t) => TG[t] && <TagChip key={t} tag={TG[t]} small />)}</div> },
                { key: 'last', label: 'Último atendimento', sortValue: (c) => lastSession(c.id)?.lastAt ?? 0, render: (c) => { const s = lastSession(c.id); return s ? <span className="text-xs">{fmtDate(s.lastAt)} <Badge tone={s.status === 'concluded' ? 'green' : 'blue'}>{s.status === 'concluded' ? 'Concluído' : 'Aberto'}</Badge></span> : <span className="text-xs text-slate-400">Nunca atendido</span>; } },
                { key: 'city', label: 'Cidade' },
              ]} />
          )}
        </div>
      </div>
      <Modal open={moving} onClose={() => setMoving(false)} title="Transferir carteira" subtitle="Útil quando um vendedor sai de férias ou deixa a empresa" icon="ArrowLeftRight"
        footer={<><Btn onClick={() => setMoving(false)}>Cancelar</Btn><Btn variant="primary" disabled={!target || !current} onClick={() => { current!.contacts.forEach((c) => st.updateContact(c.id, { ownerId: target })); st.toast(`${current!.contacts.length} contatos transferidos`, { tone: 'success' }); setMoving(false); setSel(target); }}>Transferir {current?.contacts.length} contatos</Btn></>}>
        <div className="flex items-center gap-3">
          <Field label="De" className="flex-1"><div className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 flex items-center text-sm">{current?.u.name}</div></Field>
          <Icon name="ArrowRight" className="mt-5 text-slate-400" />
          <Field label="Para" className="flex-1"><Select className="w-full" value={target} onChange={(e) => setTarget(e.target.value)}><option value="">Selecione…</option>{st.users.filter((u) => u.id !== current?.u.id).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select></Field>
        </div>
      </Modal>
    </Page>
  );
}
