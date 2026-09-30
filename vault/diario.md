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
