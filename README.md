# Universidade dos Negócios — plataforma de cursos e infoprodutos

React + TypeScript + Vite + Tailwind + Supabase. Tema escuro com laranja (tokens em `src/index.css`).

## Ver a plataforma agora (sem backend)

```bash
npm install
npm run demo        # http://127.0.0.1:5173
```

Logins de teste (senha `demo1234`): `produtor@demo.com`, `aluno@demo.com`, `afiliado@demo.com`, `rafael@demo.com`.
Os dados ficam em memória e voltam ao início ao recarregar a página. O modo demo só liga com `VITE_DEMO=true`.

## Instalação com Supabase

1. Crie um projeto no Supabase (próprio desta plataforma).
2. No SQL Editor, rode em ordem os arquivos de `supabase/migrations/` (`0001` a `0004`).
3. `cp .env.example .env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
   (o build falha com aviso se estiverem vazios).
4. `npm run dev`

Qualquer pessoa cadastrada vira produtor pelo botão "Quero vender" (função `become_producer`).

## O que tem

| Área | Funcionalidades |
| --- | --- |
| Loja | Busca, categorias, página de vendas (currículo, FAQ, garantia, parcelamento), verificação pública de certificado |
| Checkout | Pix, cartão com parcelas e boleto, cupom, oferta adicional (order bump), resumo do pedido |
| Aluno (estilo streaming) | Banner com o curso em andamento, fileiras (continue assistindo, meus cursos, concluídos, descubra mais), página do curso com episódios por módulo, player em modo cinema com próximo episódio automático, comunidade por episódio, certificado, histórico de compras |
| Produtor | Dashboard (receita por dia, ticket médio, aprovação, top produtos, formas de pagamento), produtos com editor em abas, vendas com filtros/CSV/reembolso, alunos com progresso, cupons, afiliados, financeiro com saldo e saque |
| Afiliação | Marketplace, links com `?ref=`, estatísticas e comissões |

Regras sensíveis ficam no banco (RLS e funções SQL): preço, cupom, parcelas e oferta adicional são calculados no
servidor; o aluno só lê as aulas dos cursos em que está matriculado; saque respeita saldo e garantia.
Taxa da plataforma: 9,9% por venda (constante `TAXA_PLATAFORMA` e função `producer_balance`).

## Sistema de design

Tokens de cor em `src/index.css` (tema escuro padrão e tema claro, alternável no topo do painel; a área de estudo é sempre escura).
Componentes reutilizáveis em `src/components`: `Botao` (variantes e estado de carregamento), `Campo` (rótulo, obrigatório, dica e erro),
`DataTable` (busca, ordenação, paginação, seleção e cartões no celular), `Drawer`, `Menu`, `Breadcrumbs`, `Dialogs` (confirmação,
entrada de texto e avisos), `Esqueleto` e `Icon`. Menu lateral recolhível com grupos e submenus; gaveta no celular.

## Padrão de telas

Fluxos focados (acesso e checkout) usam `Dividido`: conteúdo à esquerda e painel da marca à direita, em tela cheia, sem cabeçalho do site.
Abas são sempre segmentadas (`Abas`); áreas de destaque levam o brilho da marca; títulos em Bricolage Grotesque, números em JetBrains Mono.

## Atividades

O produtor cria atividades interativas na aba **Atividades** do produto e escolhe em qual aula cada uma aparece.

- **Tipos de pergunta:** única escolha, múltipla escolha, verdadeiro ou falso e dissertativa. Cada pergunta tem pontos e uma explicação opcional, mostrada ao aluno depois do envio.
- **Regras:** nota mínima de aprovação, limite de tentativas e opção de tornar a atividade **obrigatória para o certificado**.
- **Correção:** as perguntas de marcar são corrigidas na hora, no servidor. As dissertativas ficam em "Respostas", onde o produtor dá os pontos e um comentário; a nota final é recalculada.
- **Construtor:** edição com validação por pergunta e prévia "Ver como o aluno". Editar uma atividade que já tem envios preserva as notas já registradas.
- **Aluno:** a aula mostra as atividades com a situação (não iniciada, em correção, aprovado, não aprovado); a atividade abre em uma tela própria, uma pergunta por vez, com revisão antes de enviar e gabarito comentado no resultado.
- **Segurança:** o gabarito fica só no servidor. O aluno recebe as perguntas por uma função que não inclui as respostas certas, e as notas só são gravadas pelas funções `submit_activity` e `grade_submission` (migration `0004_atividades.sql`).

## Produtos

- **Página de venda** (`/p/:slug`): resumo com selos, o que o aluno recebe, texto de apresentação, conteúdo em módulos (expandir/recolher), garantia, perguntas frequentes e cursos relacionados. Card de compra fixo no desktop e barra de compra fixa no celular.
- **Editor** (`/painel/produtos/:id`): barra de ações fixa com aviso de alterações não salvas, prévia do card como aparece na loja e checklist "Pronto para publicar?" (publicar exige nome, descrição e ao menos uma aula).
- **Lista**: resumo com totais, receita e vendas por produto, busca, filtro, duplicar e publicar/despublicar.

## Acabamento

Diálogos e avisos próprios (sem `alert/confirm/prompt`), ícones SVG, esqueletos de carregamento, tela de erro, página 404,
termos de uso e política de privacidade (**modelos: revisar com um advogado antes de publicar**), rodapé, título por página,
"pular para o conteúdo" e foco visível para teclado.

## Pagamento (pendente)

O checkout cria o pedido com o método escolhido e o produtor confirma em Vendas. Para integrar um gateway,
chame `settle_order` a partir de uma Edge Function no webhook de pagamento (apenas a service role executa).

## Estrutura

- `src/pages` — telas (`painel/` produtor, `aluno/` aluno e afiliação) · `src/components` — layout e UI
- `src/lib` — cliente Supabase, autenticação, utilidades e o backend de demonstração (`demo.ts`)
- `supabase/migrations` — schema, RLS, funções e storage
