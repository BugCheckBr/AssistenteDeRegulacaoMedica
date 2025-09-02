/**
 * Manifest Validation Script for Browser Extension
 * Validates Manifest V3 compliance, permissions, and browser compatibility
 */

import Ajv from 'ajv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

class ManifestValidator {
  constructor() {
    this.ajv = new Ajv({ allErrors: true });
    this.manifestV3Schema = this.loadManifestV3Schema();
    this.errors = [];
    this.warnings = [];
  }

  loadManifestV3Schema() {
    return {
      type: 'object',
      required: ['manifest_version', 'name', 'version'],
      properties: {
        manifest_version: { const: 3 },
        name: { type: 'string', minLength: 1, maxLength: 132 },
        version: {
          type: 'string',
          pattern: '^[0-9]+\\.[0-9]+\\.[0-9]+$',
        },
        description: { type: 'string', maxLength: 10000 },
        permissions: {
          type: 'array',
          items: { type: 'string' },
        },
        host_permissions: {
          type: 'array',
          items: { type: 'string' },
        },
        content_security_policy: {
          type: 'object',
          properties: {
            extension_pages: { type: 'string' },
          },
        },
        background: {
          type: 'object',
          properties: {
            service_worker: { type: 'string' },
            scripts: {
              type: 'array',
              items: { type: 'string' },
            },
            type: { enum: ['module'] },
          },
        },
        content_scripts: {
          type: 'array',
          items: {
            type: 'object',
            required: ['matches'],
            properties: {
              matches: {
                type: 'array',
                minItems: 1,
                items: { type: 'string' },
              },
              js: {
                type: 'array',
                items: { type: 'string' },
              },
            },
          },
        },
        icons: {
          type: 'object',
          properties: {
            16: { type: 'string' },
            48: { type: 'string' },
            128: { type: 'string' },
          },
        },
      },
    };
  }

