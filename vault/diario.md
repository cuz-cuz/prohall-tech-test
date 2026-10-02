# Diário de desenvolvimento

## 30 de setembro de 2026 — Fase 0

### Feito

- leitura do enunciado completo a partir da captura desktop;
- substituição do plano antigo pelo plano correto da loja virtual;
- definição da stack React + Django + PostgreSQL;
- definição de Vercel + Railway + Railway PostgreSQL;
- escolha do nome de trabalho Mosaico;
- documentação do contrato público do DummyJSON;
- criação das regras permanentes em `AGENTS.md`;
- criação da estrutura inicial do vault;
- criação do `.gitignore` antes do primeiro commit;
- inicialização do repositório Git na branch `main`;
- organização da captura original do desafio.

### Validado

- endpoint paginado de produtos respondeu com `products`, `total`, `skip` e `limit`;
- campos atuais do produto foram inspecionados;
- nenhum token é necessário para a listagem pública;
- a API externa não será usada como banco da loja.

### Próximo

- iniciar a Fase 1 somente após trocar para GPT-5.6 Sol — Medium.

## 30 de setembro de 2026 — Fase 1

### Feito

- criado frontend React 19 com Vite 8 e React Router;
- criada página inicial mínima e rota 404;
- configurados Vitest, Testing Library, lint e build;
- criado backend Django 5.2 LTS com Django REST Framework;
- configurados PostgreSQL por `DATABASE_URL`, CORS, CSRF, timezone e WhiteNoise;
- criado `GET /api/health/`;
- criados testes básicos do frontend e do healthcheck;
- adicionados `.env.example` para frontend e backend;
- adicionados Dockerfiles e `docker-compose.yml`;
- criado README inicial com comandos executáveis;
- removidos assets padrão não utilizados do Vite.

### Validado

- `python manage.py check` sem erros;
- 3 testes backend aprovados;
- 2 testes frontend aprovados;
- lint frontend aprovado;
- build de produção frontend aprovado;
- `GET http://127.0.0.1:8000/api/health/` respondeu HTTP 200;
- `GET http://127.0.0.1:5173/` respondeu HTTP 200;
- npm audit não encontrou vulnerabilidades nas dependências instaladas.

### Limitações do ambiente

- o PostgreSQL do computador está ativo, mas as credenciais locais não foram fornecidas;
- migrations reais não foram aplicadas nesse serviço local;
- Docker não está instalado neste computador, então o Compose precisa ser validado em casa;
- o healthcheck foi testado via WSGI sem acessar banco, pois esse endpoint é independente dele.

### Próximo

- configurar uma `DATABASE_URL` local válida ou validar o Compose em casa;
- antes da Fase 2, trocar para GPT-5.6 Sol — High;
- implementar somente produtos importados e sincronização na Fase 2.

## 30 de setembro de 2026 — Fase 2

### Feito

- criado o modelo `ImportedProduct` com identificador externo único;
- adicionadas constraints de preço e desconto;
- criada e versionada a migration inicial do catálogo;
- configurado Admin somente leitura para produtos externos;
- criado cliente HTTP com timeout, paginação e validação de contrato;
- implementada detecção de IDs duplicados e paginação inconsistente;
- criada normalização segura de dinheiro, estoque e textos;
- implementada importação atômica e idempotente com `update_or_create`;
- criado o comando `python manage.py import_products`;
- adicionados testes unitários e testes de persistência;
- documentada a decisão da importação atômica.

### Validado

- Django check sem erros;
- migration consistente com os models;
- 16 testes sem banco aprovados, incluindo paginação, normalização e Admin;
- API real retornou 194 produtos;
- os 194 produtos reais foram normalizados sem erro;
- nenhum dado externo foi gravado durante a validação sem banco.

### Limitações do ambiente

- os 2 testes de persistência/idempotência exigem um PostgreSQL acessível;
- migrations e comando real de importação ainda não foram executados no banco local por falta de credenciais;
- a validação completa deve ser feita com `docker compose up --build` em casa.

### Próximo

- validar migrations, 15 testes do catálogo (18 no total) e duas importações consecutivas no Docker;
- confirmar que a contagem permanece 194 após a segunda importação;
- iniciar a Fase 3 apenas depois dessa confirmação.

## 30 de setembro de 2026 — Fase 3

### Feito

- avanço autorizado pelo responsável mesmo com a validação PostgreSQL/Docker da Fase 2 pendente;
- criados `Listing`, `Menu`, `MenuListing` e `Banner` com ordenação e constraints;
- mantida a separação entre dados importados e dados comerciais;
- configurado Django Admin para anúncios, menus, banners e produtos externos somente leitura;
- incluído atalho do produto importado para criação ou edição de anúncio;
- adicionadas ações administrativas para ativar e desativar anúncios;
- implementado `seed_demo` idempotente para anúncios, menus, vínculos, banners e administrador opcional;
- implementados endpoints públicos de Home, menus, listagens e detalhes;
- anúncios inativos foram excluídos da API e anúncios sem estoque permanecem visíveis como indisponíveis;
- criada migration `0002` do catálogo;
- README e variáveis de ambiente foram atualizados.

### Validado

- `python manage.py check` sem erros;
- 21 testes sem banco aprovados;
- 33 testes completos aprovados em SQLite em memória, incluindo migrations, constraints, Admin, comando de demonstração e endpoints;
- `makemigrations --check` sem alterações pendentes;
- `collectstatic` de produção gerou e pós-processou os arquivos do Django Admin sem erros;
- nenhuma senha administrativa foi adicionada ao repositório.

### Limitações do ambiente

- a suíte completa ainda precisa ser executada em PostgreSQL;
- o Compose continua sem validação neste computador;
- a importação real e o `seed_demo` ainda precisam ser executados no banco Docker em casa;
- SQLite foi usado somente como verificação complementar e não substitui PostgreSQL.

### Próximo

- em casa, executar migrations, importar produtos duas vezes, rodar `seed_demo` e executar a suíte completa no Docker;
- antes da Fase 4, selecionar GPT-5.6 Sol — Medium;
- construir a estrutura visual responsiva sem antecipar busca, carrinho ou checkout.

## 30 de setembro de 2026 — Fase 4

### Feito

- definido o sistema visual “A Vitrine Clara” e documentados tokens, componentes e regras em `DESIGN.md`;
- criada estrutura pública responsiva com cabeçalho, navegação por menus e rodapé;
- criada Home com banners administráveis, benefícios verificáveis, anúncios e menus;
- criadas páginas de menu, detalhe de produto e rota não encontrada;
- implementados cards com preço normal/promocional, estoque, categoria e imagem resiliente;
- implementados estados de carregamento, sucesso, vazio e erro para chamadas assíncronas;
- adicionados foco visível, skip link, hierarquia de títulos, textos alternativos, lazy loading e redução de movimento;
- busca, carrinho e checkout foram deliberadamente omitidos até suas fases funcionais, evitando controles inativos.

### Validado

- 5 testes do frontend aprovados;
- lint do frontend aprovado sem alertas;
- build de produção do frontend aprovado;
- auditoria mecânica do sistema visual sem ocorrências;
- integração local respondeu com 2 banners, 4 menus e 24 anúncios ativos;
- endpoints de Home, menu, listagens e detalhe responderam com os dados importados;
- servidor do frontend respondeu HTTP 200.

### Limitações do ambiente

- a inspeção visual automatizada em navegador não pôde ser executada porque esta sessão não disponibilizou nenhum navegador controlável;
- SQLite foi usado somente para a prévia integrada da interface; PostgreSQL continua obrigatório e pendente de validação completa no Docker;
- o Compose continua sem validação neste computador.

### Próximo

