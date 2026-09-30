# Erros da IA e prevenção

## 30 de setembro de 2026 — Escopo inicial incorreto

### Erro

O planejamento inicial assumiu um quiz capilar com integração à API Prohall, mas a página desktop continha outro desafio: uma loja virtual completa baseada no DummyJSON.

### Como foi percebido

A captura `Tela.png` expôs o enunciado integral, incluindo importação, ADMIN, busca, carrinho, checkout, pedidos e requisitos de trabalho com IA.

### Correção

O plano foi totalmente reescrito com base no enunciado real.

### Regra preventiva

Antes de planejar uma integração, confirmar a fonte primária do desafio e registrar explicitamente o enunciado usado como fonte de verdade.

## 30 de setembro de 2026 — Tentativa de pular a Fase 0

### Erro

A execução foi direcionada inicialmente para a Fase 1 antes de criar `AGENTS.md`, `/vault`, `.gitignore` e o contrato da API.

### Como foi percebido

O responsável questionou corretamente a ausência da Fase 0.

### Correção

A Fase 1 foi interrompida antes de alterações e a Fase 0 passou a ser executada primeiro.

### Regra preventiva

Antes de iniciar qualquer fase, verificar se os critérios de conclusão de todas as fases anteriores estão atendidos ou se houve decisão explícita e registrada para ignorá-los.

## 30 de setembro de 2026 — Versão do gerador Vite

### Erro

Foi usado `npm create vite@8.3.1`, assumindo que `create-vite` teria a mesma versão publicada do pacote `vite`.

### Como foi percebido

O npm respondeu que essa versão de `create-vite` não existia. O PowerShell tentou continuar os próximos comandos após a falha.

### Correção

O processo foi interrompido, o workspace foi inspecionado e nenhum artefato acidental permaneceu. A versão do pacote `create-vite` foi consultada separadamente e o scaffold foi refeito com `create-vite@9.2.1`.

### Regra preventiva

Consultar a versão do pacote que será realmente executado e usar `$ErrorActionPreference = 'Stop'` em sequências PowerShell que dependem do sucesso do comando anterior.

## 30 de setembro de 2026 — Pool padrão do Vitest no Node 25

### Erro

A primeira execução combinada do Vitest não terminou no tempo esperado usando o pool padrão no Node 25.

### Como foi percebido

O processo exibiu apenas o início da suíte, enquanto uma execução isolada com um worker terminou normalmente.

### Correção

O script de teste foi tornado determinístico com pool de threads e um único worker.

### Regra preventiva

Em runtimes Node não LTS, validar explicitamente o runner de testes e fixar a configuração estável no script do projeto.

## 30 de setembro de 2026 — Escape de comando no PowerShell

### Erro

Duas tentativas de validar o catálogo com `manage.py shell -c` falharam porque aspas aninhadas no código Python foram reinterpretadas pelo PowerShell.

### Como foi percebido

O Django recebeu partes do código como argumentos separados e encerrou com erro de uso, sem executar a validação.

### Correção

O mesmo código foi enviado ao Python pela entrada padrão usando um here-string do PowerShell, sem construir uma cadeia de aspas aninhadas.

### Regra preventiva

Para scripts Python de múltiplas instruções no PowerShell, preferir entrada padrão ou arquivo versionado; evitar `-c` quando o código também contém índices, strings e interpolação.

## 30 de setembro de 2026 — Descoberta e isolamento de testes Django

### Erro

A primeira tentativa da suíte complementar executou `manage.py test` sem rótulos a partir da raiz do repositório e encontrou zero testes. Além disso, um teste unitário chamou `full_clean()` em `SimpleTestCase`, acionando validação de constraint que precisava de banco.

### Como foi percebido

O runner informou explicitamente `Ran 0 tests`, e o teste do banner falhou com `DatabaseOperationForbidden`.

### Correção

A suíte foi repetida com os apps `apps.core apps.catalog apps.storefront`, encontrando todos os testes. A validação isolada de link passou a chamar os validadores do campo, enquanto constraints ficaram nos testes com banco.

### Regra preventiva

Ao rodar testes Django fora da pasta `backend`, indicar os apps explicitamente e nunca contabilizar uma execução com zero testes. Em `SimpleTestCase`, testar validadores puros diretamente; reservar `full_clean()` com constraints para casos com banco.

## 30 de setembro de 2026 — Storage de produção em teste do Admin

### Erro

O primeiro teste de renderização do Django Admin usou o storage de arquivos estáticos de produção e falhou por não haver manifesto de `collectstatic` no ambiente de testes.

### Correção e prevenção

O teste de integração passou a sobrescrever somente o storage estático com `StaticFilesStorage`. Testes que renderizam templates não devem depender de artefatos de deploy; a configuração de produção continua sendo validada separadamente pelo `collectstatic` e pelo deploy.

## 30 de setembro de 2026 — Variável reservada do PowerShell

### Erro

Um script de diagnóstico tentou armazenar a resposta da Home em `$home`. Como nomes de variáveis do PowerShell não diferenciam maiúsculas de minúsculas, isso tentou sobrescrever a variável automática somente leitura `$HOME` e interrompeu parte da checagem.

### Correção

O diagnóstico foi repetido com nomes específicos (`$storefrontData`, `$listingData` e `$menuSlugValue`) e todas as respostas esperadas foram confirmadas.

### Regra preventiva

Não reutilizar nomes de variáveis automáticas ou opções comuns do sistema em scripts PowerShell; adotar prefixos específicos da tarefa para toda variável temporária.

## 30 de setembro de 2026 — Operador incompatível com Windows PowerShell

### Erro

Uma verificação final usou `||`, operador disponível no PowerShell moderno, mas não no Windows PowerShell desta máquina. O parser recusou o comando antes de executar qualquer checagem.

### Correção

As buscas foram repetidas como instruções independentes separadas por `;`, compatíveis com a versão instalada.

### Regra preventiva

Neste ambiente, escrever comandos compatíveis com Windows PowerShell 5.1 e não usar `&&` ou `||` para encadear verificações.

## 30 de setembro de 2026 — `localStorage` indisponível no JSDOM com Node 25

### Erro

Os primeiros testes do carrinho presumiram que `window.localStorage` teria a implementação completa do JSDOM. Neste runtime, o Node 25 expôs um storage experimental sem caminho válido e o método `clear` não estava disponível, interrompendo todos os testes de página antes da renderização.

### Correção

O setup do Vitest passou a instalar uma implementação em memória da API Web Storage, com `getItem`, `setItem`, `removeItem`, `clear`, `key` e `length`.

### Regra preventiva

Testes que dependem de armazenamento do navegador devem fornecer uma implementação determinística no setup e não depender das APIs experimentais expostas pela versão local do Node.

## 30 de setembro de 2026 — Contexto de patch com codificação exibida incorretamente

### Erro

Uma alteração extensa tentou localizar no frontend textos acentuados usando a representação corrompida exibida anteriormente pelo terminal. O patch não encontrou o contexto e foi recusado sem modificar arquivos.

### Correção

Os arquivos foram relidos explicitamente como UTF-8 e a alteração foi dividida em patches menores com o texto real.

### Regra preventiva

Quando a saída do terminal mostrar mojibake, reler com codificação UTF-8 antes de usar texto acentuado como contexto de patch; preferir contextos estruturais curtos.
