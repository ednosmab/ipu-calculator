# SKILL: Network Connectivity Protocol (Web & Mobile)

Sempre que implementar verificações de status de rede, siga este protocolo para evitar falsos positivos, especialmente em ambientes Web/Desktop onde o navegador pode reportar "Online" mas não haver internet real (Captive Portals, Wi-Fi sem sinal, etc).

---

## 🚀 Estratégia de Detecção Híbrida

### 1. Web / Desktop (Navegador)
O `navigator.onLine` é apenas um indício. Para confirmação real, deve-se realizar um "Heartbeat Check".

- **Endpoint de Teste**: `https://www.google.com/favicon.ico` (ou similar confiável).
- **Configuração de Fetch**:
    - `mode: 'no-cors'`: Para evitar bloqueios de CORS.
    - `cache: 'no-store'`: Para garantir que não estamos lendo um resultado antigo.
    - `AbortController`: Timeout rigoroso de **3 segundos**.

```typescript
// Exemplo de lógica de validação real
const hasInternet = await fetch(url, { mode: 'no-cors', cache: 'no-store', signal }).then(() => true).catch(() => false);
```

### 2. Mobile (Native)
Use a biblioteca `@react-native-community/netinfo` como fonte primária, mas aplique um **Debounce** de pelo menos 500ms nas mudanças de estado para evitar disparos frenéticos durante transições de torre/Wi-Fi.

---

## ⏱️ Ciclo de Verificação (Heartbeat)

Não confie apenas em eventos (`online`/`offline`). Implemente uma verificação ativa periódica:
- **Intervalo sugerido**: 10 a 30 segundos enquanto o app estiver em primeiro plano.
- **Trigger**: Verifique imediatamente ao detectar que a aba/app voltou a ficar visível (`visibilitychange`).

---

## 📋 Interface do Hook (`useNetworkStatus`)

O hook deve retornar três estados possíveis:
- `true`: Conectividade real confirmada.
- `false`: Sem conexão ou falha no heartbeat.
- `null`: Estado inicial (carregando).

---

## ⚠️ Boas Práticas
1. **Silêncio nos Logs**: Evite logar sucessos de heartbeat para não poluir o console; logue apenas falhas de transição.
2. **Fallback Gracioso**: Se o servidor de teste estiver fora do ar, o app não deve travar; trate o erro e assuma o estado anterior ou tente outro endpoint.
3. **Respeito aos Dados**: O heartbeat deve ser um request minúsculo (apenas cabeçalhos ou um favicon) para não consumir dados do usuário.
