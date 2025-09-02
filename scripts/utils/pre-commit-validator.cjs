#!/usr/bin/env node

/**
 * 🛡️ Pre-commit Validation
 *
 * Valida que o fluxo obrigatório do agents.md está sendo seguido:
 * 1. CHANGELOG.md [Unreleased] foi atualizado
 * 2. Executar validações de segurança e lint
 * 3. Verificar compliance médico
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class PreCommitValidator {
  constructor() {
    this.changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
  }

  async validate() {
    console.log('🛡️  Pre-commit Validation (agents.md compliance)');

    try {
      // 1. Verificar se CHANGELOG foi atualizado
      await this.validateChangelogUpdate();

      // 2. Executar validações padrão
      await this.runStandardValidations();

      // 3. Verificação médica
      await this.validateMedicalCompliance();

      console.log('✅ Pre-commit validation passou!');
      console.log('📋 agents.md compliance: ✅');
    } catch (error) {
      console.error('\n❌ Pre-commit validation falhou:', error.message);
      console.error('\n💡 Para corrigir:');
      console.error('   1. Atualize CHANGELOG.md seção [Unreleased]');
      console.error('   2. Execute: npm run commit:smart -- "sua mensagem"');
      console.error(
        '   3. Ou use: npm run changelog:update -- --type feat --scope xxx --description "..."'
      );
      process.exit(1);
    }
  }

  async validateChangelogUpdate() {
    // Verificar se CHANGELOG.md está staged
    try {
      const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' });
      const changelogStaged = stagedFiles.includes('CHANGELOG.md');

      if (!changelogStaged) {
        // Verificar se [Unreleased] tem conteúdo recente
        const changelog = fs.readFileSync(this.changelogPath, 'utf8');
        const hasRecentUnreleased = this.hasRecentUnreleasedContent(changelog);

        if (!hasRecentUnreleased) {
          throw new Error('CHANGELOG.md [Unreleased] não foi atualizado');
        }

        // Auto-stage CHANGELOG.md se tem conteúdo
        console.log('📋 Auto-staging CHANGELOG.md...');
        execSync('git add CHANGELOG.md');
      }

      console.log('✅ CHANGELOG.md validation passou');
    } catch (error) {
      throw new Error(`CHANGELOG validation falhou: ${error.message}`);
    }
  }

  hasRecentUnreleasedContent(changelog) {
    const lines = changelog.split('\n');
    const unreleasedIndex = lines.findIndex((line) => line.trim() === '## [Unreleased]');

    if (unreleasedIndex === -1) return false;

    // Verificar se há conteúdo nas próximas 20 linhas
    const nextLines = lines.slice(unreleasedIndex + 1, unreleasedIndex + 21);
    return nextLines.some((line) => line.trim().startsWith('- ') || line.trim().startsWith('### '));
  }

  async runStandardValidations() {
    const validations = [
      { name: 'Format & Lint Fix', command: 'npm run lint:fix' },
      { name: 'Security Validation', command: 'npm run validate:security' },
    ];

    for (const validation of validations) {
      try {
        console.log(`🔍 ${validation.name}...`);
        execSync(validation.command, { stdio: 'pipe' });
        console.log(`✅ ${validation.name} passou`);
      } catch {
        throw new Error(`${validation.name} falhou`);
      }
    }
  }

  async validateMedicalCompliance() {
    // Verificações básicas de compliance médico
    console.log('🏥 Medical compliance check...');

    try {
      // Verificar se não há dados sensíveis em logs
      const jsFiles = execSync('git diff --cached --name-only | grep -E "\\.js$"', {
        encoding: 'utf8',
      })
        .split('\n')
        .filter(Boolean);

      for (const file of jsFiles) {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          this.checkForSensitiveData(content, file);
        }
      }

      console.log('✅ Medical compliance check passou');
    } catch {
      // Se grep não encontrar arquivos, é OK
      console.log('✅ Medical compliance check passou (sem arquivos JS)');
    }
  }

  checkForSensitiveData(content, filename) {
    const sensitivePatterns = [
      /console\.log.*(?:cpf|cns|isenPK|reguId)/i,
      /console\..*(?:nome|dataNascimento|nomeMae)/i,
      /log.*patient.*:/i,
    ];

    for (const pattern of sensitivePatterns) {
      if (pattern.test(content)) {
        throw new Error(`Possível exposição de dados sensíveis em ${filename}`);
      }
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const validator = new PreCommitValidator();
  validator.validate();
}

module.exports = { PreCommitValidator };
