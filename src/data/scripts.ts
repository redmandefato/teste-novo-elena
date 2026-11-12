// Roteiros de conversa usados para gerar atendimentos realistas.
// Placeholders: {first} = primeiro nome do cliente, {agent} = primeiro nome do atendente.
// Formato de cada passo: [direção, tipo, texto, extras?]

export type Step = [dir: 'in' | 'out' | 'bot', type: 'text' | 'image' | 'audio' | 'document' | 'location' | 'template', body: string, extra?: any];

export interface Script {
  key: string;
  teamId: string;
  opt: string; // opção escolhida no menu do chatbot
  channel?: 'c4' | 'c5' | 'c6' | 'c2' | 'c3';
  tags: string[];
  classification: string;
  sale?: number;
  intro: Step[];
  waiting?: Step[]; // mensagens extras enquanto aguarda na fila
  body: Step[];
}

export const BOT_MENU =
  'Olá, {first}! 👋 Seja bem-vindo(a) à *Vitta Suplementos*.\nComo podemos te ajudar hoje?\n\n1️⃣ Fazer um pedido (Delivery)\n2️⃣ Nossas lojas\n3️⃣ Atacado / Revenda\n4️⃣ Financeiro\n5️⃣ Trocas e SAC';

export const SCRIPTS: Script[] = [
  {
    key: 'whey', teamId: 't1', opt: '1', tags: ['tg4'], classification: 'Venda realizada', sale: 147.9,
    intro: [['in', 'text', 'Oi, boa tarde! Vocês têm whey da Top 3W?']],
    waiting: [['in', 'text', 'Alguém aí? 😅']],
    body: [
      ['out', 'text', 'Oi {first}, tudo bem? Aqui é a {agent} 😊 Temos sim! O *Top Whey 3W 900g* está R$ 139,90 e o *100% Whey 2kg* sai por R$ 219,90.'],
      ['out', 'image', 'Top Whey 3W 900g — baunilha, chocolate e morango', { src: 'products/whey.svg' }],
      ['in', 'text', 'Qual o valor da entrega pro Parque 10?'],
      ['out', 'text', 'Para o Parque 10 a taxa é R$ 8,00 e entregamos em até 1h 🛵'],
      ['in', 'text', 'Fechado! Quero o de chocolate. Pode ser no Pix?'],
      ['out', 'text', 'Pode sim! Chave Pix (CNPJ): 12.345.678/0001-90\nTotal com entrega: *R$ 147,90* ✅'],
      ['in', 'image', 'Comprovante', { src: 'products/comprovante.svg' }],
      ['out', 'text', 'Pagamento confirmado! Seu pedido já está em separação e sai em instantes. Obrigada pela preferência 💚'],
    ],
  },
  {
    key: 'rastreio', teamId: 't1', opt: '1', tags: ['tg7'], classification: 'Pedido / entrega',
    intro: [['in', 'text', 'Boa noite, meu pedido ainda não chegou. Fiz às 19h']],
    waiting: [['in', 'text', 'Já faz mais de 1h e nada...']],
    body: [
      ['out', 'text', 'Boa noite, {first}! Sou {agent}, vou verificar agora mesmo para você. Pode me confirmar o número do pedido?'],
      ['in', 'text', 'É o 48213'],
      ['out', 'text', 'Encontrei! O motoboy saiu às 19h52 e está a 5 minutos do seu endereço 🛵💨'],
      ['in', 'text', 'Ah ótimo, obrigado!'],
      ['out', 'text', 'Por nada! Qualquer coisa é só chamar. Bom treino! 💪'],
    ],
  },
  {
    key: 'troca', teamId: 't7', opt: '5', tags: ['tg5'], classification: 'Reclamação resolvida',
    intro: [['in', 'text', 'Olá, recebi meu pré-treino com o lacre violado 😡']],
    waiting: [['in', 'image', 'Foto do produto', { src: 'products/avaria.svg' }]],
    body: [
      ['out', 'text', 'Oi {first}, sinto muito pelo ocorrido! Aqui é {agent} do SAC. Pode me enviar uma foto do produto e da nota fiscal?'],
      ['in', 'image', 'Foto do produto', { src: 'products/avaria.svg' }],
      ['in', 'document', 'nota-fiscal-48102.pdf', { fileName: 'nota-fiscal-48102.pdf', fileSize: '182 KB' }],
      ['out', 'text', 'Obrigada! Já registrei a troca (protocolo TR-2291). Um motoboy vai até você hoje com um produto novo e recolhe o avariado, sem custo nenhum.'],
      ['in', 'text', 'Que bom, obrigada pela agilidade 🙏'],
      ['out', 'text', 'Nós que agradecemos a paciência, {first}! 💚'],
    ],
  },
  {
    key: 'atacado', teamId: 't5', opt: '3', channel: 'c3', tags: ['tg3', 'tg1'], classification: 'Venda realizada', sale: 3480,
    intro: [['in', 'text', 'Bom dia! Tenho uma academia e queria comprar no atacado']],
    waiting: [['in', 'text', 'Preciso de uns 20 potes de creatina']],
    body: [
      ['out', 'text', 'Bom dia, {first}! Que ótimo 😊 Sou {agent}, do Atacado. Para compras acima de *R$ 1.000,00* você já garante preço de tabela.'],
      ['out', 'document', 'Tabela Atacado — Novembro 2026.pdf', { fileName: 'Tabela-Atacado-Nov-2026.pdf', fileSize: '1,2 MB' }],
      ['in', 'text', 'Quanto fica 20 creatinas 300g e 10 whey 900g?'],
      ['out', 'text', 'Fica assim:\n• 20× Creatina 300g — R$ 69,90 = R$ 1.398,00\n• 10× Whey 900g — R$ 208,20 = R$ 2.082,00\n*Total: R$ 3.480,00* (frete grátis em Manaus 🚚)'],
      ['in', 'text', 'Consegue parcelar no cartão?'],
      ['out', 'text', 'Consigo sim! No crédito parcelado tem acréscimo de 5%. No Pix ou à vista sai pelo valor da tabela.'],
      ['in', 'text', 'Vou fechar no Pix então. Me manda o pedido'],
      ['out', 'text', 'Perfeito! Gerei a cobrança, o link vai na próxima mensagem 👇'],
    ],
  },
  {
    key: 'creatina', teamId: 't2', opt: '2', channel: 'c2', tags: [], classification: 'Dúvida esclarecida',
    intro: [['in', 'text', 'Oi! Comecei agora a tomar creatina, tenho uma dúvida']],
    waiting: [['in', 'audio', '', { duration: 23 }]],
    body: [
      ['out', 'text', 'Oi {first}! Aqui é {agent} da Loja 😊 Pode perguntar!'],
      ['in', 'audio', '', { duration: 23 }],
      ['out', 'text', 'Entendi! A recomendação geral é 3 a 5g por dia, todos os dias (inclusive nos dias sem treino). Não precisa fazer saturação. Para orientação individual, o ideal é consultar um nutricionista 😉'],
      ['in', 'text', 'Pode tomar junto com o whey?'],
      ['out', 'text', 'Pode sim, sem problema nenhum! Muita gente mistura no shake pós-treino.'],
      ['in', 'text', 'Show, valeu!'],
    ],
  },
  {
    key: 'black', teamId: 't1', opt: '1', tags: ['tg8'], classification: 'Venda realizada', sale: 289.8,
    intro: [['in', 'text', 'Vi a promoção da Black Friday! O cupom BLACK50 ainda vale?']],
    waiting: [['in', 'text', 'Quero aproveitar hoje']],
    body: [
      ['out', 'text', 'Vale sim, {first}! 🖤 O cupom *BLACK50* dá até 50% OFF em produtos selecionados até domingo.'],
      ['out', 'image', 'Super Black Friday Vitta', { src: 'products/promo.svg' }],
      ['in', 'text', 'Quero 2 pré-treinos Insanity então'],
      ['out', 'text', 'Ótima escolha! 2× Insanity 300g com cupom: de R$ 259,80 por *R$ 189,80*. Quer incluir mais alguma coisa?'],
      ['in', 'text', 'Coloca uma creatina também'],
      ['out', 'text', 'Feito! Total: *R$ 289,80* com a creatina 300g. Posso gerar o link de pagamento?'],
    ],
  },
  {
    key: 'horario', teamId: 't3', opt: '2', channel: 'c2', tags: [], classification: 'Dúvida esclarecida',
    intro: [['in', 'text', 'Vocês abrem domingo? Queria passar na loja da Ponta Negra']],
    body: [
      ['out', 'text', 'Oi {first}! Abrimos sim 😊 Domingo das 10h às 16h. De segunda a sábado das 9h às 21h.'],
      ['out', 'location', 'Vitta Suplementos — Ponta Negra', { address: 'Av. Coronel Teixeira, 5705 — Ponta Negra, Manaus/AM' }],
      ['in', 'text', 'Perfeito, passo lá amanhã então'],
      ['out', 'text', 'Te esperamos! 💚'],
    ],
  },
  {
    key: 'boleto', teamId: 't6', opt: '4', tags: ['tg6'], classification: 'Financeiro',
    intro: [['in', 'text', 'Preciso da segunda via do boleto da minha compra']],
    waiting: [['in', 'text', 'Vence hoje']],
    body: [
      ['out', 'text', 'Olá {first}, aqui é {agent} do Financeiro. Vou gerar agora para você!'],
      ['out', 'document', 'boleto-2a-via.pdf', { fileName: 'boleto-2a-via-87341.pdf', fileSize: '96 KB' }],
      ['out', 'text', 'Prontinho! Vencimento atualizado para amanhã, sem juros 😉'],
      ['in', 'text', 'Muito obrigado!'],
    ],
  },
  {
    key: 'personal', teamId: 't2', opt: '2', channel: 'c4', tags: ['tg10', 'tg1'], classification: 'Parceria',
    intro: [['in', 'text', 'Oi! Sou personal trainer, vocês têm desconto para alunos?']],
    waiting: [['in', 'text', 'Tenho uns 40 alunos ativos']],
    body: [
      ['out', 'text', 'Oi {first}! Temos sim 🙌 Nosso *Programa Parceiro Vitta* dá 10% de desconto para seus alunos e comissão de 5% para você.'],
      ['in', 'text', 'Interessante! Como funciona o cadastro?'],
      ['out', 'text', 'Você recebe um cupom exclusivo (ex.: PERSONAL{first}) e acompanha as vendas por um painel. Posso te mandar o formulário?'],
      ['in', 'text', 'Pode mandar sim!'],
    ],
  },
  {
    key: 'insta', teamId: 't11', opt: '1', channel: 'c4', tags: ['tg4'], classification: 'Venda realizada', sale: 119.9,
    intro: [['in', 'text', 'Vi o story de vocês! O pré-treino Insanity ainda está em promoção? 🔥']],
    body: [
      ['out', 'text', 'Oi {first}! Está sim 🔥 De R$ 129,90 por *R$ 94,90* só essa semana.'],
      ['out', 'image', 'Insanity Pré-treino 300g', { src: 'products/pretreino.svg' }],
      ['in', 'text', 'Tem sabor limão?'],
      ['out', 'text', 'Tem sim! Limão, frutas vermelhas e maçã verde 🍋'],
      ['in', 'text', 'Quero o de limão! Entrega no Aleixo?'],
      ['out', 'text', 'Entregamos sim, taxa R$ 7,00. Vou te chamar no WhatsApp para finalizar 😉'],
    ],
  },
  {
    key: 'site', teamId: 't9', opt: '1', channel: 'c6', tags: ['tg9'], classification: 'Dúvida esclarecida',
    intro: [['in', 'text', 'Olá, o site está dando erro no cupom PRIMEIRACOMPRA']],
    body: [
      ['out', 'text', 'Olá {first}! Sou {agent}. O cupom PRIMEIRACOMPRA é válido para pedidos acima de R$ 150,00. Seu carrinho estava abaixo?'],
      ['in', 'text', 'Ah, estava R$ 139. Vou colocar mais uma coisa'],
      ['out', 'text', 'Perfeito! Com uma coqueteleira (R$ 19,90) você já atinge o mínimo 😉'],
    ],
  },
  {
    key: 'posvenda', teamId: 't8', opt: '5', tags: ['tg8'], classification: 'Pesquisa de satisfação',
    intro: [['in', 'text', 'Recebi o pedido, tudo certinho!']],
    body: [
      ['out', 'text', 'Que bom, {first}! Aqui é {agent} do pós-venda. De 0 a 10, quanto você recomendaria a Vitta para um amigo?'],
      ['in', 'text', '10! Atendimento nota mil'],
      ['out', 'text', 'Uhuul! 🎉 Obrigado pelo carinho. Como presente, aqui vai um cupom de 10% na próxima compra: *VOLTEI10*'],
      ['in', 'text', 'Opa, vou usar com certeza 😄'],
    ],
  },
  {
    key: 'pix_pendente', teamId: 't1', opt: '1', tags: ['tg6', 'tg7'], classification: 'Venda realizada', sale: 219.9,
    intro: [['in', 'text', 'Quero o whey 2kg de baunilha']],
    waiting: [['in', 'text', 'Vocês entregam no Tarumã?']],
    body: [
      ['out', 'text', 'Oi {first}! Aqui é {agent} 😊 Temos sim, o *100% Whey 2kg baunilha* sai por R$ 219,90. Entregamos no Tarumã com taxa de R$ 12,00.'],
      ['in', 'text', 'Ok, pode fechar'],
      ['out', 'text', 'Fechado! Total *R$ 231,90*. Chave Pix (CNPJ): 12.345.678/0001-90'],
      ['in', 'text', 'Vou fazer o pix daqui a pouco, tô no trabalho'],
      ['out', 'text', 'Sem problemas! Deixo reservado até as 18h 😉'],
    ],
  },
  {
    key: 'nutri', teamId: 't4', opt: '2', channel: 'c2', tags: ['tg2'], classification: 'Venda realizada', sale: 412.5,
    intro: [['in', 'text', 'Boa tarde! Minha nutricionista passou uma lista, vocês têm tudo?']],
    waiting: [['in', 'image', 'Lista da nutri', { src: 'products/creatina.svg' }]],
    body: [
      ['out', 'text', 'Boa tarde, {first}! Sou {agent}, da Loja Cidade Nova. Me manda a lista que eu confiro 😊'],
      ['in', 'text', 'Whey isolado, creatina, ômega 3 e multivitamínico'],
      ['out', 'text', 'Temos todos! Separei as melhores opções:\n• Whey Isolado 900g — R$ 189,90\n• Creatina 300g — R$ 89,90\n• Ômega 3 120 cáps — R$ 64,90\n• Multi A-Z 60 cáps — R$ 67,80\n*Total: R$ 412,50*'],
      ['in', 'text', 'Perfeito, passo pra buscar às 18h'],
      ['out', 'text', 'Combinado! Fica separado no seu nome 💚'],
    ],
  },
];

