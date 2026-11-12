import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { DataTable } from '../../components/DataTable';
import { Badge, Page, Select, Stat } from '../../components/ui';
import { fmtDateTime } from '../../lib/util';

const TONE: Record<string, string> = { Conectado: 'green', Desconectado: 'red', 'QR gerado': 'blue', Reconectado: 'violet' };

export default function Connections() {
  const st = useStore();
  const [ev, setEv] = useState('');
  const list = st.admin.connections;
  const rows = list.filter((c) => !ev || c.event === ev);
  return (
    <Page title="Relatório de conexões" subtitle="Histórico de conexão e desconexão das instâncias de WhatsApp de todas as contas">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {(['Conectado', 'Desconectado', 'Reconectado', 'QR gerado'] as const).map((e, i) => <Stat key={e} label={e} value={list.filter((c) => c.event === e).length} icon={['Wifi', 'WifiOff', 'RefreshCw', 'QrCode'][i]} tone={(['brand', 'red', 'violet', 'blue'] as const)[i]} />)}
      </div>
      <DataTable rows={rows} search={(c) => c.accountName + c.channel} initialSort={{ key: 'at', dir: 'desc' }}
        toolbar={<Select value={ev} onChange={(e) => setEv(e.target.value)}><option value="">Todos os eventos</option>{Object.keys(TONE).map((e) => <option key={e}>{e}</option>)}</Select>}
        columns={[
          { key: 'at', label: 'Data/hora', render: (c) => fmtDateTime(c.at) },
          { key: 'accountName', label: 'Conta' },
          { key: 'channel', label: 'Canal', render: (c) => <span className="font-mono text-xs">{c.channel}</span> },
          { key: 'event', label: 'Evento', render: (c) => <Badge tone={TONE[c.event]}>{c.event}</Badge> },
          { key: 'detail', label: 'Detalhe', render: (c) => <span className="text-slate-600">{c.detail}</span> },
        ]} />
    </Page>
  );
}
