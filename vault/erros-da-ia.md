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

## 30 de setembro de 2026 — Build Docker iniciado sem conferir espaço livre

### Erro

O primeiro `docker compose up --build` foi iniciado quando a unidade `C:` tinha cerca de 244 MB livres. O crescimento do disco virtual do Docker esgotou o volume e deixou o filesystem ext4 interno somente leitura.

### Como foi percebido

O BuildKit retornou `input/output error`, `read-only file system` e erros de leitura em `/dev/sde`. O Docker Desktop permaneceu preso em `starting` mesmo depois de reiniciado.

### Correção

Foi liberado espaço em `C:`, criado um backup do `docker_data.vhdx` em `E:`, executado `e2fsck` conforme a orientação do WSL e removidas somente as imagens e camadas de build corrompidas. Uma segunda verificação confirmou o filesystem limpo.

### Regra preventiva

Antes de baixar imagens ou construir serviços Docker, conferir o espaço livre no volume que armazena o VHDX e manter margem de vários gigabytes para downloads, extração de camadas e crescimento do disco virtual.

## 30 de setembro de 2026 — Limiar trigramático baixo demais para buscas curtas

### Erro

A busca PostgreSQL usava `word_similarity` com limiar `0.18`. Uma busca por `colecao` também aceitava a descrição `descricao comercial` com similaridade `0.5`, incluindo um produto sem relação nos resultados.

### Como foi percebido

A suíte PostgreSQL real encontrou 14 resultados onde paginação esperava 13; SQLite não executava essa implementação trigramática e não expunha o defeito.

### Correção

Correspondências exatas e parciais permanecem nos filtros normalizados `contains`; a similaridade aproximada passou a exigir `0.6`. Um teste cobre a descrição que gerou o falso positivo.

### Regra preventiva

Validar limiares de busca aproximada com consultas curtas e campos de texto longos no mesmo banco e extensão usados em produção.

## 30 de setembro de 2026 — Testes novos anexados à classe de fixture errada

### Erro

Ao adicionar testes da Fase 8 a `orders/tests.py`, os métodos restantes do checkout ficaram temporariamente dentro da classe de testes de sessão, que não preparava produto e anúncio.

### Como foi percebido

Uma execução de 15 testes mostrou vários `AttributeError` por falta de `self.url` e `self.listing`.

### Correção e prevenção

Os testes de checkout restantes foram separados em uma classe derivada da fixture original. Depois de inserir testes em módulos existentes, conferir o escopo com `rg -n '^class |^    def test_'` e executar o app completo.

## 30 de setembro de 2026 — Recorrência de limite de classe e conexão concorrente aberta

### Erro

Ao inserir o teste concorrente da Fase 10, o último método da classe anterior voltou a ficar sob a nova classe. Além disso, `close_old_connections()` não encerrou a conexão criada pela thread, e o PostgreSQL recusou remover o banco de teste depois de todos os casos passarem.

### Como foi percebido

A execução focada encontrou um `AttributeError` no método deslocado. Após corrigir a classe, os oito testes passaram, mas o teardown retornou `ObjectInUse` porque ainda havia uma sessão conectada a `test_mosaico`.

### Correção

O método foi devolvido à classe com a fixture correta. Cada worker passou a executar `connections.close_all()` no bloco `finally`, e a execução seguinte criou e removeu o banco de teste sem erro.

### Regra preventiva

Antes de rodar testes após inserir uma classe, conferir os limites com `rg -n '^class |^    def test_'`. Em testes PostgreSQL com threads, usar conexões independentes e encerrá-las explicitamente no `finally`; o fechamento de conexões antigas não substitui o fechamento da conexão ativa do worker.

## 30 de setembro de 2026 — Status da fase inserido na seção errada

### Erro

Um patch usou apenas a linha genérica `Modelo recomendado: GPT-5.6 Sol — High` como contexto e inseriu o status da Fase 10 depois da Fase 0, que possui a mesma recomendação.

### Correção e prevenção

O status foi movido para a seção correta e a posição foi conferida com busca por número de linha. Ao editar documentos com blocos repetidos, usar o título da seção e o título seguinte como contexto do patch, depois localizar o texto inserido para validar sua posição.

## 30 de setembro de 2026 — Uso de variável reservada do PowerShell

### Erro

