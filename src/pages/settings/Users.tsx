import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { DataTable } from '../../components/DataTable';
import { Avatar, Badge, Btn, Field, Input, Modal, Page, Progress, Select } from '../../components/ui';
import { timeAgo, uid } from '../../lib/util';
import type { User } from '../../types';

const ROLE = { admin: 'Administrador', supervisor: 'Supervisor', agent: 'Atendente' };

export default function Users() {
  const st = useStore();
  const [edit, setEdit] = useState<Partial<User> | null>(null);
  const [teamIds, setTeamIds] = useState<string[]>([]);
  const teamsOf = (uid: string) => st.teams.filter((t) => t.members.some((m) => m.userId === uid));
  const save = () => {
    const isNew = !edit!.id;
    const user = { id: edit!.id ?? uid('u'), name: edit!.name!, email: edit!.email ?? '', phone: edit!.phone ?? '', role: edit!.role ?? 'agent', status: edit!.status ?? 'offline', title: ROLE[edit!.role ?? 'agent'], lastSeenAt: edit!.lastSeenAt ?? Date.now(), createdAt: edit!.createdAt ?? Date.now(), maxConcurrent: edit!.maxConcurrent ?? 8 } as User;
    st.upsert('users', user);
    st.patch('teams', st.teams.map((t) => { const has = t.members.some((m) => m.userId === user.id); const want = teamIds.includes(t.id); if (has === want) return t; return { ...t, members: want ? [...t.members, { userId: user.id, role: 'agent' as const }] : t.members.filter((m) => m.userId !== user.id) }; }));
    st.toast(isNew ? 'Convite enviado por e-mail' : 'Usuário atualizado', { tone: 'success' });
    setEdit(null);
  };
  return (
    <Page title="Usuários" subtitle="Quem atende na sua conta, com perfil de acesso e equipes" actions={<Btn variant="primary" icon="UserPlus" onClick={() => { setEdit({ role: 'agent', maxConcurrent: 8 }); setTeamIds([]); }}>Novo usuário</Btn>}>
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5 flex items-center gap-6 shadow-card">
        <div className="flex-1"><p className="text-sm font-semibold">Licenças em uso: {st.users.length} de {st.company.licenses}</p><Progress value={(st.users.length / st.company.licenses) * 100} className="mt-2" /></div>
        <div className="text-sm text-slate-500 flex gap-5"><span><b className="text-emerald-600">{st.users.filter((u) => u.status === 'online').length}</b> online</span><span><b className="text-amber-500">{st.users.filter((u) => u.status === 'away').length}</b> ausentes</span><span><b>{st.users.filter((u) => u.status === 'offline').length}</b> offline</span></div>
      </div>
      <DataTable rows={st.users} search={(u) => u.name + u.email} onRowClick={(u) => { setEdit(u); setTeamIds(teamsOf(u.id).map((t) => t.id)); }} columns={[
        { key: 'name', label: 'Nome', render: (u) => <span className="flex items-center gap-3"><Avatar name={u.name} size={32} status={u.status} /><span><b className="font-medium">{u.name}</b><span className="block text-xs text-slate-400">{u.email}</span></span></span> },
        { key: 'role', label: 'Perfil', render: (u) => <Badge tone={u.role === 'admin' ? 'dark' : u.role === 'supervisor' ? 'violet' : 'slate'}>{ROLE[u.role]}</Badge> },
        { key: 'teams', label: 'Equipes', render: (u) => <div className="flex flex-wrap gap-1 max-w-xs">{teamsOf(u.id).map((t) => <span key={t.id} className="text-[11px] bg-slate-100 rounded px-1.5 py-0.5">{t.name}</span>)}</div> },
        { key: 'maxConcurrent', label: 'Limite simultâneo', align: 'right' },
        { key: 'lastSeenAt', label: 'Último acesso', render: (u) => (u.status === 'online' ? <span className="text-emerald-600 text-xs font-semibold">Online agora</span> : timeAgo(u.lastSeenAt)) },
      ]} />
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Editar usuário' : 'Novo usuário'} icon="User" footer={<>{edit?.id && edit.id !== 'u1' && <Btn variant="danger" className="mr-auto" onClick={() => { st.removeItem('users', edit.id!); setEdit(null); st.toast('Usuário removido'); }}>Remover</Btn>}<Btn onClick={() => setEdit(null)}>Cancelar</Btn><Btn variant="primary" disabled={!edit?.name} onClick={save}>Salvar</Btn></>}>
        {edit && <div className="grid grid-cols-2 gap-3">
          <Field label="Nome" className="col-span-2"><Input value={edit.name ?? ''} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
          <Field label="E-mail"><Input value={edit.email ?? ''} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></Field>
          <Field label="Telefone"><Input value={edit.phone ?? ''} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></Field>
          <Field label="Perfil"><Select className="w-full" value={edit.role} onChange={(e) => setEdit({ ...edit, role: e.target.value as any })}><option value="agent">Atendente</option><option value="supervisor">Supervisor</option><option value="admin">Administrador</option></Select></Field>
          <Field label="Atendimentos simultâneos"><Input type="number" value={edit.maxConcurrent ?? 8} onChange={(e) => setEdit({ ...edit, maxConcurrent: Number(e.target.value) })} /></Field>
          <Field label="Equipes" className="col-span-2"><div className="flex flex-wrap gap-1.5">{st.teams.filter((t) => !t.isBot).map((t) => <button key={t.id} onClick={() => setTeamIds(teamIds.includes(t.id) ? teamIds.filter((x) => x !== t.id) : [...teamIds, t.id])} className={`text-xs rounded-full px-2.5 py-1 border ${teamIds.includes(t.id) ? 'bg-brand-600 text-white border-brand-600' : 'border-slate-200 text-slate-600'}`}>{t.name}</button>)}</div></Field>
        </div>}
      </Modal>
    </Page>
  );
}
