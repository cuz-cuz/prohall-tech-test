# Auditoria dos requisitos do desafio Prohall

Revisão realizada em 30 de setembro de 2026, comparando o enunciado com o código, os testes, a documentação, o banco local e o repositório remoto.

Legenda:

- **Concluído:** comportamento implementado e com evidência verificável;
- **Parcial:** existe uma solução funcional, mas falta parte exigida para a entrega;
- **Pendente:** ainda precisa ser implementado ou executado.

## Resultado executivo

O núcleo da loja está funcional: importação idempotente, catálogo, busca, carrinho persistente, checkout transacional, pagamento simulado, conta automática e histórico de pedidos. O painel React possui autenticação staff, dashboard, consultas e operação comercial de anúncios, menus, banners e importação. A Fase 13 ainda deve executar a aprovação manual completa de acessibilidade, responsividade, integração painel–loja e concorrência.

A entrega ainda não está pronta. As pendências prioritárias são a aprovação de qualidade do painel, o setup completo em um comando com credencial administrativa de teste, a documentação final do README e a publicação das alterações locais no Git. O deploy continua pendente como diferencial planejado.

## Matriz de conformidade

| Área | Estado | Evidência e pendência |
| --- | --- | --- |
| Nome e identidade própria | Concluído | A loja se chama **Mosaico**, possui tokens visuais, documentação de design e interface responsiva própria. |
| Importação DummyJSON | Concluído | O comando `import_products` percorre a paginação, usa o identificador externo como chave e pode ser repetido sem duplicar ou sobrescrever anúncios. |
| Persistência no banco | Concluído | Produtos importados e anúncios comerciais são entidades separadas em PostgreSQL. |
| ADMIN com login | Concluído no código | O painel React em `/admin` possui login por sessão Django, CSRF, proteção staff, dashboard, consultas e operações comerciais. A aprovação manual completa pertence à Fase 13; o Django Admin segue como contingência. |
| Usuário de teste no README | Pendente | O README informa o usuário padrão e explica variáveis, mas não fornece uma credencial completa e imediatamente utilizável pelo avaliador. |
| Produtos importados no ADMIN | Concluído | A listagem somente leitura, pesquisável, filtrável e paginada está disponível no painel React. |
| Anúncios no ADMIN | Concluído | O painel React cria, edita, ativa e desativa anúncios, com validações de preço, promoção e estoque vinculadas aos campos. |
| Menus no ADMIN | Concluído | Nome, ordem, status e associação ordenada de anúncios são administráveis no painel React. |
| Banners no ADMIN | Concluído | Imagem por URL, link, texto alternativo, ordem, status e período são administráveis no painel React. |
| Pedidos no ADMIN | Concluído | Pedidos são consultáveis como dados somente leitura no painel React e no Django Admin; snapshots detalhados permanecem preservados no banco. |
| Importação pelo painel | Concluído | A reimportação idempotente pode ser confirmada e executada no painel, que exibe novos, atualizados, total e horário de conclusão. |
| Home, menus e banners | Concluído | A Home consome a configuração persistida no backend e possui navegação de banners por gesto e setas. |
| Listagem e detalhe | Concluído | Catálogo geral, menus, paginação, filtros, ordenação, galeria e página de produto estão implementados. |
| Promoções | Concluído | Preço anterior, preço vigente e percentual de desconto aparecem claramente. |
| Busca obrigatória | Concluído | Busca por título, descrição, marca, categoria e menu; ignora caixa e acentos, aceita termos incompletos, ordena por relevância, usa debounce e cancela requisições anteriores. |
| Carrinho | Concluído | Adiciona, altera quantidade, remove, respeita limites e persiste em `localStorage`. |
| Checkout e pagamento | Concluído | O backend recalcula valores, bloqueia estoque e aplica a regra `0000` recusado; qualquer outro final de quatro dígitos é aprovado. |
| Conta automática | Concluído | Nome e e-mail criam ou recuperam o cliente no checkout e estabelecem sessão segura. |
| Meus pedidos | Concluído | Exibe pedidos, itens, quantidades, snapshots, valores, status e data em `America/Sao_Paulo`; consultas são limitadas ao cliente da sessão. |
| Retorno do cliente | Concluído | Acesso posterior usa código temporário de uso único, armazenado com hash e enviado por e-mail. |
| Dinheiro exato | Concluído | Cálculos de autoridade usam `Decimal`/`DecimalField` no backend e constraints no banco. |
| Estoque e concorrência | Concluído | Checkout usa transação e `select_for_update`; teste PostgreSQL cobre disputa pela última unidade. |
| Snapshots de pedido | Concluído | `OrderItem` guarda título, SKU, preço, quantidade, subtotal e imagem da compra. |
| Estados de interface | Concluído no código | Existem estados de carregamento, vazio, erro, indisponibilidade e conflito de checkout. |
| Responsividade mobile | Parcial | O CSS é mobile-first e possui testes de comportamento, mas a rodada manual completa em celular, teclado e leitores de tela ainda precisa ser registrada e aprovada. |
| Migrations | Concluído | As migrations existentes estão versionadas, a Fase 11 não alterou modelos e `makemigrations --check --dry-run` permanece limpo. |
| Setup em um comando | Pendente | `docker compose up --build` cria o banco e aplica migrations, mas não importa produtos, executa `seed_demo` nem garante o usuário de teste. |
| Modelagem no README | Pendente | A modelagem detalhada existe no plano, mas o README ainda não apresenta o diagrama ou a lista de tabelas exigida. |
| Decisões e trade-offs no README | Pendente | As decisões existem em `/vault/decisoes`, mas precisam ser resumidas no README final. |
| Testes documentados no README | Parcial | Os comandos e alguns cenários estão documentados; faltam resultados atuais e a matriz final de cobertura. |
| Limitações e próximos passos no README | Pendente | Ainda não existe uma seção final explícita. |
| Uso e revisão da IA no README | Pendente | `AGENTS.md`, diário e erros existem, mas o README ainda não explica onde a IA ajudou, onde errou e como foi conferida. |
| Regras para IA | Concluído | `AGENTS.md` registra arquitetura, comandos, regras críticas e prevenção de recorrências. |
| Vault | Concluído, requer fechamento | Há decisões, diário, erros e registro de conversas; a fase de entrega deve atualizar o resumo final. |
| `.env.example` e segredos | Concluído | Exemplos existem para backend e frontend; arquivos `.env` são ignorados e a revisão da Fase 10 não encontrou segredos no histórico. |
| Repositório público | Concluído | `https://github.com/cuz-cuz/prohall-tech-test` está público e usa `main`. |
| Histórico incremental | Parcial | Existem oito commits progressivos, mas 56 entradas do trabalho atual estão modificadas ou não rastreadas e ainda não chegaram ao remoto. |
| Deploy | Pendente | Railway, Vercel, e-mail de produção, URLs públicas e smoke test externo ainda não foram executados. |
| Screenshots e vídeo | Pendente/opcional | Screenshots finais planejados ainda não existem; o vídeo de até cinco minutos é opcional. |

