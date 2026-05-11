# Hotfix Roadmap — Erro 403 no Service Worker

## Sumário Executivo

O erro 403 estava sendo causado pelo **service worker desatualizado** (`1.1.8`) tentando servir assets cacheados que não correspondiam mais à build atual (`1.2.0`). O service worker em cache respondia com 403 para requisições que não conseguia resolver, bloqueando o app.

**Solução:** Bump da versão do cache (`1.1.8 → 1.2.0`) e adição de headers de cache no `vercel.json` para garantir que assets estáticos sejam servidos corretamente.

---

## Fase 1 — Preparação da branch

```bash
git checkout refactor
git pull origin refactor
```

---

## Fase 2 — Atualizar versão do Service Worker

**Arquivo:** `public/service-worker.js`

```diff
- const CACHE_NAME = 'ipu-calc-1.1.8';
+ const CACHE_NAME = 'ipu-calc-1.2.0';
```

---

## Fase 3 — Adicionar headers de cache no Vercel

**Arquivo:** `vercel.json`

Adicionar seção `headers` para garantir que assets estáticos tenham headers corretos:

```diff
{
  "outputDirectory": "dist",
+ "headers": [
+   {
+     "source": "/assets/(.*)",
+     "headers": [
+       {
+         "key": "Cache-Control",
+         "value": "public, max-age=31536000, immutable"
+       }
+     ]
+   },
+   {
+     "source": "/service-worker.js",
+     "headers": [
+       {
+         "key": "Cache-Control",
+         "value": "no-cache"
+       },
+       {
+         "key": "Service-Worker-Allowed",
+         "value": "/"
+       }
+     ]
+   },
+   {
+     "source": "/favicon.ico",
+     "headers": [
+       {
+         "key": "Cache-Control",
+         "value": "public, max-age=86400"
+       }
+     ]
+   },
+   {
+     "source": "/manifest.json",
+     "headers": [
+       {
+         "key": "Cache-Control",
+         "value": "public, max-age=86400"
+       }
+     ]
+   }
+ ],
  "rewrites": [
    ...
  ]
}
```

---

## Fase 4 — Teste local

```bash
npm run build
npx serve dist -l 3000
```

Validar:
- [ ] App carrega em `http://localhost:3000`
- [ ] Console do navegador (F12) não mostra erros de 403
- [ ] Service worker registrado sem erros
- [ ] Navegação entre telas funciona

---

## Fase 5 — Commit e Push

```bash
git add public/service-worker.js vercel.json
git commit -m "fix(sw): bump cache version 1.1.8→1.2.0 and add cache headers"
git push origin refactor
```

---

## Checklist Pós-Deploy

Após fazer merge para `develop` e o deploy automático na Vercel:

- [ ] Acessar https://ipu-calculator-staging.vercel.app — app carrega sem 403
- [ ] Abrir DevTools > Application > Service Workers — status "Activated and is running"
- [ ] DevTools > Network — assets com status 200, não 403
- [ ] Navegar entre telas (Home, Calculator, Calibration, Models) — todas funcionam
- [ ] Fazer logout e login novamente — autenticação funciona
- [ ] Clicar em "Instalar App" — prompt de instalação aparece
- [ ] Testar em outro navegador ou aba anônima

---

## Troubleshooting

### Ainda vejo 403 após o deploy

1. Limpar cache do navegador: DevTools > Application > Clear storage > "Clear site data"
2. Aguardar 1-2 minutos (tempo de propagação da Vercel)
3. Verificar se o novo `service-worker.js` está sendo servido: `https://ipu-calculator-staging.vercel.app/service-worker.js` deve conter `1.2.0`

### Service Worker não atualiza

1. O usuário precisa fechar todas as abas do app e reabrir
2. Ou limpar manualmente: DevTools > Application > Service Workers > "Unregister"

### Vercel headers não funcionam

1. Verificar se o `vercel.json` está na raiz do projeto
2. Verificar se o deploy foi para o ambiente correto (staging vs production)
3. Adicionar headers manualmente no painel da Vercel: Project Settings > Headers

---

## Commits gerados

```
fix(sw): bump cache version 1.1.8→1.2.0 and add cache headers
```
