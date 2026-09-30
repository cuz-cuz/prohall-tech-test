# Plano de Implementação — Loja Virtual Prohall

> **Fonte de verdade:** enunciado do desafio disponível em `docs/referencias/enunciado-desafio-prohall.png` e documentação pública do DummyJSON.
> **Stack definida:** React + Vite, Django + Django REST Framework e PostgreSQL.
> **Hospedagem definida:** frontend na Vercel; backend e PostgreSQL no Railway.
> **Prazo informado no desafio:** 1º de outubro de 2026.

---

## 1. Objetivo

Construir uma loja virtual completa, do catálogo ao pedido pago, com duas frentes:

- **ADMIN:** onde a equipe importa produtos, cria anúncios, organiza menus, administra banners e acompanha pedidos;
- **LOJA:** onde o cliente navega, pesquisa, compra e acompanha seus pedidos.

O projeto deve ser pequeno, correto, publicável, simples de explicar e tratado como uma aplicação de produção. A entrega também deve demonstrar como a IA foi usada, revisada e corrigida durante o desenvolvimento.

Fluxo principal:

```text
DummyJSON
   ↓
Importação idempotente
   ↓
Produtos importados
   ↓
Anúncios configurados no ADMIN
   ↓
Loja / Busca / Carrinho
   ↓
Checkout e pagamento simulado
   ↓
Pedido persistido / Meus pedidos
```

---

## 2. Identidade da loja

Nome de trabalho: **Mosaico**.

Conceito: uma loja multidepartamentos em que produtos diferentes se encontram em uma experiência simples.

Direção visual inicial:

- interface clara e mobile-first;
- tipografia legível e hierarquia forte;
- cor-base escura, fundo claro e uma cor vibrante de destaque;
- cards de produto objetivos;
- banners grandes sem prejudicar navegação ou performance;
- estados de carregamento, vazio e erro sempre visíveis;
- identidade própria, sem copiar a aparência do enunciado.

O nome e os tokens visuais devem ficar centralizados para permitir troca sem refatoração extensa.

---

## 3. Escopo obrigatório (P0)

### 3.1 Importação

- importar produtos da API pública DummyJSON;
- salvar os produtos no banco local;
- permitir reexecutar a importação;
- atualizar registros existentes pelo identificador externo;
- criar os novos registros encontrados;
- não duplicar nem corromper dados já existentes;
- registrar o momento da última sincronização;
- registrar erros sem deixar importação parcialmente inconsistente.

### 3.2 ADMIN

- autenticação administrativa;
- usuário de teste documentado no README;
- visualizar produtos importados;
- criar anúncio a partir de produto importado;
- editar e desativar anúncios;
- configurar título, descrição, preço normal, preço promocional opcional, quantidade e status;
- criar e ordenar menus;
- escolher quais anúncios aparecem em cada menu;
- criar, editar, ordenar e ativar/desativar banners;
- visualizar pedidos e seus itens;
- reexecutar a importação de produtos.

### 3.3 Loja

- página inicial com banners e menus definidos no ADMIN;
- listagem de anúncios por menu;
- página de detalhes do anúncio;
- exibição clara de preço normal e promocional;
- busca global;
- carrinho persistente após recarregar a página;
- alteração de quantidade e remoção de itens;
- checkout com pagamento simulado;
- criação automática da conta do cliente no checkout;
- área “Meus pedidos” com itens, valores pagos e status.

### 3.4 Entrega

- repositório Git público;
- histórico incremental de commits;
- README suficiente para executar o projeto sem ajuda;
- migrations versionadas;
- arquivo de regras para IA;
- pasta `/vault`;
- `.env.example` sem segredos;
- nenhum segredo no repositório ou no histórico.

---

## 4. Fora do escopo

Para proteger o prazo e evitar overengineering:

- pagamento real;
- armazenamento de dados reais de cartão;
- emissão fiscal;
- cálculo real de frete;
- ERP ou CRM;
- marketplace com múltiplos vendedores;
- estoque distribuído;
- painel administrativo React próprio;
- busca semântica com IA antes de concluir a busca obrigatória;
- internacionalização completa;
- aplicativos móveis nativos.

---

## 5. Arquitetura

