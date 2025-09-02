/**
 * Universal Build Script for Browser Extension
 * Builds extension for Chrome, Firefox, and Edge with optimizations
 */

import archiver from 'archiver';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class UniversalBuilder {
  constructor() {
    this.rootDir = path.resolve(__dirname, '..', '..');
    this.srcDir = this.rootDir;
    this.distDir = path.join(this.rootDir, 'dist');
    this.tempDir = path.join(this.rootDir, '.temp');
    this.isProduction = process.env.NODE_ENV === 'production';

    this.browsers = {
      chrome: {
        name: 'Chrome',
        manifestFile: 'manifest.json',
        outputDir: path.join(this.distDir, 'chrome'),
        packageExt: '.zip',
      },
      firefox: {
        name: 'Firefox',
        manifestFile: 'manifest-firefox.json',
        outputDir: path.join(this.distDir, 'firefox'),
        packageExt: '.xpi',
      },
      edge: {
        name: 'Edge',
        manifestFile: 'manifest-edge.json',
        outputDir: path.join(this.distDir, 'edge'),
        packageExt: '.zip',
      },
    };
  }

  async buildAll() {
    console.log('🚀 Starting universal build process...');
    console.log(`📦 Environment: ${this.isProduction ? 'Production' : 'Development'}`);

    try {
      // Clean and prepare
      await this.cleanDist();
      await this.prepareBuild();

      // Build for each browser
      for (const [browserKey, browserConfig] of Object.entries(this.browsers)) {
        console.log(`\n🔧 Building ${browserConfig.name} extension...`);
        await this.buildBrowser(browserKey, browserConfig);
      }

      // Generate universal package
      await this.generateUniversalPackage();

      // Generate packages
      if (this.isProduction) {
        await this.generatePackages();
      }

      console.log('\n✅ Universal build completed successfully!');
      await this.printBuildSummary();
    } catch (error) {
      console.error('❌ Build failed:', error);
      process.exit(1);
    }
  }

  async cleanDist() {
    console.log('🧹 Cleaning dist directory...');
    await fs.remove(this.distDir);
    await fs.remove(this.tempDir);
    await fs.ensureDir(this.distDir);
    await fs.ensureDir(this.tempDir);
  }

  async prepareBuild() {
    console.log('📋 Preparing build...');

    // Validate source files
    const requiredFiles = ['manifest.json', 'background.js', 'sidebar.js', 'content-script.js'];

    for (const file of requiredFiles) {
      const filePath = path.join(this.srcDir, file);
      if (!(await fs.pathExists(filePath))) {
        throw new Error(`Required file not found: ${file}`);
      }
    }

    // Check if CSS is built
    const cssPath = path.join(this.srcDir, 'dist', 'output.css');
    if (!(await fs.pathExists(cssPath))) {
      console.log('⚠️ CSS not found, building...');
      await this.buildCSS();
    }
  }

  async buildCSS() {
    const { spawn } = await import('child_process');

    return new Promise((resolve, reject) => {
      const cssProcess = spawn('npm', ['run', 'build:css'], {
        cwd: this.rootDir,
        stdio: 'inherit',
      });

      cssProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ CSS built successfully');
          resolve();
        } else {
          reject(new Error(`CSS build failed with code ${code}`));
        }
      });
    });
  }

  async buildBrowser(browserKey, browserConfig) {
    const { outputDir, manifestFile } = browserConfig;

    // Create browser-specific output directory
    await fs.ensureDir(outputDir);

    // Copy base files
    await this.copyBaseFiles(outputDir);

    // Process manifest for browser
    await this.processManifest(browserKey, manifestFile, outputDir);

    // Apply browser-specific modifications
    await this.applyBrowserSpecificChanges(browserKey, outputDir);

    // Optimize files
    if (this.isProduction) {
      await this.optimizeFiles(outputDir);
    }

    console.log(`✅ ${browserConfig.name} build completed`);
  }

  async copyBaseFiles(outputDir) {
    // Files to copy directly
    const filesToCopy = [
      'background.js',
      'sidebar.js',
      'sidebar.html',
      'content-script.js',
      'api.js',
      'store.js',
      'utils.js',
      'field-config.js',
      'filter-config.js',
      'KeepAliveManager.js',
      'SectionManager.js',
      'TimelineManager.js',
      'renderers.js',
      'browser-polyfill.js',
      'options.html',
      'options.js',
      'help.html',
      'help.js',
    ];

    // Copy files that exist
    for (const file of filesToCopy) {
      const srcFile = path.join(this.srcDir, file);
      if (await fs.pathExists(srcFile)) {
        await fs.copy(srcFile, path.join(outputDir, file));
      }
    }

    // Copy directories
    const dirsToCopy = ['icons', 'ui'];

    for (const dir of dirsToCopy) {
      const srcDir = path.join(this.srcDir, dir);
      if (await fs.pathExists(srcDir)) {
        await fs.copy(srcDir, path.join(outputDir, dir));
      }
    }

    // Copy CSS if exists
    const cssPath = path.join(this.srcDir, 'dist', 'output.css');
    if (await fs.pathExists(cssPath)) {
      await fs.copy(cssPath, path.join(outputDir, 'dist', 'output.css'));
    }
  }

  async processManifest(browserKey, manifestFile, outputDir) {
    let manifestPath = path.join(this.srcDir, manifestFile);

    // Use main manifest if browser-specific doesn't exist
    if (!(await fs.pathExists(manifestPath))) {
      manifestPath = path.join(this.srcDir, 'manifest.json');
    }

    const manifest = await fs.readJson(manifestPath);

    // Apply browser-specific manifest changes
    const processedManifest = await this.applyManifestChanges(browserKey, manifest);

    // Write processed manifest
    await fs.writeJson(path.join(outputDir, 'manifest.json'), processedManifest, { spaces: 2 });
  }

  async applyManifestChanges(browserKey, manifest) {
    const processed = { ...manifest };

    switch (browserKey) {
      case 'firefox':
        // Firefox-specific changes
        if (!processed.browser_specific_settings) {
          processed.browser_specific_settings = {
            gecko: {
              id: 'assistente-regulacao@exemplo.com',
            },
          };
        }

        // Remove Chrome-specific features
        delete processed.sidebar_action;

        // Adjust permissions for Firefox
        if (processed.permissions && processed.permissions.includes('clipboardWrite')) {
          processed.permissions = processed.permissions.filter((p) => p !== 'clipboardWrite');
          processed.permissions.push('clipboardWrite');
        }
        break;

      case 'edge':
        // Edge-specific changes (similar to Chrome but with Edge branding)
        processed.name = processed.name.replace('Assistente', 'Assistente Edge');
        break;

      case 'chrome':
      default:
        // Chrome is the base, no changes needed
        break;
    }

    return processed;
  }

  async applyBrowserSpecificChanges(browserKey, outputDir) {
    switch (browserKey) {
      case 'firefox':
        await this.applyFirefoxChanges(outputDir);
        break;

      case 'edge':
        await this.applyEdgeChanges(outputDir);
        break;

      case 'chrome':
        await this.applyChromeChanges(outputDir);
        break;
    }
  }

  async applyFirefoxChanges(outputDir) {
    // Add Firefox-specific polyfills if needed
    const polyfillContent = `
// Firefox-specific polyfills
if (typeof browser === 'undefined') {
  window.browser = chrome;
}

// Firefox clipboard workaround
if (navigator.userAgent.includes('Firefox')) {
  // Firefox-specific clipboard handling
  const originalClipboard = navigator.clipboard;
  if (!originalClipboard) {
    navigator.clipboard = {
      writeText: async (text) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    };
  }
}
`;

    await fs.writeFile(path.join(outputDir, 'firefox-polyfill.js'), polyfillContent);

    // Update content scripts to include polyfill
    const manifestPath = path.join(outputDir, 'manifest.json');
    const manifest = await fs.readJson(manifestPath);

    if (manifest.content_scripts) {
      manifest.content_scripts.forEach((script) => {
        script.js.unshift('firefox-polyfill.js');
      });

      await fs.writeJson(manifestPath, manifest, { spaces: 2 });
    }
  }

  async applyEdgeChanges(outputDir) {
    // Edge-specific optimizations
    const edgePolyfillContent = `
// Edge-specific polyfills
if (typeof browser === 'undefined') {
  window.browser = chrome;
}

// Edge performance optimizations
if (navigator.userAgent.includes('Edg')) {
  // Edge-specific performance tweaks
  console.log('[Assistente de Regulação] Running on Microsoft Edge');
}
`;

    await fs.writeFile(path.join(outputDir, 'edge-polyfill.js'), edgePolyfillContent);
  }

  async applyChromeChanges(outputDir) {
    // Chrome-specific optimizations
    const chromePolyfillContent = `
// Chrome-specific optimizations
if (typeof browser === 'undefined') {
  window.browser = chrome;
}

// Chrome performance optimizations
if (navigator.userAgent.includes('Chrome')) {
  // Chrome-specific performance tweaks
  console.log('[Assistente de Regulação] Running on Google Chrome');
}
`;

    await fs.writeFile(path.join(outputDir, 'chrome-polyfill.js'), chromePolyfillContent);
  }

  async optimizeFiles(outputDir) {
    console.log('⚡ Optimizing files for production...');

    // Remove development files
    const devFiles = [
      'package.json',
      'package-lock.json',
      'node_modules',
      '.git',
      '.github',
      'src',
      'scripts',
      'config',
      'test',
    ];

    for (const file of devFiles) {
      const filePath = path.join(outputDir, file);
      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
      }
    }

    // Minify CSS if not already minified
    const cssPath = path.join(outputDir, 'dist', 'output.css');
    if (await fs.pathExists(cssPath)) {
      // CSS is already minified by Tailwind
      console.log('✅ CSS already optimized');
    }

    // Remove source maps in production
    const files = await this.getAllFiles(outputDir);
    for (const file of files) {
      if (file.endsWith('.map')) {
        await fs.remove(file);
      }
    }
  }

  async getAllFiles(dir) {
    const files = [];
    const items = await fs.readdir(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        const subFiles = await this.getAllFiles(fullPath);
        files.push(...subFiles);
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  async generateUniversalPackage() {
    console.log('📦 Generating universal package...');

    const universalDir = path.join(this.distDir, 'universal');
    await fs.ensureDir(universalDir);

    // Copy Chrome build as base
    await fs.copy(path.join(this.distDir, 'chrome'), universalDir);

    // Add universal browser detection
    await this.addUniversalCompatibility(universalDir);

    console.log('✅ Universal package generated');
  }

  async addUniversalCompatibility(universalDir) {
    const universalPolyfillContent = `
// Universal browser compatibility layer
(function() {
  'use strict';

  // Detect browser
  const isFirefox = navigator.userAgent.includes('Firefox');
  const isEdge = navigator.userAgent.includes('Edg');
  const isChrome = navigator.userAgent.includes('Chrome') && !isEdge;

  // Browser polyfill
  if (typeof browser === 'undefined') {
    window.browser = chrome;
  }

  // Universal clipboard handling
  const universalClipboard = {
    writeText: async (text) => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        return success ? Promise.resolve() : Promise.reject();
      }
    }
  };

  // Override clipboard if needed
  if (!navigator.clipboard) {
    navigator.clipboard = universalClipboard;
  }

  // Browser-specific initialization
  if (isFirefox) {
    console.log('[Assistente de Regulação] Running on Firefox');
  } else if (isEdge) {
    console.log('[Assistente de Regulação] Running on Edge');
  } else if (isChrome) {
    console.log('[Assistente de Regulação] Running on Chrome');
  }

  // Medical data security wrapper
  window.AssistenteRegulacao = {
    sanitizeData: (data) => {
      // Remove sensitive fields for logging
      if (typeof data === 'object' && data !== null) {
        const sanitized = { ...data };
        const sensitiveFields = ['cpf', 'sus', 'cns', 'password', 'token'];

        sensitiveFields.forEach(field => {
          if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
          }
        });

        return sanitized;
      }
      return data;
    },

    log: (message, data) => {
      if (data) {
        console.log(message, window.AssistenteRegulacao.sanitizeData(data));
      } else {
        console.log(message);
      }
    }
  };

})();
`;

    const polyfillPath = path.join(universalDir, 'universal-polyfill.js');
    await fs.writeFile(polyfillPath, universalPolyfillContent);

    // Update manifest to include universal polyfill
    const manifestPath = path.join(universalDir, 'manifest.json');
    const manifest = await fs.readJson(manifestPath);

    if (manifest.content_scripts) {
      manifest.content_scripts.forEach((script) => {
        script.js.unshift('universal-polyfill.js');
      });
    }

    await fs.writeJson(manifestPath, manifest, { spaces: 2 });
  }

  async generatePackages() {
    console.log('📦 Generating browser packages...');

    const packagesDir = path.join(this.distDir, 'packages');
    await fs.ensureDir(packagesDir);

    for (const [browserKey, browserConfig] of Object.entries(this.browsers)) {
      const { name, outputDir, packageExt } = browserConfig;
      const packageName = `AssistenteDeRegulacao-${browserKey}-v${await this.getVersion()}${packageExt}`;
      const packagePath = path.join(packagesDir, packageName);

      await this.createZipPackage(outputDir, packagePath);
      console.log(`📦 Generated ${name} package: ${packageName}`);
    }
  }

  async createZipPackage(sourceDir, outputPath) {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        console.log(
          `📦 Package created: ${path.basename(outputPath)} (${archive.pointer()} bytes)`
        );
        resolve();
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();
    });
  }

  async getVersion() {
    const manifestPath = path.join(this.srcDir, 'manifest.json');
    const manifest = await fs.readJson(manifestPath);
    return manifest.version;
  }

  async printBuildSummary() {
    console.log('\n📊 Build Summary:');
    console.log('================');

    const version = await this.getVersion();
    console.log(`📦 Version: ${version}`);
    console.log(`🏗️ Environment: ${this.isProduction ? 'Production' : 'Development'}`);

    for (const [, browserConfig] of Object.entries(this.browsers)) {
      const { outputDir } = browserConfig;

      if (await fs.pathExists(outputDir)) {
        const stats = await this.getDirectoryStats(outputDir);
        console.log(
          `${browserConfig.name.padEnd(10)} | ${stats.files} files | ${this.formatBytes(
            stats.size
          )}`
        );
      }
    }

    if (this.isProduction) {
      const packagesDir = path.join(this.distDir, 'packages');
      if (await fs.pathExists(packagesDir)) {
        const packages = await fs.readdir(packagesDir);
        console.log(`\n📦 Generated ${packages.length} packages`);
      }
    }
  }

  async getDirectoryStats(dirPath) {
    let totalSize = 0;
    let fileCount = 0;

    const files = await this.getAllFiles(dirPath);

    for (const file of files) {
      const stats = await fs.stat(file);
      totalSize += stats.size;
      fileCount++;
    }

    return { files: fileCount, size: totalSize };
  }

  formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

// Main execution
async function main() {
  const builder = new UniversalBuilder();
  await builder.buildAll();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Build script failed:', error);
    process.exit(1);
  });
}

export { UniversalBuilder };
