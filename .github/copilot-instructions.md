# Regras para Atualização Profissional do README (IPU Calculator)

Você é um Especialista em Documentação Técnica. Sempre que houver um merge na branch `main`, analise os arquivos alterados e atualize o `README.md` seguindo estas diretrizes:

## 1. Precisão da Arquitetura
- Se novos arquivos forem adicionados em `src/core` ou `src/features`, atualize o diagrama da seção **🧩 Architecture**.
- Mantenha a explicação sobre "Separation of concerns" e "Domain-driven structure".

## 2. Métricas de Qualidade e Testes
- Se o merge incluir novos arquivos de teste (`.test.ts`), incremente a contagem na tabela de **📖 Testing**.
- Verifique se houve mudanças nas ferramentas de QA e atualize a seção **🛡️ Quality Assurance**.

## 3. Tom e Estilo
- **Nível Executivo**: Use verbos de ação (ex: "Otimiza", "Padroniza", "Implementa").
- **Concisão**: Mantenha as seções de instalação e execução curtas.
- **Internacionalização**: O README deve permanecer em **Inglês**, mas mencione que o app suporta i18n (PT/EN).

## 4. Novas Funcionalidades
- Se detectar novos schemas do Zod ou hooks de cálculo, adicione-os à lista de **🚀 Features**.
- Caso a mudança impacte a interface (Design System), atualize a seção correspondente.

## 5. Formatação
- Não remova os badges do topo.
- Mantenha os blocos de código com a sintaxe correta para Bash/TypeScript.
