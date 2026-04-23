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

## Checklist Rápido

Execute estes testes em cada nova versão:

- [ ] App inicia sem crash
- [ ] ErrorBoundary funciona (se houver erro)
- [ ] Teste IPU passa
- [ ] Teste Calibração passa
- [ ] Troca de idioma funciona
- [ ] Build Android gera APK
- [ ] Build Web funciona