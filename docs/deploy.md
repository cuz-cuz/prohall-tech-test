# Deploy — Railway e Vercel

Este roteiro publica o backend Django e o PostgreSQL no Railway e o frontend React na Vercel. Segredos devem ser cadastrados somente nos painéis das plataformas.

## 1. Railway

1. Crie um projeto e adicione um serviço PostgreSQL.
2. Adicione um serviço a partir do repositório GitHub e defina **Root Directory** como `backend`.
3. Gere um domínio público para o serviço Django.
4. Configure **Pre-deploy Command** como `python manage.py migrate` e o timeout como 300 segundos.
5. Configure **Healthcheck Path** como `/api/health/`. Inclua `healthcheck.railway.app` em `ALLOWED_HOSTS`. O healthcheck chega por HTTP interno; por isso `/api/health/` é a única rota isenta de `SECURE_SSL_REDIRECT` (`SECURE_REDIRECT_EXEMPT`).
   Pela CLI, essas duas configurações podem ser aplicadas com `railway api` e a mutation `serviceInstanceUpdate` (`preDeployCommand` e `healthcheckPath`).
6. O `Dockerfile` coleta os arquivos estáticos e inicia Gunicorn na variável `PORT` fornecida pelo Railway.

Variáveis obrigatórias do backend, substituindo os domínios de exemplo:

```dotenv
DEBUG=False
SECRET_KEY=<gere-uma-chave-longa-e-aleatoria>
DATABASE_URL=${{Postgres.DATABASE_URL}}
ALLOWED_HOSTS=<backend>.up.railway.app,healthcheck.railway.app,<frontend>.vercel.app
CORS_ALLOWED_ORIGINS=https://<frontend>.vercel.app
CSRF_TRUSTED_ORIGINS=https://<frontend>.vercel.app
SESSION_COOKIE_SAMESITE=Lax
CSRF_COOKIE_SAMESITE=Lax
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=3600
SECURE_HSTS_INCLUDE_SUBDOMAINS=False
SECURE_HSTS_PRELOAD=False
SHIPPING_FEE=19.90
DEMO_ADMIN_USERNAME=admin
DEMO_ADMIN_EMAIL=<email-de-demonstracao>
DEMO_ADMIN_PASSWORD=<senha-exclusiva-do-ambiente>
DEMO_RESET_ENABLED=True
DEMO_RESET_COOLDOWN_SECONDS=600
R2_MEDIA_ENABLED=True
R2_ACCOUNT_ID=<id-da-conta-cloudflare>
R2_ACCESS_KEY_ID=<access-key-do-token-r2>
R2_SECRET_ACCESS_KEY=<secret-key-do-token-r2>
R2_BUCKET_NAME=mosaico-media
R2_PUBLIC_BASE_URL=https://media.seudominio.com
R2_MAX_UPLOAD_BYTES=8388608
R2_MAX_IMAGE_PIXELS=40000000
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
# Sem SMTP: django.core.mail.backends.dummy.EmailBackend (descarta os códigos; nunca use console, que os grava em log)
DEFAULT_FROM_EMAIL=<remetente-validado>
EMAIL_HOST=<servidor-smtp>
EMAIL_PORT=587
EMAIL_HOST_USER=<usuario-smtp>
EMAIL_HOST_PASSWORD=<senha-smtp>
EMAIL_USE_TLS=True
EMAIL_USE_SSL=False
```

## 2. Cloudflare R2

1. Em **Storage & databases → R2**, crie um bucket, por exemplo `mosaico-media`.
2. Em **Settings → Custom Domains**, conecte um domínio como `media.seudominio.com`. O domínio precisa estar na mesma conta Cloudflare. A URL `r2.dev` serve apenas para desenvolvimento e não deve ser usada na entrega.
3. Em **Manage R2 API Tokens**, crie um token com permissão **Object Read & Write** limitada somente ao bucket da loja.
4. Copie uma única vez o Access Key ID e o Secret Access Key para as variáveis do Railway listadas acima. Não os coloque na Vercel, no Git ou no navegador.

O painel envia JPEG, PNG e WebP de até 8 MB ao backend. O Django confere o conteúdo real da imagem, grava uma chave única em `banners/AAAA/MM/` e devolve somente a URL pública. As credenciais S3 nunca são expostas ao frontend. Como o upload é feito pelo servidor, não é necessário liberar escrita por CORS nem criar URLs assinadas no navegador.

Não habilite HSTS por um período longo antes de validar o domínio definitivo. Depois do primeiro deploy, abra um shell do serviço e execute uma vez:

```bash
python manage.py import_products
python manage.py seed_demo
```

O segundo comando usa as variáveis `DEMO_ADMIN_*`; a senha não deve aparecer no comando, no Git ou em logs.

## 3. Vercel

1. Importe o mesmo repositório e defina **Root Directory** como `frontend`.
2. Mantenha o preset Vite, o comando `npm run build` e a saída `dist`.
3. Cadastre `RAILWAY_API_ORIGIN=https://<backend>.up.railway.app` nos ambientes Production e Preview.
4. Não defina `VITE_API_BASE_URL` em produção: o frontend usa `/api`, e `vercel.mjs` encaminha esse caminho ao Railway antes do fallback da SPA.
   Em deploy pela CLI (`vercel --prod`), o `vercel.mjs` é compilado na máquina local; exporte `RAILWAY_API_ORIGIN` no shell antes do comando.
5. Publique e copie o domínio final da Vercel para `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS` e `CSRF_TRUSTED_ORIGINS` no Railway; então faça um novo deploy do backend.

O proxy mantém os cookies de sessão como primeira parte no domínio da loja. Se o frontend acessar o Railway diretamente em vez de usar `/api`, será necessário `SameSite=None`, e navegadores podem bloquear a sessão como cookie de terceiros.

## 4. Smoke test público

- `GET https://<backend>.up.railway.app/api/health/` responde `200`;
- home e acesso direto a `/admin` carregam na Vercel sem `404`;
- login do painel funciona e permanece após recarregar;
- criar/editar anúncio, menu e banner reflete na loja;
- checkout aprovado reduz estoque e final `0000` é recusado sem reduzi-lo;
- código temporário chega ao e-mail e abre somente os pedidos daquele cliente;
- Django Admin abre em `https://<backend>.up.railway.app/admin/` com seus arquivos estáticos;
- upload de um banner cria uma URL sob o domínio público do R2 e a imagem abre sem autenticação;
- nenhuma resposta ou log contém senha, cookie, código temporário ou número de cartão.
