import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const changelogPath = path.join(__dirname, '../../CHANGELOG.md');
const version = process.argv[2];

if (!version) {
  console.error('Erro: a versão não foi fornecida.');
  process.exit(1);
}

const today = new Date().toISOString().split('T')[0];
const newVersionHeader = `## [${version}] - ${today}`;

let changelogContent = fs.readFileSync(changelogPath, 'utf8');

// Encontra o conteúdo em "Unreleased"
const unreleasedRegex = /## \[Unreleased\]\n([\s\S]*?)\n## \[/;
const unreleasedMatch = changelogContent.match(unreleasedRegex);
const unreleasedContent = unreleasedMatch ? unreleasedMatch[1].trim() : '';

// Remove o conteúdo de "Unreleased"
changelogContent = changelogContent.replace(unreleasedRegex, `## [Unreleased]\n\n## [`);

// Adiciona a nova seção de versão com o conteúdo
changelogContent = changelogContent.replace(
  '## [Unreleased]',
  `## [Unreleased]\n\n${newVersionHeader}\n${unreleasedContent}`
);

// Adiciona o novo link de comparação
const unreleasedLinkRegex = /\[Unreleased\]: (.*\/compare\/)(.*)\.\.\.HEAD/;
const match = changelogContent.match(unreleasedLinkRegex);

if (match) {
  const baseUrl = match[1];
  const latestVersion = match[2];
  const newUnreleasedLink = `[Unreleased]: ${baseUrl}${version}...HEAD`;
  const newVersionLink = `[${version}]: ${baseUrl}${latestVersion}...${version}`;

  changelogContent = changelogContent.replace(
    unreleasedLinkRegex,
    `${newUnreleasedLink}\n${newVersionLink}`
  );
}

fs.writeFileSync(changelogPath, changelogContent, 'utf8');

console.log(`CHANGELOG.md atualizado para a versão ${version}.`);
