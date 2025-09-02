#!/usr/bin/env node

/**
 * 🏥 Medical Compliance Validator
 *
 * Valida compliance médico conforme instruções agents.md:
 * - LGPD/HIPAA compliance
 * - Não exposição de dados sensíveis
 * - Validação de fluxos médicos críticos
 */

const fs = require('fs');
const path = require('path');

class MedicalComplianceValidator {
  constructor() {
    this.rootDir = process.cwd();
    this.sensitivePatterns = [
      // Dados pessoais sensíveis
      { pattern: /console\.log.*(?:cpf|cns)/i, message: 'CPF/CNS em logs' },
      { pattern: /console\..*(?:isenPK|isenFullPKCrypto)/i, message: 'IDs criptográficos em logs' },
      { pattern: /console\..*(?:reguIdp|reguIds)/i, message: 'IDs de regulação em logs' },
      {
        pattern: /console\..*(?:nome|dataNascimento|nomeMae)/i,
        message: 'Dados demográficos em logs',
      },

      // Estruturas médicas
      { pattern: /console\.log.*patient.*:/i, message: 'Objeto paciente completo em logs' },
      { pattern: /console\..*regulation.*:/i, message: 'Dados de regulação em logs' },

      // APIs médicas
      { pattern: /console\..*sigss.*response/i, message: 'Response SIGSS completo em logs' },
      { pattern: /console\..*cadsus.*data/i, message: 'Dados CADSUS em logs' },
    ];
  }

  async validate() {
    console.log('🏥 Medical Compliance Validation');
    console.log('📋 Verificando LGPD/HIPAA compliance...\n');

    try {
      await this.validateSensitiveDataExposure();
      await this.validateMedicalFlows();
      await this.validateSecurityPatterns();

      console.log('\n✅ Medical Compliance Validation passou!');
      console.log('🔒 LGPD/HIPAA compliance: ✅');
      console.log('🏥 Medical flows: ✅');
      console.log('🛡️  Security patterns: ✅');
    } catch (error) {
      console.error('\n❌ Medical Compliance falhou:', error.message);
      console.error('\n💡 Soluções:');
      console.error('   1. Remova logs de dados sensíveis');
      console.error('   2. Use sanitizeForLog() para dados médicos');
      console.error('   3. Verifique fluxos de timeline/regulação');
      process.exit(1);
    }
  }

  async validateSensitiveDataExposure() {
    console.log('🔍 Verificando exposição de dados sensíveis...');

    const jsFiles = this.getJavaScriptFiles();
    let violations = [];

    for (const file of jsFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const fileViolations = this.checkSensitivePatterns(content, file);
      violations = violations.concat(fileViolations);
    }

    if (violations.length > 0) {
      const violationMessages = violations.map((v) => `  ⚠️  ${v.file}: ${v.message}`).join('\n');
      throw new Error(`Exposição de dados sensíveis detectada:\n${violationMessages}`);
    }

    console.log('✅ Nenhuma exposição de dados sensíveis encontrada');
  }

  async validateMedicalFlows() {
    console.log('🏥 Verificando fluxos médicos críticos...');

    // Verificar se os fluxos críticos estão preservados
    const criticalFiles = ['api.js', 'store.js', 'TimelineManager.js', 'content-script.js'];

    for (const file of criticalFiles) {
      const filePath = path.join(this.rootDir, file);
      if (fs.existsSync(filePath)) {
        await this.validateCriticalFile(filePath);
      }
    }

    console.log('✅ Fluxos médicos críticos preservados');
  }

  async validateCriticalFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const filename = path.basename(filePath);

    // Verificações específicas por arquivo
    switch (filename) {
      case 'api.js':
        this.validateApiFlows(content, filename);
        break;
      case 'TimelineManager.js':
        this.validateTimelineFlows(content, filename);
        break;
      case 'store.js':
        this.validateStoreFlows(content, filename);
        break;
    }
  }

  validateApiFlows(content, filename) {
    // Verificar se o fluxo de timeline está preservado
    const timelineFlowPresent =
      content.includes('fetchAllTimelineData') && content.includes('isenFullPKCrypto');

    if (!timelineFlowPresent) {
      throw new Error(`${filename}: Fluxo crítico de timeline pode estar comprometido`);
    }

    // Verificar se clearRegulationLock está presente
    const lockFlowPresent = content.includes('clearRegulationLock');
    if (!lockFlowPresent) {
      throw new Error(`${filename}: Fluxo de regulation lock pode estar comprometido`);
    }
  }

  validateTimelineFlows(content, filename) {
    // Verificar se normalização está presente
    const normalizationPresent = content.includes('normalizeTimelineData');
    if (!normalizationPresent) {
      throw new Error(`${filename}: Normalização de dados timeline pode estar comprometida`);
    }
  }

  validateStoreFlows(content, filename) {
    // Verificar se sanitização está presente
    const sanitizationPresent =
      content.includes('sanitize') || content.includes('medical') || content.includes('sensitive');

    if (!sanitizationPresent) {
      console.log(`⚠️  ${filename}: Verificar se sanitização médica está implementada`);
    }
  }

  async validateSecurityPatterns() {
    console.log('🛡️  Verificando padrões de segurança...');

    // Verificar CSP no manifest
    const manifestPath = path.join(this.rootDir, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      this.validateManifestSecurity(manifest);
    }

    console.log('✅ Padrões de segurança validados');
  }

  validateManifestSecurity(manifest) {
    // Verificar CSP
    if (!manifest.content_security_policy) {
      throw new Error('manifest.json: CSP não definido');
    }

    // Verificar host_permissions médicas
    if (!manifest.host_permissions || !manifest.host_permissions.some((p) => p.includes('sigss'))) {
      throw new Error('manifest.json: host_permissions para SIGSS não definidas');
    }
  }

  getJavaScriptFiles() {
    const files = [];

    // Arquivos principais
    const mainFiles = [
      'api.js',
      'background.js',
      'content-script.js',
      'sidebar.js',
      'store.js',
      'utils.js',
      'TimelineManager.js',
      'options.js',
    ];

    for (const file of mainFiles) {
      const filePath = path.join(this.rootDir, file);
      if (fs.existsSync(filePath)) {
        files.push(filePath);
      }
    }

    // Arquivos em ui/
    const uiDir = path.join(this.rootDir, 'ui');
    if (fs.existsSync(uiDir)) {
      const uiFiles = fs
        .readdirSync(uiDir)
        .filter((f) => f.endsWith('.js'))
        .map((f) => path.join(uiDir, f));
      files.push(...uiFiles);
    }

    return files;
  }

  checkSensitivePatterns(content, filePath) {
    const violations = [];

    for (const { pattern, message } of this.sensitivePatterns) {
      if (pattern.test(content)) {
        violations.push({
          file: path.basename(filePath),
          message: message,
        });
      }
    }

    return violations;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const validator = new MedicalComplianceValidator();
  validator.validate();
}

module.exports = { MedicalComplianceValidator };