- conferir visualmente a interface no navegador em celular e desktop quando houver navegador disponível;
- em casa, concluir a validação pendente com PostgreSQL e Docker;
- antes da Fase 5, trocar para GPT-5.6 Sol — High;
- implementar busca com `unaccent`, `pg_trgm`, ranking e debounce.

## 30 de setembro de 2026 — Fase 5

### Feito

- habilitadas as extensões PostgreSQL `unaccent` e `pg_trgm` por migration condicionada ao banco;
- criada a função imutável `mosaico_normalize` para normalizar caixa, acentos e separadores;
- criados índices GIN por trigramas para título, descrição, marca, categoria e nome de menu;
- implementado ranking ponderado, priorizando título, marca, categoria, menus e descrição;
- busca restrita a anúncios ativos e menus ativos;
- endpoint paginado `GET /api/listings/search/?q=...&page=...` com validação de entrada;
- fallback determinístico em Python para testes locais com SQLite, sem substituir o caminho PostgreSQL de produção;
- adicionada busca global ao cabeçalho com debounce de 350 ms e cancelamento de requisições anteriores;
- criada página `/busca` com URL compartilhável, paginação e estados inicial, carregando, vazio, erro e sucesso;
- atualizado o sistema visual sem antecipar carrinho ou checkout.

### Validado

- Django check sem erros e nenhuma migration de modelo pendente;
- 39 testes backend aprovados, incluindo acentos, caixa, termos incompletos, marca, categoria, menu, relevância, paginação e anúncios inativos;
- 8 testes frontend aprovados, incluindo debounce, resultado e estado vazio;
- lint e build de produção do frontend aprovados;
- auditoria mecânica do sistema visual sem ocorrências;
- consulta PostgreSQL compilada pelo ORM sem `GROUP BY` que impeça os filtros principais de permanecerem no `WHERE`;
- integração local retornou 5 resultados reais para `beauty`, HTTP 200 na página de busca e HTTP 400 para termo inválido.

### Limitações do ambiente

- a criação real das extensões e índices GIN ainda precisa ser executada em PostgreSQL;
- `EXPLAIN ANALYZE` e desempenho real dos índices dependem da validação no Docker/PostgreSQL em casa;
- SQLite foi usado somente para testes complementares e prévia integrada;
- a inspeção visual automatizada continuou indisponível porque esta sessão não ofereceu navegador controlável.

### Próximo

- em casa, aplicar a migration `0003`, confirmar as extensões e inspecionar a consulta com `EXPLAIN ANALYZE`;
- antes da Fase 6, trocar para GPT-5.6 Sol — Medium;
- implementar carrinho com Context API, reducer e persistência em `localStorage`.

## 30 de setembro de 2026 — Fase 6

### Feito

- criado carrinho global com Context API e reducer puro;
- implementadas ações de adicionar, incrementar, diminuir, remover e limpar;
- produtos duplicados são consolidados pelo identificador do anúncio;
- quantidades são limitadas ao estoque conhecido e produtos indisponíveis não são adicionados;
- persistência versionada em `localStorage` com restauração e descarte seguro de dados corrompidos;
- subtotal calculado em centavos inteiros, evitando acumulação de erro de ponto flutuante;
- adicionado contador acessível no cabeçalho e ação funcional no detalhe do produto;
- criada rota `/carrinho` com estado vazio, lista de produtos, preços promocionais, controles de quantidade e resumo estimado;
- resumo informa que preço, atividade e estoque serão confirmados pelo backend;
- checkout não foi antecipado e nenhum botão inativo foi incluído.

### Validado

- 15 testes frontend aprovados;
- testes cobrem reducer, deduplicação, limite de estoque, dados inválidos, restauração, subtotal exato, adição, atualização e remoção;
- lint do frontend aprovado sem alertas;
- build de produção do frontend aprovado;
- auditoria mecânica do sistema visual sem ocorrências.

### Limitações do ambiente

- o carrinho mantém um snapshot local apenas para estimativa; a validação definitiva pertence ao checkout da Fase 7;
- a inspeção visual automatizada permaneceu indisponível porque esta sessão não ofereceu navegador controlável;
- PostgreSQL/Docker e a migration de busca da Fase 5 continuam pendentes de validação em casa.

### Próximo

- conferir manualmente adição, recarga, atualização e remoção em celular e desktop;
- antes da Fase 7, trocar para GPT-5.6 Sol — High;
- implementar checkout transacional, cliente, pedido e pagamento simulado.

## 30 de setembro de 2026 — Fase 7

### Feito

- criados os modelos `Customer`, `Order` e `OrderItem`, com e-mail normalizado, UUID público e constraints monetárias;
- adicionadas migrations iniciais de clientes e pedidos;
- implementado checkout atômico com bloqueio determinístico dos anúncios por `select_for_update`;
- preços, atividade e estoque são revalidados no backend antes da criação do pedido;
- subtotais e total são calculados com `Decimal`, sem confiar no total informado pelo navegador;
- itens guardam snapshots de título, produto externo, SKU, preço, quantidade, subtotal e imagem;
- criada idempotência por UUID e impressão digital do payload, inclusive para concorrência e reenvio;
- implementada a regra simulada: final `0000` recusa e qualquer outro final de quatro dígitos aprova;
- pedidos recusados são registrados sem reduzir estoque; pedidos aprovados atualizam o estoque na mesma transação;
- a API rejeita campos desconhecidos e nunca aceita nem armazena número completo de cartão;
- criado Admin de pedidos somente leitura, com itens inline;
- criada rota `POST /api/orders/checkout/` e respostas de conflito para preço, estoque, anúncio e idempotência;
- criado checkout responsivo com dados do cliente, aviso explícito, códigos fictícios, resumo e bloqueio durante envio;
- criadas telas de resultado para aprovação, recusa e acesso direto sem estado;
- o carrinho é limpo somente após aprovação e preservado após recusa ou erro;
- criado o cadastro comercial mínimo do cliente para associação ao pedido; usuário Django, sessão e “Meus pedidos” permanecem na Fase 8.

### Validado

- 50 testes backend aprovados em SQLite, sendo 11 cenários específicos do checkout;
- aprovação, recusa, estoque insuficiente, preço alterado, anúncio indisponível, snapshots e normalização do cliente cobertos;
- repetição da mesma chave retorna o mesmo pedido e não reduz estoque novamente;
- chave reutilizada com outro payload retorna conflito;
- payload com número completo de cartão é rejeitado;
- 19 testes frontend aprovados, incluindo aprovação, recusa, conflito e acesso direto ao resultado;
- Django check e `makemigrations --check` sem erros ou mudanças pendentes;
- lint e build de produção do frontend aprovados;
- auditoria mecânica do sistema visual sem ocorrências;
- `git diff --check` sem erros.

### Limitações do ambiente

- SQLite ignora `select_for_update`; o bloqueio real e a concorrência ainda precisam ser validados no PostgreSQL do Docker/Railway;
- as migrations de clientes e pedidos ainda não foram aplicadas no PostgreSQL deste computador porque as credenciais locais não autenticaram;
- inspeção visual em navegador controlável continua indisponível nesta sessão;
- login, sessão segura e consulta de pedidos pertencem à Fase 8 e ainda não foram antecipados.

### Próximo

- em casa, aplicar as migrations e executar a suíte completa contra PostgreSQL;
- testar dois checkouts concorrentes sobre o mesmo estoque no PostgreSQL;
- antes da Fase 8, manter ou selecionar GPT-5.6 Sol — High;
- implementar conta automática, sessão segura, “Meus pedidos” e proteção contra acesso cruzado.

## 30 de setembro de 2026 — Restauração do ambiente em casa

### Feito