export const GROUP_SCRIPTS: { name: string; participants: string[]; lines: [string, string][] }[] = [
  {
    name: 'Vitta • Personal Trainers Parceiros',
    participants: ['Rafa Fit', 'Lucas Coach', 'Camila Personal', 'Thiago Treinos'],
    lines: [
      ['Rafa Fit', 'Pessoal, os cupons de novembro já estão ativos?'],
      ['@agent', 'Já sim! Cada um recebeu o seu por e-mail. Qualquer dúvida me chamem 😉'],
      ['Lucas Coach', 'Meus alunos estão perguntando da creatina gummy, chegou?'],
      ['@agent', 'Chega na sexta! Vou avisar aqui no grupo assim que estiver na loja.'],
      ['Camila Personal', 'Top! Já tenho 5 alunos querendo 🙌'],
    ],
  },
  {
    name: 'Fornecedores • Atacado Norte',
    participants: ['Distribuidora Max', 'Growth Rep. Norte', 'Logística Rápida'],
    lines: [
      ['Distribuidora Max', 'Bom dia! Pedido 7781 sai hoje às 14h do CD.'],
      ['@agent', 'Bom dia! Perfeito, a equipe já está aguardando para conferência.'],
      ['Logística Rápida', 'Caminhão previsto para chegar 16h30.'],
      ['Growth Rep. Norte', 'Lembrando que a tabela de dezembro entra em vigor dia 01 👍'],
    ],
  },
  {
    name: 'Clientes VIP • Black Friday',
    participants: ['Mariana S.', 'Diego R.', 'Patrícia L.', 'Bruno C.', 'Aline M.'],
    lines: [
      ['@agent', '🖤 Acesso antecipado liberado! Cupom VIPBLACK com 55% OFF até meia-noite.'],
      ['Mariana S.', 'Já comprei o meu! 😍'],
      ['Diego R.', 'Vale para o whey isolado também?'],
      ['@agent', 'Vale sim, Diego! Todo o site 😉'],
      ['Patrícia L.', 'Que maravilha, obrigada!'],
    ],
  },
  {
    name: 'Equipe Lojas • Avisos',
    participants: ['Loja Centro', 'Loja Ponta Negra', 'Loja Cidade Nova'],
    lines: [
      ['Loja Centro', 'Estoque de Insanity limão acabou aqui, alguém tem?'],
      ['Loja Ponta Negra', 'Temos 12 unidades, posso transferir'],
      ['@agent', 'Ótimo! Ponta Negra, separa 6 que o motoboy busca às 15h.'],
    ],
  },
];

