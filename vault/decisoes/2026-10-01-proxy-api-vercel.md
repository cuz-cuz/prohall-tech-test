# Proxy da API pela Vercel

## Contexto

O frontend será publicado em `vercel.app` e o backend em `railway.app`. Embora CORS e CSRF possam autorizar essa comunicação, os dois endereços são sites diferentes. A autenticação administrativa usa sessão Django e não deve depender de cookies de terceiros, que podem ser bloqueados pelo navegador.

## Decisão

Em produção, o navegador acessa a API pelo caminho `/api` do próprio frontend. `frontend/vercel.mjs` encaminha esse caminho para a origem HTTPS definida em `RAILWAY_API_ORIGIN`; as demais rotas desconhecidas recebem `index.html` para o React Router.

O backend continua público para healthcheck e Django Admin de contingência. A origem final da Vercel permanece em `CSRF_TRUSTED_ORIGINS`, e os cookies continuam `Secure` e `SameSite=Lax`.

## Consequências

- login e checkout usam cookies de primeira parte mesmo com os domínios gratuitos das plataformas;
- o endereço do Railway não é incorporado ao bundle do React;
- a Vercel precisa da variável pública `RAILWAY_API_ORIGIN` no momento do deploy;
- chamadas da aplicação passam pelo proxy da Vercel, enquanto o Django Admin é acessado diretamente no Railway;
- acesso direto do frontend ao Railway continua possível por configuração, mas exige avaliar `SameSite=None` e bloqueio de cookies de terceiros.
