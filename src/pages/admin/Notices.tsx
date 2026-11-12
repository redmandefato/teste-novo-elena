import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Badge, Btn, Field, Icon, Input, Modal, Page, Select, Textarea, Toggle } from '../../components/ui';
import { fmtDate, uid } from '../../lib/util';
import type { Notice } from '../../types';

const STYLE = { info: 'bg-sky-50 border-sky-200 text-sky-800', warning: 'bg-amber-50 border-amber-200 text-amber-800', success: 'bg-emerald-50 border-emerald-200 text-emerald-800' };
const ICON = { info: 'Info', warning: 'TriangleAlert', success: 'Sparkles' };

export default function Notices() {
  const st = useStore();
  const list = st.admin.notices;
  const [edit, setEdit] = useState<Partial<Notice> | null>(null);
  const save = (l: Notice[]) => st.patch('admin', { ...st.admin, notices: l });
  return (
    <Page title="Avisos personalizados" subtitle="Banners exibidos no topo da plataforma para os usuários das contas" actions={<Btn variant="primary" icon="Plus" onClick={() => setEdit({ level: 'info', audience: 'Todas as contas', active: true, startAt: Date.now(), endAt: Date.now() + 7 * 86400e3 })}>Novo aviso</Btn>}>
      <div className="space-y-3">
        {list.map((n) => (
          <div key={n.id} className="bg-white rounded-xl border border-slate-200 shadow-card p-4 flex gap-4">
            <div className={`flex-1 rounded-lg border px-4 py-3 flex gap-3 ${STYLE[n.level]}`}><Icon name={ICON[n.level]} size={18} /><div><p className="font-semibold text-sm">{n.title}</p><p className="text-sm opacity-90">{n.body}</p></div></div>
            <div className="w-56 text-xs text-slate-500 space-y-1"><p><b>Público:</b> {n.audience}</p><p><b>Período:</b> {fmtDate(n.startAt)} a {fmtDate(n.endAt)}</p><div className="flex items-center gap-2 pt-1"><Toggle checked={n.active} onChange={(v) => save(list.map((x) => (x.id === n.id ? { ...x, active: v } : x)))} label={n.active ? 'Ativo' : 'Inativo'} /><Btn size="xs" onClick={() => setEdit(n)}>Editar</Btn></div>{n.endAt < Date.now() && <Badge>Expirado</Badge>}</div>
          </div>
        ))}
      </div>
      <Modal open={!!edit} onClose={() => setEdit(null)} title="Aviso" icon="Megaphone" footer={<><Btn onClick={() => setEdit(null)}>Cancelar</Btn><Btn variant="primary" disabled={!edit?.title} onClick={() => { const n = { ...edit, id: edit!.id ?? uid('nc') } as Notice; save(list.some((x) => x.id === n.id) ? list.map((x) => (x.id === n.id ? n : x)) : [n, ...list]); setEdit(null); st.toast('Aviso salvo', { tone: 'success' }); }}>Salvar</Btn></>}>
        {edit && <div className="space-y-3">
          <Field label="Título"><Input value={edit.title ?? ''} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></Field>
          <Field label="Mensagem"><Textarea rows={3} value={edit.body ?? ''} onChange={(e) => setEdit({ ...edit, body: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Tipo"><Select className="w-full" value={edit.level} onChange={(e) => setEdit({ ...edit, level: e.target.value as any })}><option value="info">Informação</option><option value="warning">Alerta</option><option value="success">Novidade</option></Select></Field><Field label="Público"><Select className="w-full" value={edit.audience} onChange={(e) => setEdit({ ...edit, audience: e.target.value })}><option>Todas as contas</option><option>Contas com WhatsApp oficial</option><option>Contas em trial</option><option>Somente administradores</option></Select></Field></div>
        </div>}
      </Modal>
    </Page>
  );
}