- criado `.venv` com Python 3.14 e instaladas as dependências do backend;
- instaladas as dependências do frontend com `npm ci`;
- iniciado e validado o Docker Desktop com WSL 2;
- reparado o filesystem ext4 do disco virtual do Docker após esgotamento de espaço em `C:`;
- criado backup anterior ao reparo em `E:\docker-backups\docker_data-before-fsck-2026-09-30.vhdx`;
- construídas as imagens e iniciados PostgreSQL 18, backend e frontend pelo Compose;
- aplicadas todas as migrations, incluindo `unaccent` e `pg_trgm`;
- importados 194 produtos e confirmada a idempotência em uma segunda importação;
- criado o conjunto demo com 24 anúncios, 4 menus e 2 banners.

### Validado

- `pip check` e `manage.py check` sem erros;
- 19 testes frontend aprovados, lint aprovado e build de produção aprovado;
- frontend respondeu HTTP 200 em `localhost:5173`;
- healthcheck respondeu `status: ok` em `localhost:8000/api/health/`;
- 49 dos 50 testes backend foram aprovados contra PostgreSQL real;
- o disco virtual do Docker passou em uma segunda verificação `e2fsck` sem erros.

### Pendências encontradas

- definir uma senha administrativa local e executar novamente `seed_demo`, sem versionar a credencial;
- validar dois checkouts concorrentes sobre o mesmo estoque;
- avançar para a Fase 9 depois de selecionar GPT-5.6 Sol — Medium.

## 30 de setembro de 2026 — Fase 8 e correção da busca PostgreSQL

### Feito

- elevado o limiar trigramático PostgreSQL de `0.18` para `0.6`; correspondências exatas e parciais continuam cobertas por busca normalizada;
- adicionado teste de regressão para impedir que `colecao` retorne descrição sem relação;
- associado checkout e sessão do navegador ao `Customer` por ID em sessão Django;
- adicionados endpoints de sessão, solicitação e verificação de código, logout, lista e detalhe de pedidos;
- criado `CustomerAccessCode` com hash, expiração de 10 minutos, uso único e limite de cinco tentativas;
- protegidas as operações de sessão com CSRF e limitador de requisições;
- configurado e-mail de demonstração em memória, sem colocar o código em logs; resposta inclui o código somente com `DEBUG=True`;
- produção falha ao iniciar se ainda usar o backend de e-mail em memória;
- pedidos são consultados pelo cliente da sessão, e IDs públicos de outra conta retornam 404;
- criadas telas “Meus pedidos” e “Acesse seus pedidos”, com snapshots, status e datas em `America/Sao_Paulo`;
- adicionada migration `customers.0002_customeraccesscode` e documentação da forma de acesso.

### Validado

- migration aplicada ao PostgreSQL Docker e `makemigrations --check --dry-run` sem mudanças pendentes;
- Django check aprovado;
- 58 testes backend aprovados contra PostgreSQL, incluindo busca, CSRF, sessão, isolamento, uso único e tentativas;
- 20 testes frontend aprovados, lint e build aprovados;
- healthcheck/API e frontend seguem ativos em `localhost:8000` e `localhost:5173`.

### Pendências

- definir administrador local para uso do Django Admin;
- validar concorrência de checkout sobre o último item de estoque no PostgreSQL;
- antes da Fase 9, selecionar GPT-5.6 Sol — Medium.

## 30 de setembro de 2026 — Fase 9: UX e responsividade

### Feito

- revisado o fluxo mobile de carrinho, checkout, resultado, acesso e pedidos;
- ações principais passam a ocupar a largura disponível em telas pequenas e o resumo do checkout usa espaçamento compacto;
- conflitos de preço, estoque, anúncio e idempotência movem o foco para o aviso e oferecem retorno direto ao carrinho;
- erro de estoque mostra a quantidade ainda disponível e preço alterado mostra o valor confirmado pelo backend;
- formulário de acesso associa o erro ao campo inválido, move o foco para o aviso e foca automaticamente o código após o envio;
- adicionados estados `aria-busy`, feedback de falha no logout e skeleton acessível para o histórico de pedidos;
- imagens ganharam `decoding="async"`, `sizes` por contexto e dimensões explícitas nos snapshots de pedidos;
- corrigida a sombra dos cards de pedido para usar o token existente `--shadow-low`.

### Validado

- 21 testes frontend aprovados, incluindo foco após solicitação do código e orientação para conflito de estoque;
- lint sem avisos ou erros;
- build de produção aprovado no container Docker;
- revisão do CSS mobile-first e dos estados acessíveis concluída por inspeção do código;
- `git diff --check` sem erros.

### Limitação do ambiente

- a inspeção visual automatizada não pôde ser executada porque o controlador local do navegador/Windows falhou ao criar os arquivos do kernel; a aplicação permaneceu disponível no Docker e as verificações automatizadas passaram.

### Próximo

- antes da Fase 10, selecionar GPT-5.6 Sol — High;
- revisar segurança, concorrência, segredos e o checklist manual completo.

## 30 de setembro de 2026 — Fase 10: testes e segurança

### Feito

- adicionado teste transacional com duas conexões PostgreSQL disputando a última unidade; apenas um checkout aprova e o outro recebe `insufficient_stock`;
- criada a constraint `orders_order_total_matches_subtotal` e a migration `orders.0002`, impedindo divergência monetária diretamente no banco;
- checkout anônimo passou a exigir CSRF e o frontend obtém um token explícito antes de qualquer escrita, compatível com frontend e API em subdomínios do mesmo site;
- respostas `204 No Content` deixaram de ser interpretadas como JSON, corrigindo o logout do cliente;
- adicionados testes de CORS permitido e recusado, CSRF do checkout, atributos `Secure`, `HttpOnly` e `SameSite` dos cookies;
- produção agora exige `ALLOWED_HOSTS`, CORS e CSRF explícitos, proíbe wildcard em hosts, exige origens HTTPS e força redirecionamento HTTPS;
- HSTS ficou configurável por ambiente para ser ativado quando o domínio definitivo estiver estável;
- login administrativo real foi exercitado e as páginas de produtos, anúncios, menus, banners, clientes, códigos e pedidos foram abertas nos testes;
- `AGENTS.md` recebeu regras para limites de classes de teste e fechamento de conexões concorrentes.

### Validado

- 63 testes backend aprovados contra PostgreSQL 18;
- 21 testes frontend aprovados, lint sem erros e build de produção aprovado;
- `manage.py check`, `makemigrations --check` e `check --deploy` com configuração completa aprovados;
- migration `orders.0002` aplicada ao banco local;
- `pip check` sem dependências quebradas e `npm audit --omit=dev` com zero vulnerabilidades;
- varredura de padrões de chaves privadas e tokens no workspace e nos oito commits sem ocorrências;
- `.env` do backend e frontend confirmados como ignorados pelo Git;
- Home, carrinho, checkout, acesso, pedidos, healthcheck, vitrine, busca e login do Admin responderam HTTP 200 localmente.

### Pendências de aceite

- realizar a conferência visual manual em celular e desktop, pois o controlador de navegador/Windows desta sessão não iniciou;
- definir uma credencial administrativa local ou de demonstração fora do Git;
- criar e testar o deploy público na Fase 14;
- adicionar as migrations e demais arquivos ao próximo commit antes da entrega.

### Próximo

- seguir para a Fase 11 com GPT-5.6 Sol — High para construir a fundação do painel administrativo próprio.

## 30 de setembro de 2026 — Planejamento do painel administrativo próprio

### Decisão do responsável

Antes do deploy e da entrega, o projeto ganhará uma área administrativa React própria. O Django Admin continuará ativo como contingência, mas deixará de ser a experiência principal de operação.

### Plano aprovado para implementação

- Fase 11: autenticação staff, API administrativa, layout protegido, dashboard e consultas somente leitura;
- Fase 12: gestão de anúncios, menus, banners e importação pelo painel;
- Fase 13: segurança, acessibilidade, responsividade, testes integrados e aprovação visual;
- Fase 14: deploy no Railway e Vercel;
- Fase 15: documentação e entrega final.

