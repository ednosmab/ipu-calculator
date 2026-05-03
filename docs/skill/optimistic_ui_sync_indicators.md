# SKILL: Optimistic UI & Sync Indicators

Este protocolo define como a interface deve comunicar o estado de sincronização dos dados, equilibrando velocidade de resposta e transparência sobre a persistência remota.

---

## ⚡ Princípio da Resposta Instantânea

O usuário não deve esperar o servidor para ver sua ação refletida na tela.

1.  **Ação do Usuário**: Ex: Criar novo cálculo.
2.  **Atualização Local**: Salve no Repositório e atualize a lista imediatamente.
3.  **Estado Visual**: O item aparece na lista com um indicador de "Sincronizando" ou "Pendente".

---

## 🚦 Os Três Estados de Sincronização

A interface deve usar o campo `syncStatus` do Model para escolher o ícone/estilo:

| Status | Significado Visual | Feedback Sugerido |
| :--- | :--- | :--- |
| `synced` | Dado salvo no Supabase. | Sem ícone ou check verde discreto. |
| `pending` | Salvo apenas localmente (Offline). | Ícone de nuvem ou "bolinha" amarela. |
| `error` | Falha após várias tentativas. | Ícone de erro vermelho (permite re-tentativa). |

---

## 🔄 Tratamento de Erros de Sincronização

Se a sincronização em background falhar definitivamente:
1.  O item deve permanecer localmente (não delete o trabalho do usuário!).
2.  Um indicador visual deve convidar o usuário a tentar sincronizar novamente quando houver internet.

---

## 🧩 Coerência entre Telas
O estado de sincronização deve ser consistente em todo o app. Se um modelo está "Pendente" na lista, ele deve estar "Pendente" também na tela de detalhes.

---

## ⚠️ Regras de Ouro
1. **Nunca bloqueie a UI**: Nunca use um Spinner/Loading que impeça a navegação enquanto aguarda o servidor (exceto em logins/pagamentos).
2. **Confirmação Silenciosa**: Quando o status mudar de `pending` para `synced`, a transição visual deve ser suave (ex: o ícone apenas desaparece).
3. **Offline em Primeiro Lugar**: O app deve ser totalmente funcional sem internet; a sincronização é um bônus de segurança e multi-dispositivo.
