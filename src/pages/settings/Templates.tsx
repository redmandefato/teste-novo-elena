import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { DataTable } from '../../components/DataTable';
import { Badge, Btn, Field, Icon, IconBtn, Input, Modal, Page, Segmented, Select, Textarea } from '../../components/ui';
import { fmtDate, uid } from '../../lib/util';
import type { MessageTemplate, QuickReply } from '../../types';

export default function Templates() {
  const st = useStore();
  const [tab, setTab] = useState<'modelos' | 'rapidas'>('modelos');
  const [sel, setSel] = useState<MessageTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Utilidade', body: '' });
  const [qr, setQr] = useState<Partial<QuickReply> | null>(null);
  return (
    <Page title="Modelos de mensagens" subtitle="Modelos aprovados pela Meta (WhatsApp oficial) e respostas rápidas da equipe" actions={<>
      <Segmented value={tab} onChange={setTab} options={[{ id: 'modelos', label: `Modelos (${st.templates.length})` }, { id: 'rapidas', label: `Respostas rápidas (${st.quickReplies.length})` }]} />
      <Btn variant="primary" icon="Plus" onClick={() => (tab === 'modelos' ? setCreating(true) : setQr({ shortcut: '', text: '' }))}>{tab === 'modelos' ? 'Novo modelo' : 'Nova resposta'}</Btn>
    </>}>
      {tab === 'modelos' ? (
        <div className="grid lg:grid-cols-[1fr_340px] gap-5">
          <DataTable rows={st.templates} onRowClick={setSel} search={(t) => t.name + t.body} columns={[
            { key: 'name', label: 'Nome', render: (t) => <span className="font-mono text-xs font-semibold">{t.name}</span> },
            { key: 'category', label: 'Categoria', render: (t) => <Badge tone={t.category === 'Marketing' ? 'violet' : t.category === 'Utilidade' ? 'blue' : 'slate'}>{t.category}</Badge> },
            { key: 'language', label: 'Idioma' },
            { key: 'status', label: 'Status', render: (t) => <Badge tone={t.status === 'Aprovado' ? 'green' : t.status === 'Pendente' ? 'amber' : 'red'} icon={t.status === 'Aprovado' ? 'Check' : t.status === 'Pendente' ? 'Clock' : 'X'}>{t.status}</Badge> },
            { key: 'updatedAt', label: 'Atualizado', render: (t) => fmtDate(t.updatedAt) },
          ]} />
          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-4 h-fit sticky top-0">
            <p className="text-xs font-semibold text-slate-500 mb-3">Pré-visualização no WhatsApp</p>
            {(sel ?? st.templates[0]) && (() => { const t = sel ?? st.templates[0]; return (
              <>
                <div className="rounded-2xl bg-slate-900 p-2"><div className="rounded-xl chat-bg p-4 min-h-[260px]"><div className="bg-white rounded-xl rounded-tl-md p-3 text-sm shadow-sm">{t.header && <p className="font-bold mb-1">{t.header}</p>}<p className="whitespace-pre-wrap">{t.body}</p><p className="text-[10px] text-slate-400 text-right mt-1">10:42</p>{t.buttons?.map((b) => <p key={b} className="text-center text-sky-600 border-t border-slate-100 pt-1.5 mt-1.5">{b}</p>)}</div></div></div>
                <p className="text-sm font-semibold mt-3 font-mono">{t.name}</p>
                {t.rejectionReason && <p className="text-xs text-red-600 mt-2 flex gap-1.5 bg-red-50 rounded-lg p-2"><Icon name="TriangleAlert" size={14} />{t.rejectionReason}</p>}
              </>
            ); })()}
          </div>
        </div>
      ) : (
        <DataTable rows={st.quickReplies} onRowClick={setQr} columns={[
          { key: 'shortcut', label: 'Atalho', render: (q) => <span className="font-mono text-brand-700 font-semibold">/{q.shortcut}</span>, width: 160 },
          { key: 'text', label: 'Mensagem', render: (q) => <p className="text-slate-600">{q.text}</p> },
          { key: 'x', label: '', render: (q) => <IconBtn icon="Trash2" size={15} onClick={(e: any) => { e.stopPropagation(); st.removeItem('quickReplies', q.id); }} /> },
        ]} />
      )}
      <Modal open={creating} onClose={() => setCreating(false)} title="Novo modelo de mensagem" subtitle="O modelo é enviado para aprovação da Meta (normalmente minutos a 24h)" icon="FileText" footer={<><Btn onClick={() => setCreating(false)}>Cancelar</Btn><Btn variant="primary" disabled={!form.name || !form.body} onClick={() => { st.upsert('templates', { id: uid('tp'), name: form.name.toLowerCase().replace(/\s+/g, '_'), category: form.category, language: 'pt_BR', status: 'Pendente', body: form.body, updatedAt: Date.now() }); setCreating(false); st.toast('Modelo enviado para aprovação', { tone: 'success' }); }}>Enviar para aprovação</Btn></>}>
        <div className="space-y-3">
          <Field label="Nome (sem espaços)"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ex.: confirmacao_pedido" /></Field>
          <Field label="Categoria"><Select className="w-full" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option>Utilidade</option><option>Marketing</option><option>Autenticação</option></Select></Field>
          <Field label="Corpo" hint="Use {{1}}, {{2}}… para variáveis"><Textarea rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></Field>
        </div>
      </Modal>
      <Modal open={!!qr} onClose={() => setQr(null)} title={qr?.id ? 'Editar resposta rápida' : 'Nova resposta rápida'} icon="Zap" footer={<><Btn onClick={() => setQr(null)}>Cancelar</Btn><Btn variant="primary" disabled={!qr?.shortcut || !qr?.text} onClick={() => { st.upsert('quickReplies', { id: qr!.id ?? uid('q'), shortcut: qr!.shortcut!.replace('/', ''), text: qr!.text }); setQr(null); }}>Salvar</Btn></>}>
        {qr && <div className="space-y-3"><Field label="Atalho"><Input value={qr.shortcut} onChange={(e) => setQr({ ...qr, shortcut: e.target.value })} placeholder="ex.: frete" /></Field><Field label="Mensagem" hint="Use {agente} e {nome} para personalizar"><Textarea rows={4} value={qr.text} onChange={(e) => setQr({ ...qr, text: e.target.value })} /></Field></div>}
      </Modal>
    </Page>
  );
}
