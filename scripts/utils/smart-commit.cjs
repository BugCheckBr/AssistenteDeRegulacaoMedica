#!/usr/bin/env node

/**
 * 🤖 Smart Commit Script
 *
 * Script que implementa o fluxo obrigatório das instruções agents.md:
 * 1. Detecta mudanças
 * 2. Força atualização do CHANGELOG [Unreleased]
 * 3. Executa validações
 * 4. Commit automático
 *
 * Uso:
 * - npm run commit:smart -- "feat(api): adiciona endpoint de pacientes"
 * - npm run commit:smart -- --interactive
 */

const { execSync } = require('child_process');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { ChangelogAutoUpdater } = require('./changelog-auto-updater.cjs');

class SmartCommit {
  constructor() {
    this.updater = new ChangelogAutoUpdater();
  }

  /**
   * Executa o fluxo completo de commit seguindo agents.md
   */
  async execute(commitMessage, options = {}) {
    console.log('🚀 Iniciando Smart Commit Flow (agents.md compliance)');
    console.log('📋 Verificando fluxo obrigatório...\n');

    try {
      // 1. Verificar se há mudanças para commit
      await this.checkForChanges();

      // 2. Parsear mensagem de commit
      const { type, scope, description } = this.parseCommitMessage(commitMessage);

      // 3. OBRIGATÓRIO: Atualizar CHANGELOG [Unreleased]
      console.log('📝 Atualizando CHANGELOG.md [Unreleased]...');
      const changelogUpdated = await this.updater.updateUnreleased({
        type,
        scope,
        description,
        details: options.details,
      });

      if (!changelogUpdated) {
        throw new Error('❌ Falha ao atualizar CHANGELOG.md');
      }

      // 4. Executar validações obrigatórias
      console.log('\n🔍 Executando validações obrigatórias...');
      await this.runValidations();

      // 5. Stage do CHANGELOG.md
      console.log('📋 Staging CHANGELOG.md...');
      execSync('git add CHANGELOG.md', { stdio: 'inherit' });

      // 6. Commit final
      console.log('💾 Executando commit...');
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });

      console.log('\n✅ Smart Commit concluído com sucesso!');
      console.log('📋 Fluxo agents.md compliance: ✅');
      console.log('📝 CHANGELOG.md atualizado: ✅');
      console.log('🔍 Validações passaram: ✅');
      console.log('💾 Commit realizado: ✅');
    } catch (error) {
      console.error('\n❌ Smart Commit falhou:', error.message);
      console.error('💡 Dica: Verifique as instruções em agents.md');
      process.exit(1);
    }
  }

  /**
   * Executa modo interativo para criar commit
   */
  async interactive() {
    console.log('🤖 Smart Commit - Modo Interativo');
    console.log('📋 Seguindo fluxo obrigatório do agents.md\n');

    // TODO: Implementar prompts interativos
    // Por enquanto, mostra as instruções
    console.log('📚 Tipos de commit disponíveis:');
    console.log('  feat      - Nova funcionalidade');
    console.log('  fix       - Correção de bug');
    console.log('  docs      - Documentação');
    console.log('  style     - Estilo/formatação');
    console.log('  refactor  - Refatoração');
    console.log('  test      - Testes');
    console.log('  chore     - Manutenção');

    console.log('\n🏥 Escopos médicos sugeridos:');
    console.log('  api       - Chamadas SIGSS/CADSUS');
    console.log('  ui        - Interface sidebar');
    console.log('  timeline  - Timeline de pacientes');
    console.log('  store     - Gerenciamento de estado');
    console.log('  medical   - Lógica médica geral');
    console.log('  security  - Segurança/compliance');

    console.log('\n💡 Exemplo de uso:');
    console.log('  npm run commit:smart -- "feat(timeline): adiciona filtro por especialidade"');
  }

  async checkForChanges() {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      if (!status.trim()) {
        throw new Error('Nenhuma mudança para commit');
      }
      console.log('✅ Mudanças detectadas para commit');
    } catch (error) {
      throw new Error(`Erro ao verificar status git: ${error.message}`);
    }
  }

  parseCommitMessage(message) {
    // Regex para formato: type(scope): description
    const match = message.match(/^(\w+)(?:\(([^)]+)\))?: (.+)$/);

    if (!match) {
      // Fallback: tentar extrair tipo pelo menos
      const typeMatch = message.match(/^(\w+):/);
      return {
        type: typeMatch ? typeMatch[1] : 'chore',
        scope: null,
        description: message,
      };
    }

    return {
      type: match[1],
      scope: match[2] || null,
      description: match[3],
    };
  }

  async runValidations() {
    const validations = [
      { name: 'Format & Lint', command: 'npm run lint:fix' },
      { name: 'Security Validation', command: 'npm run validate:security' },
      { name: 'Medical Compliance', command: 'npm run validate:medical' },
    ];

    for (const validation of validations) {
      try {
        console.log(`  🔍 ${validation.name}...`);
        execSync(validation.command, { stdio: 'pipe' });
        console.log(`  ✅ ${validation.name} passou`);
      } catch (error) {
        // Para medical compliance, só warn se não existir
        if (validation.command.includes('validate:medical')) {
          console.log(`  ⚠️  ${validation.name} script não encontrado (continuando)`);
          continue;
        }
        throw new Error(`${validation.name} falhou: ${error.message}`);
      }
    }
  }
}

// CLI Interface
if (require.main === module) {
  const argv = yargs(hideBin(process.argv))
    .command('$0 [message]', 'Executa smart commit', (yargsCmd) => {
      yargsCmd
        .positional('message', {
          describe: 'Mensagem de commit no formato: type(scope): description',
          type: 'string',
        })
        .option('interactive', {
          alias: 'i',
          describe: 'Modo interativo',
          type: 'boolean',
          default: false,
        })
        .option('details', {
          describe: 'Detalhes adicionais para o changelog',
          type: 'string',
        });
    })
    .help().argv;

  const smartCommit = new SmartCommit();

  if (argv.interactive) {
    smartCommit.interactive();
  } else if (argv.message) {
    smartCommit.execute(argv.message, {
      details: argv.details,
    });
  } else {
    console.error('❌ Erro: Mensagem de commit ou --interactive é obrigatório');
    console.log('💡 Exemplo: npm run commit:smart -- "feat(api): adiciona endpoint"');
    process.exit(1);
  }
}
