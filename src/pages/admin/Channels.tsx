import { useMemo, useState } from 'react';
import { useStore } from '../../store/useStore';
import { DataTable } from '../../components/DataTable';
import { Badge, Btn, ChannelGlyph, Icon, Modal, Page, Segmented, Stat } from '../../components/ui';
import { byId, fmtDateTime, timeAgo } from '../../lib/util';

export default function Channels() {
  const st = useStore();
  const [tab, setTab] = useState<'conta' | 'qr'>('conta');
  const [qr, setQr] = useState<string | null>(null);
  const A = useMemo(() => byId(st.admin.accounts), [st.admin.accounts]);
  const inst = st.admin.qrInstances;
  return (
    <Page title="Canais" subtitle="Números de WhatsApp, Instagram, Messenger e webchat conectados" actions={<Segmented value={tab} onChange={setTab} options={[{ id: 'conta', label: 'Canais desta conta' }, { id: 'qr', label: `Instâncias QR (${inst.length})` }]} />}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <Stat label="Canais conectados" value={st.channels.filter((c) => c.status === 'connected').length} icon="Wifi" tone="brand" />
        <Stat label="Desconectados" value={st.channels.filter((c) => c.status !== 'connected').length} icon="WifiOff" tone="red" />
        <Stat label="Instâncias QR ativas (todas as contas)" value={inst.filter((i) => !i.endAt).length} icon="QrCode" tone="blue" />
        <Stat label="Reconexões no mês" value={st.admin.connections.filter((c) => c.event === 'Reconectado').length} icon="RefreshCw" tone="amber" />
      </div>
      {tab === 'conta' ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {st.channels.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-slate-200 shadow-card p-4">
              <div className="flex items-center gap-3"><ChannelGlyph type={c.type} size={36} /><div className="flex-1"><p className="font-semibold">{c.name}</p><p className="text-sm text-slate-500">{c.identifier}</p></div>{c.status === 'connected' ? <Badge tone="green" icon="Wifi">Conectado</Badge> : <Badge tone="red" icon="WifiOff">Desconectado</Badge>}</div>
              <div className="grid grid-cols-2 gap-2 text-xs mt-4"><div className="rounded-lg bg-slate-50 p-2"><p className="text-slate-400">Tipo</p><p className="font-medium">{{ whatsapp: 'WhatsApp oficial (API Cloud)', whatsapp_qr: 'WhatsApp QR (não oficial)', instagram: 'Instagram Direct', messenger: 'Facebook Messenger', webchat: 'Webchat' }[c.type]}</p></div><div className="rounded-lg bg-slate-50 p-2"><p className="text-slate-400">Equipe padrão</p><p className="font-medium">{st.teams.find((t) => t.id === c.teamId)?.name}</p></div></div>
              <div className="flex gap-2 mt-4">{c.type === 'whatsapp_qr' && <Btn size="sm" icon="QrCode" variant={c.status === 'connected' ? 'secondary' : 'primary'} onClick={() => setQr(c.id)}>{c.status === 'connected' ? 'Ver QR' : 'Reconectar'}</Btn>}<Btn size="sm" icon="Settings" onClick={() => st.toast('Configurações do canal (protótipo)')}>Configurar</Btn></div>
            </div>
          ))}
        </div>
      ) : (
        <DataTable rows={inst} search={(i) => A[i.accountId]?.name + i.number + i.instanceId} initialSort={{ key: 'startAt', dir: 'desc' }} columns={[
          { key: 'account', label: 'Empresa', sortValue: (i) => A[i.accountId]?.name, render: (i) => A[i.accountId]?.name },
          { key: 'instanceId', label: 'Instância', render: (i) => <span className="font-mono text-[11px]">{i.instanceId}</span> },
          { key: 'number', label: 'Número' },
          { key: 'startAt', label: 'Início', render: (i) => fmtDateTime(i.startAt) },
          { key: 'endAt', label: 'Fim', sortValue: (i) => i.endAt ?? Infinity, render: (i) => (i.endAt ? fmtDateTime(i.endAt) : '—') },
          { key: 'status', label: 'Status', render: (i) => <Badge tone={i.endAt ? 'slate' : 'green'}>{i.endAt ? 'Encerrada' : 'Conectada'}</Badge> },
        ]} />
      )}
      <Modal open={!!qr} onClose={() => setQr(null)} title="Conectar WhatsApp" subtitle="Abra o WhatsApp no celular › Aparelhos conectados › Conectar aparelho" icon="QrCode" size="sm">
        <div className="grid place-items-center py-4">
          <div className="grid grid-cols-[repeat(21,10px)] gap-0 p-3 bg-white border border-slate-200 rounded-xl">{Array.from({ length: 441 }, (_, k) => { const x = k % 21, y = Math.floor(k / 21); const finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13); const on = finder ? !(x % 6 && y % 6 && !(x > 1 && x < 5 && y > 1 && y < 5)) || (x > 1 && x < 5 && y > 1 && y < 5) || (x > 15 && x < 19 && y > 1 && y < 5) || (x > 1 && x < 5 && y > 15 && y < 19) : ((x * 7 + y * 13 + x * y) % 3 === 0); return <span key={k} className={on ? 'bg-slate-900 h-[10px]' : 'h-[10px]'} />; })}</div>
          <p className="text-xs text-slate-500 mt-3 flex items-center gap-1"><Icon name="Timer" size={13} />O código expira em 60 segundos · atualizado {timeAgo(Date.now())}</p>
          <Btn variant="primary" className="mt-4" onClick={() => { st.patch('channels', st.channels.map((c) => (c.id === qr ? { ...c, status: 'connected' } : c))); setQr(null); st.toast('WhatsApp conectado!', { tone: 'success' }); }}>Simular leitura do QR</Btn>
        </div>
      </Modal>
    </Page>
  );
}
