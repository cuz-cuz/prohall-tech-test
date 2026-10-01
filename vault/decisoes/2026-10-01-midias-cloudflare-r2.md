# Mídias administrativas no Cloudflare R2

## Contexto

O cadastro de banners aceitava somente uma URL externa, o que obrigava o operador a hospedar a imagem separadamente e copiar o endereço. O ambiente de produção já pretende usar Cloudflare R2 para mídias.

## Decisão

O painel permite enviar imagens de banner ao backend. O Django valida tamanho, conteúdo real, formato e quantidade de pixels e usa a API S3 compatível do R2 com `boto3`. As credenciais ficam exclusivamente no Railway. O banco continua armazenando a URL no campo existente de `Banner`, portanto não é necessária migration e URLs externas continuam aceitas.

Os objetos recebem nomes imutáveis e aleatórios sob `banners/AAAA/MM/`, `Content-Type` derivado do arquivo real e cache público de um ano. Produção usa um domínio próprio conectado ao bucket; `r2.dev` fica restrito a testes.

## Consequências

- chaves do R2 nunca são enviadas ao navegador;
- uploads exigem sessão staff e CSRF;
- somente JPEG, PNG e WebP são aceitos, com limites configuráveis;
- o upload passa pelo Railway, suficiente para o limite atual de 8 MB e mais simples que URLs pré-assinadas;
- arquivos substituídos no formulário não são apagados automaticamente do bucket; limpeza de órfãos pode ser adicionada futuramente se o volume justificar.