```text
┌─────────────────────────────────────┐
│        React + Vite (Vercel)        │
│ Home / Menus / Busca / Produto      │
│ Carrinho / Checkout / Meus pedidos  │
└──────────────────┬──────────────────┘
                   │ HTTPS / JSON
                   ▼
┌─────────────────────────────────────┐
│ Django + DRF (Railway)              │
│ API / regras / autenticação         │
│ importação / pedidos / estoque      │
│ Django Admin                        │
└─────────────┬───────────────┬───────┘
              │               │
              ▼               ▼
     PostgreSQL/Railway   DummyJSON
```

Princípios:

- o frontend nunca define preço final ou disponibilidade;
- o backend recalcula o pedido dentro de transação;
- o PostgreSQL é a fonte de verdade da loja;
- o DummyJSON é somente a origem dos produtos importados;
- produto importado e anúncio comercial são entidades diferentes;
- pedidos guardam snapshots para preservar o histórico;
- o Django Admin será a interface administrativa do MVP;
- regras importantes devem estar no backend e cobertas por testes.

---

## 6. Stack

### Frontend

- React;
- Vite;
- React Router;
- Context API + reducer para o carrinho;
- Axios ou `fetch`;
- CSS Modules ou CSS tradicional com tokens;
- Vitest;
- React Testing Library.

### Backend

- Python;
- Django;
- Django REST Framework;
- `django-cors-headers`;
- `dj-database-url`;
- `httpx` para o DummyJSON;
- PostgreSQL;
- Gunicorn;
- WhiteNoise para arquivos estáticos do Admin;
- pytest ou Django TestCase.

### Infraestrutura

- Vercel para o frontend;
- Railway para o backend;
- Railway PostgreSQL para produção;
- PostgreSQL local via Docker Compose ou instalação local.

---

## 7. Estrutura do repositório

```text
prohall-tech-test/
├── AGENTS.md
├── README.md
├── .gitignore
├── docker-compose.yml
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   └── utils/
│   ├── .env.example
│   └── package.json
├── backend/
│   ├── config/
│   ├── apps/
│   │   ├── catalog/
│   │   ├── storefront/
│   │   ├── customers/
│   │   └── orders/
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
├── docs/
│   ├── plano_implementacao_prohall.md
│   ├── modelagem.md
│   ├── api.md
│   └── screenshots/
└── vault/
    ├── decisoes/
    ├── conversas/
    ├── diario.md
    └── erros-da-ia.md
```

---

## 8. Integração com DummyJSON

Documentação: `https://dummyjson.com/docs/products`.

Endpoint principal:

```http
GET https://dummyjson.com/products?limit={limit}&skip={skip}
```

A resposta é paginada e contém, além de `products`:

```text
total
skip
limit
```

A importação deve percorrer todas as páginas até atingir `total`. Não depender da quantidade padrão retornada pela API.

Campos úteis a persistir:

```text
id externo
title
description
category
brand
sku
price
discountPercentage
stock
availabilityStatus
thumbnail
images
raw_payload
```

Regras da sincronização:

1. obter a página;
2. validar a resposta;
3. converter dinheiro com `Decimal`, nunca `float`;
4. executar `update_or_create` usando `external_id` único;
5. atualizar somente campos pertencentes à origem externa;
6. nunca sobrescrever dados comerciais dos anúncios;
7. repetir até importar `total` produtos;
8. produzir um resumo com criados, atualizados e erros;
9. permitir nova execução pelo comando de gestão e, se houver tempo, por ação protegida no Admin.

Comando planejado:

```bash
python manage.py import_products
```

O DummyJSON não será usado para persistir alterações da loja. Criação, edição e remoção oferecidas pela API externa são simuladas; as operações reais do projeto ficam no PostgreSQL.

---

## 9. Modelo de dados

### 9.1 ImportedProduct

Produto bruto vindo do DummyJSON.

```text
id
external_id (unique)
title
description
category
brand
sku
source_price
source_discount_percentage
source_stock
availability_status
thumbnail_url
images (JSON)
raw_payload (JSON)
last_synced_at
created_at
updated_at
```

O registro não é vendido diretamente.

### 9.2 Listing

Anúncio criado pela equipe a partir de um produto importado.

```text
id
product_id (FK ImportedProduct)
slug (unique)
title
description
price
promotional_price (nullable)
stock_quantity
active
created_at
updated_at
```

Regras:

- `price > 0`;
- `stock_quantity >= 0`;
- preço promocional, quando informado, deve ser positivo e menor que `price`;
- anúncio inativo não aparece na loja;
- anúncio sem estoque pode aparecer como indisponível, mas não pode ser comprado;
- preço efetivo é `promotional_price` quando existente; caso contrário, `price`.

