import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore, useMe } from '../../store/useStore';
import { DataTable } from '../../components/DataTable';
import { Badge, Btn, Field, Input, Modal, Page, Select, Stat, IconBtn } from '../../components/ui';
import { brl, byId, fmtDate, sum, uid } from '../../lib/util';
import type { Payment } from '../../types';

const TONE: Record<Payment['status'], string> = { Pago: 'green', Pendente: 'amber', Vencido: 'red', Cancelado: 'slate' };

export default function Payments() {
  const st = useStore();
  const me = useMe();
  const [sp, setSp] = useSearchParams();
  const [status, setStatus] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ contactId: '', description: '', value: '', method: 'Pix' as Payment['method'], due: '' });
  const C = useMemo(() => byId(st.contacts), [st.contacts]);
  useEffect(() => { const c = sp.get('novo'); if (c) { setForm((f) => ({ ...f, contactId: c })); setCreating(true); sp.delete('novo'); setSp(sp, { replace: true }); } }, []);
  const rows = st.payments.filter((p) => !status || p.status === status);
  const paid = st.payments.filter((p) => p.status === 'Pago');
  return (
    <Page title="Pagamentos" subtitle="Cobranças por Pix, boleto e cartão (integração Asaas) enviadas direto na conversa" actions={<Btn variant="primary" icon="Plus" onClick={() => setCreating(true)}>Nova cobrança</Btn>}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <Stat label="Recebido" value={brl(sum(paid, (p) => p.value))} hint={`${paid.length} cobranças`} icon="CircleDollarSign" tone="brand" />
        <Stat label="A receber" value={brl(sum(st.payments.filter((p) => p.status === 'Pendente'), (p) => p.value))} icon="Clock" tone="amber" />
        <Stat label="Vencido" value={brl(sum(st.payments.filter((p) => p.status === 'Vencido'), (p) => p.value))} icon="TriangleAlert" tone="red" />
        <Stat label="Pix (participação)" value={`${Math.round((st.payments.filter((p) => p.method === 'Pix').length / st.payments.length) * 100)}%`} icon="Zap" tone="blue" />
      </div>
      <DataTable rows={rows} search={(p) => `${C[p.contactId]?.name} ${p.description}`} initialSort={{ key: 'dueAt', dir: 'desc' }}
        toolbar={<Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Todos os status</option>{['Pago', 'Pendente', 'Vencido', 'Cancelado'].map((s) => <option key={s}>{s}</option>)}</Select>}
        columns={[
          { key: 'contact', label: 'Cliente', sortValue: (p) => C[p.contactId]?.name, render: (p) => <div><p className="font-medium">{C[p.contactId]?.name}</p><p className="text-xs text-slate-400">{p.description}</p></div> },
          { key: 'value', label: 'Valor', align: 'right', render: (p) => <b>{brl(p.value)}</b> },
          { key: 'method', label: 'Forma' },
          { key: 'status', label: 'Status', render: (p) => <Badge tone={TONE[p.status]}>{p.status}</Badge> },
          { key: 'dueAt', label: 'Vencimento', render: (p) => fmtDate(p.dueAt) },
          { key: 'paidAt', label: 'Pago em', render: (p) => (p.paidAt ? fmtDate(p.paidAt) : '—') },
          { key: 'link', label: '', render: (p) => <IconBtn icon="Link" size={15} title="Copiar link de pagamento" onClick={(e: any) => { e.stopPropagation(); navigator.clipboard?.writeText(p.link); st.toast('Link copiado'); }} /> },
        ]} />
      <Modal open={creating} onClose={() => setCreating(false)} title="Nova cobrança" icon="CreditCard" footer={<><Btn onClick={() => setCreating(false)}>Cancelar</Btn><Btn variant="primary" disabled={!form.contactId || !form.value} onClick={() => {
        st.upsert('payments', { id: uid('pg'), contactId: form.contactId, description: form.description || 'Cobrança avulsa', value: Number(form.value.replace(',', '.')), method: form.method, status: 'Pendente', dueAt: form.due ? new Date(form.due + 'T12:00').getTime() : Date.now() + 3 * 86400e3, paidAt: null, createdBy: me.id, link: `https://pay.vitta.com.br/c/${Math.random().toString(36).slice(2, 12)}` });
        st.toast('Cobrança criada e link gerado', { tone: 'success' }); setCreating(false);
      }}>Gerar cobrança</Btn></>}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cliente" className="col-span-2"><Select className="w-full" value={form.contactId} onChange={(e) => setForm({ ...form, contactId: e.target.value })}><option value="">Selecione…</option>{st.contacts.filter((c) => !c.id.startsWith('ctg')).slice(0, 120).map((c) => <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}</Select></Field>
          <Field label="Descrição" className="col-span-2"><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex.: Pedido delivery #48290" /></Field>
          <Field label="Valor (R$)"><Input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="0,00" /></Field>
          <Field label="Forma"><Select className="w-full" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as any })}><option>Pix</option><option>Boleto</option><option>Cartão de crédito</option></Select></Field>
          <Field label="Vencimento"><Input type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} /></Field>
        </div>
      </Modal>
    </Page>
  );
}
