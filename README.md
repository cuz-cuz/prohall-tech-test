# Mosaico

Loja virtual desenvolvida para o desafio técnico da Prohall. O projeto usa React no frontend, Django REST Framework no backend e PostgreSQL como banco de dados.

> Estado atual: Fase 10 concluída e evolução da vitrine validada. Um painel administrativo React próprio foi planejado para as fases 11 a 13, antes do deploy e da entrega.

## Requisitos

- Node.js 22.12 ou superior;
- Python 3.14;
- PostgreSQL 18;
- Docker Compose opcional.

## Execução local sem Docker

### Backend

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r .\backend\requirements.txt
Copy-Item .\backend\.env.example .\backend\.env
```

Edite `backend/.env` e informe uma `DATABASE_URL` válida para o seu PostgreSQL local. Depois:

```powershell
.\.venv\Scripts\python.exe .\backend\manage.py migrate
.\.venv\Scripts\python.exe .\backend\manage.py runserver
```

Healthcheck: <http://localhost:8000/api/health/>

### Importação de produtos

Com o PostgreSQL configurado e as migrations aplicadas:

```powershell
.\.venv\Scripts\python.exe .\backend\manage.py import_products
```

O comando lê somente as categorias do nicho feminino da loja, definidas em `backend/apps/catalog/niche.py`: `beauty`, `skin-care`, `fragrances`, `tops`, `womens-dresses`, `womens-bags`, `womens-shoes`, `sunglasses`, `womens-jewellery` e `womens-watches`. Cada categoria é lida em um endpoint paginado próprio e o comando pode ser executado novamente. Produtos existentes são atualizados pelo identificador externo, sem duplicação. Use `--all-categories` para importar o catálogo inteiro do DummyJSON e `--remover-fora-do-nicho` para apagar produtos fora do nicho que não tenham anúncio. O `seed_demo` seleciona os 45 itens do nicho feminino atualmente disponíveis nas categorias configuradas e cria anúncios separados; descontos da origem servem apenas para preparar promoções nos anúncios de demonstração e promoções personalizadas são preservadas.

### Vitrine e administrador de demonstração

Depois da importação, prepare anúncios, menus e banners idempotentes com:

```powershell
.\.venv\Scripts\python.exe .\backend\manage.py seed_demo
```

Para o comando também criar ou atualizar um administrador local, defina no `backend/.env`:

```dotenv
DEMO_ADMIN_USERNAME=admin
DEMO_ADMIN_EMAIL=admin@mosaico.local
DEMO_ADMIN_PASSWORD=escolha-uma-senha-local
```

Nenhuma senha administrativa é versionada. Sem `DEMO_ADMIN_PASSWORD`, os dados da vitrine são criados e a criação do usuário é ignorada. O Admin fica em <http://localhost:8000/admin/>.

Endpoints públicos disponíveis:

- `GET /api/storefront/home/`;
- `GET /api/menus/`;
- `GET /api/menus/{slug}/listings/`;
- `GET /api/listings/`;
- `GET /api/listings/search/?q={termo}&page={pagina}`;
- `GET /api/listings/{slug}/`;
- `POST /api/orders/checkout/`;
- `GET /api/customer/session/`;
- `POST /api/customer/access/request/` e `POST /api/customer/access/verify/`;
- `POST /api/customer/logout/`;
- `GET /api/orders/mine/` e `GET /api/orders/mine/{public_id}/`.

As listagens de anúncios e de menus são paginadas. Aceitam `page`, `page_size`, `min_price`, `max_price`, `free_shipping` e `ordering`. As ordenações disponíveis são `best_selling`, `least_selling`, `price_asc`, `price_desc`, `newest`, `oldest` e `discount_desc`; páginas de menu também aceitam `featured`. Vendas recusadas não entram na contagem de mais vendidos.

O checkout recebe nome, e-mail, itens, preços esperados, uma chave UUID de idempotência e somente os quatro dígitos fictícios usados na simulação. Nunca informe um cartão real: `0000` simula recusa e qualquer outro final de quatro dígitos simula aprovação. Preços e estoque são confirmados novamente pelo backend; somente pedidos aprovados reduzem o estoque.

Não existe tela de cadastro: a conta do cliente é criada no primeiro checkout, identificada pelo e-mail normalizado, e o acesso posterior é feito por código temporário, sem senha. Cada pedido guarda o nome informado naquela compra, então atualizar o nome da conta não altera o histórico já registrado.

Após o checkout, o navegador recebe uma sessão HttpOnly e vê somente os pedidos ligados àquela conta. Para acessar em outro navegador, solicite um código de seis dígitos pelo e-mail usado na compra; ele expira em 10 minutos, só pode ser usado uma vez e bloqueia após cinco tentativas. Em desenvolvimento (`DEBUG=True`), o backend usa e-mail em memória e mostra o código na resposta para a demonstração, sem registrá-lo em logs. Em produção, configure `EMAIL_BACKEND` para um provedor ou SMTP, junto das variáveis `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` e `EMAIL_USE_TLS`; o backend recusa iniciar em produção com o provedor em memória.

### Frontend

```powershell
Set-Location .\frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Aplicação: <http://localhost:5173/>

