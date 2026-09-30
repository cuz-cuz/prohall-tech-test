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