  async validateManifest(manifestPath) {
    console.log(`🔍 Validating manifest: ${manifestPath}`);

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

      // Schema validation
      const isValid = this.ajv.validate(this.manifestV3Schema, manifest);
      if (!isValid) {
        this.ajv.errors.forEach((error) => {
          this.addError(`Schema validation: ${error.instancePath} ${error.message}`);
        });
      }

      // Specific validations
      this.validatePermissions(manifest);
      this.validateIcons(manifest);
      this.validateContentScripts(manifest);
      this.validateWebAccessibleResources(manifest);
      this.validateContentSecurityPolicy(manifest);
      this.validateBackgroundScript(manifest);
      this.validateBrowserCompatibility(manifest);
      this.validateMedicalDataCompliance(manifest);

      return this.errors.length === 0;
    } catch (error) {
      this.addError(`Validation error: ${error.message}`);
      return false;
    }
  }

  validatePermissions(manifest) {
    const dangerousPermissions = [
      '<all_urls>',
      'tabs',
      'history',
      'bookmarks',
      'cookies',
      'debugger',
      'nativeMessaging',
      'privacy',
    ];

    const permissions = [...(manifest.permissions || []), ...(manifest.host_permissions || [])];

    // Check for dangerous permissions
    const dangerous = permissions.filter((p) => dangerousPermissions.some((dp) => p.includes(dp)));

    if (dangerous.length > 0) {
      dangerous.forEach((perm) => {
        this.addWarning(`Potentially dangerous permission: ${perm}`);
      });
    }

    // Validate medical data specific permissions
    const requiredPermissions = ['storage', 'scripting'];
    const missingRequired = requiredPermissions.filter((req) => !permissions.includes(req));

    if (missingRequired.length > 0) {
      missingRequired.forEach((perm) => {
        this.addError(`Missing required permission: ${perm}`);
      });
    }

    // Check host permissions for SIGSS
    const hostPermissions = manifest.host_permissions || [];
    const hasSigssPermission = hostPermissions.some(
      (host) => host.includes('sigss') || host.includes('<all_urls>')
    );

    if (!hasSigssPermission) {
      this.addError('Missing SIGSS host permission for medical system integration');
    }
  }

  validateIcons(manifest) {
    if (!manifest.icons) {
      this.addError('Missing icons object');
      return;
    }

    const requiredSizes = ['16', '48', '128'];
    const availableSizes = Object.keys(manifest.icons);
    const missingSizes = requiredSizes.filter((size) => !availableSizes.includes(size));

    if (missingSizes.length > 0) {
      missingSizes.forEach((size) => {
        this.addError(`Missing required icon size: ${size}`);
      });
    }

    // Validate icon file paths
    Object.entries(manifest.icons).forEach(([, iconPathRel]) => {
      const iconPath = this.resolveIconPath(iconPathRel);
      if (!fs.existsSync(iconPath)) {
        this.addError(`Icon file not found: ${iconPathRel}`);
      }
    });
  }

  validateContentScripts(manifest) {
    if (!manifest.content_scripts) {
      this.addWarning('No content scripts defined');
      return;
    }

    manifest.content_scripts.forEach((script, index) => {
      if (!script.matches || script.matches.length === 0) {
        this.addError(`Content script ${index}: missing or empty matches array`);
      }

      if (!script.js || script.js.length === 0) {
        this.addWarning(`Content script ${index}: no JavaScript files specified`);
      }

      // Validate SIGSS-specific patterns
      const hasSigssMatch = script.matches.some((match) => match.includes('sigss'));

      if (!hasSigssMatch) {
        this.addWarning(`Content script ${index}: no SIGSS-specific match patterns`);
      }

      // Validate script files exist
      if (script.js) {
        script.js.forEach((jsFile) => {
          const scriptPath = this.resolveScriptPath(jsFile);
          if (!fs.existsSync(scriptPath)) {
            this.addError(`Content script file not found: ${jsFile}`);
          }
        });
      }
    });
  }

  validateWebAccessibleResources(manifest) {
    if (!manifest.web_accessible_resources) {
      return; // Optional for this extension
    }

    // Validate new Manifest V3 format
    if (Array.isArray(manifest.web_accessible_resources)) {
      manifest.web_accessible_resources.forEach((resource, index) => {
        if (!resource.resources || !Array.isArray(resource.resources)) {
          this.addError(`Web accessible resource ${index}: missing or invalid resources array`);
        }

        if (!resource.matches || !Array.isArray(resource.matches)) {
          this.addError(`Web accessible resource ${index}: missing or invalid matches array`);
        }
      });
    } else {
      this.addError('Web accessible resources must be an array in Manifest V3');
    }
  }

  validateContentSecurityPolicy(manifest) {
    const csp = manifest.content_security_policy;

    if (!csp) {
      this.addWarning('No Content Security Policy defined');
      return;
    }

    if (!csp.extension_pages) {
      this.addError('Missing extension_pages CSP directive');
      return;
    }

    const extensionCSP = csp.extension_pages;

    // Check for unsafe directives
    const unsafeDirectives = ["'unsafe-eval'", "'unsafe-inline'", 'data:', "'unsafe-hashes'"];

    unsafeDirectives.forEach((directive) => {
      if (extensionCSP.includes(directive)) {
        this.addWarning(`Potentially unsafe CSP directive: ${directive}`);
      }
    });

    // Validate required directives
    if (!extensionCSP.includes("script-src 'self'")) {
      this.addError("CSP must include script-src 'self'");
    }

    if (!extensionCSP.includes("object-src 'self'")) {
      this.addError("CSP must include object-src 'self'");
    }

    // Medical data compliance - ensure secure connections
    if (!extensionCSP.includes('https:') && extensionCSP.includes('http:')) {
      this.addWarning('CSP allows HTTP connections - consider HTTPS only for medical data');
    }
  }

  validateBackgroundScript(manifest) {
    const background = manifest.background;

    if (!background) {
      this.addWarning('No background script defined');
      return;
    }

    if (background.persistent === true) {
      this.addError('Manifest V3 does not support persistent background scripts');
    }

    if (!background.type || background.type !== 'module') {
      this.addError('Background script must use type: "module" in Manifest V3');
    }

    // Check for service_worker (Manifest V3) or scripts (legacy)
    if (background.service_worker) {
      // Validate service worker file exists
      const scriptPath = this.resolveScriptPath(background.service_worker);
      if (!fs.existsSync(scriptPath)) {
        this.addError(`Background service worker file not found: ${background.service_worker}`);
      }
    } else if (background.scripts && background.scripts.length > 0) {
      // Validate background script files exist
      background.scripts.forEach((scriptFile) => {
        const scriptPath = this.resolveScriptPath(scriptFile);
        if (!fs.existsSync(scriptPath)) {
          this.addError(`Background script file not found: ${scriptFile}`);
        }
      });
    } else {
      this.addError('Background script files not specified (missing service_worker or scripts)');
    }
  }

  validateBrowserCompatibility(manifest) {
    // Check for Firefox-specific settings
    if (manifest.browser_specific_settings?.gecko) {
      const gecko = manifest.browser_specific_settings.gecko;
      if (!gecko.id) {
        this.addError('Firefox requires an extension ID in browser_specific_settings.gecko.id');
      }
    }

    // Check for Chrome-specific features
    if (manifest.sidebar_action && !manifest.action) {
      this.addWarning('sidebar_action requires action in Chrome');
    }

    // Validate permissions compatibility
    const permissions = manifest.permissions || [];
    const chromeOnlyPermissions = ['clipboardWrite', 'alarms'];
    // const firefoxOnlyPermissions = ['nativeMessaging'];

    chromeOnlyPermissions.forEach((perm) => {
      if (permissions.includes(perm)) {
        this.addWarning(`Permission '${perm}' may not be supported in all browsers`);
      }
    });
  }

  validateMedicalDataCompliance(manifest) {
    // Medical data specific validations
    const permissions = [...(manifest.permissions || []), ...(manifest.host_permissions || [])];

    // Check for privacy-sensitive permissions
    const privacyPermissions = ['tabs', 'history', 'cookies', 'identity'];
    const hasPrivacyPermissions = permissions.some((p) => privacyPermissions.includes(p));

    if (hasPrivacyPermissions) {
      this.addWarning(
        'Extension requests privacy-sensitive permissions - ensure GDPR/LGPD compliance'
      );
    }

    // Validate CSP for secure medical data handling
    const csp = manifest.content_security_policy?.extension_pages;
    if (csp && csp.includes('http:') && !csp.includes('https:')) {
      this.addError('Medical extensions should use HTTPS for secure data transmission');
    }

    // Check for proper content script isolation
    const contentScripts = manifest.content_scripts || [];
    contentScripts.forEach((script, index) => {
      if (script.all_frames === true) {
        this.addWarning(
          `Content script ${index}: all_frames=true may expose medical data in iframes`
        );
      }
    });
  }

  resolveIconPath(iconPath) {
    const scriptDir = path.dirname(fileURLToPath(import.meta.url));
    const rootDir = path.resolve(scriptDir, '..', '..');
    return path.resolve(rootDir, iconPath);
  }

  resolveScriptPath(scriptPath) {
    const scriptDir = path.dirname(fileURLToPath(import.meta.url));
    const rootDir = path.resolve(scriptDir, '..', '..');
    return path.resolve(rootDir, scriptPath);
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
    console.log('\n📊 Validation Results:');
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
      console.log('🎉 No issues found! Manifest is valid.');
    }
  }
}