Durante uma consulta exploratória do catálogo, foi usado o nome `$home`, que no PowerShell é uma variável automática e somente leitura. A atribuição falhou e interrompeu apenas aquela consulta de menus.

### Correção e prevenção

A consulta foi repetida com o nome específico `$storefrontData`. Scripts PowerShell do projeto devem usar nomes ligados à tarefa e nunca reutilizar `$HOME`, `$home` ou outras variáveis automáticas do sistema.

## 1º de outubro de 2026 — Módulos diferenciados apenas por caixa no Windows

### Erro

O contexto administrativo foi inicialmente dividido entre `AdminAuthContext.jsx` e `adminAuthContext.js`. Embora os nomes sejam distintos em sistemas case-sensitive, o Windows e o resolvedor do Vite trataram ambos como o mesmo caminho e o provider ficou `undefined` nos testes.

### Como foi percebido

Os cinco testes iniciais do painel falharam ao renderizar `AdminRouteScope`, informando que o tipo do elemento era inválido.

### Correção e prevenção

O módulo que contém apenas o contexto foi renomeado para `AdminAuthState.js`, eliminando a ambiguidade. Em projetos multiplataforma, arquivos irmãos nunca devem depender somente de diferenças entre maiúsculas e minúsculas; usar nomes semanticamente distintos e validar a montagem das rotas logo após criar a estrutura.

## 1º de outubro de 2026 — Operador de Bash em comando PowerShell

### Erro

Uma varredura final tentou usar `||` para tratar a ausência de resultados do `rg`. A versão do PowerShell desta máquina não reconhece esse operador, e o comando parou antes de executar qualquer verificação.

### Correção e prevenção

A checagem foi repetida tratando `$LASTEXITCODE` com um bloco `if`, sem misturar sintaxe de shells. Em comandos PowerShell, resultados nulos de ferramentas nativas devem ser tratados com construções do próprio PowerShell e nunca com operadores condicionais de Bash.

## 1º de outubro de 2026 — Método criptográfico indisponível não interrompeu o PowerShell

### Erro

Ao gerar uma senha administrativa local, foi chamado o método estático `RandomNumberGenerator.Fill()`, indisponível no runtime PowerShell desta máquina. Como o script não estava com parada global por erro, a execução continuou com o vetor de bytes ainda zerado e chegou a definir uma senha previsível.

### Correção e prevenção

A senha foi sobrescrita imediatamente, antes da entrega ao responsável, usando a API compatível `RandomNumberGenerator.Create().GetBytes()`. O novo hash foi verificado e apenas a nova senha segura foi colocada na área de transferência. Scripts que geram credenciais devem usar `$ErrorActionPreference = 'Stop'`, verificar a disponibilidade da API ou utilizar o padrão compatível por instância, e nunca continuar após uma falha do gerador aleatório.

## 1º de outubro de 2026 — Varredura documental no diretório errado

### Erro

Uma checagem com `rg` foi executada a partir de `frontend/` usando caminhos relativos à raiz do repositório, por isso os três arquivos de documentação não foram encontrados. O lint que fazia parte do mesmo comando foi executado normalmente.

### Correção e prevenção

A busca foi repetida a partir da raiz do projeto e confirmou que os números antigos estavam apenas no registro histórico da Fase 11. Em comandos que misturam arquivos de áreas diferentes, fixar o diretório de trabalho na raiz ou usar caminhos absolutos validados antes da execução.

## 1º de outubro de 2026 — Expressão regular mal escapada no PowerShell

### Erro

A primeira varredura pré-commit de possíveis segredos combinou aspas e barras invertidas de uma expressão regular dentro de uma string PowerShell, causando erro de análise antes da execução.

### Correção e prevenção

A verificação foi repetida com padrões menores passados em argumentos literais separados para o `rg`. Em PowerShell, varreduras complexas devem preferir múltiplas opções `-e` com aspas simples, evitando uma única expressão com níveis concorrentes de escape.

## 1º de outubro de 2026 — Diagnóstico afirmado sem ler o trecho decisivo

### Erro

Ao explicar o cadastro de clientes, foi afirmado que o nome do cliente não era atualizado em compras seguintes, com base apenas em `_get_or_create_customer`, onde o nome aparece em `defaults`. O bloco imediatamente posterior em `_checkout_order_atomic` já atualizava o nome quando ele mudava. O diagnóstico entregue ao responsável estava pela metade: o problema real não era a falta de atualização, mas a ausência de snapshot no pedido.