## Verificações executadas nesta auditoria

- `python manage.py check`: aprovado;
- `python manage.py makemigrations --check --dry-run`: nenhuma alteração de modelo pendente;
- suíte backend: 66 testes aprovados;
- suíte frontend: 24 testes aprovados;
- lint frontend: aprovado;
- build de produção do frontend: aprovado;
- PostgreSQL, backend e frontend ativos no Docker;
- usuário administrativo local `admin` ativo e `is_superuser`;
- repositório GitHub confirmado como público;
- nenhuma migration nova precisa ser criada, mas migrations existentes ainda precisam entrar em commit.

## Ordem recomendada para concluir

1. **Fase 13 — qualidade do ADMIN React:** aprovação visual, funcional, responsiva, acessível e de concorrência.
2. **Setup reproduzível:** fazer o comando principal importar, popular e criar o usuário de demonstração com credencial documentada e exclusivamente local.
3. **Commitar e publicar o trabalho atual:** dividir as alterações em commits coerentes e confirmar que migrations, documentação e novos arquivos estão rastreados.
4. **Fase 14 — Deploy:** Railway, PostgreSQL, Vercel, e-mail, CORS/CSRF/cookies e smoke test público.
5. **Fase 15 — Documentação e entrega:** README completo, modelagem, decisões, IA, limitações, URLs, screenshots e revisão final de segredos.
6. **Validação manual:** executar e registrar o fluxo completo em celular e desktop antes da entrega.

O vídeo continua opcional. Busca semântica e outras extensões P2 devem esperar até todas as pendências obrigatórias acima serem encerradas.
