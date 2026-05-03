# Smoke Tests

Este documento contém os casos de teste para validação rápida das funcionalidades do IPU Calculator.

---

## Calcular Injeção (IPU)

### Dados de Teste

| Campo | Valor |
|-------|-------|
| Isocianato (Iso) | 0.0771 |
| Poliol | 0.1506 |
| Fórmula | (iso + poliol) / 0.140 |

### Resultado Esperado

| Indicador | Valor |
|-----------|-------|
| IPU | **1.6264** |

### Verificações

- [ ] Resultado exibe 1.6264
- [ ] Tela scroll para o resultado após cálculo
- [ ] Botão voltar funciona
- [ ] Limpar limpa os campos

---

## Calibrar Vazão

### Dados de Teste

| Campo | Valor |
|-------|-------|
| Peso extraído | 41,1 |
| Divisor | 3 |
| Peso desejado | 0,127 |
| Valor da máquina | 1,253 |
| Peso real (calculado) | 0,137 |

### Resultado Esperado

| Indicador | Valor |
|-----------|-------|
| Ajuste | **1,162** |

### Verificações

- [ ] Assistente de Peso Real calcula peso real automaticamente
- [ ] Resultado exibe 1,162
- [ ] Tela scroll para o resultado após cálculo
- [ ] Botão voltar funciona
- [ ] Limpar limpa todos os campos

---

## internacionalização (i18n)

### Dados de Teste

| Idioma | Verificação |
|--------|-------------|
| PT | Botão "PT" na tela inicial |
| EN | Trocar para "EN" altera todos os textos |

### Verificações

- [ ] Botão PT/EN visível no canto superior direito
- [ ] Troca de idioma funciona em todas as telas
- [ ] Títulos: "IPU Calculator" / "Calculadora IPU"
- [ ] Botões traduzidos corretamente

---

## Modelos (Sync + Realtime)

### Criar Modelo

| Campo | Valor |
|-------|-------|
| Nome | "Teste Smoke" |
| Tipo | IPU |
| Isocianato | 0.0771 |
| Poliol | 0.1506 |

### Verificações

- [ ] Modelo salvo localmente
- [ ] Modelo sincroniza com Supabase
- [ ] Modelo aparece em todas as abas abertas

### Editar Modelo

| Campo | Novo Valor |
|-------|------------|
| Isocianato | 0.1000 |

### Verificações

- [ ] Alteração salva localmente
- [ ] Alteração sincroniza com Supabase
- [ ] Alteração replicada em todas as abas abertas

### Deletar Modelo (via Supabase)

### Verificações

- [ ] Delete no Supabase remove modelo das abas abertas
- [ ] Multiple abas receptor a mesma mudança

---

## Offline + Sincronização

### Cenário: Dados Móveis Instáveis

1. Conectar em dados móveis
2. Criar modelo
3. Desconectar (modo avião)
4. Abrir novamente

### Verificações

- [ ] App inicia sem crash ("Algo deu errado" não aparece)
- [ ] Modelo salvo localmente como "pending"
- [ ] Ao reconectar, sincroniza automaticamente
- [ ] "Conexão restabelecida" aparece no console

---

## Checklist Rápido

Execute estes testes em cada nova versão:

- [ ] App inicia sem crash
- [ ] ErrorBoundary funciona (se houver erro)
- [ ] Teste IPU passa
- [ ] Teste Calibração passa
- [ ] Troca de idioma funciona
- [ ] Criar modelo sincroniza com Supabase
- [ ] Editar modelo replica em abas abertas
- [ ] Deletar no Supabase remove das abas abertas
- [ ] Modo offline funciona sem crash
- [ ] Build Android gera APK
- [ ] Build Web funciona

---

## Testes Visuais (Manuais)

### Design System

| Componente | Verificação | Status |
|-----------|-------------|--------|
| **Button Primary** | Cor primária #649991 | ☐ |
| **Button Secondary** | Cor secundária #313943 | ☐ |
| **Button Ghost** | Sem fundo, cor primária | ☐ |
| **Input Default** | Borda #313943 | ☐ |
| **Input Focus** | Borda #649991 | ☐ |
| **Input Error** | Borda #E57373, texto erro vermelho | ☐ |
| **Card** | Background #1C1F26, border radius | ☐ |
| **ResultCard** | Fonte 36px, cor #94A684, alinhado à esquerda | ☐ |
| **Text Label** | Maiúsculas, letter-spacing 1px | ☐ |

### Telas

| Tela | Verificação | Status |
|------|-------------|--------|
| **HomeScreen** | Título centralizado, botões PT/EN no canto direito | ☐ |
| **IPU Screen** | Labels Isocianato/Poliol, resultado scroll | ☐ |
| **Calibration Screen** | Assistente toggle, labels corretos | ☐ |

---

## Pendente

| Item | Prioridade | Status |
|------|-----------|--------|
| Snapshot Tests (Design System) | Média | ⏳ Pendente |