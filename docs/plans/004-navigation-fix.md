# Plano de Correção: Navegação Inteligente e Animação Lateral

Este plano visa corrigir os problemas identificados na navegação após a execução do plano `003-navigation-improvements.md`. As rotas passarão a ser "inteligentes" (destacando a página atual) e a animação do menu será alterada para um slide lateral da esquerda para a direita.

## User Review Required

> [!IMPORTANT]
> Substituiremos o componente `Modal` nativo por uma implementação customizada usando `Animated.View`. Isso é necessário porque o `Modal` do React Native não suporta animação lateral (Slide from Left) nativamente.

## Problemas Identificados

- **Animação Incorreta:** O menu desliza de baixo para cima (padrão do `Modal`), contrariando a especificação de design em `side_navigation_design.md`.
- **Navegação "Burra":** Os itens do menu não indicam visualmente em qual página o usuário se encontra.

## Mudanças Propostas

### Navegação e UI

#### [MODIFY] [NavMenu.tsx](file:///media/edson-ubuntu/Data1/Astra/calculadora-ipu/src/components/NavMenu.tsx)

- **Refatoração da Animação:**
  - Remover o componente `Modal`.
  - Implementar um `Animated.View` para o menu (drawer) e outro para o backdrop (scrim).
  - Configurar `translateX` para deslizar da esquerda (`-280`) para a posição original (`0`).
  - Adicionar suporte a `pointerEvents` para gerenciar a interatividade quando o menu estiver oculto.

- **Rotas Inteligentes:**
  - Importar e utilizar `usePathname` de `expo-router`.
  - Adicionar a prop `active` ao componente interno `NavItem`.
  - Aplicar estilos de destaque (cor primária e fundo sutil) quando `active={true}`.

- **Redirecionamento Inteligente Pós-Login:**
  - Em `useRequireAuth.ts`, substituir `window.location.pathname` por `usePathname()` para capturar a rota de origem corretamente (essencial para Expo/Web).
  - Garantir que `getPostLoginRedirect` recupere e limpe a rota salva no `sessionStorage`.

---

## Detalhes das Mudanças

### [Componente] NavMenu.tsx
- Refatoração total para remover `Modal`.
- Adição de `Animated.View` com `translateX`.
- Lógica de destaque usando `usePathname`.

### [Hook] useRequireAuth.ts
- Correção na captura da rota original para usar `usePathname`.

### [Página] login.tsx
- Garantir que a chamada para `getPostLoginRedirect` aconteça após o sucesso do `signIn`.

---

## Verificação Plan

### Automated Tests
- Verificação visual via browser após a implementação.

### Manual Verification
1. **Animação:** Abrir o menu e confirmar que ele desliza horizontalmente da esquerda para a direita.
2. **Backdrop:** Confirmar que o fundo escurece suavemente e que clicar nele fecha o menu.
3. **Destaque de Rota:**
   - Acessar `/` -> Item "Início" deve estar destacado.
   - Acessar `/models` -> Item "Modelos" deve estar destacado.
   - Acessar `/admin` -> Item "Painel Admin" deve estar destacado.
4. **Redirecionamento:**
   - Tentar acessar `/models` sem estar logado.
   - Fazer login.
   - Verificar se o redirecionamento foi para `/models` (e não para `/`).
5. **Interatividade:** Garantir que, com o menu fechado, o "backdrop invisível" não bloqueie cliques no conteúdo da página.