### Restrições preservadas

- React, Django, DRF e PostgreSQL continuam como stack;
- usuários administrativos continuam sendo usuários Django com `is_staff`;
- sessão HttpOnly e CSRF protegem o painel; não será introduzido JWT;
- produtos importados, pedidos e clientes respeitam campos somente leitura;
- regras de preço, estoque e total continuam exclusivamente no backend;
- códigos temporários e hashes de clientes não serão expostos.

### Próximo

- iniciar a Fase 11 com GPT-5.6 Sol — High após o responsável terminar a rodada atual de testes e ajustes da loja.

## 30 de setembro de 2026 — Evolução da vitrine antes da Fase 11

### Entregue

- setas no banner, preservando a rolagem horizontal por gesto;
- catálogo geral e menus com paginação, ordenação e filtros de preço e frete;
- ordenação por vendas baseada apenas em pedidos aprovados e por desconto promocional real;
- cards redesenhados a partir da referência em `docs/referencias/interface/card-de-produto.jpg`, com imagem alternativa no hover, estoque exato e alerta nas últimas cinco unidades;
- Home sem a seção redundante de categorias e com bloco editorial de posicionamento;
- rodapé responsivo com navegação, conta, contexto da demonstração e formas de pagamento;
- produto com condições comerciais, seletor de quantidade e compartilhamento;
- carrinho com estoque, condições comerciais e compartilhamento consciente da limitação do `localStorage`;
- descontos importados usados para configurar promoções apenas nos anúncios gerados pelo `seed_demo`, preservando promoções personalizadas;
- contrato público paginado e parâmetros comerciais configuráveis no backend.

### Validação

- 21 testes de `apps.storefront` aprovados;
- 41 testes de catálogo, pedidos e clientes aprovados;
- 66 testes backend aprovados na suíte completa, incluindo `apps.core`;
- 23 testes frontend aprovados;
- lint frontend sem avisos e build de produção aprovado;
- API local confirmou 45 anúncios, maior desconto de 15,94% e cinco itens com frete grátis;
- checkout aprovado com final fictício `4242` continua coberto pelo teste integrado do frontend.

### Próximo

- responsável realiza a rodada visual e funcional na loja;
- depois, iniciar a Fase 11 com GPT-5.6 Sol — High.

## 30 de setembro de 2026 — Dropdown e paginação detalhada

### Entregue

- seletor nativo de ordenação substituído por dropdown acessível e alinhado à referência visual, com opção selecionada, marca de confirmação, hover, foco, fechamento externo e tecla Escape;
- paginação passou a exibir setas, números, página atual destacada e reticências quando necessário;
- todas as listagens mostram “Página X de Y” e “Mostrando A–B de N produtos”, inclusive quando existe uma única página;
- links de paginação preservam busca, filtros e ordenação ativos.

### Validação

- 23 testes frontend aprovados, incluindo o resumo de 45 produtos em quatro páginas;
- lint sem avisos;
- build de produção aprovado.

## 30 de setembro de 2026 — Pagamentos coloridos e imagens em alta qualidade

### Entregue

- página de produto e resumo do carrinho diferenciam Pix em verde, cartão em roxo e entrega em azul;
- valores à vista e parcelados ganharam maior peso visual, seguindo a referência em `docs/referencias/interface/detalhes-de-pagamento.jpg`;
- `ImportedProduct.primary_image_url` centraliza a prioridade da primeira imagem de alta qualidade do DummyJSON;
- thumbnail comprimida passou a ser somente fallback;
- cards, galeria, carrinho, banners gerados e snapshots de novos pedidos usam a imagem principal de maior qualidade;
- snapshots de pedidos antigos permanecem imutáveis.

### Validação

- 62 testes backend das áreas afetadas aprovados e nenhuma migration pendente;
- 24 testes frontend aprovados, incluindo cores semânticas e imagem principal;
- lint sem avisos e build de produção aprovado.

## 30 de setembro de 2026 — Compra direta e sinalização comercial nos cards

### Entregue

- cards receberam seletor de quantidade e ação direta de adicionar ao carrinho;
- quantidade máxima considera o estoque e as unidades que já estão no carrinho;
- preço normal usa a cor principal do texto e preço efetivo fica vermelho somente quando há promoção;
- frete grátis usa selo verde;
- descontos abaixo de 10% usam roxo, entre 10% e 19,99% usam laranja e a partir de 20% usam vermelho;
- estados de hover, foco, indisponibilidade, limite e confirmação foram adicionados aos controles.

### Validação

- 24 testes frontend aprovados, incluindo duas unidades adicionadas diretamente pelo card;
- lint sem avisos;
- build de produção aprovado.

## 30 de setembro de 2026 — Simplificação das condições de pagamento

- removidos fundos coloridos, bordas laterais e caixas dos identificadores de Pix, cartão e frete;
- cores semânticas foram mantidas apenas nos textos principais;
- opções usam separadores discretos e espaçamento próximo da referência visual;
- 24 testes frontend, lint e build de produção aprovados.

## 30 de setembro de 2026 — Estrutura de preço e pagamento da referência

### Entregue

- bloco da página de produto reorganizado conforme `docs/referencias/interface/detalhes-de-pagamento.jpg`;
- desconto percentual, moeda e preço aparecem na mesma linha, com centavos elevados;
- preço anterior tachado e indicador informativo aparecem logo abaixo;
- parcelamento sem juros usa o destaque verde da referência e informa o total parcelado;
- o link “Ver opções de pagamento” expande as condições de Pix, cartão e frete sem fundos coloridos;
- valores continuam sendo calculados a partir dos campos comerciais retornados pela API.

### Validação

- 24 testes frontend aprovados, incluindo a hierarquia do novo bloco;
- lint sem avisos;
- build de produção aprovado;
- frontend reiniciado no Docker para teste local.

## 30 de setembro de 2026 — Auditoria integral do desafio

### Revisado

- todos os requisitos do enunciado foram comparados com o código, o plano, o README, o banco local e o repositório remoto;
- a matriz de conformidade foi registrada em `docs/auditoria_requisitos.md`;
- o checklist do plano foi corrigido para refletir o estado real e o próximo passo passou a ser a Fase 11;
- o repositório GitHub foi confirmado como público;
- foram identificadas como pendências principais o painel React, o setup completo em um comando, o README final, a validação manual mobile, o deploy e a publicação das alterações locais.

### Validação

- 66 testes backend aprovados;
- `manage.py check` aprovado e nenhuma migration nova pendente;
- 24 testes frontend, lint e build de produção aprovados na revisão da vitrine imediatamente anterior;
- serviços PostgreSQL, backend e frontend ativos no Docker;
- usuário administrativo local `admin` confirmado como ativo e superusuário;
- GitHub confirmou `cuz-cuz/prohall-tech-test` como repositório público na branch `main`;
- 56 entradas locais estavam modificadas ou não rastreadas antes da criação desta auditoria, portanto o remoto ainda não representa a aplicação atual.

## 1º de outubro de 2026 — Economia da promoção e opções de pagamento

### Entregue

- cards promocionais passaram a informar em reais quanto o cliente economiza;
- a página dedicada do produto exibe a mesma economia junto ao preço anterior;
- a diferença é calculada em centavos a partir dos preços normal e efetivo recebidos da API e só aparece quando é positiva;
- o conteúdo de “Ver opções de pagamento” foi reorganizado em um painel com condições comparáveis de Pix, cartão e frete;
- o aviso do painel reforça que preço, estoque e condições são confirmados no checkout.

### Validação

- 24 testes frontend aprovados, incluindo economia de R$ 170,00 no card e no detalhe e abertura do novo painel;
- lint sem avisos e build de produção aprovado;
- `git diff --check` aprovado;
- conferência visual automatizada ficou indisponível porque não havia navegador conectado à sessão; alteração ficou disponível no servidor local para aceite manual.

