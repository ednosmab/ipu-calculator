# Resumo — Debug Panel e Service Worker (Maio 2026)

**Data:** 2026-05-09  
**Status:** ✅ Parcialmente concluído

---

## O que foi implementado

### 1. Debug Button aparece em development

**Correção:** `app/_layout.tsx` — adjustments na lógica de detecção de ambiente:

```typescript
const appEnv = process.env.EXPO_PUBLIC_APP_ENV;
const isDevelopment = !appEnv || appEnv === 'development';
const isStaging = appEnv === 'staging';
const isProduction = appEnv === 'production';
const isDebugVisible = isStaging || isDevelopment;
```

**Resultado:** Botão de debug (besourinho) agora aparece automaticamente no `npm start`.

---

### 2. Service Worker não registra em development

**Correção:** SW só registra em staging/production:

```typescript
const shouldRegisterSW = (isProduction || isStaging) && typeof window !== 'undefined' && 'serviceWorker' in navigator;
```

**Resultado:** Evita erro "Not found" no console do Expo dev server.

---

## Pendências

| Item | Status | Observação |
|------|--------|------------|
| Erro "ServiceWorker Not found" no `npm start` | ⚠️ Pendente | O Metro não serve arquivos do `public/`. Isso não bloqueia o uso do app em desenvolvimento, apenas mostra erro no console. Solution: Usar `npm run build && npx serve dist` para testar PWA completo localmente. |
| Botão SW Update no DebugPanel | ❌ Não implementado | O DebugPanel não tem opção para forçar verificação de nova versão do SW. Pode ser adicionado futuramente se necessário. |

---

## Matriz de Comportamento

| Ambiente | Debug Button | Service Worker |
|----------|--------------|----------------|
| `npm start` (development) | ✅ aparece | ❌ não registra (evita erro) |
| `staging` | ✅ aparece | ✅ registra |
| `production` | ❌ não aparece | ✅ registra |

---

## Como testar PWA completo localmente

```bash
npm run build && npx serve dist -l 3000
```

Acessar: `http://localhost:3000`

Isso serve os arquivos estáticos completos (service-worker.js, manifest.json, etc).

---

## Alterações realizadas

- `app/_layout.tsx` — Lógica de detecção de ambiente corrigida
- `src/components/UpdateBanner.tsx` — Corrigido hardcoded `#FFFFFF` → `theme.colors.primaryText`

---

## Próximos testes

1. Verificar se deploy novo na Vercel dispara o UpdateBanner
2. Testar banner no navegador mobile
3. Em staging, verificar se SW registra corretamente