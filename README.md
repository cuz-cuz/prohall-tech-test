# Mosaico

Loja virtual desenvolvida para o desafio técnico da Prohall. O projeto usa React no frontend, Django REST Framework no backend e PostgreSQL como banco de dados.

> Estado atual: Fase 1 — bootstrap da aplicação. Catálogo, busca, carrinho e checkout serão implementados nas fases seguintes.

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

### Frontend

```powershell
Set-Location .\frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Aplicação: <http://localhost:5173/>

## Execução com Docker

```bash
docker compose up --build
```

O arquivo foi preparado na Fase 1, mas ainda precisa ser validado em uma máquina com Docker instalado.

## Testes e verificações

```powershell
.\.venv\Scripts\python.exe .\backend\manage.py test apps.core
Set-Location .\frontend
npm test
npm run lint
npm run build
```

## Documentação

- [Plano de implementação](docs/plano_implementacao_prohall.md)
- [Contrato do DummyJSON](docs/api-dummyjson.md)
- [Memória do projeto](vault/diario.md)

As credenciais administrativas de demonstração e as instruções completas de importação serão adicionadas nas fases correspondentes.