### Correção e prevenção

A afirmação foi corrigida na mensagem seguinte, antes de qualquer alteração de código, e o conserto foi redirecionado para o snapshot. Antes de apontar a ausência de um comportamento, localizar todos os pontos que escrevem no campo em questão — não apenas o de criação — e confirmar lendo o fluxo completo da função que o utiliza.

### Consequência evitada

Corrigir somente a atualização do nome teria ativado a reescrita retroativa do histórico em vez de resolvê-la, porque a atualização já existia e o snapshot não.

## 1º de outubro de 2026 — Falso positivo por arredondamento do Python na auditoria

### Erro

Na auditoria das regras de negócio foi relatado que o preço no Pix divergia um centavo entre a página do produto e o carrinho, em três anúncios. A verificação usou `round()` do Python para simular o `Math.round` do JavaScript. São arredondamentos diferentes: `round()` arredonda para o par mais próximo e `Math.round` arredonda meio para cima. O carrinho sempre esteve correto.

### Correção e prevenção

O cálculo foi reexecutado em Node, com o mesmo código do navegador, antes de qualquer alteração; os três casos deram igual ao servidor e o achado foi retirado. Ao auditar aritmética de outra linguagem, executar no runtime de destino em vez de reimplementar a operação, porque o modo de arredondamento é parte do comportamento.

### Consequência evitada

A correção teria sido feita sobre código correto, trocando um arredondamento que já casava com o servidor.

## 1º de outubro de 2026 — Seção administrativa bloqueada por estado duplicado no frontend

### Erro

A restauração da demonstração foi corretamente protegida no backend por `is_superuser`, mas o frontend repetiu essa autorização usando `auth.user.is_superuser` antes mesmo de consultar o endpoint. O estado do contexto preservado pelo Hot Reload não continha o campo novo e ocultou toda a seção, embora a sessão e o usuário no backend já fossem de superusuário.

### Correção e prevenção

A tela passou a consultar sempre o endpoint protegido: o backend continua sendo a única autoridade. Superusuários recebem os dados e veem a seção; usuários staff comuns recebem 403 e a seção permanece oculta. Interfaces não devem duplicar decisões de autorização com dados potencialmente antigos do cliente; flags locais servem apenas para apresentação depois que a autoridade respondeu.

## 1º de outubro de 2026 — Constraint inserida inicialmente no modelo errado

### Erro

Ao aplicar a constraint de ordem única dos banners, o primeiro patch encontrou o primeiro bloco `Meta.constraints` semelhante do arquivo e inseriu temporariamente a regra em `ImportedProduct`, que nem possui `display_order`.

### Correção e prevenção

O diff foi revisado antes de migrations ou testes, a inserção incorreta foi removida e a constraint foi colocada no `Meta` de `Banner`. Em arquivos com vários blocos estruturalmente semelhantes, patches de modelo devem incluir a declaração da classe como contexto e o diff deve ser conferido antes de qualquer comando que altere o banco.

## 1º de outubro de 2026 — Proxy da Vercel não casava rotas com barra final

### Erro

O rewrite `/api/:path*` em `vercel.mjs` não casa caminhos terminados em `/`, como `/api/health/`. Como todas as rotas do Django terminam em barra, toda chamada da API caía no fallback da SPA e recebia `index.html` com status 200, sem erro aparente no deploy.

### Correção e prevenção

A origem passou a ser o regex `/api/(.*)` com destino `/api/$1`. Proxies devem ser verificados após o deploy por uma rota real da API, conferindo o `Content-Type` da resposta e não apenas o status.

## 1º de outubro de 2026 — Healthcheck recusado pelo redirecionamento HTTPS

### Erro

O roteiro de deploy ativava `SECURE_SSL_REDIRECT` e o healthcheck do Railway em `/api/health/`, mas o healthcheck chama o container por HTTP interno, sem `X-Forwarded-Proto`. O Django respondia 301 e o Railway reprovava o deploy.

### Correção e prevenção

`SECURE_REDIRECT_EXEMPT` isenta somente `/api/health/`, com testes que confirmam que as demais rotas continuam redirecionando. Configurações de segurança que alteram respostas devem ser validadas contra o caminho exato usado pela plataforma de hospedagem.