### 9.3 Menu

```text
id
name
slug (unique)
active
display_order
created_at
updated_at
```

### 9.4 MenuListing

Tabela de associação entre menu e anúncio.

```text
id
menu_id
listing_id
display_order
unique(menu_id, listing_id)
```

Um anúncio pode aparecer em vários menus.

### 9.5 Banner

```text
id
title
image_url ou image
link_url
alt_text
display_order
active
starts_at (opcional)
ends_at (opcional)
created_at
updated_at
```

### 9.6 Customer

Usar o usuário do Django com e-mail único, complementado por perfil quando necessário.

```text
id
name
email (unique e normalizado)
is_active
created_at
updated_at
```

No primeiro checkout, a conta é criada automaticamente. O cliente permanece autenticado por sessão segura após a compra. Para voltar em outro dispositivo, será implementado acesso sem senha por código temporário associado ao e-mail. No ambiente de demonstração, o código pode ser exibido por um backend de e-mail de desenvolvimento; em produção, deve ser enviado por provedor configurável.

Se o envio de e-mail não for concluído dentro do prazo, manter a sessão persistente como fluxo funcional e documentar claramente a limitação no README.

### 9.7 CustomerAccessCode

```text
id
customer_id
code_hash
expires_at
used_at
attempt_count
created_at
```

Nunca armazenar o código em texto puro. Código de uso único, validade curta e limite de tentativas.

### 9.8 Order

```text
id
public_id (UUID unique)
customer_id
status
payment_status
subtotal
total
payment_last_four
created_at
updated_at
```

Status mínimos:

```text
payment_approved
payment_declined
cancelled
```

### 9.9 OrderItem

```text
id
order_id
listing_id (nullable)
listing_title
product_external_id
sku
unit_price
quantity
subtotal
image_url
```

Os campos duplicados são snapshots deliberados. O pedido não muda quando título, imagem ou preço do anúncio forem alterados posteriormente.

---

## 10. Dinheiro, estoque e transações

### Dinheiro

- usar `DecimalField` no banco;
- usar `Decimal` no Python;
- usar strings decimais na API quando necessário;
- nunca realizar cálculo monetário com `float`;
- arredondar de forma explícita para duas casas decimais;
- o backend calcula subtotal e total.

### Estoque

Na finalização:

1. iniciar transação atômica;
2. buscar anúncios com bloqueio de linha (`select_for_update`);
3. confirmar que todos estão ativos;
4. confirmar estoque suficiente;
5. recalcular preços vigentes;
6. criar pedido e itens com snapshot;
7. aplicar a regra de pagamento simulado;
8. reduzir estoque somente quando aprovado;
9. concluir a transação.

Requisições duplicadas devem ser evitadas no frontend e protegidas no backend com uma chave de idempotência do checkout.

---

## 11. Pagamento simulado

Regra obrigatória:

```text
cartão terminado em 0000 → pagamento recusado
qualquer outro final       → pagamento aprovado
```

Cuidados:

- deixar explícito que o formulário é uma simulação;
- oferecer números fictícios de teste;
- nunca solicitar ou armazenar cartão real;
- enviar somente dados mínimos necessários para simular a regra;
- armazenar, no máximo, os quatro últimos dígitos;
- pedido recusado pode ser persistido para histórico, mas não consome estoque;
- resposta deve indicar claramente aprovação ou recusa.

---

## 12. Busca

A busca é requisito central e deve funcionar sobre anúncios ativos.

Campos considerados:

- título do anúncio;
- descrição do anúncio;
- marca do produto importado;
- categoria do produto importado;
- nome dos menus associados.

Comportamento:

- ignorar maiúsculas e minúsculas;
- ignorar acentos;
- aceitar palavras incompletas;
- ordenar resultados por relevância;
- responder rapidamente;
- pesquisar enquanto o cliente digita, com debounce;
- cancelar requisições anteriores quando houver novo termo;
- exibir estado sem resultados.

Implementação planejada no PostgreSQL:

- extensão `unaccent`;
- extensão `pg_trgm`;
- índices adequados;
- pesos maiores para título, marca e categoria;
- similaridade e correspondência parcial;
- paginação.

Busca semântica com IA somente será considerada após todos os critérios obrigatórios estarem concluídos.

---

## 13. Carrinho

Usar Context API + reducer.

Funcionalidades:

