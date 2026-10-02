# Auditoria dos requisitos do desafio Prohall

Revisão final realizada em 1º de outubro de 2026, comparando o enunciado com o código, os testes, a documentação, o ambiente publicado e o repositório remoto. A primeira versão desta auditoria, de 30 de setembro, está no histórico do Git.

Legenda:

- **Concluído:** comportamento implementado e com evidência verificável;
- **Parcial:** existe uma solução funcional, com limitação documentada;
- **Pendente:** ainda precisa ser implementado ou executado.

## Resultado executivo

Todos os requisitos obrigatórios estão implementados, testados e publicados. A loja está no ar em <https://mosaico-alpha.vercel.app>, com o painel em `/admin` (usuário `admin` / `Admin@123`). `docker compose up --build` cria o banco do zero já populado e com o usuário de teste. O README traz modelagem, decisões, testes, uso da IA e limitações.

Limitações conhecidas, documentadas no README: sem provedor SMTP em produção, o código de acesso posterior aos pedidos não é enviado no ambiente publicado; as imagens dos banners usam a URL provisória `r2.dev`.

## Matriz de conformidade

| Área | Estado | Evidência e pendência |
| --- | --- | --- |
| Nome e identidade própria | Concluído | A loja se chama **Mosaico**, com tokens visuais, ícone de aba, documentação de design e interface responsiva própria. |
| Importação DummyJSON | Concluído | `import_products` percorre a paginação por categoria do nicho, usa o identificador externo como chave e pode ser repetido sem duplicar ou sobrescrever anúncios. |
| Persistência no banco | Concluído | Produtos importados e anúncios comerciais são entidades separadas em PostgreSQL. |
| ADMIN com login | Concluído | Painel React em `/admin` com login por sessão Django, CSRF e proteção staff; o Django Admin segue como contingência. |
| Usuário de teste no README | Concluído | `admin` / `Admin@123` no README, em `.env.example` e no Compose; criado por `bootstrap_demo` e conferido com login real em produção. |
| Produtos importados no ADMIN | Concluído | Listagem somente leitura, pesquisável, filtrável e paginada. |
| Anúncios no ADMIN | Concluído | Cria, edita, ativa e desativa anúncios, com validações de preço, promoção e estoque. |
| Menus no ADMIN | Concluído | Nome, ordem, status e associação ordenada de anúncios. |
| Banners no ADMIN | Concluído | Imagem por URL ou upload ao Cloudflare R2, link, texto alternativo, ordem única, status e período. |
| Pedidos no ADMIN | Concluído | Pedidos somente leitura com status, forma de pagamento e total. |
| Home, menus e banners | Concluído | Home configurada pelo backend; banners inteiros, sem corte, navegáveis por gesto e setas. |
| Listagem e detalhe | Concluído | Catálogo, menus, paginação, filtros e ordenação em modal, galeria e página de produto aberta no topo. |
| Promoções | Concluído | Preço anterior, preço vigente e percentual de desconto aparecem claramente. |
| Busca obrigatória | Concluído | Título, descrição, marca, categoria e menu; ignora caixa e acentos, aceita termos incompletos, ordena por relevância, sugere produtos enquanto o cliente digita e abre os resultados pela lupa. |
| Busca semântica (diferencial) | Parcial | Consultas em português encontram produtos em inglês por um dicionário do nicho; frases fora do vocabulário seguem a busca textual. |
| Carrinho | Concluído | Adiciona, altera quantidade, remove, respeita limites, persiste em `localStorage` e mostra o resumo com descontos e frete. |
| Checkout e pagamento | Concluído | O backend recalcula valores e bloqueia estoque; cartão final `0000` é recusado e qualquer outro aprovado; Pix simulado com desconto, pago ou expirado. |
| Conta automática | Concluído | Nome e e-mail criam ou recuperam o cliente no checkout e estabelecem sessão segura. |
| Meus pedidos | Concluído | Pedidos, itens, snapshots, descontos, frete, forma de pagamento e data em `America/Sao_Paulo`, limitados ao cliente da sessão. |
| Retorno do cliente | Parcial | Código temporário de uso único, com hash e expiração, funciona localmente; em produção depende de configurar SMTP. |
| Dinheiro exato | Concluído | `Decimal`/`DecimalField` no backend e constraints no banco, inclusive para a composição do total com Pix e frete. |
| Estoque e concorrência | Concluído | Transação e `select_for_update`; teste PostgreSQL cobre a disputa pela última unidade. |
| Snapshots de pedido | Concluído | `OrderItem` guarda título, SKU, preço, quantidade, subtotal e imagem; o pedido guarda descontos e frete da compra. |
| Estados de interface | Concluído | Carregamento, vazio, erro, indisponibilidade, sugestões sem resultado e conflito de checkout. |
| Responsividade mobile | Concluído | Telas conferidas em 390 px: banners, filtros em folha inferior, busca com sugestões, checkout por cartão e Pix. |
| Migrations | Concluído | Versionadas e `makemigrations --check --dry-run` limpo. |
| Setup em um comando | Concluído | `docker compose up --build` aplica migrations e executa `bootstrap_demo`, que importa produtos, prepara a vitrine e cria o administrador num banco vazio; validado num PostgreSQL recém-criado. |
| Modelagem no README | Concluído | Diagrama e tabela com papel e garantias de cada tabela. |
| Decisões e trade-offs no README | Concluído | Resumo no README com links para `vault/decisoes`. |
| Testes documentados no README | Concluído | Comandos, cobertura automatizada, verificação manual e smoke tests de produção. |
| Limitações e próximos passos no README | Concluído | Seção "O que ficou faltando". |
| Uso e revisão da IA no README | Concluído | Seção "Como a IA foi usada", com acertos e erros, ligada a `vault/erros-da-ia.md`. |
| Regras para IA | Concluído | `AGENTS.md` registra arquitetura, comandos, regras críticas e prevenção de recorrências. |
| Vault | Concluído | Decisões, diário, erros e as nove conversas com Codex e Claude Code exportadas sem segredos em `vault/conversas/`. |
| `.env.example` e segredos | Concluído | Exemplos para backend e frontend; `.env` ignorado; varredura do histórico sem chaves. A única credencial versionada é a de teste pública pedida pelo enunciado. |
| Repositório público | Concluído | <https://github.com/cuz-cuz/prohall-tech-test>, branch `main`. |
| Histórico incremental | Concluído | Commits progressivos ao longo do desenvolvimento. |
| Deploy | Concluído | Railway (API e PostgreSQL), Vercel (frontend com proxy `/api`) e Cloudflare R2 (mídias); healthcheck, login, busca e upload conferidos em produção. |
| Vídeo | Opcional | Não produzido. |

## Verificações executadas nesta auditoria

- suíte backend: 120 testes aprovados;
- suíte frontend: 57 testes aprovados;
- lint e build de produção do frontend: aprovados;
- `makemigrations --check --dry-run`: nenhuma alteração pendente;
- `migrate` seguido de `bootstrap_demo` num PostgreSQL vazio: 45 anúncios, 8 menus, 3 banners e login `admin` / `Admin@123` válido; segunda execução sem alterações;
- produção: healthcheck 200 pelo Railway e pelo proxy da Vercel, login administrativo, buscas em português e upload real ao R2;
- repositório GitHub confirmado como público.

## Pendências para a entrega

1. Revogar o token do Cloudflare R2 que apareceu em texto puro numa sessão e cadastrar um novo no Railway.
2. Opcional: configurar SMTP em produção, domínio próprio para as mídias e gravar o vídeo.
