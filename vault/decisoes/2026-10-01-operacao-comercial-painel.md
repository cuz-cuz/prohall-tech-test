# Operação comercial no painel React

Data: 1º de outubro de 2026

## Decisão

Expor anúncios, menus, banners e importação por endpoints próprios em `apps.backoffice`, autenticados por sessão Django, restritos a staff ativo e protegidos por CSRF. O painel usa editores contextuais na própria página e ações de ativação reversíveis, sem exclusão de registros.

## Motivos

- mantém preço, estoque e vínculos como fonte de verdade no backend;
- reutiliza os modelos e as regras comerciais já existentes sem acoplar o React ao Django Admin;
- permite mensagens de validação associadas aos campos e confirmação antes de mudanças de visibilidade;
- reduz o risco operacional ao preservar anúncios, menus e banners inativos em vez de apagá-los;
- mantém a importação separada dos anúncios e exibe somente um resumo seguro da sincronização.

## Consequências

- `ImportedProduct` permanece somente leitura no painel, exceto pela sincronização completa;
- o produto de origem de um anúncio não pode ser trocado após a criação;
- menus recebem uma lista ordenada e sem duplicatas de identificadores de anúncios;
- datas enviadas pelo navegador são convertidas para ISO e persistidas em UTC;
- exclusões continuam fora do escopo da interface operacional.
