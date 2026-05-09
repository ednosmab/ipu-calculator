# Plano: Logout + Deploy Staging

## Tarefas

### 1. Adicionar Logout na ModelsScreen

**Arquivo:** `src/features/models/screens/ModelsScreen.tsx`

Adicionar `rightHeader` com ícone de logout no ScreenLayout:

```tsx
// Imports necessários
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';

// No componente
const { signOut } = useAuth();
const router = useRouter();

const handleLogout = async () => {
  try {
    await signOut();
    router.replace('/');
  } catch (e) {
    // erro tratado
  }
};

// Right header
const rightHeader = (
  <Pressable onPress={handleLogout} style={{ padding: 8 }}>
    <FontAwesome5 name="sign-out-alt" size={20} color={theme.colors.primary} />
  </Pressable>
);

// No ScreenLayout
<ScreenLayout title="Modelos" onBack={onGoBack} rightHeader={rightHeader} footer={fab}>
```

### 2. Testar Local

```bash
npm run build
npx serve dist -l 3000
```

Testar:
- Login → Models → Ícone logout → tela inicial

### 3. Merge para Develop

```bash
git checkout develop
git merge refactor
git push origin develop
```

### 4. Testar Staging

Acessar: https://ipu-calculator-staging.vercel.app

### 5. Merge para Main (se staging OK)

```bash
git checkout main
git merge develop
git push origin main
```

---

## Checklist

- [ ] Adicionar logout na ModelsScreen
- [ ] Testar localmente
- [ ] Merge para develop
- [ ] Testar staging
- [ ] Merge para main