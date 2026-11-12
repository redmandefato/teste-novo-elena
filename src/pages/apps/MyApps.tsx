import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Badge, Btn, Icon, Input, Page, Segmented } from '../../components/ui';

export default function MyApps() {
  const st = useStore();
  const [tab, setTab] = useState<'todos' | 'instalados'>('todos');
  const [q, setQ] = useState('');
  const list = st.apps.filter((a) => (tab === 'todos' || a.installed) && (a.name + a.description + a.category).toLowerCase().includes(q.toLowerCase()));
  return (
    <Page title="Meus apps" subtitle="Amplie a plataforma com integrações e recursos extras" actions={<Segmented value={tab} onChange={setTab} options={[{ id: 'todos', label: 'Loja de apps' }, { id: 'instalados', label: `Instalados (${st.apps.filter((a) => a.installed).length})` }]} />}>
      <Input icon="Search" placeholder="Buscar apps" className="w-80 mb-5" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {list.map((a) => (
          <div key={a.id} className="bg-white rounded-xl border border-slate-200 shadow-card p-4 flex flex-col">
            <div className="flex items-start gap-3"><span className="h-11 w-11 rounded-xl grid place-items-center text-white" style={{ background: a.color }}><Icon name={a.icon} size={22} /></span><div className="flex-1"><p className="font-semibold">{a.name}</p><p className="text-xs text-slate-400">{a.category}</p></div>{a.installed && <Badge tone="green" icon="Check">Instalado</Badge>}</div>
            <p className="text-sm text-slate-600 mt-3 flex-1">{a.description}</p>
            <div className="flex items-center mt-4"><span className="text-xs font-semibold text-slate-500 flex-1">{a.price}</span>
              <Btn size="sm" variant={a.installed ? 'secondary' : 'primary'} onClick={() => { st.upsert('apps', { ...a, installed: !a.installed }); st.toast(a.installed ? `${a.name} desinstalado` : `${a.name} instalado!`, { tone: a.installed ? 'default' : 'success' }); }}>{a.installed ? 'Desinstalar' : 'Instalar'}</Btn>
            </div>
          </div>
        ))}
      </div>
    </Page>
  );
}
