/**
 * Security Validation Script for Browser Extension
 * Validates security compliance, CSP, permissions, and medical data protection
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class SecurityValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.securityIssues = [];
  }

  async validateSecurity() {
    console.log('🔒 Starting security validation...');

    try {
      await this.validateManifestSecurity();
      await this.validateScriptSecurity();
      await this.validateCSPSecurity();
      await this.validatePermissionSecurity();
      await this.validateMedicalDataSecurity();
      await this.validateDependencySecurity();
      await this.validateFileIntegrity();

      return this.errors.length === 0;
    } catch (error) {
      this.addError(`Security validation failed: ${error.message}`);
      return false;
    }
  }

  async validateManifestSecurity() {
    console.log('🔍 Validating manifest security...');

    const rootDir = path.resolve(__dirname, '..', '..');
    const manifestPath = path.join(rootDir, 'manifest.json');

    if (!fs.existsSync(manifestPath)) {
      this.addError('Manifest file not found');
      return;
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    // Check for dangerous permissions
    const dangerousPermissions = [
      '<all_urls>',
      'debugger',
      'nativeMessaging',
      'privacy',
      'system.cpu',
      'system.memory',
      'system.storage',
    ];

    const allPermissions = [...(manifest.permissions || []), ...(manifest.host_permissions || [])];

    dangerousPermissions.forEach((dangerous) => {
      if (allPermissions.includes(dangerous)) {
        this.addSecurityIssue(`High risk permission detected: ${dangerous}`, 'HIGH');
      }
    });

    // Check for overly broad host permissions
    const hostPermissions = manifest.host_permissions || [];
    hostPermissions.forEach((host) => {
      if (host === '<all_urls>' || host === '*://*/*') {
        this.addSecurityIssue('Overly broad host permission detected', 'HIGH');
      } else if (host.includes('*://*/')) {
        this.addSecurityIssue(`Broad host permission: ${host}`, 'MEDIUM');
      }
    });

    // Validate content script security
    const contentScripts = manifest.content_scripts || [];
    contentScripts.forEach((script, index) => {
      if (script.all_frames === true) {
        this.addSecurityIssue(
          `Content script ${index} runs in all frames - potential security risk`,
          'MEDIUM'
        );
      }

      if (script.run_at === 'document_start') {
        this.addSecurityIssue(
          `Content script ${index} runs at document_start - ensure input validation`,
          'LOW'
        );
      }
    });
  }

  async validateScriptSecurity() {
    console.log('📜 Validating script security...');

    const rootDir = path.resolve(__dirname, '..', '..');
    const scriptFiles = [
      'background.js',
      'sidebar.js',
      'content-script.js',
      'api.js',
      'store.js',
      'utils.js',
    ];

    for (const scriptFile of scriptFiles) {
      const scriptPath = path.join(rootDir, scriptFile);

      if (fs.existsSync(scriptPath)) {
        await this.analyzeScriptSecurity(scriptPath);
      }
    }
  }

  async analyzeScriptSecurity(scriptPath) {
    const content = fs.readFileSync(scriptPath, 'utf8');
    const filename = path.basename(scriptPath);

    // Check for dangerous patterns
    const dangerousPatterns = [
      {
        pattern: /eval\s*\(/g,
        message: 'Use of eval() detected - potential XSS vulnerability',
        severity: 'HIGH',
      },
      {
        pattern: /innerHTML\s*=/g,
        message: 'Use of innerHTML detected - potential XSS vulnerability',
        severity: 'MEDIUM',
      },
      {
        pattern: /document\.write\s*\(/g,
        message: 'Use of document.write() detected - potential XSS vulnerability',
        severity: 'MEDIUM',
      },
      {
        pattern: /setTimeout\s*\(\s*['"][^'"]*['"],/g,
        message: 'setTimeout with string argument - potential code injection',
        severity: 'HIGH',
      },
      {
        pattern: /setInterval\s*\(\s*['"][^'"]*['"],/g,
        message: 'setInterval with string argument - potential code injection',
        severity: 'HIGH',
      },
      {
        pattern: /\$\{[^}]*\}/g,
        message: 'Template literal interpolation - ensure input validation',
        severity: 'LOW',
      },
      {
        pattern: /window\.\w+\s*=/g,
        message: 'Global variable assignment - potential pollution',
        severity: 'LOW',
      },
    ];

    dangerousPatterns.forEach(({ pattern, message, severity }) => {
      const matches = content.match(pattern);
      if (matches) {
        this.addSecurityIssue(`${filename}: ${message} (${matches.length} occurrences)`, severity);
      }
    });

    // Check for hardcoded secrets
    const secretPatterns = [
      /api[_-]?key['\s]*[:=]['\s]*[a-zA-Z0-9]{20,}/gi,
      /secret['\s]*[:=]['\s]*[a-zA-Z0-9]{20,}/gi,
      /password['\s]*[:=]['\s]*[a-zA-Z0-9]{8,}/gi,
      /token['\s]*[:=]['\s]*[a-zA-Z0-9]{20,}/gi,
    ];

    secretPatterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        this.addSecurityIssue(`${filename}: Potential hardcoded secret detected`, 'HIGH');
      }
    });

    // Check for console.log with sensitive data patterns
    const logPattern =
      /console\.(log|warn|error|info)\s*\([^)]*(?:cpf|password|token|key|secret|auth)[^)]*\)/gi;
    const logMatches = content.match(logPattern);
    if (logMatches) {
      this.addSecurityIssue(`${filename}: Potential sensitive data logging detected`, 'MEDIUM');
    }

    // Medical data specific patterns
    const medicalPatterns = [
      /cpf['\s]*[:=]/gi,
      /cnpj['\s]*[:=]/gi,
      /sus['\s]*[:=]/gi,
      /cns['\s]*[:=]/gi,
      /prontuario['\s]*[:=]/gi,
    ];

    medicalPatterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches && content.includes('console.log')) {
        this.addSecurityIssue(`${filename}: Potential medical data exposure in logs`, 'HIGH');
      }
    });
  }

  async validateCSPSecurity() {
    console.log('🛡️ Validating Content Security Policy...');

    const rootDir = path.resolve(__dirname, '..', '..');
    const manifestPath = path.join(rootDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    const csp = manifest.content_security_policy;

    if (!csp) {
      this.addSecurityIssue('No Content Security Policy defined', 'HIGH');
      return;
    }

    const extensionCSP = csp.extension_pages || '';

    // Check for unsafe CSP directives
    const unsafeDirectives = [
      { directive: "'unsafe-eval'", severity: 'HIGH' },
      { directive: "'unsafe-inline'", severity: 'HIGH' },
      { directive: "'unsafe-hashes'", severity: 'MEDIUM' },
      { directive: 'data:', severity: 'MEDIUM' },
      { directive: '*', severity: 'HIGH' },
    ];

    unsafeDirectives.forEach(({ directive, severity }) => {
      if (extensionCSP.includes(directive)) {
        this.addSecurityIssue(`Unsafe CSP directive detected: ${directive}`, severity);
      }
    });

    // Check for missing required directives
    const requiredDirectives = ["script-src 'self'", "object-src 'self'"];

    requiredDirectives.forEach((directive) => {
      if (!extensionCSP.includes(directive)) {
        this.addSecurityIssue(`Missing required CSP directive: ${directive}`, 'MEDIUM');
      }
    });

    // Medical data compliance - check for secure connections
    if (extensionCSP.includes('http:') && !extensionCSP.includes('https:')) {
      this.addSecurityIssue('CSP allows HTTP connections for medical data extension', 'HIGH');
    }
  }

  async validatePermissionSecurity() {
    console.log('🔑 Validating permission security...');

    const rootDir = path.resolve(__dirname, '..', '..');
    const manifestPath = path.join(rootDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    const permissions = manifest.permissions || [];
    const hostPermissions = manifest.host_permissions || [];

    // Check permission minimization principle
    const allPermissions = [...permissions, ...hostPermissions];

    if (allPermissions.length > 10) {
      this.addSecurityIssue(
        `Large number of permissions (${allPermissions.length}) - review if all are necessary`,
        'MEDIUM'
      );
    }

    // Check for privacy-sensitive permissions with medical context
    const privacyPermissions = ['tabs', 'history', 'cookies', 'identity'];
    const hasPrivacyPermissions = permissions.some((p) => privacyPermissions.includes(p));

    if (hasPrivacyPermissions) {
      this.addSecurityIssue(
        'Privacy-sensitive permissions detected - ensure GDPR/LGPD compliance',
        'MEDIUM'
      );
    }

    // Validate host permissions scope
    hostPermissions.forEach((host) => {
      if (!host.includes('sigss') && !host.includes('localhost') && !host.includes('127.0.0.1')) {
        this.addSecurityIssue(`Unusual host permission for medical extension: ${host}`, 'MEDIUM');
      }
    });
  }

  async validateMedicalDataSecurity() {
    console.log('🏥 Validating medical data security...');

    const rootDir = path.resolve(__dirname, '..', '..');

    // Check for GDPR/LGPD compliance indicators
    const apiPath = path.join(rootDir, 'api.js');
    if (fs.existsSync(apiPath)) {
      const apiContent = fs.readFileSync(apiPath, 'utf8');

      // Check for data anonymization
      if (!apiContent.includes('sanitize') && !apiContent.includes('anonymize')) {
        this.addSecurityIssue('No data sanitization detected in API module', 'HIGH');
      }

      // Check for encryption
      if (!apiContent.includes('encrypt') && !apiContent.includes('crypto')) {
        this.addSecurityIssue('No encryption detected for medical data handling', 'HIGH');
      }

      // Check for secure storage
      if (apiContent.includes('localStorage') && !apiContent.includes('storage.session')) {
        this.addSecurityIssue('Use of localStorage for potentially sensitive data', 'MEDIUM');
      }
    }

    // Check store.js for secure state management
    const storePath = path.join(rootDir, 'store.js');
    if (fs.existsSync(storePath)) {
      const storeContent = fs.readFileSync(storePath, 'utf8');

      if (storeContent.includes('cpf') || storeContent.includes('sus')) {
        if (!storeContent.includes('sanitize') && !storeContent.includes('redact')) {
          this.addSecurityIssue('Medical identifiers in store without sanitization', 'HIGH');
        }
      }
    }
  }

  async validateDependencySecurity() {
    console.log('📦 Validating dependency security...');

    const rootDir = path.resolve(__dirname, '..', '..');
    const packagePath = path.join(rootDir, 'package.json');

    if (!fs.existsSync(packagePath)) {
      this.addWarning('package.json not found');
      return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const dependencies = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {}),
    };

    // Check for known vulnerable packages
    const vulnerablePackages = [
      'lodash', // versions < 4.17.21
      'moment', // deprecated
      'request', // deprecated
      'node-sass', // deprecated
    ];

    Object.keys(dependencies).forEach((dep) => {
      if (vulnerablePackages.includes(dep)) {
        this.addSecurityIssue(`Potentially vulnerable dependency: ${dep}`, 'MEDIUM');
      }
    });

    // Check for excessive dependencies
    const depCount = Object.keys(dependencies).length;
    if (depCount > 50) {
      this.addSecurityIssue(
        `Large number of dependencies (${depCount}) increases attack surface`,
        'LOW'
      );
    }
  }

  async validateFileIntegrity() {
    console.log('🔒 Validating file integrity...');

    const rootDir = path.resolve(__dirname, '..', '..');
    const criticalFiles = ['manifest.json', 'background.js', 'content-script.js', 'sidebar.js'];

    const checksums = {};

    criticalFiles.forEach((file) => {
      const filePath = path.join(rootDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath);
        const hash = crypto.createHash('sha256').update(content).digest('hex');
        checksums[file] = hash;
        console.log(`✅ ${file}: ${hash.substring(0, 16)}...`);
      }
    });

    // Save checksums for future verification
    const checksumPath = path.join(rootDir, '.security-checksums.json');
    fs.writeFileSync(checksumPath, JSON.stringify(checksums, null, 2));

    console.log('💾 File integrity checksums saved');
  }

  addSecurityIssue(message, severity) {
    const issue = { message, severity, timestamp: new Date().toISOString() };
    this.securityIssues.push(issue);

    if (severity === 'HIGH') {
      this.addError(message);
      console.error(`🚨 HIGH: ${message}`);
    } else if (severity === 'MEDIUM') {
      this.addWarning(message);
      console.warn(`⚠️ MEDIUM: ${message}`);
    } else {
      console.log(`ℹ️ LOW: ${message}`);
    }
  }

  addError(message) {
    this.errors.push(message);
  }

  addWarning(message) {
    this.warnings.push(message);
  }

  generateSecurityReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total_issues: this.securityIssues.length,
        high_severity: this.securityIssues.filter((i) => i.severity === 'HIGH').length,
        medium_severity: this.securityIssues.filter((i) => i.severity === 'MEDIUM').length,
        low_severity: this.securityIssues.filter((i) => i.severity === 'LOW').length,
      },
      issues: this.securityIssues,
      recommendations: this.generateRecommendations(),
    };

    const rootDir = path.resolve(__dirname, '..', '..');
    const reportPath = path.join(rootDir, 'security-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`📊 Security report saved to: ${reportPath}`);
    return report;
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.securityIssues.some((i) => i.message.includes('eval'))) {
      recommendations.push('Replace eval() with safer alternatives like JSON.parse()');
    }

    if (this.securityIssues.some((i) => i.message.includes('innerHTML'))) {
      recommendations.push('Use textContent or insertAdjacentHTML instead of innerHTML');
    }

    if (this.securityIssues.some((i) => i.message.includes('medical data'))) {
      recommendations.push('Implement data anonymization and encryption for medical data');
    }

    if (this.securityIssues.some((i) => i.message.includes('CSP'))) {
      recommendations.push('Strengthen Content Security Policy to prevent XSS attacks');
    }

    recommendations.push('Regular security audits and dependency updates');
    recommendations.push('Implement input validation and output encoding');
    recommendations.push('Follow OWASP guidelines for web application security');

    return recommendations;
  }

  printResults() {
    console.log('\n🔒 Security Validation Results:');
    console.log(
      `🚨 High Severity Issues: ${this.securityIssues.filter((i) => i.severity === 'HIGH').length}`
    );
    console.log(
      `⚠️ Medium Severity Issues: ${
        this.securityIssues.filter((i) => i.severity === 'MEDIUM').length
      }`
    );
    console.log(
      `ℹ️ Low Severity Issues: ${this.securityIssues.filter((i) => i.severity === 'LOW').length}`
    );

    if (this.errors.length === 0) {
      console.log('\n✅ No critical security issues found!');
    } else {
      console.log(`\n❌ ${this.errors.length} critical security issues found`);
    }
  }
}

// Main execution
async function main() {
  const validator = new SecurityValidator();
  const isSecure = await validator.validateSecurity();

  // Generate and save security report
  validator.generateSecurityReport();

  // Print results
  validator.printResults();

  // Exit with appropriate code
  if (isSecure) {
    console.log('\n🎉 Security validation passed!');
    process.exit(0);
  } else {
    console.log('\n🚨 Security validation failed - critical issues found!');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Security validation script failed:', error);
    process.exit(1);
  });
}

export { SecurityValidator };
