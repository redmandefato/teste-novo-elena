import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { DataTable } from '../../components/DataTable';
import { Avatar, Badge, Btn, ChannelGlyph, Page, Select, Stat } from '../../components/ui';
import { byId, downloadCSV, fmtDateTime, fmtDuration, brl, num } from '../../lib/util';
import type { Session } from '../../types';

export default function SessionsReport() {
  const st = useStore();
  const nav = useNavigate();
  const [status, setStatus] = useState('');
  const [team, setTeam] = useState('');
  const [agent, setAgent] = useState('');
  const C = useMemo(() => byId(st.contacts), [st.contacts]);
  const T = useMemo(() => byId(st.teams), [st.teams]);
  const U = useMemo(() => byId(st.users), [st.users]);
  const CH = useMemo(() => byId(st.channels), [st.channels]);
  const rows = st.sessions.filter((s) => (!status || s.status === status) && (!team || s.teamId === team) && (!agent || s.assigneeId === agent));
  const wait = (s: Session) => (s.firstResponseAt ? (s.firstResponseAt - s.startedAt) / 1000 : (Date.now() - s.startedAt) / 1000);
  const concluded = rows.filter((s) => s.concludedAt);
  const cols = [
    { key: 'protocol', label: 'Protocolo', render: (s: Session) => <span className="font-mono text-xs">#{s.protocol}</span> },
    { key: 'contact', label: 'Contato', sortValue: (s: Session) => C[s.contactId]?.name, render: (s: Session) => <span className="flex items-center gap-2"><ChannelGlyph type={CH[s.channelId]?.type} size={18} />{C[s.contactId]?.name}</span> },
    { key: 'team', label: 'Equipe', sortValue: (s: Session) => T[s.teamId]?.name, render: (s: Session) => T[s.teamId]?.name },
    { key: 'agent', label: 'Atendente', sortValue: (s: Session) => U[s.assigneeId ?? '']?.name ?? '', render: (s: Session) => (s.assigneeId ? <span className="flex items-center gap-2"><Avatar name={U[s.assigneeId]?.name} size={22} />{U[s.assigneeId]?.name.split(' ')[0]}</span> : <span className="text-slate-400">Na fila</span>) },
    { key: 'status', label: 'Status', render: (s: Session) => <Badge tone={s.status === 'concluded' ? 'green' : s.status === 'new' ? 'amber' : 'blue'}>{s.status === 'concluded' ? 'Concluído' : s.status === 'new' ? 'Na fila' : 'Em andamento'}</Badge> },
    { key: 'startedAt', label: 'Início', render: (s: Session) => fmtDateTime(s.startedAt) },
    { key: 'wait', label: 'Espera', align: 'right' as const, sortValue: wait, render: (s: Session) => fmtDuration(wait(s)) },
    { key: 'dur', label: 'Duração', align: 'right' as const, sortValue: (s: Session) => (s.concludedAt ?? Date.now()) - s.startedAt, render: (s: Session) => fmtDuration(((s.concludedAt ?? Date.now()) - s.startedAt) / 1000) },
    { key: 'classification', label: 'Classificação', render: (s: Session) => s.classification ?? '—' },
    { key: 'csat', label: 'CSAT', align: 'center' as const, render: (s: Session) => (s.csat ? <span className="text-amber-500">{'★'.repeat(s.csat)}</span> : '—') },
  ];
  return (
    <Page wide title="Relatório de atendimentos" subtitle="Todos os atendimentos com tempos, classificações e avaliações" actions={<Btn icon="Download" onClick={() => downloadCSV('atendimentos.csv', [{ label: 'Protocolo', key: 'protocol' }, { label: 'Contato', csv: (s: Session) => C[s.contactId]?.name }, { label: 'Equipe', csv: (s: Session) => T[s.teamId]?.name }, { label: 'Atendente', csv: (s: Session) => U[s.assigneeId ?? '']?.name ?? '' }, { label: 'Status', key: 'status' }, { label: 'Início', csv: (s: Session) => fmtDateTime(s.startedAt) }, { label: 'Classificação', key: 'classification' }, { label: 'CSAT', key: 'csat' }], rows)}>Exportar CSV</Btn>}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <Stat label="Atendimentos" value={num(rows.length)} icon="MessagesSquare" tone="brand" />
        <Stat label="Espera média (1ª resposta)" value={fmtDuration(rows.reduce((a, s) => a + wait(s), 0) / Math.max(1, rows.length))} icon="Hourglass" tone="amber" />
        <Stat label="Concluídos" value={num(concluded.length)} hint={`${num((concluded.length / Math.max(1, rows.length)) * 100, 0)}% do total`} icon="CircleCheck" tone="blue" />
        <Stat label="Vendas registradas" value={brl(concluded.reduce((a, s) => a + (s.saleValue ?? 0), 0))} icon="CircleDollarSign" tone="violet" />
      </div>
      <DataTable rows={rows} columns={cols} search={(s) => `${s.protocol} ${C[s.contactId]?.name}`} searchPlaceholder="Protocolo ou contato" onRowClick={(s) => nav(`/atendimentos/${s.id}`)} initialSort={{ key: 'startedAt', dir: 'desc' }}
        toolbar={<>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Todos os status</option><option value="new">Na fila</option><option value="open">Em andamento</option><option value="concluded">Concluído</option></Select>
          <Select value={team} onChange={(e) => setTeam(e.target.value)}><option value="">Todas as equipes</option>{st.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select>
          <Select value={agent} onChange={(e) => setAgent(e.target.value)}><option value="">Todos os atendentes</option>{st.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>
        </>} />
    </Page>
  );
}