## 1º de outubro de 2026 — Fase 11: fundação do painel administrativo

### Entregue

- criado o app backend `backoffice`, sem modelos ou migrations novas;
- autenticação administrativa usa sessão Django, rotação de sessão, cookie HttpOnly e proteção CSRF;
- login aceita somente usuários autenticáveis, ativos e `is_staff`;
- permissão centralizada protege dashboard e todas as consultas administrativas;
- dashboard mostra produtos importados, anúncios ativos, pedidos, clientes, receita aprovada, estoque baixo, pedidos recentes e última sincronização DummyJSON;
- APIs paginadas e somente leitura consultam produtos importados, pedidos e clientes;
- serializers administrativos omitem senha, hashes e códigos temporários, fingerprints de idempotência, últimos dígitos do pagamento e payload bruto importado;
- painel React próprio criado em `/admin`, com login, rotas protegidas, layout responsivo, estados de carregamento/erro/vazio, navegação por teclado e logout também no mobile;
- Django Admin preservado e ligado no painel como contingência;
- nenhuma operação de escrita comercial foi antecipada da Fase 12.

### Validação

- 6 testes novos do `apps.backoffice` aprovados em SQLite, cobrindo anonimato, usuário comum, staff ativo, staff inativo, CSRF, logout, paginação, somente leitura e ausência de dados sensíveis;
- a suíte PostgreSQL completa encontrou 72 testes, mas não iniciou porque o serviço local recusou a senha configurada; Docker não está instalado nesta máquina;
- `manage.py check`, `makemigrations --check --dry-run` e compilação Python aprovados com banco alternativo;
- 29 testes frontend aprovados;
- lint frontend sem avisos e build de produção aprovado;
- nenhuma credencial ou segredo novo foi adicionado.

### Próximo

- antes da Fase 12, selecionar **GPT-5.6 Sol — Medium**;
- implementar somente a operação comercial do painel: anúncios, menus, banners e reimportação, com filtros e feedback;
- repetir a suíte integrada em PostgreSQL assim que a credencial local válida ou um ambiente Docker estiver disponível.

## 1º de outubro de 2026 — Fase 12: operação comercial no painel

### Entregue

- APIs staff com sessão e CSRF para criar e editar anúncios, menus e banners, sem oferecer exclusão destrutiva;
- ativação e desativação com confirmação explícita no painel;
- validação de preço, promoção, estoque e período de banners ligada aos respectivos campos;
- seleção e ordenação de anúncios dentro dos menus, preservada por `MenuListing.display_order`;
- busca, filtros e paginação para produtos, anúncios, menus, banners, pedidos e clientes;
- reimportação paginada e idempotente do DummyJSON pelo painel, com tratamento seguro de falhas e resumo de novos, atualizados e total;
- telas React responsivas para toda a operação comercial, com editores contextuais, estados de carregamento, vazio, erro e sucesso;
- documentação de fase e matriz de conformidade atualizadas.

### Validação

- 11 testes de `apps.backoffice` aprovados em PostgreSQL, incluindo CRUD, validações, ordenação, filtros, permissões e importação;
- suíte integrada com 77 testes backend aprovada em PostgreSQL;
- 33 testes frontend aprovados, com cobertura de criação de anúncio, ordenação de menu, agendamento de banner e confirmação da importação;
- `manage.py check`, `makemigrations --check --dry-run`, lint e build de produção frontend aprovados;
- nenhuma migration foi necessária e nenhum segredo foi adicionado.

### Próximo

- antes da Fase 13, selecionar **GPT-5.6 Sol — High**;
- executar a revisão de acessibilidade, responsividade, integração painel–loja, permissões de campos e concorrência prevista na Fase 13.

## 1º de outubro de 2026 — Ajuste visual das tabelas administrativas

### Entregue

- tabelas do painel aproximadas da referência em `docs/referencias/interface/tabela-e-coluna-de-acoes.jpg`, com cabeçalhos compactos em caixa alta, linhas mais arejadas, status discretos e paginação numérica;
- coluna de ações de anúncios, menus e banners convertida para ícones consistentes: lápis azul para edição e pausa laranja ou reprodução verde para status;
- rótulos acessíveis, foco visível e `title` preservados nos botões de ícone;
- exclusão vermelha da referência não foi introduzida, pois a operação comercial do painel usa desativação reversível e não oferece exclusão;
- miniaturas dos produtos adicionadas às tabelas de Produtos importados e Anúncios, com fallback visual quando não há imagem;
- API administrativa de produtos importados passou a expor somente a URL da imagem principal já normalizada pelo catálogo.

### Validação

- 11 testes do backoffice aprovados em PostgreSQL;
- 33 testes frontend, lint e build de produção aprovados;
- `manage.py check` e `git diff --check` aprovados.

## 1º de outubro de 2026 — Snapshot do nome do comprador no pedido

### Entregue

- `Order.customer_name` passou a guardar o nome informado no checkout, junto dos snapshots já existentes em `OrderItem`;
- migration `0003_order_customer_name` adiciona o campo e copia o nome atual da conta para os pedidos anteriores, com reversão `noop`;
- `OrderSerializer` lê o nome do snapshot e mantém o e-mail vindo da conta, que é a identidade e não muda sem virar outro cliente;
- a forma do JSON (`customer.name` e `customer.email`) foi preservada, sem alteração no frontend;
- `AdminOrderSerializer` passou a exibir o snapshot, e a busca de pedidos do painel consulta o snapshot, o nome da conta e o e-mail;
- Django Admin expõe `customer_name` como campo somente leitura, pesquisável.

### Motivo

O checkout já atualizava o nome da conta em compras seguintes (`services.py`), e o histórico lia esse nome ao vivo. Um cliente que digitasse o nome de outra forma renomeava retroativamente todos os pedidos anteriores. Decidido manter o acesso sem senha e corrigir apenas a fidelidade do histórico.

### Validação

- 79 testes backend aprovados em PostgreSQL;
- novo teste de checkout garante que renomear a conta não altera o nome dos pedidos já feitos;
- novo teste de migration aplica `0002` com dois clientes e pedidos, migra para `0003` e confirma que cada pedido recebe o nome do seu próprio cliente;
- o teste de migration foi verificado por inversão: com o backfill desativado ele falha com `'' != 'Ana Lima'`;
- `manage.py check` e `makemigrations --check --dry-run` aprovados;
- 33 testes frontend, lint e build de produção aprovados;
- migration aplicada no banco local de desenvolvimento.

### Próximo

- antes da Fase 14, selecionar **GPT-5.6 Sol — High**;
- a suíte PostgreSQL voltou a rodar nesta máquina; a pendência registrada na Fase 11 está resolvida.

## 1º de outubro de 2026 — Nicho na importação, dropdowns e modais

### Entregue

- categorias do nicho centralizadas em `apps/catalog/niche.py`, lidas pelo importador, pelo `seed_demo` e pelo painel;
- `DummyJSONClient.fetch_products_in_categories` lê um endpoint paginado por categoria, valida o slug e recusa o mesmo produto vindo de duas categorias;
- `sync_products` passou a importar somente o nicho por padrão, com filtro redundante após a normalização e contagem de ignorados;
- `import_products` ganhou `--all-categories` para o catálogo inteiro e `--remover-fora-do-nicho` para apagar apenas produtos sem anúncio;
- painel informa as categorias lidas e quantos itens ficaram fora do nicho;
- `AdminSelect`: listbox acessível com rótulo acima, painel destacado, divisórias entre opções e opção escolhida realçada, conforme `docs/referencias/interface/dropdown.jpg`;
- todos os seletores nativos do painel foram substituídos; nenhum `<select>` permanece no projeto;
- `AdminModal` e `AdminConfirmModal`: diálogos com `aria-modal`, foco inicial, ciclo de Tab preso, Escape, clique no fundo e devolução do foco ao elemento de origem;
- editores de anúncio, menu e banner e as confirmações de ativar/desativar passaram a acontecer em modal, no lugar do painel embutido e da confirmação em linha.

