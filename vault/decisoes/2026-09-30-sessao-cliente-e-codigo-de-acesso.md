# Decisão: sessão do cliente e código temporário de acesso

- Data: 30 de setembro de 2026
- Status: aceita

## Contexto

A Fase 7 já tinha um `Customer` comercial, mas não precisava de senha nem de acesso ao Django Admin. A Fase 8 precisava autenticar o navegador após o checkout, dar acesso posterior em outro dispositivo e isolar pedidos entre clientes.

## Decisão

- guardar `customer_id` na sessão Django do servidor, com cookie HttpOnly, SameSite e Secure fora de DEBUG;
- estabelecer a sessão após checkout e após validar um código de acesso;
- filtrar todas as consultas de pedidos pelo cliente na sessão; retornar 404 para pedidos de outra conta;
- solicitar um código de seis dígitos por e-mail para acesso posterior;
- guardar somente o hash do código; expirar em dez minutos, aceitar uma vez e invalidar após cinco tentativas;
- aplicar CSRF e limitação de requisições nos endpoints de acesso;
- usar backend de e-mail em memória no desenvolvimento e expor o código somente na resposta local com `DEBUG=True`;
- falhar ao iniciar em produção se o backend de e-mail em memória não tiver sido substituído;
- exigir no deploy domínios frontend/API sob o mesmo domínio próprio para que as sessões `SameSite=Lax` funcionem de forma previsível.

## Motivos

- o cliente não precisa definir senha para comprar ou consultar histórico;
- a sessão server-side impede confiar em IDs de cliente enviados pelo navegador;
- o código temporário permite retorno em outro dispositivo sem armazenar credencial reutilizável;
- respostas genéricas de solicitação reduzem enumeração de e-mails em produção.

## Consequências

- produção precisa configurar provedor de e-mail e credenciais por ambiente;
- URLs cruzadas de Vercel e Railway devem usar domínios próprios compatíveis com cookies e CORS;
- códigos expirados permanecem no banco e podem exigir rotina futura de limpeza;
- pedidos recusados também aparecem no histórico com status de pagamento recusado.
