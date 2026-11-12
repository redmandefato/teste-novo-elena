import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { DataTable } from '../../components/DataTable';
import { Avatar, Btn, Drawer, Field, Input, Modal, Page, Select, TagChip, Toggle, Icon, Stat } from '../../components/ui';
import { downloadCSV, fmtDate, maskPhone, byId } from '../../lib/util';
import ContactPanel from '../inbox/ContactPanel';
import type { Contact } from '../../types';

export default function Contacts() {
  const st = useStore();
  const nav = useNavigate();
  const [archived, setArchived] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [tag, setTag] = useState('');
  const [owner, setOwner] = useState('');
  const [open, setOpen] = useState<Contact | null>(null);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', instagram: '', city: 'Manaus' });
  const TG = useMemo(() => byId(st.tags), [st.tags]);
  const U = useMemo(() => byId(st.users), [st.users]);

  const rows = st.contacts.filter((c) => !c.id.startsWith('ctg') && c.archived === archived && (blocked ? c.blocked : !c.blocked || archived) && (!tag || c.tagIds.includes(tag)) && (!owner || c.ownerId === owner));
  const cols = [
    { key: 'name', label: 'Nome', render: (c: Contact) => <div className="flex items-center gap-3"><Avatar name={c.name} size={32} /><div><p className="font-medium text-slate-800">{c.name}</p><p className="text-xs text-slate-400">{c.city} · {c.origin}</p></div></div> },
    { key: 'phone', label: 'Telefone' },
    { key: 'instagram', label: 'Instagram', render: (c: Contact) => c.instagram || <span className="text-slate-300">—</span> },
    { key: 'email', label: 'E-mail', render: (c: Contact) => c.email || <span className="text-slate-300">—</span> },
    { key: 'tags', label: 'Etiquetas', sortValue: (c: Contact) => c.tagIds.length, render: (c: Contact) => <div className="flex flex-wrap gap-1 max-w-[220px]">{c.tagIds.map((t) => TG[t] && <TagChip key={t} tag={TG[t]} small />)}</div> },
    { key: 'owner', label: 'Carteira', sortValue: (c: Contact) => U[c.ownerId ?? '']?.name ?? '', render: (c: Contact) => (c.ownerId ? <span className="text-xs">{U[c.ownerId]?.name}</span> : <span className="text-slate-300">—</span>) },
    { key: 'createdAt', label: 'Criado em', render: (c: Contact) => fmtDate(c.createdAt) },
  ];
  const withSession = st.sessions.filter((s) => s.status !== 'concluded').length;

  return (
    <Page title="Contatos" subtitle={`${st.contacts.length} contatos na base · ${withSession} em atendimento agora`} actions={<>
      <Btn icon="Download" onClick={() => downloadCSV('contatos.csv', [{ label: 'Nome', key: 'name' }, { label: 'Telefone', key: 'phone' }, { label: 'E-mail', key: 'email' }, { label: 'Instagram', key: 'instagram' }, { label: 'Cidade', key: 'city' }, { label: 'Etiquetas', csv: (c: Contact) => c.tagIds.map((t) => TG[t]?.name).join(', ') }], rows)}>Exportar contatos</Btn>
      <Btn icon="Upload" onClick={() => setImporting(true)}>Importar contatos</Btn>
      <Btn variant="primary" icon="Plus" onClick={() => setCreating(true)}>Novo</Btn>
    </>}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <Stat label="Total de contatos" value={st.contacts.filter((c) => !c.id.startsWith('ctg')).length} icon="Contact" tone="brand" />
        <Stat label="Com carteira definida" value={st.contacts.filter((c) => c.ownerId).length} icon="Wallet" tone="violet" />
        <Stat label="Qualificados" value={st.contacts.filter((c) => c.tagIds.includes('tg1')).length} icon="BadgeCheck" tone="blue" />
        <Stat label="Novos nos últimos 30 dias" value={st.contacts.filter((c) => Date.now() - c.createdAt < 30 * 86400e3).length} icon="UserPlus" tone="amber" trend={12.4} />
      </div>
      <DataTable rows={rows} columns={cols} search={(c) => `${c.name} ${c.phone} ${c.email} ${c.instagram}`} searchPlaceholder="Pesquisar por nome, telefone, e-mail…" onRowClick={setOpen} pageSize={12}
        toolbar={<>
          <Select value={tag} onChange={(e) => setTag(e.target.value)}><option value="">Todas as etiquetas</option>{st.tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select>
          <Select value={owner} onChange={(e) => setOwner(e.target.value)}><option value="">Todas as carteiras</option>{st.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>
          <Toggle checked={archived} onChange={setArchived} label="Arquivados" />
          <Toggle checked={blocked} onChange={setBlocked} label="Bloqueados" />
        </>} />

      <Drawer open={!!open} onClose={() => setOpen(null)} title={open?.name} width={420} footer={open && <Btn variant="primary" icon="MessageSquare" onClick={() => { const sid = st.startConversation(open.phone); nav(`/atendimentos/${sid}?aba=meus`); }}>Iniciar conversa</Btn>}>
        {open && <div className="-m-5 h-[calc(100%+40px)]"><ContactPanel contactId={open.id} embedded /></div>}
      </Drawer>

      <Modal open={creating} onClose={() => setCreating(false)} title="Novo contato" icon="UserPlus" footer={<><Btn onClick={() => setCreating(false)}>Cancelar</Btn><Btn variant="primary" disabled={!form.name || !form.phone} onClick={() => { st.addContact(form); setCreating(false); setForm({ name: '', phone: '', email: '', instagram: '', city: 'Manaus' }); st.toast('Contato criado', { tone: 'success' }); }}>Salvar</Btn></>}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome *" className="col-span-2"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Telefone *"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })} placeholder="(92) 99999-9999" /></Field>
          <Field label="E-mail"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Instagram"><Input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="@usuario" /></Field>
          <Field label="Cidade"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
        </div>
      </Modal>

      <Modal open={importing} onClose={() => setImporting(false)} title="Importar contatos" subtitle="Planilha CSV ou XLSX com as colunas nome, telefone, e-mail e etiquetas" icon="Upload" footer={<><Btn onClick={() => setImporting(false)}>Cancelar</Btn><Btn variant="primary" onClick={() => { setImporting(false); st.toast('Importação simulada: 0 contatos novos (protótipo)'); }}>Importar</Btn></>}>
        <label className="block border-2 border-dashed border-slate-200 rounded-xl p-10 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50/40">
          <Icon name="FileSpreadsheet" size={32} className="mx-auto text-slate-400" />
          <p className="mt-2 text-sm font-medium text-slate-700">Arraste o arquivo aqui ou clique para selecionar</p>
          <p className="text-xs text-slate-400">Até 50.000 linhas · modelo disponível para download</p>
          <input type="file" className="hidden" />
        </label>
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500"><Icon name="Info" size={14} />Contatos com telefone já existente serão atualizados, não duplicados.</div>
      </Modal>
    </Page>
  );
}
