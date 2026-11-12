import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Avatar, Badge, Btn, Card, ChannelGlyph, Icon, IconBtn, Input, Modal, Page, Select, Toggle, Field } from '../../components/ui';
import { fmtDateTime, uid } from '../../lib/util';
import type { Team } from '../../types';

export default function Teams() {
  const { id } = useParams();
  const nav = useNavigate();
  const st = useStore();
  const [q, setQ] = useState('');
  const [channel, setChannel] = useState('');
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const team = st.teams.find((t) => t.id === id);
  const list = st.teams.filter((t) => t.name.toLowerCase().includes(q.toLowerCase()) && (!channel || t.channelIds.includes(channel))).sort((a, b) => a.name.localeCompare(b.name));
  const groups = list.reduce((m, t) => { const k = t.name[0].toUpperCase(); (m[k] ||= []).push(t); return m; }, {} as Record<string, Team[]>);
  const open = st.sessions.filter((s) => s.status !== 'concluded');

  return (
    <div className="h-full flex">
      <div className="w-[420px] shrink-0 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-5 pb-3">
          <div className="flex items-center"><div className="flex-1"><h1 className="text-2xl font-bold">Equipes</h1><p className="text-xs text-slate-500">{st.teams.length} equipes encontradas</p></div><Btn variant="primary" icon="Plus" onClick={() => setCreating(true)}>Novo</Btn></div>
          <div className="flex gap-2 mt-4"><Input icon="Search" placeholder="Pesquisar" className="flex-1" value={q} onChange={(e) => setQ(e.target.value)} /><Select value={channel} onChange={(e) => setChannel(e.target.value)}><option value="">Canais: todos</option>{st.channels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
        </div>
        <div className="flex-1 overflow-y-auto scroll-thin">
          {Object.entries(groups).map(([k, ts]) => (
            <div key={k}>
              <p className="px-5 py-1 text-xs font-semibold text-slate-400 bg-slate-50">{k}</p>
              {ts.map((t) => (
                <button key={t.id} onClick={() => nav(`/ajustes/equipes/${t.id}`)} className={`w-full flex items-center gap-3 px-5 py-3 border-b border-slate-100 text-left ${t.id === id ? 'bg-brand-50' : 'hover:bg-slate-50'}`}>
                  <Avatar name={t.name} size={38} />
                  <div className="flex-1"><p className="text-sm font-medium flex items-center gap-1.5">{t.name}{t.restricted && <Icon name="Lock" size={12} className="text-slate-400" />}</p><p className="text-xs text-slate-500">{t.members.length ? `${t.members.length} usuário(s)` : 'Nenhum usuário associado'} · {open.filter((s) => s.teamId === t.id).length} atendimentos abertos</p></div>
                  {t.isDefault && <Badge>Padrão</Badge>}{t.isBot && <Badge tone="violet" icon="Bot">Bot</Badge>}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scroll-thin">
        {team ? (
          <div className="max-w-3xl mx-auto p-6 space-y-5">
            <div className="flex items-center gap-4">
              <Avatar name={team.name} size={56} />
              <div className="flex-1"><input className="text-2xl font-bold outline-none rounded focus:bg-white w-full" value={team.name} onChange={(e) => st.upsert('teams', { ...team, name: e.target.value })} /><p className="text-xs text-slate-500">Id: {team.id} · criada em {fmtDateTime(team.createdAt)}</p></div>
              {!team.isDefault && <Btn variant="danger" icon="Trash2" onClick={() => { st.removeItem('teams', team.id); nav('/ajustes/equipes'); st.toast('Equipe excluída'); }}>Excluir</Btn>}
            </div>
            <Card title="Configurações de atendimento">
              <div className="space-y-4">
                <Toggle checked={team.isDefault} onChange={(v) => st.patch('teams', st.teams.map((t) => ({ ...t, isDefault: t.id === team.id ? v : v ? false : t.isDefault })))} label="Equipe padrão" hint="Recebe os atendimentos quando nenhum chatbot direciona" />
                <Field label="Acesso aos atendimentos"><Select className="w-full" value={team.access} onChange={(e) => st.upsert('teams', { ...team, access: e.target.value })}><option value="agent">Atendente — visível apenas ao atendente da conversa e aos supervisores da equipe</option><option value="team">Equipe — todos os membros veem os atendimentos da equipe</option></Select></Field>
                <Toggle checked={team.restricted} onChange={(v) => st.upsert('teams', { ...team, restricted: v })} label="Equipe restrita" hint="Só supervisores podem transferir atendimentos para esta equipe" />
                <Toggle checked={team.distribution} onChange={(v) => st.upsert('teams', { ...team, distribution: v })} label="Distribuição automática de atendimentos" hint="Round-robin entre atendentes online, respeitando o limite simultâneo de cada um" />
                <Toggle checked={team.overflow} onChange={(v) => st.upsert('teams', { ...team, overflow: v })} label="Transbordo na distribuição" hint="Se ninguém aceitar a tempo, o atendimento vai para o próximo atendente" />
                <Field label="Tempo para o atendente iniciar (minutos)" hint="Depois disso o atendimento é redistribuído"><Input type="number" className="w-32" value={team.acceptTimeoutMin} onChange={(e) => st.upsert('teams', { ...team, acceptTimeoutMin: Number(e.target.value) })} /></Field>
              </div>
            </Card>
            <Card title="Canais associados" actions={<Btn size="sm" icon="Link" onClick={() => { navigator.clipboard?.writeText(`https://wa.me/55${(st.channels.find((c) => c.id === team.channelIds[0])?.identifier ?? '').replace(/\D/g, '')}?text=Ol%C3%A1`); st.toast('Link para atendimento direto copiado'); }}>Gerar link direto</Btn>}>
              <div className="flex flex-wrap gap-2">{st.channels.map((c) => { const on = team.channelIds.includes(c.id); return <button key={c.id} onClick={() => st.upsert('teams', { ...team, channelIds: on ? team.channelIds.filter((x) => x !== c.id) : [...team.channelIds, c.id] })} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${on ? 'border-brand-500 bg-brand-50' : 'border-slate-200 opacity-60'}`}><ChannelGlyph type={c.type} size={18} />{c.name}<span className="text-xs text-slate-400">{c.identifier}</span></button>; })}</div>
            </Card>
            <Card title={`Usuários (${team.members.length})`} actions={<Select value="" onChange={(e) => { if (e.target.value) st.upsert('teams', { ...team, members: [...team.members, { userId: e.target.value, role: 'agent' }] }); }}><option value="">+ Adicionar usuário</option>{st.users.filter((u) => !team.members.some((m) => m.userId === u.id)).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>} bodyClass="!px-0">
              {team.members.map((m) => { const u = st.users.find((x) => x.id === m.userId); if (!u) return null; return (
                <div key={m.userId} className="flex items-center gap-3 px-5 py-2.5 border-t border-slate-100">
                  <Avatar name={u.name} size={32} status={u.status} /><span className="flex-1 text-sm font-medium">{u.name}</span>
                  <Select value={m.role} onChange={(e) => st.upsert('teams', { ...team, members: team.members.map((x) => (x.userId === m.userId ? { ...x, role: e.target.value as any } : x)) })}><option value="agent">Usuário</option><option value="supervisor">Supervisor</option></Select>
                  <IconBtn icon="X" size={15} onClick={() => st.upsert('teams', { ...team, members: team.members.filter((x) => x.userId !== m.userId) })} />
                </div>
              ); })}
              {!team.members.length && <p className="px-5 py-4 text-sm text-slate-400 border-t border-slate-100">Nenhum usuário associado {team.isBot && '— equipe atendida por IA'}</p>}
            </Card>
          </div>
        ) : (
          <div className="h-full grid place-items-center text-center p-8"><div><Icon name="UsersRound" size={40} className="mx-auto text-slate-300" /><p className="mt-3 font-semibold text-slate-600">Selecione uma equipe para ver e editar</p><p className="text-sm text-slate-400">Distribuição, canais, transbordo e membros</p></div></div>
        )}
      </div>
      <Modal open={creating} onClose={() => setCreating(false)} title="Nova equipe" icon="UsersRound" footer={<><Btn onClick={() => setCreating(false)}>Cancelar</Btn><Btn variant="primary" disabled={!name} onClick={() => { const tid = uid('t'); st.upsert('teams', { id: tid, name, isDefault: false, access: 'agent', restricted: false, distribution: true, overflow: true, acceptTimeoutMin: 4, channelIds: ['c1'], members: [], createdAt: Date.now() }); setCreating(false); setName(''); nav(`/ajustes/equipes/${tid}`); }}>Criar</Btn></>}>
        <Field label="Nome da equipe"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Loja Shopping" /></Field>
      </Modal>
    </div>
  );
}

