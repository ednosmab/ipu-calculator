# SKILL: Security Threat Model Protocol

Este protocolo define o modelo de ameaças do IPU Calculator, as mitigações aplicadas e as decisões de design de segurança. Serve como referência para avaliar novas features e mudanças de arquitetura.

---

## 🎯 Contexto de Segurança

- App de uso interno/controlado — link não é divulgado publicamente
- Usuários cadastrados manualmente pelo admin (engenheiro responsável)
- Dados sensíveis: lista de modelos de cálculo IPU
- Plataformas: Android, iOS (nativo via Expo) e PWA (Vercel)
- Backend: Supabase + Edge Functions

---

## 🗺️ Superfície de Ataque

```
Internet
  │
  ├── PWA (Vercel)          ← HTML/JS acessível via URL
  │     └── chama Edge Functions via HTTPS
  │
  ├── App nativo (APK/IPA)  ← bundle compilado
  │     └── chama Edge Functions via HTTPS
  │
  └── Edge Functions        ← único ponto de entrada ao Supabase
        └── Supabase DB (nunca exposto diretamente ao cliente)
```

---

## 🔴 Ameaças e Mitigações

### T1 — Acesso direto ao Supabase com ANON_KEY

**Descrição:** ANON_KEY estava exposta no bundle como `EXPO_PUBLIC_*`. Qualquer pessoa com a chave conseguia fazer queries na tabela `models`.

**Mitigação:** App para de chamar o Supabase diretamente. Toda comunicação passa pelas Edge Functions que usam `SERVICE_ROLE_KEY` (variável de servidor, nunca no bundle).

**Residual:** Baixo. SERVICE_ROLE_KEY nunca sai do servidor.

---

### T2 — Acesso não autorizado à lista de modelos

**Descrição:** Sem autenticação, qualquer pessoa que tivesse o link acessava os modelos.

**Mitigação:** RLS habilitado na tabela `models`. Edge Functions exigem JWT válido via `requireAuth`. Sessão sem JWT recebe 401.

**Residual:** Baixo. RLS é enforced pelo banco, independente do cliente.

---

### T3 — Escalada de privilégio (viewer agindo como editor)

**Descrição:** Usuário viewer manipula a requisição para executar INSERT/UPDATE.

**Mitigação (dupla):**
- RLS verifica role diretamente no banco via `auth.uid()` — o banco recusa a operação
- `requireAuth` nas Edge Functions verifica o role antes de processar

**Residual:** Mínimo. Duas camadas independentes bloqueiam.

---

### T4 — Acesso ao painel admin por não-admin

**Descrição:** Usuário editor acessa `/admin` ou chama endpoints admin.

**Mitigação:**
- `useRequireAuth('admin')` redireciona no frontend
- `requireAuth(req, 'admin')` bloqueia no servidor com 403

**Residual:** Baixo. Frontend é UX, servidor é segurança real.

---

### T5 — Conta suspensa continua com sessão ativa

**Descrição:** Admin suspende usuário mas o JWT ainda é válido até expirar.

**Mitigação:** `requireAuth` verifica campo `active` no banco em toda requisição — não confia só no JWT. JWT expirado + conta suspensa = 403 imediato.

**Residual:** Baixo. Verificação em tempo real no banco.

---

### T6 — JWT roubado / replay attack

**Descrição:** JWT interceptado e usado por terceiro.

**Mitigação:**
- HTTPS obrigatório em todos os endpoints
- JWT com expiração curta (configurar no Supabase)
- Suspensão de conta invalida o acesso mesmo com JWT válido

**Residual:** Médio. JWT roubado antes de expirar ainda funciona para o escopo daquele usuário. Mitigação adicional (refresh rotativo) pode ser adicionada numa segunda iteração.

---

### T7 — XSS no PWA rouba token de sessão

**Descrição:** Script injetado lê o token do sessionStorage.

**Mitigação:**
- `sessionStorage` em vez de `localStorage` (escopo de aba)
- Content Security Policy no `vercel.json`
- Evitar `dangerouslySetInnerHTML` e eval no código

**Residual:** Médio. CSP bem configurada reduz significativamente a superfície.

---

### T8 — CSRF no PWA

**Descrição:** Site malicioso faz requisição ao backend usando sessão do usuário.

**Mitigação:**
- Edge Functions verificam header `Origin` contra `ALLOWED_ORIGIN`
- CORS restrito ao domínio da Vercel

**Residual:** Baixo com CORS configurado corretamente.

---

### T9 — Enumeração de usuários

**Descrição:** Atacante tenta adivinhar emails válidos pelo comportamento da resposta de login.

**Mitigação:** Resposta de login retorna sempre `INVALID_CREDENTIALS` — sem distinguir "email não existe" de "senha errada".

**Residual:** Baixo.

---

### T10 — Admin se auto-suspende acidentalmente

**Descrição:** Admin suspende a própria conta e perde acesso ao painel.

**Mitigação:** Endpoint PATCH `/admin-users-update` verifica se `targetId === user.id && active === false` e retorna 400.

**Residual:** Nenhum.

---

## 🟡 Fora de Escopo (decisão deliberada)

| Ameaça | Motivo de não mitigar agora |
|--------|----------------------------|
| Dados cifrados em repouso no Supabase | Dados não são PII crítico; Supabase já cifra disco |
| Segundo fator (SMS/TOTP) | Custo e fricção desnecessários para o contexto atual |
| Rate limiting nos endpoints | Público controlado, baixo risco de abuso |
| Rotação de refresh token | JWT de curta duração já mitiga suficientemente |
| Device binding | Over-engineering para o contexto atual |

---

## 📐 Decisões de Design de Segurança

**Por que Edge Functions e não chamar Supabase direto?**
Isola a SERVICE_ROLE_KEY do cliente. O cliente nunca tem credenciais de banco.

**Por que RLS mesmo com Edge Functions?**
Defesa em profundidade. Se uma Edge Function tiver um bug e não chamar `requireAuth`, o RLS ainda bloqueia no banco.

**Por que sessionStorage e não localStorage no web?**
Reduz a janela de exposição. Token some ao fechar a aba — aceitável para usuários que o admin conhece pessoalmente.

**Por que verificar `active` no banco e não só no JWT?**
JWT não é revogável. Verificar no banco garante efeito imediato da suspensão.

---

## 📋 Checklist de revisão de segurança

A cada nova feature ou endpoint, verificar:

- [ ] Endpoint tem `requireAuth` com o role mínimo correto?
- [ ] RLS cobre o caso de uso no banco?
- [ ] Nenhuma credencial nova foi adicionada ao bundle do cliente?
- [ ] Erros internos retornam `INTERNAL_ERROR` sem vazar detalhes?
- [ ] Ação relevante é registrada em `access_logs`?
- [ ] CORS restrito ao domínio correto?
- [ ] Dados sensíveis omitidos dos logs?
