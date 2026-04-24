# 🚀 Roadmap de Evolução: IPU Calculator

## Fase 1: Estabilização e Qualidade (Curto Prazo)

O foco aqui é garantir que o que já existe seja inquebrável.

- Validação Rigorosa: Implementar o IPUInputSchema com Zod para todos os cálculos, garantindo que o valor de $y = 0,1506$ seja uma constante imutável no domínio.
- Cobertura de Testes:
  - Subir a cobertura de testes unitários para 80% na pasta src/core.
  - Implementar Snapshot Tests nos componentes do design-system para evitar regressões visuais.
- Observabilidade: Finalizar a integração do ErrorBoundary com o LogService para capturar falhas em produção.

## Fase 2: Arquitetura e DX (Developer Experience)

Melhorar a estrutura para suportar novas funcionalidades sem criar "código espaguete".

- Clean Architecture Deep Dive:
  - Mover toda a lógica de cálculo para UseCases puros.
  - Garantir que a UI (screens) não conheça as regras de negócio, apenas as chame.
- Local Persistence: Implementar AsyncStorage ou Expo SQLite para salvar históricos de cálculos de IPU e calibrações anteriores.
- Performance: Utilizar FlashList (da Shopify) em vez de FlatList se houver listagem de histórico.

## Fase 3: Automação e DevOps (Médio Prazo)

Agilizar o processo de entrega e garantir confiança no deploy.

- Pipeline CI/CD:
  - Finalizar o workflow do GitHub Actions.
  - Configurar EAS Update para enviar correções críticas (hotfixes) para os usuários sem precisará pasar pela aprovação da Apple/Google.
- Ambientes de Staging: Configurar o eas.json para gerar builds de "Internal Preview" (APK/IPA) automaticamente via branch develop.

## Fase 4: Especialização e Produto (Longo Prazo)

Diferenciais que colocam você no nível Pleno+.

- Offline First: Garantir que o app funcione 100% em chão de fábrica sem internet (comum em ambientes industriais).
- Internacionalização (i18n): Implementar i18next para suportar Inglês/Português.
- Acessibilidade: Implementar accessibilityLabel/Hint nativos do React Native para leitores de tela e contraste adequado para ambientes com muita iluminação.

---

## 🛠️ Sugestão de Backlog Imediato (Next Sprints)

| Prioridade | Task | Objetivo |
|------------|------|----------|
| Alta | Fixar constante $y = 0,1506$ no Zod | Precisão matemática. |
| Alta | Ativar Workflow de CI no GitHub | Segurança no código. |
| Média | Criar LogService no ErrorBoundary | Monitoramento de crashes. |
| Média | Testes de integração no IPUScreen | Validar fluxo do usuário. |

---

## Roadmap de Refatoração e Implementação

### 🔴 Fase 1 — Fundamentos (impacto imediato)

1. **Documentação (CRÍTICO)**
   - Criar README profissional
   - Adicionar:
     - prints da aplicação
     - GIF de uso
     - explicação do problema real (injeção/IPU)

2. **Testes (CRÍTICO)**
   - Corrigir coverage (hoje está 0%)
   - Priorizar:
     1. Regras de negócio (core/domain)
     2. Hooks críticos
     3. Fluxos principais
   - Meta: 50% (mínimo) / 70% (ideal)

3. **Navegação (ajuste técnico)**
   - Refatorar `router.push('/')` para `router.back()` ou `router.replace('/')`

### 🟠 Fase 2 — Qualitéde de código

4. **Padronização de arquitetura**
   ```
   features/
     ipu/
       domain/
       application/
       infrastructure/
       presentation/
   ```

5. **Design System (evoluir)**
   - Documentar tokens: cores, espaçamentos, tipografia
   - Garantir consistência: padding padrão, grid, estados (loading, error)

6. **Error Handling (nível sênior)**
   - Categorizar erros: domínio, UI
   - Preparar integração futura com logs (ex: Sentry)

### 🟡 Fase 3 — Dev Experience

7. **CI/CD (MUITO importante)**
   - Adicionar GitHub Actions: lint, test, build

8. **Scripts melhores**
   ```json
   "scripts": {
     "test:coverage": "jest --coverage",
     "test:watch": "jest --watch",
     "lint:fix": "expo lint --fix"
   }
   ```

9. **Simplificar Jest config**
   - Reduzir complexidade do transformIgnorePatterns
   - Garantir isolamento entre unit/integration

### 🔵 Fase 4 — Diferencial de mercado

10. **Performance**
    - Memoization (React.memo, useMemo)
    - Evitar re-renders desnecessários

11. **Acessibilidade (implementação manual)**
    - accessibilityLabel em inputs
    - accessibilityHint para instruções
    - Contraste adequado
    - Navegação por screen reader (nativo RN)

12. **Internacionalização (já começou bem)**
    - Expandir idiomas (en/es)
    - Fallback correto

### 🟢 Fase 5 — Produto (nível empresa)

13. **Observabilidade**
    - Logs estruturados
    - Tracking de erros

14. **Deploy completo**
    - Já tem: ✅ EAS, ✅ Vercel
    - Falta: pipeline automatizado

---

## 🧠 Ordem ideal de execução

1. README
2. Testes + coverage
3. Navegação
4. CI
5. Arquitetura refinada
6. Design system
7. Performance + Acessibilidade manual