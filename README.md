# Mosaico

Loja virtual desenvolvida para o desafio técnico da Prohall. O projeto usa React no frontend, Django REST Framework no backend e PostgreSQL como banco de dados.

> Estado atual: Fase 7 concluída — checkout transacional, pedidos com snapshots e pagamento simulado. Conta autenticada e “Meus pedidos” entram na Fase 8.

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

O comando percorre todas as páginas do DummyJSON e pode ser executado novamente. Produtos existentes são atualizados pelo identificador externo, sem duplicação.

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
- `POST /api/orders/checkout/`.

O checkout recebe nome, e-mail, itens, preços esperados, uma chave UUID de idempotência e somente os quatro dígitos fictícios usados na simulação. Nunca informe um cartão real: `0000` simula recusa e qualquer outro final de quatro dígitos simula aprovação. Preços e estoque são confirmados novamente pelo backend; somente pedidos aprovados reduzem o estoque.

### Frontend

```powershell
Set-Location .\frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Aplicação: <http://localhost:5173/>

Rotas públicas da interface:

- `/` — Home com banners, benefícios, produtos e menus;
- `/menu/{slug}` — anúncios organizados pelo menu;
- `/busca?q={termo}` — resultados paginados e ordenados por relevância;
- `/carrinho` — itens selecionados, quantidades e subtotal estimado;
- `/checkout` — identificação e pagamento simulado;
- `/checkout/resultado` — confirmação de aprovação ou recusa;
- `/produto/{slug}` — galeria e detalhes comerciais do anúncio.

O sistema visual está documentado em [`DESIGN.md`](DESIGN.md). O carrinho persiste no navegador, mas o backend recalcula preços, atividade e estoque dentro da transação do checkout. A conta autenticada e o acesso posterior ao histórico serão adicionados na Fase 8; nesta fase, o cadastro comercial do cliente já fica associado ao pedido.

## Execução com Docker

```bash
docker compose up --build
```

O arquivo foi preparado na Fase 1, mas ainda precisa ser validado em uma máquina com Docker instalado.

## Testes e verificações

```powershell
.\.venv\Scripts\python.exe .\backend\manage.py test apps.core apps.catalog apps.storefront apps.customers apps.orders
Set-Location .\frontend
npm test
npm run lint
npm run build
```

## Documentação

- [Plano de implementação](docs/plano_implementacao_prohall.md)
- [Contrato do DummyJSON](docs/api-dummyjson.md)
- [Sistema visual](DESIGN.md)
- [Memória do projeto](vault/diario.md)

As credenciais administrativas de demonstração serão adicionadas na fase correspondente.
