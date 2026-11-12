import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { DataTable } from '../../components/DataTable';
import { Badge, Btn, Field, Input, Modal, Page, Select, Toggle } from '../../components/ui';
import { uid } from '../../lib/util';
import type { CustomAction } from '../../types';

export default function CustomActions() {
  const st = useStore();
  const list = st.admin.customActions;
  const [edit, setEdit] = useState<Partial<CustomAction> | null>(null);
  const save = (l: CustomAction[]) => st.patch('admin', { ...st.admin, customActions: l });
  return (
    <Page title="Ações e menus personalizados" subtitle="Botões que abrem sistemas externos dentro do atendimento, com dados do contato" actions={<Btn variant="primary" icon="Plus" onClick={() => setEdit({ location: 'Menu do chat', openIn: 'Modal', active: true })}>Nova ação</Btn>}>
      <DataTable rows={list} onRowClick={setEdit} columns={[
        { key: 'name', label: 'Nome', render: (a) => <b className="font-medium">{a.name}</b> },
        { key: 'url', label: 'URL', render: (a) => <span className="font-mono text-xs text-slate-500">{a.url}</span> },
        { key: 'location', label: 'Onde aparece', render: (a) => <Badge tone="blue">{a.location}</Badge> },
        { key: 'openIn', label: 'Abre em' },
        { key: 'active', label: 'Ativa', render: (a) => <span onClick={(e) => e.stopPropagation()}><Toggle checked={a.active} onChange={(v) => save(list.map((x) => (x.id === a.id ? { ...x, active: v } : x)))} /></span> },
      ]} />
      <p className="text-xs text-slate-500 mt-3">Variáveis disponíveis: <code>{'{{contato.nome}}'}</code>, <code>{'{{contato.telefone}}'}</code>, <code>{'{{contato.id}}'}</code>, <code>{'{{atendimento.protocolo}}'}</code>, <code>{'{{usuario.email}}'}</code></p>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Editar ação' : 'Nova ação'} icon="SquareMousePointer" footer={<><Btn onClick={() => setEdit(null)}>Cancelar</Btn><Btn variant="primary" disabled={!edit?.name || !edit?.url} onClick={() => { const a = { ...edit, id: edit!.id ?? uid('ca') } as CustomAction; save(list.some((x) => x.id === a.id) ? list.map((x) => (x.id === a.id ? a : x)) : [...list, a]); setEdit(null); }}>Salvar</Btn></>}>
        {edit && <div className="space-y-3">
          <Field label="Nome"><Input value={edit.name ?? ''} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
          <Field label="URL"><Input value={edit.url ?? ''} onChange={(e) => setEdit({ ...edit, url: e.target.value })} placeholder="https://…?tel={{contato.telefone}}" /></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Onde aparece"><Select className="w-full" value={edit.location} onChange={(e) => setEdit({ ...edit, location: e.target.value as any })}><option>Menu do chat</option><option>Painel do contato</option><option>Barra superior</option></Select></Field><Field label="Abrir em"><Select className="w-full" value={edit.openIn} onChange={(e) => setEdit({ ...edit, openIn: e.target.value as any })}><option>Modal</option><option>Nova aba</option></Select></Field></div>
        </div>}
      </Modal>
    </Page>
  );
}
