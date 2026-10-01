# AGENTS.md

## Projeto

Este repositório contém o desafio técnico da Prohall: uma loja virtual chamada **Mosaico**, com ADMIN e LOJA, importação de produtos do DummyJSON, busca, carrinho persistente, checkout com pagamento simulado e histórico de pedidos.

A fonte de verdade é `docs/plano_implementacao_prohall.md`. Antes de alterar código, identifique a fase atual e leia as seções relevantes do plano.

## Arquitetura definida

- frontend: React + Vite, publicado na Vercel;
- backend: Django + Django REST Framework, publicado no Railway;
- banco: PostgreSQL local e Railway PostgreSQL em produção;
- administração principal: painel React em `/admin`, consumindo API DRF protegida para usuários `is_staff`;
- contingência operacional: Django Admin mantido no backend em `/admin/`;
- origem dos produtos: API pública DummyJSON;
- produto importado e anúncio comercial são entidades separadas.

Não trocar a stack nem introduzir outro framework sem registrar a decisão em `vault/decisoes/`.

## Regras que não podem ser quebradas

1. O frontend nunca é a fonte de verdade de preço, estoque ou total.
2. Dinheiro usa `Decimal`/`DecimalField`, nunca `float`.
3. Preço promocional deve ser positivo e menor que o preço normal.
4. Somente anúncios ativos podem ser vendidos.
5. Não vender quantidade superior ao estoque.
6. Checkout deve recalcular preços e bloquear estoque dentro de transação.
7. Cartão simulado terminado em `0000` é recusado; qualquer outro é aprovado.
8. Pagamento recusado não reduz estoque.
9. `OrderItem` guarda snapshot de nome, preço, SKU e imagem; `Order` guarda snapshot do nome do comprador. Histórico de pedido nunca lê dado que ainda pode mudar.
10. Datas são persistidas em UTC e exibidas em `America/Sao_Paulo`.
11. Cliente só pode consultar os próprios pedidos.
12. Importação do DummyJSON é paginada, idempotente e não sobrescreve anúncios; por padrão traz apenas as categorias do nicho definidas em `apps/catalog/niche.py`.
13. Carrinho persiste após recarregar a página.
14. Busca considera título, descrição, marca e categoria; ignora caixa e acentos e aceita termos incompletos.
15. Nunca solicitar, armazenar ou registrar um número real de cartão.
16. O painel não usa `<select>` nativo: dropdowns são `AdminSelect` e ações de tabela confirmam ou editam em `AdminModal`.

## Segurança

- nunca versionar `.env`, senhas, tokens, cookies, códigos temporários ou chaves;
- exemplos pertencem a `.env.example` e não podem conter segredos reais;
- não registrar dados sensíveis em logs;
- validar entradas com serializers;
- restringir CORS, CSRF e hosts em produção;
- revisar arquivos staged e histórico antes de publicar o repositório.

## Forma de trabalho

- implementar somente a fase solicitada;
- não antecipar diferenciais enquanto houver P0 pendente;
- preferir soluções pequenas e explicáveis;
- preservar mudanças existentes do usuário;
- criar migrations para toda alteração de modelo;
- adicionar ou atualizar testes para regras de negócio;
- ao inserir uma nova classe em arquivo de testes existente, conferir os limites das classes e listar os métodos descobertos antes de executar a suíte;
- testes concorrentes com threads devem fechar explicitamente todas as conexões de banco abertas por cada worker;
- executar verificações proporcionais ao risco;
- ao terminar, registrar o trabalho em `vault/diario.md`;
- registrar decisões relevantes em `vault/decisoes/`;
- registrar falhas de IA e a prevenção adotada em `vault/erros-da-ia.md`;
- atualizar este arquivo quando uma regra recorrente for descoberta.

## Modelos por fase

- usar GPT-5.6 Sol — Medium nas fases 1, 4, 6, 9, 12 e 15;
- usar GPT-5.6 Sol — High nas fases 0, 2, 3, 5, 7, 8, 10, 11, 13 e 14;
- antes de começar cada fase, lembrar o responsável de selecionar a configuração indicada.

## Comandos

### Backend

```powershell
.\.venv\Scripts\python.exe -m pip install -r .\backend\requirements.txt
.\.venv\Scripts\python.exe .\backend\manage.py check
.\.venv\Scripts\python.exe .\backend\manage.py test apps.core
.\.venv\Scripts\python.exe .\backend\manage.py test apps.catalog
.\.venv\Scripts\python.exe .\backend\manage.py test apps.storefront
.\.venv\Scripts\python.exe .\backend\manage.py import_products
.\.venv\Scripts\python.exe .\backend\manage.py seed_demo
.\.venv\Scripts\python.exe .\backend\manage.py runserver
```

O `runserver` e as migrations exigem uma `DATABASE_URL` PostgreSQL válida em `backend/.env`.
Ao executar a suíte a partir da raiz, informe explicitamente os apps; `manage.py test` sem rótulos pode não descobri-los porque o diretório de trabalho não é `backend`.

### Frontend

```powershell
Set-Location .\frontend
npm install
npm test
npm run lint
npm run build
npm run dev
```

### Docker

```bash
docker compose up --build
```

O Compose foi preparado, mas deve ser validado em uma máquina com Docker. Não documentar comandos adicionais como validados antes de executá-los.

## Definição de conclusão de uma tarefa

Uma tarefa só termina quando:

- o comportamento solicitado está implementado;
- migrations necessárias existem;
- testes relevantes foram executados ou a impossibilidade foi documentada;
- não há segredo novo no repositório;
- documentação e vault refletem decisões materiais;
- arquivos alterados e validações são informados ao responsável.
