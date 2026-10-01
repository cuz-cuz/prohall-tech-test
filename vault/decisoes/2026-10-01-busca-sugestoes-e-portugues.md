# Busca com sugestões e consultas em português

## Contexto

A busca navegava para a página de resultados a cada pausa na digitação. O responsável pediu que os resultados só fossem abertos ao clicar na lupa. O enunciado, porém, avalia que a busca responda "de preferência enquanto o cliente digita". Além disso, os produtos do DummyJSON estão em inglês, e o diferencial de busca semântica pede que consultas em português os encontrem.

## Decisão

- digitar mostra até cinco sugestões de produtos sob o campo (combobox ARIA, com setas, Enter e Escape), com debounce de 300 ms e cancelamento da requisição anterior; a página de resultados abre somente pela lupa, por Enter ou por "Ver todos os resultados";
- consultas são divididas em palavras, palavras de ligação ("pra", "algo", "de") são descartadas e cada palavra restante é expandida por um dicionário PT→EN do nicho da loja em `apps/storefront/query_expansion.py`, com tolerância a plural e feminino;
- cada palavra é um conceito; o resultado ordena primeiro pelos conceitos cobertos e depois pela relevância somada;
- a palavra digitada pelo cliente continua aceitando correspondência parcial, mas os termos traduzidos só contam no início de uma palavra, para que "red" (de "vermelho") não case com "inspired";
- uma palavra única sem tradução segue exatamente o caminho de busca anterior.

## Alternativa descartada

Busca semântica com embeddings exigiria chave de API paga, chamada externa a cada consulta e um índice vetorial, desproporcional para um catálogo de 45 produtos. O dicionário é determinístico, testável e gratuito, mas só entende o vocabulário que conhece: "algo pra cozinha" não encontra nada porque a loja não vende itens de cozinha.

## Consequências

- consultas com várias palavras fazem uma consulta por termo expandido; com o catálogo atual isso é desprezível, mas um catálogo grande pediria um índice próprio;
- palavras novas do nicho precisam ser adicionadas ao dicionário.
