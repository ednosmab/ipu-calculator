# Resumo — Acesso Offline aos Modelos (Maio 2026)

**Data:** 2026-05-09  
**Status:** ⚠️ Não funcionou — precisa debug

---

## Objetivo

Permitir que usuários acessem a lista de modelos **sem login**, quando offline e com cache local.

### Comportamento esperado:

| Cenário | Resultado |
|---------|-----------|
| Sem internet + sem login + com cache local | Exibe modelos do cache + banner informativo |
| Sem internet + sem login + sem cache | Redireciona para /login |
| Sem internet + logado | Exibe modelos (já funciona) |

---

## O que foi implementado

### 1. `src/hooks/useRequireAuth.ts`

Adicionado parâmetro `allowOfflineAccess`:
- Se `allowOfflineAccess=true` + offline + cache local → permite acesso
- Retorna `isOffline`, `hasLocalCache` além de `isAuthorized`

```typescript
const { isAuthorized, isOffline, hasLocalCache } = useRequireAuth('viewer', true);
```

### 2. `app/models.tsx`

Passa informações de rede para a tela de modelos:
```typescript
const { isAuthorized, isOffline, hasLocalCache } = useRequireAuth('viewer', true);
// ...
<ModelsScreen isOffline={isOffline} hasLocalCache={hasLocalCache} />
```

### 3. `src/features/models/screens/ModelsScreen.tsx`

Adiciona banner informativo quando:
- offline + sem login + tem modelos locais

```tsx
const showOfflineBanner = isOffline && !user && totalModels > 0;
// ...
{showOfflineBanner && (
  <View style={styles.offlineBanner}>
    <FontAwesome5 name="wifi" size={16} color={theme.colors.warning} />
    <Text style={styles.offlineBannerText}>
      Conecte-se à internet e faça login para atualizar a lista de modelos
    </Text>
  </View>
)}
```

---

## Problema Encontrado

### Teste do usuário:
- Desativou internet
- Acessou `/models`
- **Resultado:** Redirecionou para tela de login

### Possíveis causas:
1. `hasLocalCache` começa como `false` — verificação do cache pode ser lenta demais
2. O efeito que redireciona (`router.replace('/login')`) executa antes do cache ser verificado
3. O `isConnected` pode estar retornando `true` mesmo sem internet (problema no `useNetworkStatus`)

---

## Próximos passos para debugar

### 1. Verificar se `isConnected` realmente retorna `false` quando offline
- Adicionar console.log no `useNetworkStatus` para ver o valor retornado

### 2. Verificar se o cache tem dados
- Console.log em `modelRepository.getAll()` para ver se retorna modelos

### 3. Adicionar logging no `useRequireAuth`
- Verificar valores de `isConnected`, `hasLocalCache`, `canAccessOffline` no momento do redirect

### 4. Considerar alternativa
- Em vez de verificar cache no hook, verificar no componente da rota `/models` antes de chamar o hook

---

## Arquivos modificados

- `src/hooks/useRequireAuth.ts`
- `app/models.tsx`
- `src/features/models/screens/ModelsScreen.tsx`

---

## Build

```bash
npm run build  # ✅ Passou
npm test       # ✅ 99 passed
npm run lint   # ⚠️ 51 warnings (pré-existentes)
```