### Motivo

A loja é de nicho feminino, mas a importação trazia as 24 categorias do DummyJSON. Buscar por categoria reduziu de 194 para 46 produtos e tornou a regra explícita no código.

### Validação

- 87 testes backend aprovados em PostgreSQL;
- novos testes cobrem o filtro de nicho, o descarte com contagem, `--all-categories`, a remoção que preserva produtos com anúncio, a leitura por categoria e a recusa de slug com travessia de caminho;
- importação real executada contra o DummyJSON: 46 produtos do nicho processados;
- 36 testes frontend aprovados, incluindo navegação por teclado no dropdown, Escape sem alterar valor e confirmação em modal que só envia `PATCH` após o aceite;
- lint e build de produção aprovados;
- **não validado visualmente**: a extensão do Chrome não está conectada nesta máquina, então o dropdown e os modais não foram comparados ao print em tela.

### Próximo

- conferir o dropdown e os modais no navegador antes de seguir para a Fase 14;
- decidir se os 148 produtos fora do nicho já importados serão removidos com `--remover-fora-do-nicho`.

## 1º de outubro de 2026 — Dados de origem no editor e frete grátis configurável

### Entregue

- editor de anúncio mostra o produto de origem com imagem, marca, categoria, SKU, preço, estoque, disponibilidade e data de sincronização;
- opções do dropdown de produtos ganharam miniatura;
- editor de banner mostra prévia da imagem, com aviso visível quando a URL não carrega;
- `StoreSettings` em `apps.core`, linha única, com o mínimo de frete grátis editável em `/api/admin/settings/` e na nova página Configurações do painel;
- `Listing.free_shipping` como marcação por anúncio, editável no formulário;
- mínimo passou a valer sobre o subtotal do carrinho; o carrinho informa quanto falta e avisa quando o frete foi conquistado;
- filtro `free_shipping` do catálogo passou a consultar a marcação do anúncio.

### Motivo

O valor só existia em variável de ambiente, exigindo deploy para mudar, e a regra comparava o preço unitário em vez do valor da compra.

### Validação

- 92 testes backend aprovados em PostgreSQL;
- novos testes cobrem o valor inicial vindo do ambiente, a edição refletida na vitrine, a recusa de valor zero ou negativo, o bloqueio para anônimo e usuário comum, e a marcação por anúncio;
- 41 testes frontend aprovados, incluindo a mensagem "adicione mais R$ 71,00", a troca para o estado conquistado, a edição do mínimo e a prévia do banner com URL quebrada;
- migrations aplicadas no banco local: 5 de 24 anúncios receberam a marcação pelo backfill;
- lint e build de produção aprovados.

### Correção de estrutura

- `AdminStoreSettingsTests` havia sido criada herdando `BackofficeAPITests`, o que reexecutava os 11 testes do pai (27 testes, 72 s). Os fixtures foram extraídos para `BackofficeFixtures`, sem testes próprios, e as duas classes passaram a herdá-lo: 16 testes, 39 s.

### Próximo

- segue pendente a conferência visual no navegador, inclusive das novas telas;
- decidir sobre os 148 produtos fora do nicho ainda no banco.

## 1º de outubro de 2026 — Marcação de nicho nos produtos e ajuste da sidebar

### Entregue

- API administrativa de produtos passou a expor `in_niche` e a aceitar o filtro `niche`;
- tela de Produtos mostra o selo "No nicho" ou "Fora do nicho" ao lado da categoria e ganhou o filtro correspondente;
- ritmo vertical da sidebar reduzido (`margin-top` 2.5rem para 1.5rem, item de 2.75rem para 2.4rem, `gap` 0.25rem para 0.15rem) para os nove itens caberem sem scrollbar interna; `overflow-y: auto` mantido apenas como proteção em telas muito baixas.

### Motivo

A importação já trazia só o nicho desde a mudança anterior, mas o responsável continuava vendo produtos masculinos e eletrônicos na tela de Produtos: são 148 linhas importadas antes do filtro. O selo torna a diferença visível em vez de confusa. A entrada Configurações foi o nono item do menu e estourou a altura da barra lateral.

### Achado relevante

- 14 anúncios fora do nicho estão **ativos na loja**: móveis, alimentos, decoração e cozinha. Não vieram de importação recente; são anteriores ao filtro. Precisam de decisão do responsável, porque desativá-los muda a vitrine.

### Validação

- 94 testes backend aprovados em PostgreSQL, com dois novos cobrindo `in_niche` e o filtro `niche`;
- 42 testes frontend aprovados, incluindo os selos nas linhas e o filtro enviando `niche=false`;
- lint e build de produção aprovados;
- **não validado visualmente**: a extensão do Chrome segue desconectada, então a ausência da scrollbar na sidebar não foi confirmada em tela.

## 1º de outubro de 2026 — Limpeza dos produtos fora do nicho

### Entregue

- `--remover-fora-do-nicho` passou a fazer a limpeza completa: desativa os anúncios fora do nicho e só então apaga os produtos importados sem nenhum anúncio;
- anúncios nunca são apagados, apenas desativados: pedidos apontam para eles e `Listing.product` é `PROTECT`, então os produtos anunciados também permanecem;
- scrollbar da barra lateral confirmada pelo responsável como resolvida.

### Executado no banco local, autorizado pelo responsável

- 14 anúncios fora do nicho desativados (móveis, alimentos, decoração, cozinha);
- 134 produtos importados sem anúncio removidos;
- 14 produtos preservados por terem anúncio, agora inativo;
- estado final: 60 produtos, sendo 46 do nicho; nenhum anúncio ativo fora do nicho;
- a relação do que foi removido, preservado e desativado foi gravada antes da execução, fora do repositório, no scratchpad da sessão.

### Consequência que precisa de decisão

- a loja ficou com **10 anúncios ativos**: dos 46 produtos do nicho, 36 não têm anúncio. `seed_demo` cria anúncios idempotentes para eles e devolveria a vitrine cheia, mas cria dados de demonstração e não foi executado sem autorização.

### Validação

- 94 testes backend aprovados em PostgreSQL;
- o teste do `--remover-fora-do-nicho` passou a verificar também que o anúncio fora do nicho fica inativo e que um anúncio do nicho continua ativo.

## 1º de outubro de 2026 — Auditoria das regras de negócio

### Verificado e correto

- só anúncios ativos aparecem: todas as consultas públicas passam por `active_listing_queryset()` e o checkout recusa anúncio inativo;
- estoque: bloqueio por `select_for_update` em ordem estável, `PositiveIntegerField` no banco e teste de concorrência disputando a última unidade;
- promoção menor que o preço normal em três camadas (constraint, serializer, teste) e preço relido sob lock no checkout, com 409 `price_changed`;
- cartão terminado em `0000` recusado, demais aprovados, e o decremento de estoque só ocorre quando aprovado;
- pedido preserva nome, preço, SKU, imagem e id externo, além do nome do comprador, com `SET_NULL` no anúncio;
- fuso de Brasília no backend (`TIME_ZONE`, `USE_TZ`) e nos formatadores do cliente e do painel.

### Falha encontrada e corrigida

- o parcelamento não fechava com o total em 41 dos 45 anúncios ativos: a parcela era `preço / 12` arredondada e a soma não voltava ao total. `split_installments` em `apps/storefront/catalog.py` passou a distribuir o resto na primeira parcela e a reduzir o número de parcelas quando o total não dá um centavo para cada; a API expõe `first_installment_value` e a interface mostra a primeira parcela quando ela difere. O mesmo cálculo foi espelhado em `splitInstallments` no frontend para o carrinho.

