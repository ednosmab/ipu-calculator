const fs = require('fs');
const path = require('path');

/**
 * Script de Sincronização Automática do README
 * Este script garante que o README reflita sempre o estado atual das Skills e Versão.
 */

const paths = {
  readme: path.join(__dirname, '../README.md'),
  package: path.join(__dirname, '../package.json'),
  skills: path.join(__dirname, '../docs/skill')
};

function syncReadme() {
  console.log('🔄 Iniciando sincronização do README...');

  let readmeContent = fs.readFileSync(paths.readme, 'utf8');
  const packageJson = JSON.parse(fs.readFileSync(paths.package, 'utf8'));
  const version = packageJson.version;

  // 1. Atualizar Versão
  readmeContent = readmeContent.replace(
    /\*\*Version:\*\* [0-9.]+/g,
    `**Version:** ${version}`
  );

  // 2. Atualizar Lista de Skills
  const skills = fs.readdirSync(paths.skills)
    .filter(file => file.endsWith('.md'))
    .map(file => {
      const content = fs.readFileSync(path.join(paths.skills, file), 'utf8');
      const title = content.split('\n')[0].replace('# ', '').trim();
      return `- [${title}](docs/skill/${file})`;
    })
    .join('\n');

  const skillsSectionRegex = /## 📜 Protocolos de Skill \(Documentation as Code\)\n([\s\S]*?)\n---/g;
  readmeContent = readmeContent.replace(
    skillsSectionRegex,
    `## 📜 Protocolos de Skill (Documentation as Code)\nO projeto é guiado por protocolos rigorosos localizados em \`./docs/skill/\`:\n${skills}\n---`
  );

  fs.writeFileSync(paths.readme, readmeContent);
  console.log(`✅ README sincronizado com sucesso para a versão ${version}!`);
  console.log(`📚 ${skills.split('\n').length} protocolos vinculados.`);
}

try {
  syncReadme();
} catch (error) {
  console.error('❌ Erro ao sincronizar README:', error.message);
  process.exit(1);
}
