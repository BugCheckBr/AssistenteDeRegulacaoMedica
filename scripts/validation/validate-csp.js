/**
 * Content Security Policy (CSP) Validation Script for Browser Extension
 * Validates CSP compliance for medical data security and Manifest V3 requirements
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

class CSPValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.requiredDirectives = ["script-src 'self'", "object-src 'self'"];
    this.unsafeDirectives = [
      "'unsafe-eval'",
      "'unsafe-inline'",
      "'unsafe-hashes'",
      'data:',
      'blob:',
    ];
    this.medicalSecurityDirectives = [
      'connect-src https:',
      "img-src 'self' https:",
      "style-src 'self' 'unsafe-inline'",
    ];
  }

  async validateCSP(manifestPath) {
    console.log(`🛡️ Validating CSP in: ${manifestPath}`);

    try {
      // Check if file exists
      if (!fs.existsSync(manifestPath)) {
        this.addError(`Manifest file not found: ${manifestPath}`);
        return false;
      }

      // Read and parse manifest
      const manifestContent = fs.readFileSync(manifestPath, 'utf8');
      let manifest;

      try {
        manifest = JSON.parse(manifestContent);
      } catch (parseError) {
        this.addError(`Invalid JSON in manifest: ${parseError.message}`);
        return false;
      }

      // Validate CSP configuration
      this.validateCSPStructure(manifest);
      this.validateExtensionPagesCSP(manifest);
      this.validateSecurityDirectives(manifest);
      this.validateMedicalDataSecurity(manifest);
      this.validateManifestV3Compliance(manifest);

      return this.errors.length === 0;
    } catch (error) {
      this.addError(`Validation error: ${error.message}`);
      return false;
    }
  }

  validateCSPStructure(manifest) {
    const csp = manifest.content_security_policy;

    if (!csp) {
      this.addWarning('No Content Security Policy defined - consider adding for enhanced security');
      return;
    }

    // Validate Manifest V3 structure
    if (typeof csp === 'string') {
      this.addError('CSP must be an object in Manifest V3, not a string');
      return;
    }

    if (!csp.extension_pages) {
      this.addError('Missing extension_pages CSP directive - required in Manifest V3');
      return;
    }

    // Check for deprecated sandbox directive
    if (csp.sandbox) {
      this.addWarning('Sandbox CSP directive is deprecated in Manifest V3');
    }

    console.log(`✅ CSP structure validated`);
  }

  validateExtensionPagesCSP(manifest) {
    const csp = manifest.content_security_policy;
    if (!csp || !csp.extension_pages) return;

    const extensionCSP = csp.extension_pages;
    console.log(`🔍 Analyzing extension_pages CSP: ${extensionCSP}`);

    // Validate required directives
    this.requiredDirectives.forEach((directive) => {
      if (!extensionCSP.includes(directive)) {
        this.addError(`Missing required CSP directive: ${directive}`);
      }
    });

    // Check for unsafe directives
    this.unsafeDirectives.forEach((directive) => {
      if (extensionCSP.includes(directive)) {
        if (directive === "'unsafe-inline'" && extensionCSP.includes('style-src')) {
          this.addWarning(
            `CSP contains ${directive} - acceptable for styles but avoid for scripts`
          );
        } else {
          this.addWarning(`Potentially unsafe CSP directive: ${directive}`);
        }
      }
    });

    // Validate script-src specifically
    this.validateScriptSrc(extensionCSP);

    console.log(`✅ Extension pages CSP validated`);
  }

  validateScriptSrc(cspString) {
    const scriptSrcMatch = cspString.match(/script-src\s+([^;]+)/);
    if (!scriptSrcMatch) {
      this.addError('Missing script-src directive in CSP');
      return;
    }

    const scriptSrc = scriptSrcMatch[1].trim();
    const sources = scriptSrc.split(/\s+/);

    // Must include 'self'
    if (!sources.includes("'self'")) {
      this.addError("script-src must include 'self'");
    }

    // Check for unsafe sources
    const unsafeSources = ["'unsafe-eval'", "'unsafe-inline'"];
    unsafeSources.forEach((unsafe) => {
      if (sources.includes(unsafe)) {
        this.addError(
          `script-src contains unsafe directive: ${unsafe} - not allowed in Manifest V3`
        );
      }
    });

    // Check for external domains
    const externalDomains = sources.filter(
      (source) =>
        !source.startsWith("'") &&
        !source.startsWith('chrome-extension:') &&
        !source.startsWith('moz-extension:')
    );

    if (externalDomains.length > 0) {
      externalDomains.forEach((domain) => {
        this.addWarning(
          `External domain in script-src: ${domain} - ensure it's necessary and trusted`
        );
      });
    }

    console.log(`✅ script-src directive validated: ${sources.length} sources found`);
  }

  validateSecurityDirectives(manifest) {
    const csp = manifest.content_security_policy;
    if (!csp || !csp.extension_pages) return;

    const extensionCSP = csp.extension_pages;

    // Validate object-src
    if (!extensionCSP.includes('object-src')) {
      this.addWarning('Consider adding object-src directive for enhanced security');
    } else if (
      !extensionCSP.includes("object-src 'self'") &&
      !extensionCSP.includes("object-src 'none'")
    ) {
      this.addWarning("object-src should be set to 'self' or 'none' for security");
    }

    // Validate img-src for medical images
    if (extensionCSP.includes('img-src')) {
      if (extensionCSP.includes('img-src *') || extensionCSP.includes('img-src data:')) {
        this.addWarning(
          'img-src allows all sources - consider restricting for medical data security'
        );
      }
    }

    // Validate connect-src for API calls
    if (extensionCSP.includes('connect-src')) {
      if (extensionCSP.includes('connect-src *')) {
        this.addWarning(
          'connect-src allows all connections - consider restricting to specific medical APIs'
        );
      }

      // Check for HTTP connections in medical context
      // Note: SIGSS may require HTTP connections, so this is allowed but warned
      if (
        extensionCSP.includes('connect-src http:') &&
        !extensionCSP.includes('connect-src https:')
      ) {
        this.addWarning(
          'connect-src allows only HTTP - consider adding HTTPS support for enhanced security'
        );
      }
    }

    console.log(`✅ Security directives validated`);
  }

  validateMedicalDataSecurity(manifest) {
    const csp = manifest.content_security_policy;
    if (!csp || !csp.extension_pages) return;

    const extensionCSP = csp.extension_pages;

    // Medical data specific validations
    const medicalSecurityChecks = [
      {
        check: () => extensionCSP.includes('connect-src'),
        message: 'Consider adding connect-src directive to control API access',
        type: 'warning',
      },
      {
        check: () => !extensionCSP.includes("'unsafe-eval'"),
        message: "CSP contains 'unsafe-eval' - prohibited for medical data security",
        type: 'error',
      },
    ];

    // Check if both HTTP and HTTPS are supported (ideal for SIGSS compatibility)
    if (extensionCSP.includes('connect-src http:') && extensionCSP.includes('connect-src https:')) {
      console.log('✅ CSP supports both HTTP and HTTPS connections for SIGSS compatibility');
    } else if (extensionCSP.includes('connect-src http:')) {
      this.addWarning(
        'CSP allows HTTP connections - required for SIGSS but consider HTTPS when possible'
      );
    }

    medicalSecurityChecks.forEach(({ check, message, type }) => {
      if (!check()) {
        if (type === 'error') {
          this.addError(message);
        } else {
          this.addWarning(message);
        }
      }
    });

    // Check for SIGSS-specific domains
    const hasSigssAccess =
      extensionCSP.includes('sigss') ||
      extensionCSP.includes('*://*/sigss/*') ||
      extensionCSP.includes('connect-src http:') ||
      extensionCSP.includes('connect-src https:');

    if (!hasSigssAccess) {
      this.addWarning('CSP may not allow connections to SIGSS - verify medical system access');
    }

    console.log(`✅ Medical data security validated`);
  }

  validateManifestV3Compliance(manifest) {
    const csp = manifest.content_security_policy;
    if (!csp) return;

    // Check for Manifest V2 patterns
    if (typeof csp === 'string') {
      this.addError('CSP format is Manifest V2 style - must be object in V3');
      return;
    }

    // Validate required V3 structure
    const requiredKeys = ['extension_pages'];
    const missingKeys = requiredKeys.filter((key) => !csp[key]);

    if (missingKeys.length > 0) {
      missingKeys.forEach((key) => {
        this.addError(`Missing required CSP key for Manifest V3: ${key}`);
      });
    }

    // Check for deprecated keys
    const deprecatedKeys = ['content_scripts', 'sandbox'];
    const foundDeprecated = deprecatedKeys.filter((key) => csp[key]);

    if (foundDeprecated.length > 0) {
      foundDeprecated.forEach((key) => {
        this.addWarning(`Deprecated CSP key in Manifest V3: ${key}`);
      });
    }

    // Validate extension_pages CSP format
    if (csp.extension_pages && typeof csp.extension_pages !== 'string') {
      this.addError('extension_pages CSP must be a string');
    }

    console.log(`✅ Manifest V3 compliance validated`);
  }

  addError(message) {
    this.errors.push(message);
    console.error(`❌ Error: ${message}`);
  }

  addWarning(message) {
    this.warnings.push(message);
    console.warn(`⚠️ Warning: ${message}`);
  }

  printResults() {
    console.log('\n📊 CSP Validation Results:');
    console.log(`✅ Errors: ${this.errors.length}`);
    console.log(`⚠️ Warnings: ${this.warnings.length}`);

    if (this.errors.length > 0) {
      console.log('\n❌ Errors found:');
      this.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      this.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('🎉 No issues found! CSP is properly configured.');
    }
  }
}

// Main execution
async function main() {
  const validator = new CSPValidator();

  // Get root directory
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const rootDir = path.resolve(scriptDir, '..', '..');

  console.log(`📁 Script directory: ${scriptDir}`);
  console.log(`📁 Root directory: ${rootDir}`);

  // Validate main manifest
  const mainManifestPath = path.join(rootDir, 'manifest.json');
  console.log(`📄 Looking for manifest at: ${mainManifestPath}`);
  const isMainValid = await validator.validateCSP(mainManifestPath);

  // Validate Edge-specific manifest if it exists
  const edgeManifestPath = path.join(rootDir, 'manifest-edge.json');
  let isEdgeValid = true;

  if (fs.existsSync(edgeManifestPath)) {
    console.log('\n🌐 Validating Edge-specific manifest CSP...');
    isEdgeValid = await validator.validateCSP(edgeManifestPath);
  }

  // Print results
  validator.printResults();

  // Exit with appropriate code
  const isValid = isMainValid && isEdgeValid;
  if (isValid) {
    console.log('\n✅ All CSP configurations are valid!');
    process.exit(0);
  } else {
    console.log('\n❌ CSP validation failed!');
    process.exit(1);
  }
}

// Run if called directly
const isMainModule =
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url.endsWith(process.argv[1]) ||
  process.argv[1].endsWith('validate-csp.js');

if (isMainModule) {
  main().catch((error) => {
    console.error('❌ CSP validation script failed:', error);
    process.exit(1);
  });
}

export { CSPValidator };
