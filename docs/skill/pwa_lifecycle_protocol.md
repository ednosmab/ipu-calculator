# SKILL: PWA Lifecycle & Update Protocol

Sempre que lidar com a instalação, detecção de ambiente ou atualização do PWA, siga este protocolo para garantir robustez e evitar comportamentos duplicados ou intrusivos.

---

## 🧠 Filosofia de Detecção
NÃO use `localStorage` ou variáveis de ambiente para adivinhar se o app está instalado ou atualizado. Confie exclusivamente nos sinais reais do navegador.

### 1. Detecção de Ambiente (Standalone)
A única fonte de verdade para saber se o usuário está usando o app instalado ou o navegador é a Media Query `display-mode`.
- **Modo Standalone**: Usuário abriu pelo ícone na tela inicial.
- **Modo Browser**: Usuário está navegando via Chrome/Safari.

```typescript
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
```

### 2. Detecção de Instalação (A2HS)
- **Android/Chrome/Desktop**: Use o evento `beforeinstallprompt`. Se ele disparar, o app é instalável. Se não disparar, o app já está instalado ou o navegador não suporta.
- **iOS**: Verifique `!isStandalone`. O iOS não possui evento de prompt, então a instrução de instalação deve ser oferecida sempre que não estiver em standalone.

---

## 🛠️ Estados da Interface (Pill Logic)

O componente de interface (PWA Pill) deve alternar entre dois estados exclusivos:

| Estado | Condição | Ação do Botão |
| :--- | :--- | :--- |
| **Instalar App** | `!isStandalone` && `canInstall` | Dispara o `deferredPrompt.prompt()` ou mostra instruções manuais (iOS). |
| **Atualizar App** | `isStandalone` && `updateAvailable` | Mostra alerta informativo: "Feche e abra o app para atualizar". |

---

## 🔄 Ciclo de Vida do Service Worker (Updates)

### Estratégia de Cache
- **Network-First**: Priorize a rede para garantir o deploy mais atual. Use o cache apenas como fallback (Offline).
- **Sem Auto-Skip**: Remova `self.skipWaiting()` do evento `install` no `service-worker.js`. Isso permite que a nova versão fique em estado `waiting` até que o usuário decida atualizar.

### Detecção de Update
Monitore o estado `waiting` do registro do Service Worker.
```typescript
if (registration.waiting) {
  setUpdateAvailable(true);
}
```

---

## ⚠️ Regras de Ouro
1. **Não automatize o reload**: Evite forçar `window.location.reload()` via código ao detectar update. Isso pode causar perda de dados do usuário. Prefira educar o usuário a fechar e abrir o app.
2. **Prioridade Visual**: O botão "Instalar" é para aquisição de novos usuários PWA. O botão "Atualizar" é para manutenção da experiência dos usuários atuais.
3. **Persistência**: Ao clicar em "Dismiss" (X) na pílula, o estado deve ser limpo apenas para a sessão atual, permitindo que o aviso reapareça em uma nova visita se a condição persistir.
