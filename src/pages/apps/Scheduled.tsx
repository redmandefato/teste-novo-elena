import { useMemo, useState } from 'react';
import { useStore } from '../../store/useStore';
import { DataTable } from '../../components/DataTable';
import { Avatar, Badge, Btn, IconBtn, Page, Select, Stat } from '../../components/ui';
import { byId, fmtDateTime } from '../../lib/util';
import { ScheduleModal } from '../inbox/modals';
import type { ScheduledMessage } from '../../types';

const TONE: Record<ScheduledMessage['status'], string> = { Agendada: 'violet', Enviada: 'green', Cancelada: 'slate', Falhou: 'red' };

export default function Scheduled() {
  const st = useStore();
  const [status, setStatus] = useState('');
  const [creating, setCreating] = useState(false);
  const [contact, setContact] = useState('');
  const C = useMemo(() => byId(st.contacts), [st.contacts]);
  const U = useMemo(() => byId(st.users), [st.users]);
  const rows = st.scheduled.filter((s) => !status || s.status === status);
  return (
    <Page title="Mensagens agendadas" subtitle="Lembretes e mensagens programadas para envio futuro" actions={<>
      <Select value={contact} onChange={(e) => setContact(e.target.value)}><option value="">Escolha um contato…</option>{st.contacts.filter((c) => !c.id.startsWith('ctg')).slice(0, 80).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
      <Btn variant="primary" icon="CalendarPlus" disabled={!contact} onClick={() => setCreating(true)}>Agendar mensagem</Btn>
    </>}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {(['Agendada', 'Enviada', 'Cancelada', 'Falhou'] as const).map((s, i) => <Stat key={s} label={s === 'Agendada' ? 'Agendadas' : s === 'Enviada' ? 'Enviadas' : s === 'Cancelada' ? 'Canceladas' : 'Com falha'} value={st.scheduled.filter((x) => x.status === s).length} icon={['CalendarClock', 'Send', 'Ban', 'TriangleAlert'][i]} tone={(['violet', 'brand', 'slate', 'red'] as const)[i]} />)}
      </div>
      <DataTable rows={rows} initialSort={{ key: 'sendAt', dir: 'asc' }} search={(s) => C[s.contactId]?.name + s.body}
        toolbar={<Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Todos os status</option>{['Agendada', 'Enviada', 'Cancelada', 'Falhou'].map((s) => <option key={s}>{s}</option>)}</Select>}
        columns={[
          { key: 'contact', label: 'Contato', sortValue: (s) => C[s.contactId]?.name, render: (s) => <span className="flex items-center gap-2"><Avatar name={C[s.contactId]?.name ?? '?'} size={26} />{C[s.contactId]?.name}</span> },
          { key: 'body', label: 'Mensagem', render: (s) => <p className="max-w-md truncate text-slate-600">{s.body}</p> },
          { key: 'channel', label: 'Canal', render: (s) => st.channels.find((c) => c.id === s.channelId)?.name },
          { key: 'sendAt', label: 'Envio', render: (s) => fmtDateTime(s.sendAt) },
          { key: 'status', label: 'Status', render: (s) => <Badge tone={TONE[s.status]}>{s.status}</Badge> },
          { key: 'createdBy', label: 'Criado por', render: (s) => U[s.createdBy]?.name.split(' ')[0] },
          { key: 'a', label: '', render: (s) => s.status === 'Agendada' && <IconBtn icon="X" size={15} title="Cancelar" onClick={(e: any) => { e.stopPropagation(); st.upsert('scheduled', { ...s, status: 'Cancelada' }); st.toast('Agendamento cancelado'); }} /> },
        ]} />
      <ScheduleModal open={creating} onClose={() => setCreating(false)} contactId={contact} channelId="c1" />
    </Page>
  );
}
