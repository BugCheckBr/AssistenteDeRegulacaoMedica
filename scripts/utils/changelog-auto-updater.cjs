#!/usr/bin/env node

/**
 * 🔄 Auto Changelog Updater
 *
 * Script para automatizar a atualização do CHANGELOG.md na seção [Unreleased]
 * seguindo as instruções do agents.md
 *
 * Uso:
 * - node scripts/utils/changelog-auto-updater.js --type feat --scope api --description "adiciona endpoint de pacientes"
 * - npm run changelog:update -- --type fix --scope ui --description "corrige layout da sidebar"
 */

const fs = require('fs').promises;
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

class ChangelogAutoUpdater {
  constructor(rootDir = process.cwd()) {
    this.rootDir = rootDir;
    this.changelogPath = path.join(rootDir, 'CHANGELOG.md');
  }

  /**
   * Atualiza o CHANGELOG.md na seção [Unreleased]
   * @param {Object} options - Opções da mudança
   * @param {string} options.type - Tipo: feat, fix, docs, style, refactor, test, chore
   * @param {string} options.scope - Escopo: api, ui, timeline, store, etc.
   * @param {string} options.description - Descrição da mudança
   * @param {string} [options.details] - Detalhes adicionais (opcional)
   */
  async updateUnreleased({ type, scope, description, details }) {
    try {
      const changelog = await this.readChangelog();
      const section = this.getChangelogSection(type);
      const entry = this.formatChangelogEntry({ type, scope, description, details });

      const updatedChangelog = this.insertUnreleasedEntry(changelog, section, entry);

      await fs.writeFile(this.changelogPath, updatedChangelog, 'utf8');

      console.log(`✅ CHANGELOG.md atualizado:`);
      console.log(`   📝 ${section}: ${entry}`);
      console.log(`   📍 Seção: [Unreleased] > ${section}`);

      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar CHANGELOG.md:', error.message);
      return false;
    }
  }

  async readChangelog() {
    try {
      return await fs.readFile(this.changelogPath, 'utf8');
    } catch (error) {
      throw new Error(`Não foi possível ler CHANGELOG.md: ${error.message}`);
    }
  }

  /**
   * Mapeia tipos de commit para seções do changelog
   */
  getChangelogSection(type) {
    const sectionMap = {
      feat: '✨ Added',
      fix: '🐞 Fixed',
      docs: '📚 Documentation',
      style: '🎨 Style',
      refactor: '🛠️ Changed',
      test: '🧪 Testing',
      chore: '🔧 Maintenance',
      perf: '⚡ Performance',
      build: '🏗️ Build',
      ci: '🤖 CI/CD',
    };

    return sectionMap[type] || '🛠️ Changed';
  }

  /**
   * Formata entrada do changelog seguindo padrões médicos
   */
  formatChangelogEntry({ scope, description, details }) {
    const scopeEmoji = this.getScopeEmoji(scope);
    const formattedScope = scope ? `**${scopeEmoji} ${scope}**` : '';

    let entry = formattedScope ? `${formattedScope}: ${description}` : description;

    // Capitaliza primeira letra
    entry = entry.charAt(0).toUpperCase() + entry.slice(1);

    if (details) {
      entry += `\n  - ${details}`;
    }

    return entry;
  }

  /**
   * Mapeia escopos para emojis seguindo padrões médicos
   */
  getScopeEmoji(scope) {
    const emojiMap = {
      api: '🔗',
      ui: '🎨',
      timeline: '📅',
      store: '💾',
      sidebar: '📋',
      search: '🔍',
      patient: '🏥',
      regulation: '📝',
      sigss: '🔐',
      cadsus: '🏛️',
      manifest: '📦',
      security: '🔒',
      performance: '⚡',
      medical: '🏥',
      compliance: '📋',
    };

    return emojiMap[scope] || '🔧';
  }

  /**
   * Insere entrada na seção [Unreleased] do changelog
   */
  insertUnreleasedEntry(changelog, section, entry) {
    const lines = changelog.split('\n');

    // Encontra a seção [Unreleased]
    const unreleasedIndex = lines.findIndex((line) => line.trim() === '## [Unreleased]');

    if (unreleasedIndex === -1) {
      throw new Error('Seção [Unreleased] não encontrada no CHANGELOG.md');
    }

    // Encontra ou cria a seção específica (Added, Fixed, etc.)
    let sectionIndex = -1;
    let insertIndex = unreleasedIndex + 1;

    // Procura pela seção específica após [Unreleased]
    for (let i = unreleasedIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();

      // Para na próxima versão
      if (line.startsWith('## [') && !line.includes('Unreleased')) {
        break;
      }

      // Encontrou a seção
      if (line === `### ${section}`) {
        sectionIndex = i;
        break;
      }

      // Atualiza índice de inserção
      if (line.startsWith('### ') || line === '') {
        insertIndex = i;
      }
    }

    if (sectionIndex === -1) {
      // Cria nova seção
      const newSectionLines = ['', `### ${section}`, '', `- ${entry}`, ''];

      lines.splice(insertIndex + 1, 0, ...newSectionLines);
    } else {
      // Adiciona à seção existente
      const nextLineIndex = sectionIndex + 1;

      // Pula linhas vazias
      let insertAt = nextLineIndex;
      while (insertAt < lines.length && lines[insertAt].trim() === '') {
        insertAt++;
      }

      lines.splice(insertAt, 0, `- ${entry}`);
    }

    return lines.join('\n');
  }

  /**
   * Detecta mudanças não commitadas e sugere entradas automáticas
   */
  async suggestAutoEntries() {
    // TODO: Implementar detecção git diff e sugestões automáticas
    console.log('🤖 Auto-detecção de mudanças (em desenvolvimento)');
  }
}

// CLI Interface
if (require.main === module) {
  const argv = yargs(hideBin(process.argv))
    .option('type', {
      alias: 't',
      describe: 'Tipo da mudança',
      choices: ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'perf', 'build', 'ci'],
      demandOption: true,
    })
    .option('scope', {
      alias: 's',
      describe: 'Escopo da mudança (api, ui, timeline, etc.)',
      type: 'string',
    })
    .option('description', {
      alias: 'd',
      describe: 'Descrição da mudança',
      type: 'string',
      demandOption: true,
    })
    .option('details', {
      describe: 'Detalhes adicionais (opcional)',
      type: 'string',
    })
    .help().argv;

  const updater = new ChangelogAutoUpdater();
  updater.updateUnreleased(argv).then((success) => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { ChangelogAutoUpdater };
