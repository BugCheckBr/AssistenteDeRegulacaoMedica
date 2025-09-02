/**
 * Permissions Validation Script for Browser Extension
 * Validates extension permissions for security and medical data compliance
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

class PermissionsValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.medicalDataPermissions = ['storage', 'scripting', 'contextMenus', 'clipboardWrite'];
    this.dangerousPermissions = [
      '<all_urls>',
      'tabs',
      'history',
      'bookmarks',
      'cookies',
      'debugger',
      'nativeMessaging',
      'privacy',
      'management',
      'identity',
    ];
    this.allowedHostPermissions = [
      '*://*/sigss/*',
      '*://sigss.*/*',
      'https://sigss.*/*',
      'http://sigss.*/*',
    ];
  }

  async validatePermissions(manifestPath) {
    console.log(`🔐 Validating permissions in: ${manifestPath}`);

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

      // Validate permissions
      this.validateBasicPermissions(manifest);
      this.validateHostPermissions(manifest);
      this.validateMedicalDataCompliance(manifest);
      this.validateSecurityPermissions(manifest);
      this.validateCrossOriginPermissions(manifest);

      return this.errors.length === 0;
    } catch (error) {
      this.addError(`Validation error: ${error.message}`);
      return false;
    }
  }

  validateBasicPermissions(manifest) {
    const permissions = manifest.permissions || [];

    // Check for required medical extension permissions
    const missingRequired = this.medicalDataPermissions.filter((req) => !permissions.includes(req));

    if (missingRequired.length > 0) {
      missingRequired.forEach((perm) => {
        if (perm === 'clipboardWrite') {
          this.addWarning(`Missing optional permission: ${perm} (needed for copy functionality)`);
        } else {
          this.addError(`Missing required permission: ${perm}`);
        }
      });
    }

    // Check for unnecessary permissions
    const unnecessaryPermissions = [
      'geolocation',
      'notifications',
      'background',
      'unlimitedStorage',
    ];

    unnecessaryPermissions.forEach((perm) => {
      if (permissions.includes(perm)) {
        this.addWarning(`Potentially unnecessary permission: ${perm}`);
      }
    });

    console.log(`✅ Basic permissions validated: ${permissions.length} permissions found`);
  }

  validateHostPermissions(manifest) {
    const hostPermissions = manifest.host_permissions || [];

    if (hostPermissions.length === 0) {
      this.addError('No host permissions defined - extension needs SIGSS access');
      return;
    }

    // Check for SIGSS-specific permissions
    const hasSigssPermission = hostPermissions.some(
      (host) =>
        host.includes('sigss') ||
        this.allowedHostPermissions.some((allowed) => this.matchesPattern(host, allowed))
    );

    if (!hasSigssPermission) {
      this.addError('Missing SIGSS host permission for medical system integration');
    }

    // Check for overly broad permissions
    const broadPermissions = hostPermissions.filter(
      (host) =>
        host === '<all_urls>' ||
        host === '*://*/*' ||
        host === 'https://*/*' ||
        host === 'http://*/*'
    );

    if (broadPermissions.length > 0) {
      broadPermissions.forEach((perm) => {
        this.addWarning(
          `Overly broad host permission: ${perm} - consider restricting to specific domains`
        );
      });
    }

    console.log(`✅ Host permissions validated: ${hostPermissions.length} host permissions found`);
  }

  validateMedicalDataCompliance(manifest) {
    const allPermissions = [...(manifest.permissions || []), ...(manifest.host_permissions || [])];

    // Check for privacy-sensitive permissions
    const privacyPermissions = this.dangerousPermissions.filter((perm) =>
      allPermissions.some((p) => p.includes(perm))
    );

    if (privacyPermissions.length > 0) {
      privacyPermissions.forEach((perm) => {
        this.addWarning(
          `Privacy-sensitive permission detected: ${perm} - ensure LGPD/GDPR compliance`
        );
      });
    }

    // Validate medical data specific requirements
    const hasStoragePermission = allPermissions.includes('storage');
    const hasScriptingPermission = allPermissions.includes('scripting');

    if (!hasStoragePermission) {
      this.addError('Missing storage permission - required for medical data caching');
    }

    if (!hasScriptingPermission) {
      this.addError('Missing scripting permission - required for SIGSS integration');
    }

    // Check for secure communication requirements
    const hostPermissions = manifest.host_permissions || [];
    const hasHttpPermissions = hostPermissions.some((host) => host.startsWith('http://'));
    const hasHttpsPermissions = hostPermissions.some((host) => host.startsWith('https://'));

    if (hasHttpPermissions && !hasHttpsPermissions) {
      this.addWarning(
        'Extension allows HTTP connections - consider HTTPS only for medical data security'
      );
    }

    console.log(`✅ Medical data compliance validated`);
  }

  validateSecurityPermissions(manifest) {
    const permissions = manifest.permissions || [];

    // Check for dangerous permissions
    const dangerous = permissions.filter((perm) => this.dangerousPermissions.includes(perm));

    if (dangerous.length > 0) {
      dangerous.forEach((perm) => {
        this.addWarning(`Potentially dangerous permission: ${perm} - ensure proper justification`);
      });
    }

    // Check for development-only permissions
    const devPermissions = ['debugger', 'management'];
    const hasDevPermissions = permissions.some((perm) => devPermissions.includes(perm));

    if (hasDevPermissions) {
      this.addError('Development-only permissions detected - remove before production');
    }

    // Validate content script permissions
    const contentScripts = manifest.content_scripts || [];
    contentScripts.forEach((script, index) => {
      if (script.all_frames === true) {
        this.addWarning(
          `Content script ${index}: all_frames=true may expose medical data in iframes`
        );
      }

      if (script.run_at === 'document_start') {
        this.addWarning(
          `Content script ${index}: document_start execution may interfere with page security`
        );
      }
    });

    console.log(`✅ Security permissions validated`);
  }

  validateCrossOriginPermissions(manifest) {
    const hostPermissions = manifest.host_permissions || [];

    // Check for cross-origin access patterns
    const crossOriginPatterns = hostPermissions.filter(
      (host) => host.includes('*') && !host.includes('sigss')
    );

    if (crossOriginPatterns.length > 0) {
      crossOriginPatterns.forEach((pattern) => {
        this.addWarning(
          `Cross-origin permission: ${pattern} - ensure necessary for medical functionality`
        );
      });
    }

    // Validate specific medical system domains
    const medicalDomains = ['sigss', 'cadsus', 'datasus'];

    const hasMedicalDomainAccess = hostPermissions.some((host) =>
      medicalDomains.some((domain) => host.includes(domain))
    );

    if (!hasMedicalDomainAccess) {
      this.addWarning(
        'No medical system domain permissions detected - verify integration requirements'
      );
    }

    console.log(`✅ Cross-origin permissions validated`);
  }

  matchesPattern(permission, pattern) {
    // Simple pattern matching for host permissions
    const permissionRegex = pattern.replace(/\*/g, '.*').replace(/\./g, '\\.');

    return new RegExp(`^${permissionRegex}$`).test(permission);
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
    console.log('\n📊 Permissions Validation Results:');
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
      console.log('🎉 No issues found! Permissions are properly configured.');
    }
  }
}

