---
name: A Vitrine Clara
product: Mosaico
platform: web
primary: "#5146E5"
background: "#F8F9FC"
surface: "#FFFFFF"
text: "#11152F"
accent: "#D92D55"
success: "#137A52"
---

# Overview

A Vitrine Clara é o sistema visual da Mosaico. Ele combina organização de marketplace com uma identidade confiante, prática e vibrante. O conteúdo comercial permanece protagonista: preço, promoção, disponibilidade e próximo passo aparecem antes de qualquer decoração. O layout é mobile-first, ganha densidade controlada em telas maiores e evita controles sem função implementada.

# Colors

- `canvas`: `#F8F9FC`, fundo geral quase branco.
- `surface`: `#FFFFFF`, cartões, painéis e áreas elevadas.
- `ink`: `#11152F`, títulos e texto principal.
- `ink-soft`: `#51566B`, texto secundário e metadados.
- `primary`: `#5146E5`, navegação ativa, ações e foco.
- `promotion`: `#D92D55`, preço promocional e comunicação comercial pontual.
- `success`: `#137A52`, disponibilidade positiva.
- Cores de ação devem preservar contraste mínimo AA; cor nunca é o único indicador de estado.

# Typography

A família é uma humanist sans do sistema: `Segoe UI Variable Text`, seguida por `Segoe UI`, `ui-sans-serif` e `system-ui`. Pesos 400, 600 e 700 sustentam toda a hierarquia. Títulos usam entre `2.25rem` e `3rem`, line-height compacto e tracking de `-0.03em`; corpo usa `1rem` com line-height `1.5`. Textos corridos permanecem próximos de 58–65 caracteres por linha.

# Elevation

A profundidade é discreta e funcional. Superfícies usam borda clara e sombra baixa de até `0.5rem`; o cabeçalho sticky recebe sombra específica para separar a navegação do conteúdo. Raios seguem uma escala curta de `0.375rem`, `0.625rem` e `1rem`. Pílulas ficam reservadas a estados compactos, nunca a todos os contêineres.

# Components

- Cabeçalho: marca em fundo escuro, mensagem curta e navegação horizontal por departamentos.
- Hero: texto e imagem administráveis; apenas o primeiro banner contém o `h1` da página.
- Benefícios: três afirmações verificáveis, sem promessas logísticas inexistentes.
- Card de produto: imagem, marca/categoria, título, preços, estoque e link de detalhe.
- Menu tile: número ordinal, nome e chamada curta para descoberta.
- Detalhe: galeria, preço normal/promocional, estoque, descrição e retorno à vitrine.
- State panel: variantes de carregamento, vazio e erro com ação contextual quando aplicável.
- Esqueleto: reservado ao carregamento e desativado visualmente com `prefers-reduced-motion`.

# Do's and Don'ts

- Faça a disponibilidade e o preço serem compreendidos sem interação adicional.
- Faça o layout compor de forma própria no celular e no desktop.
- Use imagens reais de ambientes e produtos em uso nos banners administráveis.
- Preserve foco visível, texto alternativo e navegação por teclado.
- Não invente frete, prazo, parcelamento, desconto ou estoque.
- Não adicione busca, carrinho ou checkout como controles inativos.
- Não use gradientes, glassmorphism, sombras pesadas ou arredondamento excessivo.
- Não replique a interface de referências externas; use apenas seus princípios de clareza e organização.
