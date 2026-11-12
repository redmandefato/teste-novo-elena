import { useMemo, useState } from 'react';
import { useStore } from '../../store/useStore';
import { DataTable } from '../../components/DataTable';
import { Avatar, Badge, Btn, Drawer, Field, Input, Modal, Page, Select, Stat, Toggle } from '../../components/ui';
import { computeAccount } from '../../lib/pricing';
import { brl, fmtDate, monthKey, uid, sum } from '../../lib/util';
import type { Account } from '../../types';

export default function Accounts() {
  const st = useStore();
  const { accounts, pricing } = st.admin;
  const cur = monthKey(Date.now());
  const [open, setOpen] = useState<Account | null>(null);
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState('');
  const [form, setForm] = useState({ name: '', users: 3, channels: 1 });
  const mrr = (a: Account) => computeAccount(a, cur, pricing)?.total ?? 0;
  const rows = useMemo(() => accounts.filter((a) => !status || a.status === status).map((a) => ({ ...a, mrr: mrr(a), snap: a.history[cur] ?? a.history[Object.keys(a.history).pop()!] })), [accounts, status, pricing]);
  const save = (a: Account) => st.patch('admin', { ...st.admin, accounts: accounts.map((x) => (x.id === a.id ? a : x)) });
  return (
    <Page title="Contas" subtitle="Empresas clientes da sua plataforma white label" actions={<Btn variant="primary" icon="Plus" onClick={() => setCreating(true)}>Nova conta</Btn>}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <Stat label="Contas ativas" value={accounts.filter((a) => a.status === 'Ativa').length} icon="Building" tone="brand" />
        <Stat label="Em teste (trial)" value={accounts.filter((a) => a.status === 'Trial').length} icon="FlaskConical" tone="violet" />
        <Stat label="Canceladas" value={accounts.filter((a) => a.status === 'Cancelada').length} icon="Ban" tone="red" />
        <Stat label="Receita recorrente (mês)" value={brl(sum(rows, (r) => r.mrr))} icon="TrendingUp" tone="amber" />
      </div>
      <DataTable rows={rows} search={(a) => a.name + a.cnpj} onRowClick={setOpen} initialSort={{ key: 'mrr', dir: 'desc' }}
        toolbar={<Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Todos os status</option>{['Ativa', 'Trial', 'Suspensa', 'Cancelada'].map((s) => <option key={s}>{s}</option>)}</Select>}
        columns={[
          { key: 'name', label: 'Conta', render: (a) => <span className="flex items-center gap-3"><Avatar name={a.name} size={32} /><span><b className="font-medium">{a.name}</b><span className="block text-xs text-slate-400">{a.cnpj}</span></span></span> },
          { key: 'status', label: 'Status', render: (a) => <Badge tone={a.status === 'Ativa' ? 'green' : a.status === 'Trial' ? 'violet' : a.status === 'Suspensa' ? 'amber' : 'slate'}>{a.status}</Badge> },
          { key: 'users', label: 'Usuários', align: 'right', sortValue: (a) => a.snap?.users, render: (a) => a.snap?.users },
          { key: 'channels', label: 'Canais', align: 'right', sortValue: (a) => a.snap?.channels, render: (a) => a.snap?.channels },
          { key: 'addons', label: 'Adicionais', render: (a) => <div className="flex gap-1">{a.chatbotAI && <Badge tone="violet">IA</Badge>}{a.asaas && <Badge tone="blue">Asaas</Badge>}{a.snap?.transcription > 0 && <Badge tone="amber">Transcrição</Badge>}</div> },
          { key: 'startBillingAt', label: 'Cliente desde', render: (a) => fmtDate(new Date(a.startBillingAt + 'T12:00').getTime()) },
          { key: 'mrr', label: 'Mensalidade atual', align: 'right', render: (a) => <b>{brl(a.mrr)}</b> },
        ]} />
      <Drawer open={!!open} onClose={() => setOpen(null)} title={open?.name} footer={open && <><Btn onClick={() => { const n = { ...open, status: open.status === 'Suspensa' ? 'Ativa' : 'Suspensa' } as Account; save(n); setOpen(n); st.toast(n.status === 'Suspensa' ? 'Conta suspensa' : 'Conta reativada'); }}>{open.status === 'Suspensa' ? 'Reativar' : 'Suspender'}</Btn><Btn variant="primary" icon="LogIn" onClick={() => st.toast(`Acessando ${open.name} como suporte (protótipo)`)}>Acessar conta</Btn></>}>
        {open && <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3"><div><p className="text-xs text-slate-500">Razão social</p><p className="font-medium">{open.legalName}</p></div><div><p className="text-xs text-slate-500">Responsável</p><p className="font-medium">{open.contactName} · {open.contactPhone}</p></div></div>
          <div className="space-y-2"><Toggle checked={open.chatbotAI} onChange={(v) => { const n = { ...open, chatbotAI: v }; save(n); setOpen(n); }} label="Chatbot com IA" /><Toggle checked={open.asaas} onChange={(v) => { const n = { ...open, asaas: v }; save(n); setOpen(n); }} label="App Asaas" /></div>
          <div><p className="text-xs font-semibold text-slate-500 mb-2">Histórico mensal</p>
            <table className="w-full text-xs"><thead><tr className="text-slate-400 text-left"><th className="py-1">Mês</th><th className="text-right">Usuários</th><th className="text-right">Canais</th><th className="text-right">Valor</th></tr></thead>
              <tbody>{Object.keys(open.history).reverse().map((m) => <tr key={m} className="border-t border-slate-100"><td className="py-1.5">{m}</td><td className="text-right">{open.history[m].users}</td><td className="text-right">{open.history[m].channels}</td><td className="text-right font-medium">{brl(computeAccount(open, m, pricing)?.total ?? 0)}</td></tr>)}</tbody></table>
          </div>
        </div>}
      </Drawer>
      <Modal open={creating} onClose={() => setCreating(false)} title="Nova conta" icon="Building" footer={<><Btn onClick={() => setCreating(false)}>Cancelar</Btn><Btn variant="primary" disabled={!form.name} onClick={() => {
        const today = new Date().toISOString().slice(0, 10);
        const acc: Account = { id: uid('ac'), name: form.name, legalName: form.name + ' LTDA', cnpj: '00.000.000/0001-00', plan: 'Padrão', status: 'Trial', isPartnerAccount: false, chatbotAI: false, asaas: false, startBillingAt: today, endBillingAt: null, contactName: '—', contactPhone: '—', history: { [cur]: { users: form.users, channels: form.channels, transcription: 0, calling: 0 } } };
        st.patch('admin', { ...st.admin, accounts: [...accounts, acc] }); setCreating(false); st.toast('Conta criada em período de teste', { tone: 'success' });
      }}>Criar conta</Btn></>}>
        <div className="grid grid-cols-2 gap-3"><Field label="Nome da empresa" className="col-span-2"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field><Field label="Usuários"><Input type="number" value={form.users} onChange={(e) => setForm({ ...form, users: Number(e.target.value) })} /></Field><Field label="Canais"><Input type="number" value={form.channels} onChange={(e) => setForm({ ...form, channels: Number(e.target.value) })} /></Field></div>
      </Modal>
    </Page>
  );
}
