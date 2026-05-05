# PWA Install Pill — Correções e Relocação

## Problema

Três bugs identificados:

1. **Pill não fecha corretamente após instalar:** `install()` chama `showManualInstructions()` que chama `setCanInstall(false)`, mas o hook Android tem um *fallback timeout de 5s* que reativa `canInstall = true` — fazendo o pill reaparecer.
2. **Botão de instruções aparece mesmo após dismiss:** `showManualInstructions()` usa `window.alert()` e só depois `setCanInstall(false)` — o pill aparece em toda tela, não apenas na Home.
3. **Botão de instalar presente em todas as telas:** O pill está no `_layout.tsx` (global), quando deve aparecer somente na Home Screen.
4. **Debug button (besourinho) visível em produção:** Não tem guard de ambiente — deve aparecer apenas em staging.

---

## Proposed Changes

### `src/hooks/usePWAInstall.tsx` [MODIFY]

**Problema:** O `fallbackTimeout` de 5 segundos no Android reativa `canInstall` depois do `dismiss()` ou depois de instalar. Também, após `showManualInstructions()` ser chamado, `setCanInstall(false)` é chamado — mas o fallback pode refazê-lo verdadeiro.

**Solução:** Adicionar uma flag `isDismissed` (ref) para que o fallback e o `beforeinstallprompt` respeitem o dismiss do usuário. Após dismiss ou install concluído, a flag bloqueia qualquer reativação.

```diff
+ const isDismissed = useRef(false);

  const dismiss = useCallback(() => {
+   isDismissed.current = true;
    setCanInstall(false);
  }, []);

  // No fallback Android:
  fallbackTimeout = setTimeout(() => {
-   if (!checkIsStandalone()) {
+   if (!checkIsStandalone() && !isDismissed.current) {
      setCanInstall(true);
    }
  }, 5000);

  // No handleBeforeInstallPrompt:
  const handleBeforeInstallPrompt = (e: any) => {
    e.preventDefault();
+   if (isDismissed.current) return;
    setDeferredPrompt(e);
    setCanInstall(true);
  };

  // Em install(), após userChoice:
  deferredPrompt.userChoice.then((result) => {
    setDeferredPrompt(null);
    setCanInstall(false);
+   isDismissed.current = true;
  });

  // Em showManualInstructions(), também setar dismissed:
  const showManualInstructions = useCallback(() => {
    // ... alerts ...
    setCanInstall(false);
+   isDismissed.current = true;
  }, []);
```

---

### `app/_layout.tsx` [MODIFY]

**Remover** completamente o bloco do PWA pill e o botão de debug.  
O debug button fica no layout mas com guard de ambiente staging.

```diff
- {showPwaPill && (
-   <View style={styles.pillContainer}>
-     ...
-   </View>
- )}

- {/* Debug button */}
- <Pressable onPress={() => setShowDebug(!showDebug)} style={styles.debugButton}>
-   <FontAwesome5 name="bug" ... />
- </Pressable>

+ {/* Debug button — staging only */}
+ {isStaging && (
+   <Pressable onPress={() => setShowDebug(!showDebug)} style={styles.debugButton}>
+     <FontAwesome5 name="bug" ... />
+   </Pressable>
+ )}
```

Variável de ambiente:
```ts
const isStaging = process.env.EXPO_PUBLIC_APP_ENV === 'staging';
```

Também remover estados e imports não usados após remover o pill (`showPwaPill`, `pwaPillLabel`, `handlePwaAction`, `canInstall` do destructuring).

---

### `src/features/home/screens/HomeScreen.tsx` [MODIFY]

Adicionar o PWA Install Pill diretamente nesta tela, usando o `usePWAInstall()` hook.

O pill fica posicionado em `absolute` no rodapé, visível apenas nesta tela, com o mesmo visual atual mas sem depender do layout global.

**Props necessárias:** o `HomeScreen` já tem acesso ao contexto via `usePWAInstall()` (o Provider está no RootLayout).

---

### `docs/workflow/ipu_calculator-workflow.md` [MODIFY]

Adicionar documentação sobre a variável `EXPO_PUBLIC_APP_ENV` e a configuração de staging.

---

## Verificação

- [ ] Clicar em "Instalar App" → pill fecha e não reaparece
- [ ] Clicar em X (dismiss) → pill fecha e não reaparece
- [ ] Navegar para Calculator, Calibration, Models → pill NÃO aparece
- [ ] Na Home → pill aparece se `canInstall = true`
- [ ] Em produção: besourinho NÃO aparece
- [ ] Em staging (`EXPO_PUBLIC_APP_ENV=staging`): besourinho aparece

> [!IMPORTANT]
> A variável `EXPO_PUBLIC_APP_ENV=staging` precisa ser configurada no painel da Vercel para o ambiente de Preview/Staging. Confirme se isso está alinhado com o setup atual.

> [!NOTE]
> O `PWAInstallProvider` permanece no `RootLayout` para que o contexto esteja disponível globalmente — apenas o **componente visual** (pill) é movido para a `HomeScreen`.