// Respostas que o "cliente simulado" envia quando o atendente fala com ele
export const CLIENT_REPLIES: { match: RegExp; replies: Step[] }[] = [
  { match: /pix|chave|cnpj/i, replies: [['in', 'text', 'Acabei de fazer o Pix, segue o comprovante 👇'], ['in', 'image', 'Comprovante', { src: 'products/comprovante.svg' }]] },
  { match: /pre[çc]o|valor|r\$|custa|total/i, replies: [['in', 'text', 'Consegue fazer um desconto à vista? 😅'], ['in', 'text', 'Fechado então! Como faço o pagamento?']] },
  { match: /entrega|frete|taxa|motoboy/i, replies: [['in', 'text', 'Perfeito! Meu endereço é Rua das Palmeiras, 245 – Adrianópolis'], ['in', 'location', 'Minha localização', { address: 'Rua das Palmeiras, 245 — Adrianópolis, Manaus/AM' }]] },
  { match: /obrigad|agrade[çc]|valeu/i, replies: [['in', 'text', 'Eu que agradeço! 🙏💚'], ['in', 'text', 'Vocês são demais, até a próxima!']] },
  { match: /foto|imagem|nota fiscal/i, replies: [['in', 'image', 'Foto do produto', { src: 'products/avaria.svg' }]] },
  { match: /hor[áa]rio|abre|funciona/i, replies: [['in', 'text', 'Ah, beleza! Passo lá amanhã então.']] },
  { match: /atacado|tabela|m[íi]nimo/i, replies: [['in', 'text', 'Pode enviar a tabela sim, por favor!']] },
  { match: /cupom|promo|desconto|black/i, replies: [['in', 'text', 'Opa! Vou usar agora mesmo 😍']] },
];