- adicionar anúncio;
- aumentar quantidade;
- diminuir quantidade;
- remover item;
- limpar carrinho;
- total de itens;
- subtotal estimado;
- impedir quantidades inválidas na interface;
- persistir em `localStorage`;
- restaurar após recarregar a página;
- deduplicar itens pelo identificador do anúncio.

O carrinho armazena uma estimativa. Preço, atividade e estoque sempre são validados novamente pelo backend no checkout.

---

## 14. Área do cliente

Fluxo inicial:

1. cliente informa nome e e-mail no checkout;
2. backend normaliza o e-mail;
3. conta é criada automaticamente se ainda não existir;
4. cliente recebe uma sessão autenticada segura;
5. pedido aparece em “Meus pedidos”.

“Meus pedidos” exibe:

- número público do pedido;
- data e hora de Brasília;
- status;
- itens;
- quantidades;
- preços pagos;
- total.

O acesso nunca deve permitir consultar pedidos de outro cliente apenas alterando um UUID ou ID na URL.

---

## 15. Endpoints internos

Os nomes podem ser refinados sem alterar as responsabilidades.

### Saúde

```http
GET /api/health/
```

### Home e navegação

```http
GET /api/storefront/home/
GET /api/menus/
GET /api/menus/{slug}/listings/
```

### Anúncios

```http
GET /api/listings/
GET /api/listings/{slug}/
GET /api/listings/search/?q=...
```

### Checkout e pedidos

```http
POST /api/orders/checkout/
GET  /api/orders/mine/
GET  /api/orders/mine/{public_id}/
```

### Acesso do cliente

```http
POST /api/customer/access/request/
POST /api/customer/access/verify/
POST /api/customer/logout/
```

### Administração

- Django Admin em `/admin/`;
- importação via `python manage.py import_products`;
- ação administrativa de sincronização somente se houver tempo após o P0.

---

## 16. Django Admin

### ImportedProduct

- somente leitura para dados externos;
- busca por título, SKU e marca;
- filtros por categoria e disponibilidade;
- exibir última sincronização;
- atalho para criar anúncio relacionado.

### Listing

- criar a partir de produto importado;
- editar título, descrição, preços, quantidade e status;
- busca e filtros;
- ação ativar/desativar;
- validação de promoção;
- autocomplete para produto.

### Menu

- editar nome, status e ordem;
- organizar anúncios e sua ordem.

### Banner

- editar imagem, texto alternativo, link, ordem e status;
- validar URL e período de exibição.

### Order

- listagem e filtros por status e data;
- itens inline;
- valores e snapshots somente leitura;
- nenhuma alteração manual de total.

---

## 17. Interface da loja

### Páginas

- Home;
- Menu/categoria comercial;
- Busca;
- Detalhe do produto;
- Carrinho;
- Checkout;
- Resultado do pagamento;
- Meus pedidos;
- Detalhe do pedido;
- Acesso do cliente;
- Página não encontrada.

### Estados obrigatórios

Toda chamada assíncrona contempla:

- idle;
- loading;
- success;
- empty;
- error.

Exemplos críticos:

- carregamento da home;
- banner ausente;
- menu sem anúncios;
- busca sem resultados;
- carrinho vazio;
- item sem estoque;
- preço alterado antes do checkout;
- pagamento recusado;
- API indisponível;
- pedido não encontrado.

### Responsividade e acessibilidade

- priorizar celular;
- testar larguras pequenas sem overflow;
- navegação por teclado;
- foco visível;
- labels reais nos formulários;
- contraste adequado;
- texto alternativo em imagens;
- mensagens de erro associadas aos campos;
- botões com estado desabilitado durante envio;
- imagens responsivas e lazy loading.

---

## 18. Segurança

- segredos somente em variáveis de ambiente;
- `.env` ignorado pelo Git;
- `.env.example` sem valores reais;
- `DEBUG=False` em produção;
- `ALLOWED_HOSTS` restrito;
- CORS restrito ao domínio da Vercel;
- `CSRF_TRUSTED_ORIGINS` configurado;
- cookies seguros, HttpOnly e SameSite;
- serializers validando toda entrada;
- Django ORM contra injeção;
- throttling nos endpoints de acesso;
- código temporário armazenado com hash;
- pedidos filtrados pelo cliente autenticado;
- preços e estoque recalculados no backend;
- cartão real nunca solicitado nem armazenado;
- tokens, cookies e senhas nunca registrados em logs;
- revisão do histórico Git antes da entrega.

---

## 19. Datas e fuso horário