### Falso positivo retirado

- o preço no Pix foi relatado como divergente entre produto e carrinho; a simulação usou `round()` do Python, que arredonda para o par, em vez do `Math.round` do JavaScript. Reexecutado em Node, os três casos batem com o servidor. Registrado em `erros-da-ia.md`.

### Lacunas de cobertura fechadas

- checkout com vários itens, confirmando que o total é a soma exata dos itens: `Order.subtotal` não é garantido por constraint, só o subtotal de cada item;
- renderização em horário de Brasília, afirmando 09:00 e negando 12:00 para um pedido gravado às 12:00 UTC;
- agendamento de banner passou a converter nos dois sentidos pelo fuso da loja, não pelo da máquina do operador; o teste fixa `2026-10-02T09:00` como `2026-10-02T12:00:00.000Z`.

### Validação

- 99 testes backend aprovados em PostgreSQL e 48 no frontend;
- as 45 somas de parcelas dos anúncios ativos conferidas contra os dados reais;
- ida e volta do agendamento conferida em Node, inclusive na meia-noite;
- lint e build de produção aprovados.

## 1º de outubro de 2026 — Sincronização e revisão após trabalho no Claude

### Revisado

- `main` atualizada por fast-forward de `530e579` para `63f9036`, trazendo sete commits já publicados no GitHub;
- mudanças das Fases 11 e 12 revisadas contra o plano, incluindo painel administrativo, snapshot do nome do comprador, importação por nicho, configuração de frete grátis e correções de parcelamento e fuso;
- permissões staff, CSRF, serializers, migrations, importação e cálculos monetários conferidos estaticamente;
- árvore permaneceu sem conflitos e `git diff --check` passou.

### Validação nesta sessão

- 48 testes frontend aprovados;
- lint e build de produção aprovados;
- `manage.py check` e `makemigrations --check --dry-run` aprovados;
- a suíte backend encontrou 99 testes, mas não iniciou em PostgreSQL porque a senha local do usuário `mosaico` foi recusada e o Docker Desktop estava parado;
- como verificação complementar, os 99 testes foram executados em SQLite: 97 passaram e os dois restantes falharam em comportamentos específicos do banco (aritmética da constraint decimal e concorrência com tabela bloqueada), sem substituir a validação PostgreSQL registrada anteriormente.

### Próximo

- executar a Fase 13 com GPT-5.6 Sol — High;
- repetir os 99 testes no PostgreSQL quando a credencial local ou o Docker estiver disponível;
- concluir a inspeção visual/manual do painel e remover da auditoria a pendência já obsoleta de publicar as alterações locais.

## 1º de outubro de 2026 — Restauração controlada da demonstração

### Entregue

- Configurações do painel ganhou a ação **Restaurar demonstração**, visível somente para superusuários;
- confirmação exige a frase `RESTAURAR DEMONSTRAÇÃO` e o backend valida o mesmo valor;
- o DummyJSON é baixado e normalizado por completo antes de iniciar qualquer exclusão;
- pedidos, clientes, códigos de acesso, anúncios, menus, banners e produtos importados são reconstruídos em uma única transação;
- usuários Django, incluindo o administrador que iniciou a operação, são preservados;
- mínimo de frete grátis retorna ao valor inicial do ambiente e a vitrine é recriada pelo `seed_demo` sem alterar a senha administrativa;
- lease persistida no PostgreSQL impede restaurações simultâneas e cooldown configurável limita repetições;
- tabelas funcionais recebem bloqueio exclusivo durante a reconstrução para impedir checkout ou edição administrativa intercalados;
- horário, usuário e resumo da última execução ficam registrados sem dados sensíveis;
- o carrinho local do navegador que conclui a operação é limpo para não manter identificadores antigos;
- recurso controlado por `DEMO_RESET_ENABLED`, falso por padrão, e `DEMO_RESET_COOLDOWN_SECONDS`;
- decisão e uso documentados no README, plano, auditoria e `vault/decisoes`.

### Validação

- 103 testes backend aprovados no PostgreSQL antes do teste adicional de conflito;
- 49 testes focados de catálogo e backoffice aprovados;
- 22 testes do backoffice aprovados novamente após o bloqueio exclusivo das tabelas funcionais;
- 49 testes frontend aprovados;
- lint frontend sem avisos e build de produção aprovado;
- `manage.py check` e `makemigrations --check --dry-run` aprovados;
- migration `core.0002_demoresetstate` aplicada no banco Docker de desenvolvimento;
- healthcheck da API e rota `/admin` responderam HTTP 200;
- restauração real não foi executada, preservando os dados atuais até confirmação explícita no painel.
- usuário local `admin` confirmado como ativo, staff e superusuário; a senha foi definida diretamente no banco e não foi registrada no repositório.
- corrigida a seção que permanecia oculta por depender de `is_superuser` preservado no estado antigo do Hot Reload; a tela agora consulta diretamente o endpoint e deixa a autorização exclusivamente no backend;
- após a correção, 49 testes frontend e lint passaram, e o serviço frontend foi reiniciado.

### Refinamento visual da restauração

- cartão da restauração reorganizado com ícone, hierarquia de título, garantias, histórico, disponibilidade e ação lateral;
- cor destrutiva reservada ao botão e ao aviso, mantendo o restante alinhado ao roxo, superfícies e elevação discreta do painel;
- modal ampliado e estruturado com aviso de irreversibilidade, sequência de validação/limpeza/recriação, confirmação do acesso preservado e área própria para a frase de segurança;
- ações do modal reorganizadas e adaptadas para largura integral no celular;
- adicionados ícones de restauração e proteção ao conjunto existente;
- 49 testes frontend, lint e build de produção aprovados após o redesenho;
- conferência visual automatizada indisponível porque nenhum navegador estava conectado à sessão; servidor permaneceu disponível para aceite manual.

### Prévia e ordem dos banners

- a prévia do banner no modal passou a ter largura controlada, alinhamento central do bloco e da legenda e ponto focal explícito no centro da imagem;
- a ordem de exibição agora é única entre banners, validada pela API e garantida por constraint no PostgreSQL;
- conflitos de ordem são exibidos junto ao respectivo campo com mensagem em português;
- a migration `catalog.0005_unique_banner_display_order` preserva a primeira ocorrência de cada ordem preexistente e realoca somente eventuais duplicatas antes de criar a constraint;
- migration aplicada no banco Docker de desenvolvimento e frontend reiniciado;
- 74 testes de backoffice, storefront e catálogo, 49 testes frontend, lint, build e `makemigrations --check --dry-run` aprovados.
- após o aceite inicial, a prévia administrativa passou de recorte para encaixe completo (`object-fit: contain`), preservando toda a imagem dentro do retângulo reservado sem alterar o banner da loja.
- o responsável informou que o encaixe ainda não correspondia ao esperado e decidiu seguir para a Fase 14, mantendo o ponto como pendência visual não bloqueante.

## 1º de outubro de 2026 — Início da Fase 14 e Cloudflare R2

### Preparação de deploy

- backend passou a coletar estáticos na imagem Docker e a iniciar Gunicorn na porta dinâmica fornecida pelo Railway;
- frontend de produção usa `/api`, com proxy externo configurado pela Vercel para manter sessão e CSRF como primeira parte;
- fallback da SPA e cabeçalhos HTTP defensivos foram adicionados à configuração da Vercel;
- cookies `SameSite` tornaram-se configuráveis, preservando `Lax` como padrão seguro do fluxo por proxy;
- roteiro de Railway, PostgreSQL, Vercel, SMTP, secrets, seeds e smoke test criado em `docs/deploy.md`;
- CLIs oficiais do Railway e da Vercel instaladas; ambas ainda exigem autenticação do responsável.

