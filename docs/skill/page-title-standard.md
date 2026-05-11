# SKILL: Page Title Standardization

This skill defines the standard for all page titles across the IPU Calculator application.

## 📏 Standard

| Property | Value |
|----------|-------|
| **Font Size** | `theme.typography.sizes.xl` (28px) |
| **Alignment** | `textAlign: 'center'` |
| **Weight** | `theme.typography.weights.bold` (700) |
| **Component** | Use the `Title` component from `@/components/Title` |

## ✅ Usage

```tsx
import { Title } from '@/components/Title';

// Standard page title
<Title> Nome da Página </Title>
```

The `Title` component already applies the standard styling. If you need to override, ensure:
```tsx
<Title style={{ textAlign: 'center', fontSize: theme.typography.sizes.xl }}>
  Nome da Página
</Title>
```

## 🔍 Components that already follow the standard

- `src/components/Title.tsx` — applies `xl` and centered by default
- `app/login.tsx` — uses `Title` ✓
- `app/suspended.tsx` — uses `Title` ✓
- `app/unauthorized.tsx` — uses `Title` ✓
- `app/admin/users/index.tsx` — uses `Title` ✓
- `app/admin/logs/index.tsx` — uses `Title` ✓
- `app/admin/metrics/index.tsx` — uses `Title` ✓

## ⚠️ Out of standard (needs fix)

| File | Current | Should be |
|------|---------|-----------|
| `src/components/admin/MetricCard.tsx` | `lg` (20px) | `xl` (28px) — value text, not page title |
| `src/features/models/components/ModelCard.tsx` | `lg` (20px) | `xl` (28px) — model name, not page title |

All page titles have been standardized to `xl` (28px) and centered.

## 📋 Checklist

- [ ] All page titles use `Title` component
- [ ] All titles are `xl` (28px) and centered
- [ ] No hardcoded font sizes for titles
- [ ] No inline styles for title font size

## 💡 Tip

For screen sections or subsection headers, use `theme.typography.sizes.lg` (20px) with `textAlign: 'left'` — not the same as page titles.