# 🚀 Fluxo de Trabalho e Deploy (Workflow)

Este guia descreve como organizar as branches e realizar o deploy nos ambientes de Teste (Staging) e Produção.

## 🌿 Estrutura de Branches

| Branch | Ambiente | URL | Finalidade |
| :--- | :--- | :--- | :--- |
| `main` | **Produção** | [Link Oficial](https://ipu-calculator.vercel.app) | Versão estável usada pelos usuários finais. |
| `develop` | **Staging** | [Link de Teste](https://ipu-calculator-staging.vercel.app) | Ambiente de homologação para testes reais antes da main. |
| `refactor` | **Local** | - | Desenvolvimento, refatoração e novas funcionalidades. |

---

## 🛠️ Ciclo de Desenvolvimento (Passo a Passo)

### 1. Trabalhando na Refatoração/Feature
Faça suas alterações sempre na branch `refactor` (ou em branches de feature específicas).
```bash
git checkout refactor
# ... faz o código ...
git add .
git commit -m "feat: minha nova funcionalidade"
git push origin refactor
```

### 2. Enviando para Testes (Staging)
Quando o código estiver pronto para ser testado na Web:
```bash
git checkout develop
git merge refactor
git push origin develop
```
> **Ação**: Acesse o [Link de Teste](https://ipu-calculator-staging.vercel.app) e verifique se tudo funciona.

### 3. Publicando para Produção (Main)
Após validar que tudo está perfeito no Staging:
```bash
git checkout main
git merge develop
git push origin main
```
> **Ação**: O [Link Oficial](https://ipu-calculator.vercel.app) será atualizado automaticamente.

---

## ⚠️ Lembretes Importantes
- **Nunca faça commit direto na `main`**: Use sempre o fluxo de merge para evitar quebrar o app oficial.
- **Variáveis de Ambiente**: Se adicionar uma nova chave no `.env` local, lembre-se de adicioná-la também no painel da Vercel (*Settings > Environment Variables*).
- **Conflitos**: Se houver conflito no merge, o VS Code avisará. Resolva os conflitos, salve os arquivos e complete o commit.

---
*Dica: Você pode me pedir para realizar qualquer um desses passos de merge por você!*
