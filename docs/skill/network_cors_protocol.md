# Protocolo: Resolução de Erros de Rede e CORS (Vercel + Supabase)

Este documento descreve como diagnosticar e corrigir o erro `NETWORK_ERROR: Failed to fetch` ao utilizar Supabase Edge Functions com deploys na Vercel.

## 1. O Problema: NETWORK_ERROR
O erro ocorre quando o navegador bloqueia a requisição antes mesmo dela chegar à lógica da função. As causas comuns são:
- Mismatch de **CORS** (Origin não autorizada).
- Falha na negociação do preflight (**OPTIONS**).
- Funções não deployadas ou secrets ausentes no Supabase.

---

## 2. Diagnóstico Rápido
Ao ver `NETWORK_ERROR` no log da aplicação:
1. Verifique se o domínio do app (ex: `https://meu-app.vercel.app`) está na lista de permitidos.
2. Verifique se o erro acontece apenas em funções específicas (sinal de falta de deploy).
3. Verifique se o login funciona (o login usa a API nativa do Supabase, que tem CORS configurado automaticamente).

---

## 3. Solução Implementada

### A. CORS Dinâmico para Vercel
O arquivo `supabase/functions/_shared/cors.ts` foi atualizado para permitir qualquer origem terminada em `.vercel.app`. Isso cobre branches de preview, staging e produção automaticamente.

```typescript
// supabase/functions/_shared/cors.ts
if (origin.endsWith('.vercel.app')) {
  return new Response(null, {
    status: 200,
    headers: { ...corsHeaders, 'Access-Control-Allow-Origin': origin }
  });
}
```

### B. Propagação do Origin
Todas as funções devem capturar o `origin` da requisição e repassá-lo para os helpers `ok()` e `err()`. Sem isso, o navegador bloqueia até mesmo as respostas de erro (como 401 Unauthorized), mascarando o problema real como um erro de rede genérico.

---

## 4. Como Realizar o Deploy (Troubleshooting)

Se você não possui o Supabase CLI instalado globalmente, use o comando via `npx` para garantir que as alterações de código e CORS subam para o servidor.

### Deploy Individual
```bash
npx supabase functions deploy <nome-da-funcao> --project-ref uqihnpwpcrujqycbuzxv
```

### Lista de Funções Críticas
- `models-get`
- `admin-users`
- `admin-users-update`
- `admin-users-delete`
- `auth-validate`

---

## 5. Manutenção de Secrets
Se precisar adicionar um domínio customizado que não seja da Vercel, use o Dashboard do Supabase:
1. **Project Settings** > **Edge Functions**.
2. Adicione ou atualize a Secret `ALLOWED_ORIGIN`.