export const CLIENT_DEFAULT: Step[] = [
  ['in', 'text', 'Entendi! 👍'],
  ['in', 'text', 'Certo, obrigado pela informação.'],
  ['in', 'text', 'Ok! E vocês têm em outro sabor?'],
  ['in', 'text', 'Show! Vou ver aqui e já te falo.'],
  ['in', 'text', 'Pode ser 😊'],
  ['in', 'text', 'Beleza, aguardo então!'],
  ['in', 'audio', '', { duration: 12 }],
];

// Primeiras mensagens de novos clientes (usadas pelo simulador ao vivo)
export const NEW_OPENERS: { text: string; teamId: string; channel?: string }[] = [
  { text: 'Oi! Vocês têm creatina da Growth?', teamId: 't1' },
  { text: 'Boa tarde, qual o horário da loja do Centro?', teamId: 't2', channel: 'c2' },
  { text: 'Meu pedido veio faltando a coqueteleira', teamId: 't7' },
  { text: 'Quero revender suplementos na minha cidade, como funciona?', teamId: 't5', channel: 'c3' },
  { text: 'Oi, vocês aceitam cartão na entrega?', teamId: 't1' },
  { text: 'O whey isolado tá com desconto?', teamId: 't11', channel: 'c4' },
  { text: 'Preciso de nota fiscal da compra de ontem', teamId: 't6' },
  { text: 'Olá! Vi o anúncio do pré-treino, ainda tem?', teamId: 't11', channel: 'c4' },
  { text: 'Vocês entregam em Iranduba?', teamId: 't1' },
  { text: 'Quero cancelar meu pedido 48990', teamId: 't7' },
];
