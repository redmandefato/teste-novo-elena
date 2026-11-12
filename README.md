# Elena · Atendimento

Plataforma de atendimento multicanal (WhatsApp oficial e QR, Instagram, Messenger e chat do site) com distribuição automática por equipes, CRM em kanban, chatbots, campanhas, relatórios e módulo administrativo white label com faturamento de parceiros.

> **Protótipo com dados mockados.** Todos os clientes, conversas e valores são fictícios e gerados por `src/data/seed.ts`. Um simulador traz novos clientes e respostas automáticas para você ver o sistema "vivo".

## Rodar localmente

Pré-requisito: Node.js 20+ (instalado em `~/.local/node` nesta máquina).

```bash
export PATH="$HOME/.local/node/bin:$PATH"
npm install
npm run dev
```

Acesse **http://localhost:5173** e clique em **"Entrar direto com a conta demonstração"**.

## Deploy automático

Cada `push` na branch `main` dispara o workflow `.github/workflows/deploy.yml`, que instala as dependências, roda a verificação de tipos, gera o build e publica no **GitHub Pages**.

## Estrutura

| Pasta | O que tem |
|---|---|
| `src/types.ts` | Modelagem de domínio (todas as entidades) |
| `src/data/seed.ts`, `src/data/scripts.ts` | Gerador de dados mockados e roteiros de conversa |
| `src/store/useStore.ts` | Estado global (zustand) + ações. Ponto único para trocar por API real |
| `src/store/simulator.ts` | Simulador ao vivo (clientes chegando, respostas, "digitando…") |
| `src/lib/pricing.ts` | Motor de faturamento white label (faixas, pró-rata, instâncias QR, mínimo) |
| `src/pages/` | Telas: atendimentos, CRM, apps, relatórios, ajustes e admin |
| `docs/` | Modelagem detalhada, mapa de telas e schema SQL |

## Stack

React 18 · TypeScript · Vite · Tailwind CSS · React Router · Zustand · Recharts · Lucide
