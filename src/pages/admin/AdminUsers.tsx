import { useStore } from '../../store/useStore';
import { DataTable } from '../../components/DataTable';
import { Avatar, Badge, Btn, Page, Toggle } from '../../components/ui';
import { timeAgo, uid } from '../../lib/util';

export default function AdminUsers() {
  const st = useStore();
  const list = st.admin.admUsers;
  const save = (l: typeof list) => st.patch('admin', { ...st.admin, admUsers: l });
  return (
    <Page title="Usuários ADM" subtitle="Equipe do parceiro com acesso ao painel administrativo de todas as contas" actions={<Btn variant="primary" icon="UserPlus" onClick={() => { save([...list, { id: uid('au'), name: 'Novo administrador', email: 'novo@nortetech.com.br', role: 'Suporte', lastAccess: Date.now(), active: true }]); st.toast('Convite enviado'); }}>Convidar</Btn>}>
      <DataTable rows={list} columns={[
        { key: 'name', label: 'Nome', render: (u) => <span className="flex items-center gap-3"><Avatar name={u.name} size={32} /><span><b className="font-medium">{u.name}</b><span className="block text-xs text-slate-400">{u.email}</span></span></span> },
        { key: 'role', label: 'Função', render: (u) => <Badge tone={u.role === 'Proprietário' ? 'dark' : 'slate'}>{u.role}</Badge> },
        { key: 'lastAccess', label: 'Último acesso', render: (u) => timeAgo(u.lastAccess) },
        { key: 'active', label: 'Ativo', render: (u) => <Toggle checked={u.active} onChange={(v) => save(list.map((x) => (x.id === u.id ? { ...x, active: v } : x)))} /> },
      ]} />
      <div className="mt-5 rounded-xl bg-white border border-slate-200 p-4 text-sm text-slate-600 shadow-card">
        <p className="font-semibold text-slate-800 mb-2">Permissões por função</p>
        <ul className="grid md:grid-cols-2 gap-1.5 list-disc pl-5"><li><b>Proprietário:</b> tudo, incluindo planos e faturamento</li><li><b>Suporte:</b> acessa contas, canais e auditoria</li><li><b>Financeiro:</b> faturamento, contas e planos</li><li><b>Comercial:</b> cria contas em trial e acompanha o funil</li></ul>
      </div>
    </Page>
  );
}
