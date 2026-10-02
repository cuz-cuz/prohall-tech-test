# Dropdowns próprios e ações da tabela em modal

## Contexto

O responsável pediu que todos os dropdowns seguissem `docs/referencias/interface/dropdown.jpg` e que as ações da tabela abrissem um modal. O painel usava `<select>` nativos, um editor embutido que empurrava a tabela para baixo e uma confirmação em linha dentro da célula de ações.

## Decisão

- substituir o `<select>` nativo por um listbox próprio (`AdminSelect`), porque o painel de opções do print — borda, divisórias entre itens e item escolhido realçado — não é estilizável no elemento nativo em todos os navegadores;
- seguir o padrão ARIA de listbox: o foco permanece no gatilho e a opção ativa é anunciada por `aria-activedescendant`, evitando mover foco entre itens;
- usar as cores do sistema visual do projeto em vez do azul do print, para não introduzir uma segunda cor de destaque;
- cobrir teclado completo: setas, Home, End, Enter, espaço, Escape e Tab, que fecha a lista sem prender a navegação do formulário;
- abrir editores e confirmações em `AdminModal`, com `aria-modal`, foco inicial no primeiro campo, ciclo de Tab preso no diálogo, Escape, clique no fundo e devolução do foco ao botão de origem;
- descrever a consequência em cada confirmação, nomeando o item afetado e dizendo que a operação é reversível, em vez do "Confirmar?" genérico anterior.

## Consequências

- a validação `required` do produto de origem deixou de ser do navegador e passou a ser checada no envio do formulário, porque o listbox não é um campo nativo;
- nenhum `<select>` permanece no projeto, então o estilo é consistente sem depender do navegador;
- a tabela não é mais empurrada pelo editor, e a confirmação deixou de disputar espaço dentro da célula de ações;
- `scrollIntoView` é chamado com proteção, pois não existe no jsdom nem em algumas visualizações embarcadas;
- o teste que criava um anúncio passou a exercitar o listbox em vez de `fireEvent.change`, cobrindo o componente novo.
