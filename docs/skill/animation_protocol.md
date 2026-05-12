# 🎬 Protocolo de Animação e Transição

Este protocolo define como o IPU Calculator deve lidar com mudanças de estado visual e navegação para garantir uma experiência premium e evitar transições bruscas.

## 🏁 Princípios de Movimento
1. **Intencionalidade**: Animações devem guiar o olhar do usuário, não distraí-lo.
2. **Suavidade (Smoothing)**: Nenhuma mudança de layout ou redirecionamento deve ser instantânea (0ms).
3. **Feedback de Estado**: Transições de rede (Offline -> Online) devem ser comunicadas visualmente antes de disparar ações estruturais.

## ⏱️ Tokens de Tempo (Theme)
Use sempre os tokens definidos em `theme.animations`:
- **Fast (150ms)**: Micro-interações, hover de botões, checkboxes.
- **Normal (300ms)**: Abertura de modais, transições de tela simples.
- **Slow (500ms)**: Mensagens de erro críticas, redirecionamentos automáticos.

## 🚀 Graceful Redirect (Redirecionamento Suave)
Para evitar o redirecionamento "brusco" relatado (especialmente em mudanças de status de rede):

### Regra: "Aviso antes da Ação"
Nunca use `router.replace()` imediatamente após uma mudança automática de estado de rede se isso resultar em perda de contexto do usuário.

**Fluxo Correto:**
1. Detecta que a sessão é inválida (ao voltar online).
2. Exibe um aviso visual (Toast ou Banner de alerta).
3. Aguarda ~1.5s (Duração Normal + Delay).
4. Executa a transição de saída (Fade out).
5. Dispara o `router.replace()`.

## 🎭 Padrões de Componentes
- **Modais/Drawers**: Devem usar `DecelerateCurve` para entrar e `AccelerateCurve` para sair.
- **Listas**: Ao carregar, itens devem aparecer com um leve `translateY` (subindo) e `opacity` de 0 para 1.
- **Skeleton**: Deve pulsar suavemente em 1.5s de ciclo.

## 🛠️ Implementação Técnica (Exemplo)
```tsx
// Exemplo de transição suave em hook de auth
if (shouldRedirect) {
  Toast.show("Sessão expirada. Redirecionando...");
  setTimeout(() => {
    router.replace('/login');
  }, 1500);
}
```
