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
