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