// Main execution
async function main() {
  const validator = new PermissionsValidator();

  // Get root directory
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const rootDir = path.resolve(scriptDir, '..', '..');

  console.log(`📁 Script directory: ${scriptDir}`);
  console.log(`📁 Root directory: ${rootDir}`);

  // Validate main manifest
  const mainManifestPath = path.join(rootDir, 'manifest.json');
  console.log(`📄 Looking for manifest at: ${mainManifestPath}`);
  const isMainValid = await validator.validatePermissions(mainManifestPath);

  // Validate Edge-specific manifest if it exists
  const edgeManifestPath = path.join(rootDir, 'manifest-edge.json');
  let isEdgeValid = true;

  if (fs.existsSync(edgeManifestPath)) {
    console.log('\n🌐 Validating Edge-specific manifest permissions...');
    isEdgeValid = await validator.validatePermissions(edgeManifestPath);
  }

  // Print results
  validator.printResults();

  // Exit with appropriate code
  const isValid = isMainValid && isEdgeValid;
  if (isValid) {
    console.log('\n✅ All permissions are properly configured!');
    process.exit(0);
  } else {
    console.log('\n❌ Permissions validation failed!');
    process.exit(1);
  }
}

// Run if called directly
const isMainModule =
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url.endsWith(process.argv[1]) ||
  process.argv[1].endsWith('validate-permissions.js');

if (isMainModule) {
  main().catch((error) => {
    console.error('❌ Permissions validation script failed:', error);
    process.exit(1);
  });
}

export { PermissionsValidator };
