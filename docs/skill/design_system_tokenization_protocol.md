# Design System Tokenization Protocol

Este protocolo define como o Design System deve ser evoluído de forma consistente, evitando a fragmentação visual e estilos hardcoded.

## 🎨 Evolução do Tema (Tokens)
- **Zero Hardcoded Colors:** É proibido o uso de cores hexadecimais, `rgb` ou nomes de cores (ex: 'red') diretamente nos componentes ou arquivos de estilo (`.styles.ts`).
- **Processo de Adição:**
  1. Identifique uma nova necessidade visual (ex: cor de alerta/warning).
  2. Adicione o token correspondente em `src/design-system/theme.ts`.
  3. Use o token via `theme.colors.seuToken`.
- **Nomenclatura Semântica:** Prefira nomes que descrevam o propósito (ex: `successBg`, `overlay`, `warning`) em vez da cor física (ex: `lightGreen`).

## 🧩 Variantes de Componentes
- **Átomos com Variantes:** Componentes atômicos (Card, Button, Text) devem suportar uma prop `variant` para mudanças de estado visual.
- **Exemplo de Implementação (Padrão Antigravity):**
  ```typescript
  // No componente atômico
  const styles = StyleSheet.create({
    card: { ...estiloBase },
    success: { backgroundColor: theme.colors.successBg, borderColor: theme.colors.success }
  });

  export const Card = ({ variant = 'default', style, children }) => (
    <View style={[styles.card, variant === 'success' && styles.success, style]}>
      {children}
    </View>
  );
  ```
- **Extensão de Estilos:** Se um componente de feature (ex: `ResultCard`) precisa de um estilo muito específico, ele deve compor o componente atômico, mas herdar o máximo possível dos tokens do tema.

## 📏 Espaçamento e Tipografia
- **Escala Fixa:** Use sempre `theme.spacing` e `theme.typography.sizes`. Nunca use valores numéricos aleatórios para `padding`, `margin` ou `fontSize`.
- **Alinhamento:** Prefira o uso de `HStack` e `VStack` para layouts em vez de manipular `flexDirection` manualmente em cada componente.