- `USE_TZ=True`;
- persistir datas em UTC;
- apresentar datas em `America/Sao_Paulo`;
- usar utilities do Django para datas conscientes de fuso;
- testar viradas de dia e expiração de códigos;
- documentar no README que a interface usa horário de Brasília.

---

## 20. Variáveis de ambiente

### Backend

```dotenv
DEBUG=True
SECRET_KEY=change-me
DATABASE_URL=postgresql://user:password@localhost:5432/mosaico
ALLOWED_HOSTS=localhost,127.0.0.1
FRONTEND_URL=http://localhost:5173
CORS_ALLOWED_ORIGINS=http://localhost:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173
DUMMYJSON_BASE_URL=https://dummyjson.com
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
DEFAULT_FROM_EMAIL=no-reply@example.com
```

### Frontend

```dotenv
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## 21. Setup e dados iniciais

O README deve oferecer o menor número possível de passos.

Fluxo desejado:

```bash
docker compose up --build
```

Ou, se o setup for separado:

```bash
python manage.py migrate
python manage.py seed_demo
python manage.py import_products
```

O comando `seed_demo` deve:

- criar ou atualizar o usuário administrativo de teste;
- criar menus e banners de demonstração quando apropriado;
- ser idempotente;
- nunca depender de senha de produção;
- obter as credenciais de demonstração por variáveis ou valores explicitamente locais.

---

## 22. Testes

### Backend — prioridade máxima

1. importação inicial;
2. reimportação sem duplicidade;
3. atualização de produto externo;
4. validação do preço promocional;
5. anúncio inativo ausente da loja;
6. estoque insuficiente;
7. cálculo monetário exato;
8. pagamento terminado em `0000` recusado;
9. pagamento aprovado reduz estoque;
10. pagamento recusado não reduz estoque;
11. snapshot do pedido permanece após editar anúncio;
12. cliente não acessa pedido alheio;
13. busca sem acento, parcial e por marca/categoria;
14. idempotência do checkout.

Mockar o DummyJSON nos testes da importação.

### Frontend — prioridade

1. adicionar, atualizar e remover item;
2. restaurar carrinho do `localStorage`;
3. mostrar preço promocional;
4. busca e estado sem resultado;
5. validação do checkout;
6. pagamento aprovado e recusado;
7. renderização de “Meus pedidos”.

### Testes manuais

- fluxo completo no celular;
- fluxo completo no desktop;
- teclado e foco;
- busca com acentos e termos incompletos;
- recarga com carrinho preenchido;
- concorrência simples no último item de estoque;
- acesso administrativo;
- smoke test das URLs públicas.

---

## 23. Observabilidade

Logs estruturados mínimos:

- endpoint;
- método;
- status;
- duração;
- resultado da importação;
- identificador público do pedido;
- resultado do pagamento simulado;
- erro sem dados sensíveis.

Nunca registrar senha, código de acesso, cookies, `SECRET_KEY`, número completo de cartão ou dados de ambiente.

---

## 24. Deploy

### Railway — PostgreSQL

- criar o banco PostgreSQL;
- usar a `DATABASE_URL` fornecida;
- manter persistência compatível com a avaliação.

### Railway — Django

- instalar dependências;
- executar migrations;
- coletar arquivos estáticos;
- iniciar com Gunicorn;
- configurar domínio público e healthcheck;
- criar usuário administrativo de demonstração;
- importar produtos e criar dados iniciais.

Comandos conceituais:

```bash
python manage.py migrate
python manage.py collectstatic --noinput
gunicorn config.wsgi:application
```

### Vercel — React

- apontar o diretório raiz para `frontend`;
- configurar `VITE_API_BASE_URL` com a URL do Railway;
- adicionar rewrite para o fallback do React Router;
- validar acesso direto a rotas internas.

### Configuração cruzada

- adicionar domínio da Vercel ao CORS;
- adicionar domínio da Vercel às origens CSRF;
- habilitar HTTPS;
- validar cookies entre domínios;
- realizar smoke test completo depois do deploy.

---

## 25. Uso responsável de IA

### AGENTS.md

Arquivo obrigatório na raiz com:

- objetivo do projeto;
- arquitetura;
- comandos de execução e teste;
- padrões de código;
- regras de dinheiro, estoque e pedidos;
- proibição de segredos;
- exigência de não implementar fases futuras sem necessidade;
- obrigação de atualizar o arquivo quando um erro recorrente for descoberto.

### Vault

```text
vault/
├── decisoes/
│   └── AAAA-MM-DD-titulo.md
├── conversas/
│   └── README.md
├── diario.md
└── erros-da-ia.md
```

Conteúdo:

- **decisões:** contexto, alternativas, escolha e consequência;
- **diário:** o que foi feito, validado e ficou pendente;
- **erros da IA:** erro, como foi percebido, correção e nova regra;
- **conversas:** links, exports ou registros relevantes, sem segredos.

Regra: se outra pessoa ler apenas `AGENTS.md` e `/vault`, deve conseguir continuar o projeto.

---

## 26. Git

Branch principal:

```text
main
```

Commits pequenos e progressivos, por exemplo:

```text
docs: align implementation plan with ecommerce challenge
chore: initialize react and django projects
chore: add postgres and environment configuration
feat: import dummyjson products idempotently
feat: add listings menus and banners to admin
feat: build storefront navigation
feat: implement accent-insensitive product search
feat: persist shopping cart locally
feat: implement transactional simulated checkout
feat: add customer order history
test: cover pricing stock and payment rules
style: polish responsive storefront
docs: add setup architecture and ai usage notes
chore: configure railway and vercel deployment
```

Não fazer um único commit final nem commits vagos como `update`, `teste` ou `final`.

---

## 27. README final

Deve conter:

- apresentação e identidade da loja;
- URLs públicas;
- stack e arquitetura;
- como executar com o mínimo de passos;
- credenciais do ADMIN de demonstração;
- como importar/reimportar produtos;
- variáveis de ambiente;
- modelagem do banco;
- regras de negócio;
- escolha de acesso posterior do cliente;
- endpoints principais;
- testes executados;
- decisões e trade-offs;
- limitações e próximos passos;
- como a IA ajudou, onde errou e como a saída foi conferida;
- link opcional para vídeo de até cinco minutos.

---

## 28. Fases de implementação

### Fase 0 — Alinhamento e memória do projeto

Tarefas:

- consolidar este plano;
- criar `AGENTS.md`;
- criar `/vault`;
- registrar decisões iniciais;
- criar `.gitignore`;
- iniciar Git se necessário;
- documentar o contrato do DummyJSON.

Critério de conclusão: outra pessoa entende objetivo, regras e ordem de execução lendo o repositório.

Modelo recomendado: **GPT-5.6 Sol — High**.

### Fase 1 — Bootstrap

Tarefas:

- iniciar React + Vite;
- iniciar Django + DRF;
- configurar PostgreSQL;
- configurar CORS e ambientes;
- criar `/api/health/`;
- configurar testes básicos;
- preparar Docker Compose.

Critério de conclusão:

```text
localhost:5173
localhost:8000/api/health/
```

funcionando.

Modelo recomendado: **GPT-5.6 Sol — Medium**.

### Fase 2 — Produtos e importação

Tarefas:

- criar `ImportedProduct` e migrations;
- implementar cliente DummyJSON e paginação;
- criar comando idempotente;
- adicionar Admin somente leitura;
- testar importação e reimportação.

Critério de conclusão: todos os produtos externos são persistidos e nova execução não cria duplicatas.

Modelo recomendado: **GPT-5.6 Sol — High**.

### Fase 3 — Anúncios, menus e banners

Tarefas:

- criar `Listing`, `Menu`, `MenuListing` e `Banner`;
- aplicar constraints;
- configurar Django Admin;
- criar dados de demonstração;
- implementar endpoints públicos básicos.

Critério de conclusão: administrador consegue montar a vitrine sem editar código.

Modelo recomendado: **GPT-5.6 Sol — High**.

### Fase 4 — Estrutura visual da loja

Tarefas:

- definir tokens da marca Mosaico;
- criar layout responsivo, Home, cards e detalhes;
- renderizar banners e menus;
- implementar estados de UI.

Critério de conclusão: navegação pública funcional no celular e desktop.

Modelo recomendado: **GPT-5.6 Sol — Medium**.

### Fase 5 — Busca

Tarefas:

- habilitar `unaccent` e `pg_trgm`;
- criar índices e ranking;
- aceitar acentos, caixa e termos incompletos;
- integrar busca com debounce;
- testar relevância e performance.

Critério de conclusão: produtos ativos são encontrados por título, descrição, marca e categoria.

Modelo recomendado: **GPT-5.6 Sol — High**.

### Fase 6 — Carrinho

Tarefas:

- Context API + reducer;
- adicionar, atualizar e remover;
- persistir e restaurar pelo `localStorage`;
- criar tela vazia e resumo.

Critério de conclusão: carrinho permanece consistente durante navegação e recarga.

Modelo recomendado: **GPT-5.6 Sol — Medium**.

### Fase 7 — Checkout e pagamento

Tarefas:

- criar `Order` e `OrderItem`;
- implementar transação, bloqueio de estoque e recálculo;
- implementar snapshots e idempotência;
- implementar regra do final `0000`;
- criar formulário e resultado do pagamento.

Critério de conclusão: pagamento aprovado reduz estoque e recusado não reduz; valores permanecem exatos.

Status em 30 de setembro de 2026: **concluída**. O cadastro comercial mínimo do cliente foi criado para vincular o pedido; autenticação, sessão e acesso posterior permanecem corretamente reservados à Fase 8.

Modelo recomendado: **GPT-5.6 Sol — High**.

### Fase 8 — Cliente e Meus pedidos

Tarefas:

- criar conta automaticamente;
- estabelecer sessão segura;
- listar pedidos do cliente;
- exibir detalhes e snapshots;
- impedir acesso cruzado;
- implementar ou documentar acesso posterior.

Critério de conclusão: cliente vê somente seus próprios pedidos depois da compra.

Modelo recomendado: **GPT-5.6 Sol — High**.

### Fase 9 — UX e responsividade

Tarefas:

- revisar mobile-first e acessibilidade;
- otimizar imagens;
- adicionar skeletons e feedback;
- revisar erros de pagamento e estoque;
- eliminar atritos no carrinho e checkout.

Critério de conclusão: fluxo completo confortável principalmente no celular.

Modelo recomendado: **GPT-5.6 Sol — Medium**.

### Fase 10 — Testes e segurança

Tarefas:

- executar suítes backend e frontend;
- revisar constraints e concorrência;
- validar CORS, CSRF e cookies;
- procurar segredos no repositório e histórico;
- testar usuário administrativo;
- executar checklist manual.

Critério de conclusão: regras críticas possuem testes e não existem segredos versionados.

Modelo recomendado: **GPT-5.6 Sol — High**.

### Fase 11 — Deploy

Tarefas:

- criar PostgreSQL no Railway;
- publicar Django no Railway;
- executar migrations e seeds;
- publicar React na Vercel;
- configurar domínios, CORS e CSRF;
- executar smoke test público.

Critério de conclusão: avaliador consegue usar loja e ADMIN pelas URLs publicadas.

Modelo recomendado: **GPT-5.6 Sol — High**.

### Fase 12 — Documentação e entrega

Tarefas:

- finalizar README e modelagem;
- atualizar `/vault`;
- adicionar screenshots;
- revisar commits e limitações;
- gravar vídeo opcional de até cinco minutos.

Critério de conclusão: repositório pode ser clonado, executado e avaliado apenas pelo README.

Modelo recomendado: **GPT-5.6 Sol — Medium**.

Antes de cada fase, confirmar o modelo e o nível de esforço recomendados. Não iniciar uma fase com configuração inferior sem avisar o responsável pelo projeto.

---

## 29. Priorização pelo prazo

### P0 — obrigatório

1. setup executável;
2. importação idempotente;
3. ADMIN com produtos, anúncios, menus, banners e pedidos;
4. Home, listagem e detalhes;
5. busca obrigatória;
6. carrinho persistente;
7. checkout transacional;
8. regra de pagamento;
9. conta automática e Meus pedidos;
10. regras de dinheiro, estoque e snapshots;
11. responsividade mobile;
12. README, `AGENTS.md`, `/vault` e `.env.example`;
13. repositório público com commits progressivos.

### P1 — importante

- cobertura automatizada das regras críticas;
- publicação Vercel/Railway;
- acesso posterior por código temporário;
- ação de sincronização dentro do Admin;
- refinamento de acessibilidade e performance.

### P2 — diferenciais

- busca semântica;
- animações avançadas;
- vídeo de apresentação;
- dashboards;
- recomendações;
- funcionalidades além do enunciado.

Nenhum item P2 começa enquanto houver item P0 pendente.

---

## 30. Riscos e mitigação

### Prazo muito curto

Mitigação: Django Admin, fases pequenas, P0 estrito e ausência de features decorativas antes do fluxo completo.

### Duplicidade na importação

Mitigação: `external_id` único, `update_or_create`, paginação testada e transação por lote.

### Erro de centavos

Mitigação: `Decimal`, constraints e testes com múltiplas quantidades.

### Venda acima do estoque

Mitigação: transação, `select_for_update` e validação no servidor.

### Pedido histórico mudar

Mitigação: snapshots em `OrderItem`.

### Busca não encontrar termos reais

Mitigação: `unaccent`, trigramas, pesos, testes com acentos, caixa e termos incompletos.

### Conta automática insegura

Mitigação: sessão HttpOnly, códigos temporários com hash e autorização por cliente em todas as consultas.

### Segredo versionado

Mitigação: `.gitignore` inicial, `.env.example`, varredura do Git e revisão antes de tornar público.

### Código de IA difícil de explicar

Mitigação: implementar em fases, registrar decisões, revisar testes e atualizar `AGENTS.md` e `/vault`.

---

## 31. Critérios de aceite

### Importação

- [ ] produtos são importados do DummyJSON;
- [ ] todos os itens paginados são alcançados;
- [ ] reimportação não duplica;
- [ ] atualizações externas são refletidas;
- [ ] anúncios locais não são sobrescritos.

### ADMIN

- [ ] login funciona;
- [ ] usuário de teste está no README;
- [ ] produtos importados são visíveis;
- [ ] anúncio pode ser criado, editado e desativado;
- [ ] menus podem ser organizados;
- [ ] banners podem ser organizados;
- [ ] pedidos e itens são visíveis.

### Loja

- [ ] Home respeita configuração do ADMIN;
- [ ] menus listam anúncios corretos;
- [ ] detalhes do anúncio funcionam;
- [ ] promoção mostra claramente “de/por”;
- [ ] somente anúncios ativos são vendidos;
- [ ] layout funciona principalmente no celular.

### Busca

- [ ] encontra por título e descrição;
- [ ] encontra por marca e categoria;
- [ ] ignora caixa e acentos;
- [ ] encontra palavras incompletas;
- [ ] resultados relevantes aparecem primeiro;
- [ ] estado sem resultados é claro.

### Carrinho

- [ ] adiciona, altera e remove;
- [ ] não aceita quantidade inválida;
- [ ] permanece após recarregar;
- [ ] subtotal estimado está correto.

### Checkout

- [ ] cria conta automaticamente;
- [ ] preço é recalculado no servidor;
- [ ] estoque é revalidado;
- [ ] cartão final `0000` é recusado;
- [ ] recusa não consome estoque;
- [ ] aprovação consome estoque;
- [ ] pedido guarda snapshots;
- [ ] nenhuma cobrança real acontece.

### Cliente

- [ ] “Meus pedidos” exibe itens, valores e status;
- [ ] datas aparecem em horário de Brasília;
- [ ] cliente não acessa pedido alheio;
- [ ] método de retorno está documentado.

### Entrega

- [ ] migrations estão versionadas;
- [ ] setup cria banco e usuário de teste;
- [ ] README contém decisões e testes;
- [ ] `AGENTS.md` existe e está atualizado;
- [ ] `/vault` registra decisões, diário, erros e conversas;
- [ ] `.env.example` existe;
- [ ] nenhum segredo está no Git;
- [ ] histórico contém commits progressivos;
- [ ] repositório é público.

---

## 32. Definição de pronto

O projeto estará pronto quando o avaliador conseguir, usando apenas o README:

1. clonar o repositório;
2. iniciar banco, backend e frontend;
3. acessar o ADMIN com o usuário de teste;
4. importar novamente os produtos sem duplicação;
5. criar ou editar anúncio, menu e banner;
6. abrir a loja no celular;
7. encontrar um produto pela busca;
8. adicionar produtos e recarregar o carrinho;
9. testar pagamento aprovado;
10. testar cartão terminado em `0000`;
11. confirmar que a recusa não reduziu estoque;
12. abrir “Meus pedidos”;
13. conferir que alterações posteriores do anúncio não mudaram o pedido;
14. entender decisões, limitações e uso da IA.

---

## 33. Próximo passo imediato

Executar a **Fase 0**:

1. criar `AGENTS.md`;
2. criar a estrutura de `/vault`;
3. registrar as decisões arquiteturais deste plano;
4. configurar `.gitignore`;
5. verificar/iniciar o repositório Git;
6. preparar a Fase 1 sem implementar funcionalidades futuras.

Configuração recomendada para a Fase 0: **GPT-5.6 Sol — High**.
