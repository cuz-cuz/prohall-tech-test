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
