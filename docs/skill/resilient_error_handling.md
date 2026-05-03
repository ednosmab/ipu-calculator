# SKILL: Resilient Error Handling & UI Recovery

Este protocolo define como a aplicação deve reagir a falhas catastróficas e erros de runtime, garantindo que o usuário sempre tenha uma rota de fuga.

---

## 🛡️ Camadas de Proteção

### 1. Error Boundary Global
O app deve ser envelopado em um `ErrorBoundary` no nível mais alto (`app/_layout.tsx`).
- **Objetivo**: Capturar erros de renderização que fariam o app "sumir".
- **Ação**: Mostrar uma tela de Fallback amigável com um botão de "Tentar Novamente".

### 2. Error Boundary por Feature
Telas complexas (como a de Cálculos) devem ter seus próprios limites de erro menores.
- **Objetivo**: Se um cálculo quebrar, apenas a lista de cálculos falha, não o app inteiro (menu, cabeçalho, etc).

---

## 🔄 Protocolo de Recuperação (Reset)

O componente de `Fallback` deve oferecer uma ação clara de recuperação:
1.  **Limpeza de Estado**: Tentar resetar estados voláteis.
2.  **Hard Reload**: No PWA/Web, o botão "Tentar Novamente" deve realizar um `window.location.reload()` como último recurso para garantir que um estado corrompido em memória seja limpo.

---

## 📢 Feedback Visual de Erro

Nunca deixe o usuário sem resposta:
- **Cargas de Dados**: Se o fetch falhar, mostre um estado de erro na lista, não uma lista vazia.
- **Botões de Ação**: Se um `save` falhar, mostre um `alert` ou `toast` explicativo.

---

## 📝 Regras de Logging
Todo erro capturado em um Boundary ou Catch deve ser logado no `logger` com o contexto necessário:
```typescript
logger.error('[FeatureName] Descrição do erro', error);
```
Isso é crucial para depuração via painel de Debug.

---

## ⚠️ Checklist de Resiliência
- [ ] O componente de Fallback é amigável e não técnico?
- [ ] O botão de "Tentar Novamente" realmente limpa o erro?
- [ ] Erros de rede são diferenciados de erros de lógica?
- [ ] O app continua utilizável se uma feature secundária falhar?
