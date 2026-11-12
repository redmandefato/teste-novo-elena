import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { DataTable } from '../../components/DataTable';
import { Badge, Btn, Page, Select } from '../../components/ui';
import { downloadCSV, fmtDateTime } from '../../lib/util';

const TONE: Record<string, string> = { Criou: 'green', Alterou: 'blue', Desconectou: 'red', Conectou: 'green', Suspendeu: 'amber', Exportou: 'violet', Login: 'slate' };

export default function Audit() {
  const st = useStore();
  const [entity, setEntity] = useState('');
  const rows = st.admin.audit.filter((a) => !entity || a.entity === entity);
  return (
    <Page title="Auditoria" subtitle="Registro de todas as ações administrativas (quem, o quê, quando e de onde)" actions={<Btn icon="Download" onClick={() => downloadCSV('auditoria.csv', [{ label: 'Data', csv: (a: any) => fmtDateTime(a.at) }, { label: 'Usuário', key: 'userName' }, { label: 'Ação', key: 'action' }, { label: 'Entidade', key: 'entity' }, { label: 'Detalhe', key: 'detail' }, { label: 'IP', key: 'ip' }], rows)}>Exportar</Btn>}>
      <DataTable rows={rows} search={(a) => a.detail + a.userName} initialSort={{ key: 'at', dir: 'desc' }} pageSize={15}
        toolbar={<Select value={entity} onChange={(e) => setEntity(e.target.value)}><option value="">Todas as entidades</option>{[...new Set(st.admin.audit.map((a) => a.entity))].map((e) => <option key={e}>{e}</option>)}</Select>}
        columns={[
          { key: 'at', label: 'Data/hora', render: (a) => <span className="whitespace-nowrap">{fmtDateTime(a.at)}</span> },
          { key: 'userName', label: 'Usuário' },
          { key: 'action', label: 'Ação', render: (a) => <Badge tone={TONE[a.action] ?? 'slate'}>{a.action}</Badge> },
          { key: 'entity', label: 'Entidade' },
          { key: 'detail', label: 'Detalhe', render: (a) => <span className="text-slate-600">{a.detail}</span> },
          { key: 'ip', label: 'IP', render: (a) => <span className="font-mono text-xs text-slate-500">{a.ip}</span> },
        ]} />
    </Page>
  );
}
