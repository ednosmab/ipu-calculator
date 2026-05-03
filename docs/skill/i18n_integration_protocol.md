# i18n Integration Protocol

Este protocolo estabelece o padrão para desenvolvimento multi-idioma e garante que a interface do usuário seja totalmente traduzível e testável.

## 🌏 Regra de Ouro: Zero Hardcoded Strings
- **Proibição Absoluta:** Nenhuma string visível ao usuário deve ser escrita diretamente no JSX ou TSX.
- **Localização Obrigatória:** Todas as labels, títulos, placeholders, mensagens de erro e conteúdos de ajuda devem residir em `src/i18n/translations.ts`.
- **Uso do Hook:** Utilize o hook `useTranslation` em componentes funcionais:
  ```typescript
  const { t } = useTranslation();
  return <Text>{t('chave_da_traducao')}</Text>;
  ```

## 🧪 Estratégia de Testes (Mocking)
- **Mock Global:** Para evitar falhas de renderização e erros de transformação do Babel, o sistema de i18n é mockado globalmente em `jest.setup.js`.
- **Mapa de Tradução para Testes:** O mock utiliza um mapa estático (`ptLabels`) que mapeia chaves para seus valores em português. Isso permite que seletores como `getByLabelText('Texto em PT')` continuem funcionando.
- **Atualização de Testes:** Se uma nova string for adicionada e usada em um teste existente, o mapa `ptLabels` no `jest.setup.js` deve ser atualizado para manter a paridade.

## 📂 Organização de Chaves
- **Nomenclatura Camelo (camelCase):** Use chaves como `calculateInjection`, `saveAsModel`.
- **Sufixos Úteis:**
  - `...Short`: Para versões curtas de labels (ex: `actualWeightShort`).
  - `...Placeholder`: Para textos de exemplo em inputs.
  - `...Error`: Para mensagens de validação.
- **Paridade:** Sempre adicione a chave tanto no objeto `pt` quanto no `en` no arquivo `translations.ts` para manter a integridade do sistema.