Rotas públicas da interface:

- `/` — Home com banners navegáveis e produtos mais procurados;
- `/produtos` — catálogo paginado com filtros e ordenação;
- `/menu/{slug}` — anúncios paginados e filtráveis organizados pelo menu;
- `/busca?q={termo}` — resultados paginados e ordenados por relevância;
- `/carrinho` — itens selecionados, estoque, condições de pagamento e subtotal estimado;
- `/checkout` — identificação e pagamento simulado;
- `/checkout/resultado` — confirmação de aprovação ou recusa;
- `/meus-pedidos` — histórico do cliente autenticado;
- `/acesso` — acesso posterior por código temporário enviado ao e-mail;
- `/produto/{slug}` — galeria, quantidade, compartilhamento e detalhes comerciais do anúncio.

A vitrine informa 10% de desconto no Pix, parcelamento em até 12 vezes e frete grátis a partir de um valor mínimo. Pix e parcelamento vêm de `PIX_DISCOUNT_PERCENT` e `MAX_INSTALLMENTS`.

O mínimo de frete grátis é editável em **Configurações** no painel administrativo e vale sobre o **subtotal do carrinho**: o carrinho mostra quanto falta para alcançá-lo. `FREE_SHIPPING_MINIMUM` apenas define o valor inicial, usado na primeira vez que a configuração é lida; depois disso o valor vive no banco e mudar não exige novo deploy. Cada anúncio também pode ser marcado com **frete grátis** no editor, mas isso é apenas um destaque do item na vitrine e não dispensa o mínimo do pedido. São condições de apresentação: o checkout atual continua sendo uma simulação por cartão e sempre confirma o preço e o estoque no servidor.

O sistema visual está documentado em [`DESIGN.md`](DESIGN.md). O carrinho persiste no navegador, mas o backend recalcula preços, atividade e estoque dentro da transação do checkout. Para deploy, configure frontend e API em subdomínios do mesmo domínio próprio e ajuste CORS, CSRF e HTTPS; a sessão usa cookies `SameSite=Lax`.

Em produção, use `DEBUG=False` e informe explicitamente `SECRET_KEY`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS` e `CSRF_TRUSTED_ORIGINS`. As origens CORS e CSRF devem usar HTTPS; o backend força HTTPS e usa cookies `Secure`. Quando o domínio estiver definitivo, configure também `SECURE_HSTS_SECONDS`, `SECURE_HSTS_INCLUDE_SUBDOMAINS` e `SECURE_HSTS_PRELOAD` conforme a política do domínio. A inicialização falha se hosts, origens ou provedor de e-mail de produção estiverem ausentes.

## Execução com Docker

```bash
docker compose up --build
```

O Compose foi validado no Docker Desktop com WSL 2. Ele inicia PostgreSQL 18, aplica as migrations, publica a API em `localhost:8000` e o frontend em `localhost:5173`.

## Testes e verificações

```powershell
.\.venv\Scripts\python.exe .\backend\manage.py test apps.core apps.catalog apps.storefront apps.customers apps.orders
Set-Location .\frontend
npm test
npm run lint
npm run build
```

A suíte backend inclui dois checkouts concorrentes disputando a última unidade no PostgreSQL. A revisão de segurança também usa `python manage.py check --deploy`, `pip check`, `npm audit --omit=dev` e uma varredura de padrões de segredo no workspace e no histórico Git.

## Documentação

- [Plano de implementação](docs/plano_implementacao_prohall.md)
- [Auditoria dos requisitos e pendências](docs/auditoria_requisitos.md)
- [Contrato do DummyJSON](docs/api-dummyjson.md)
- [Sistema visual](DESIGN.md)
- [Memória do projeto](vault/diario.md)

As credenciais administrativas não são versionadas. Crie um administrador local com `docker compose exec backend python manage.py createsuperuser` ou configure `DEMO_ADMIN_PASSWORD` apenas no `.env` local antes de executar `seed_demo`.