// Main execution
async function main() {
  const validator = new ManifestValidator();

  // Get root directory - handle both local and CI environments
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const rootDir = path.resolve(scriptDir, '..', '..');

  console.log(`📁 Script directory: ${scriptDir}`);
  console.log(`📁 Root directory: ${rootDir}`);

  // Validate main manifest
  const mainManifestPath = path.join(rootDir, 'manifest.json');
  console.log(`📄 Looking for manifest at: ${mainManifestPath}`);
  const isMainValid = await validator.validateManifest(mainManifestPath);

  // Validate Edge-specific manifest if it exists
  const edgeManifestPath = path.join(rootDir, 'manifest-edge.json');
  let isEdgeValid = true;

  if (fs.existsSync(edgeManifestPath)) {
    console.log('\n🌐 Validating Edge-specific manifest...');
    isEdgeValid = await validator.validateManifest(edgeManifestPath);
  }

  // Print results
  validator.printResults();

  // Exit with appropriate code
  const isValid = isMainValid && isEdgeValid;
  if (isValid) {
    console.log('\n✅ All manifests are valid!');
    process.exit(0);
  } else {
    console.log('\n❌ Manifest validation failed!');
    process.exit(1);
  }
}

// Run if called directly
const isMainModule =
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url.endsWith(process.argv[1]) ||
  process.argv[1].endsWith('validate-manifest.js');

if (isMainModule) {
  main().catch((error) => {
    console.error('❌ Validation script failed:', error);
    process.exit(1);
  });
}

export { ManifestValidator };