### Mídias no R2

- painel de banners ganhou upload JPEG, PNG e WebP, mantendo URL manual como alternativa;
- backend valida arquivo real, tamanho máximo de 8 MB e até 40 milhões de pixels antes do envio;
- upload usa a API S3 compatível do R2 pelo backend, mantendo chaves fora do navegador;
- objetos recebem chave aleatória e imutável sob `banners/AAAA/MM/`, MIME verificado e cache público de um ano;
- endpoint exige sessão staff e CSRF; erros de configuração e transporte retornam mensagens seguras;
- bucket exclusivo `mosaico-media` criado na conta Cloudflare autenticada;
- os buckets existentes não usam domínio próprio; um deles usa `r2.dev`, que a documentação da Cloudflare classifica como acesso de desenvolvimento;
- vínculo do domínio público e token S3 do R2 ainda dependem da escolha do responsável e não foram armazenados no repositório.

### Validação

- imagem Docker do backend construída com coleta de 154 arquivos estáticos e 444 pós-processados;
- configuração Vercel e build de produção validados sem referência a `localhost:8000`;
- `check --deploy` passou com variáveis equivalentes às de produção;
- 104 testes backend e 50 testes frontend aprovados;
- lint, build frontend e `makemigrations --check --dry-run` aprovados;
- nenhum upload real foi executado porque o token S3 e a URL pública definitiva do R2 ainda não foram definidos.

## 1º de outubro de 2026 — Publicação no Railway e na Vercel

### Ambientes

- projeto `mosaico` criado no Railway com PostgreSQL e serviço `backend` em `https://backend-production-2a5f.up.railway.app`;
- projeto `mosaico` criado na Vercel em `https://mosaico-alpha.vercel.app`, com `RAILWAY_API_ORIGIN` em Production e Preview;
- pre-deploy `python manage.py migrate` e healthcheck `/api/health/` aplicados ao serviço pela API do Railway, porque o `railway.json` enviado pela CLI foi reconhecido mas não aplicado;
- `import_products` e `seed_demo` executados por `railway ssh`: 46 produtos, 45 anúncios, 8 menus, 3 banners e administrador;
- sem SMTP definido, produção usa `dummy.EmailBackend`; o acesso do cliente por código fica indisponível até configurar SMTP;
- R2 ativo no bucket `mosaico-media` com URL pública `r2.dev` provisória, por falta de domínio próprio na conta; a troca futura exige apenas `R2_PUBLIC_BASE_URL`;
- token S3 `mosaico-media-railway` limitado ao bucket e cadastrado somente no Railway; como as chaves passaram pelo histórico da sessão, devem ser rotacionadas.

### Correções

- proxy da Vercel trocado de `/api/:path*` para `/api/(.*)`, preservando as barras finais exigidas pelo Django;
- `/api/health/` isento do redirecionamento HTTPS para o healthcheck interno do Railway;
- `.gitignore` do frontend ignora `.vercel` e `.env*.local` sem esconder `.env.example`.

### Validação

- healthcheck 200 direto no Railway e pelo proxy da Vercel;
- home, listagem (45 anúncios), login administrativo, painel e status de restauração respondem pelo proxy;
- Django Admin e estáticos servidos no Railway;
- upload real de PNG pelo proxy retornou 201 e a URL pública abriu com `image/png`; o objeto de teste foi removido do bucket;
- 6 testes de `core`, incluindo os dois novos do redirecionamento, aprovados.

## 1º de outubro de 2026 — Ajustes da vitrine no celular, Pix e resumo do pedido

### Pedido do responsável

- banners deixaram de ser recortados: a imagem agora é encaixada inteira no espaço reservado (`object-fit: contain`);
- o painel de filtros virou um botão compacto "Filtrar e ordenar", com contador de filtros ativos, que abre um modal (folha inferior no celular, painel central no desktop); alterações só valem ao clicar em "Aplicar filtros", e fechar descarta o rascunho;
- navegação para outra página passa a abrir no topo; voltar e avançar no navegador preservam a posição restaurada pelo próprio navegador;
- checkout ganhou escolha entre cartão e Pix, com QR code ilustrativo, código copia e cola fictício e botões para simular Pix pago ou expirado;
- carrinho, checkout, resultado do pagamento e "Meus pedidos" mostram produtos a preço cheio, descontos em promoções, desconto Pix, frete ou frete grátis, frete economizado, total e economia total.

### Backend

- migration `orders.0004_order_payment_method_and_breakdown` adiciona forma de pagamento, descontos e frete ao pedido, com constraints para o total, os valores não negativos e a coerência entre forma de pagamento e referência;
- `SHIPPING_FEE` configurável, exposto em `commercial_terms`;
- Django Admin e painel de pedidos exibem a forma de pagamento.

### Validação

- 114 testes backend e 56 testes frontend aprovados; lint, build e `makemigrations --check` aprovados;
- telas conferidas em 390 px com Chrome headless: banner inteiro, barra de filtros, modal, checkout com cartão e Pix;
- abrir o último produto de uma listagem rolada até 10.130 px levou a página do produto ao topo (`scrollY` 0);
- o teste de foco do alerta de estoque falhou uma vez e passou nas duas execuções seguintes; fica registrado como possível instabilidade.

## 1º de outubro de 2026 — Busca pela lupa, consultas em português e usuário de teste

- a busca deixou de navegar enquanto o cliente digita: o campo mostra até cinco sugestões e a página de resultados abre pela lupa ou Enter, preservando o critério do enunciado de responder durante a digitação;
- o botão "Buscar" virou uma lupa com nome acessível "Buscar";
- consultas em português encontram produtos em inglês por um dicionário do nicho; "perfume pra presente" retorna os cinco perfumes, "bolsa de couro" as bolsas de couro e "batom vermelho" o batom vermelho primeiro;
- a primeira versão casava a tradução "red" com "inspired"; termos traduzidos passaram a exigir início de palavra, com teste de regressão;
- usuário de teste do painel `admin` / `Admin@123` documentado no README, em `backend/.env.example` e no `docker-compose.yml`, como pede o enunciado;
- 118 testes backend e 57 testes frontend aprovados; lint e build aprovados; sugestões conferidas em 390 px com Chrome headless.

## 1º de outubro de 2026 — Fechamento da entrega

- ícone da aba criado a partir da marca (SVG, ICO de reserva e ícone para tela inicial do celular);
- `docker compose up --build` passou a criar a loja do zero: o novo comando `bootstrap_demo` importa produtos, prepara a vitrine e cria `admin` / `Admin@123` somente em banco vazio, para não sobrescrever edições do painel a cada reinício;
- validado num PostgreSQL recém-criado: 45 anúncios, 8 menus, 3 banners e login válido; a segunda execução não alterou nada;
- README ganhou início rápido em um comando, modelagem do banco com diagrama, resumo das decisões, testes executados, uso da IA e o que ficou faltando;
- a seção de IA foi conferida contra o diário: as ferramentas registradas são GPT-5.6 Sol e Claude Code;
- auditoria de requisitos reescrita com o estado final;
- 120 testes backend e 57 frontend aprovados; lint e build aprovados;
- nove conversas (sete do Codex, duas do Claude Code) exportadas de `~/.codex` e `~/.claude` para `vault/conversas/`, só com o diálogo, sem segredos nem e-mails pessoais, verificadas por varredura antes do commit.
- token do Cloudflare R2 exposto na sessão revogado e substituído por `mosaico-media-railway-2`, cadastrado pelo painel do Railway; upload real em produção confirmou as chaves novas e o arquivo de teste foi removido do bucket.
- imagens de referência de interface movidas de `Prints/` para `docs/referencias/interface/`, com nomes sem espaços nem acentos e extensão `.jpg`; referências do vault atualizadas e índice criado em `docs/referencias/README.md`.
