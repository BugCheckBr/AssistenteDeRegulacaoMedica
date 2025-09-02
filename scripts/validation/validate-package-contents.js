#!/usr/bin/env node

/**
 * Package Contents Validation Script
 * Ensures extension packages only contain necessary files
 *
 * Medical Extension Compliance:
 * - No development files
 * - No test files
 * - No documentation files
 * - No configuration files
 * - Only production-ready extension files
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files that SHOULD be in the extension package
const REQUIRED_FILES = [
  'manifest.json',
  'background.js',
  'content-script.js',
  'sidebar.js',
  'sidebar.html',
  'options.js',
  'options.html',
  'help.js',
  'help.html',
  'api.js',
  'store.js',
  'utils.js',
  'renderers.js',
  'ErrorHandler.js',
  'field-config.js',
  'filter-config.js',
  'KeepAliveManager.js',
  'SectionManager.js',
  'TimelineManager.js',
  'browser-polyfill.js',
  'ui/patient-card.js',
  'ui/search.js',
  'icons/icon16.png',
  'icons/icon48.png',
  'icons/icon128.png',
  'dist/output.css',
];

// Files/patterns that should NEVER be in the package
const FORBIDDEN_PATTERNS = [
  // Documentation files
  /\.md$/i,
  /readme/i,
  /changelog/i,
  /license/i,

  // Test files
  /test.*\.js$/i,
  /.*\.test\.js$/i,
  /.*\.spec\.js$/i,
  /debug.*\.js$/i,

  // Configuration files
  /package\.json$/i,
  /package-lock\.json$/i,
  /\.babelrc/i,
  /babel\.config/i,
  /eslint\.config/i,
  /tailwind\.config/i,
  /postcss\.config/i,

  // Build/development files
  /webpack/i,
  /\.env$/i,
  /\.gitignore$/i,

  // Backup files
  /\.backup$/i,
  /\.bak$/i,

  // IDE files
  /\.vscode/i,
  /\.idea/i,

  // Temporary files
  /\.tmp$/i,
  /\.temp$/i,
  /newtestoutput/i,
  /testunitouput/i,

  // Development directories
  /^src\//i,
  /^test\//i,
  /^scripts\//i,
  /^config\//i,
  /^coverage\//i,
  /^docs\//i,
  /^\.backup\//i,
  /^\.refactor-tests\//i,
  /^test-backup/i,
];

// Directories that should NEVER be in the package
const FORBIDDEN_DIRECTORIES = [
  'node_modules',
  'src',
  'test',
  'scripts',
  'config',
  'coverage',
  'docs',
  '.git',
  '.vscode',
  '.github',
  '.husky',
  '.backup',
  '.refactor-tests',
  'dist-zips',
  'security',
];

async function extractZip(zipPath, extractPath) {
  const AdmZip = await import('adm-zip');
  const zip = new AdmZip.default(zipPath);
  zip.extractAllTo(extractPath, true);
}

async function validatePackageContents(zipPath, browserName) {
  console.log(`\n🔍 Validating ${browserName} package: ${path.basename(zipPath)}`);

  if (!(await fs.pathExists(zipPath))) {
    console.error(`❌ Package not found: ${zipPath}`);
    return false;
  }

  const tempDir = path.join(path.dirname(zipPath), `temp-validate-${browserName}`);

  try {
    // Clean up any existing temp directory
    if (await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }

    // Extract package
    await extractZip(zipPath, tempDir);

    // Get all files in the package
    const allFiles = await getAllFiles(tempDir);
    const relativeFiles = allFiles.map((file) => path.relative(tempDir, file).replace(/\\/g, '/'));

    console.log(`📦 Package contains ${relativeFiles.length} files`);

    let hasErrors = false;

    // Check for forbidden files
    console.log('\n🚫 Checking for forbidden files...');
    const forbiddenFiles = [];

    for (const file of relativeFiles) {
      // Check forbidden patterns
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(file)) {
          forbiddenFiles.push(file);
          break;
        }
      }

      // Check forbidden directories
      const firstDir = file.split('/')[0];
      if (FORBIDDEN_DIRECTORIES.includes(firstDir)) {
        forbiddenFiles.push(file);
      }
    }

    if (forbiddenFiles.length > 0) {
      console.error(`❌ Found ${forbiddenFiles.length} forbidden files:`);
      forbiddenFiles.forEach((file) => console.error(`   - ${file}`));
      hasErrors = true;
    } else {
      console.log('✅ No forbidden files found');
    }

    // Check for required files
    console.log('\n📋 Checking for required files...');
    const missingFiles = [];

    for (const requiredFile of REQUIRED_FILES) {
      if (!relativeFiles.includes(requiredFile)) {
        missingFiles.push(requiredFile);
      }
    }

    if (missingFiles.length > 0) {
      console.error(`❌ Missing ${missingFiles.length} required files:`);
      missingFiles.forEach((file) => console.error(`   - ${file}`));
      hasErrors = true;
    } else {
      console.log('✅ All required files present');
    }

    // Check package size
    const stats = await fs.stat(zipPath);
    const sizeKB = Math.round(stats.size / 1024);
    const maxSizeKB = 200; // Reasonable limit for medical extension

    console.log(`\n📏 Package size: ${sizeKB} KB`);
    if (sizeKB > maxSizeKB) {
      console.warn(`⚠️ Package size (${sizeKB} KB) exceeds recommended limit (${maxSizeKB} KB)`);
      console.warn('   Consider optimizing or removing unnecessary files');
    } else {
      console.log(`✅ Package size within limits (< ${maxSizeKB} KB)`);
    }

    // Clean up
    await fs.remove(tempDir);

    if (!hasErrors) {
      console.log(`\n✅ ${browserName} package validation passed!`);
    } else {
      console.log(`\n❌ ${browserName} package validation failed!`);
    }

    return !hasErrors;
  } catch (error) {
    console.error(`❌ Error validating ${browserName} package:`, error.message);

    // Clean up on error
    if (await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }

    return false;
  }
}

async function getAllFiles(dir) {
  const files = [];
  const items = await fs.readdir(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stats = await fs.stat(fullPath);

    if (stats.isDirectory()) {
      const subFiles = await getAllFiles(fullPath);
      files.push(...subFiles);
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

async function main() {
  console.log('🏥 Medical Extension Package Contents Validation');
  console.log('================================================');

  const projectRoot = path.resolve(__dirname, '../../');
  const distZipsDir = path.join(projectRoot, 'dist-zips');

  if (!(await fs.pathExists(distZipsDir))) {
    console.error('❌ dist-zips directory not found. Run npm run package:all first.');
    process.exit(1);
  }

  // Find all package files
  const files = await fs.readdir(distZipsDir);
  const packageFiles = files.filter(
    (file) => file.endsWith('.zip') && file.includes('AssistenteDeRegulacao')
  );

  if (packageFiles.length === 0) {
    console.error('❌ No extension packages found. Run npm run package:all first.');
    process.exit(1);
  }

  console.log(`Found ${packageFiles.length} packages to validate\n`);

  let allPassed = true;

  for (const packageFile of packageFiles) {
    const zipPath = path.join(distZipsDir, packageFile);
    let browserName = 'unknown';

    if (packageFile.includes('chrome')) browserName = 'Chrome';
    else if (packageFile.includes('firefox')) browserName = 'Firefox';
    else if (packageFile.includes('edge')) browserName = 'Edge';

    const passed = await validatePackageContents(zipPath, browserName);
    if (!passed) {
      allPassed = false;
    }
  }

  console.log('\n================================================');
  if (allPassed) {
    console.log('🎉 All packages passed validation!');
    console.log('✅ Extension packages are clean and production-ready');
    process.exit(0);
  } else {
    console.log('❌ Some packages failed validation');
    console.log('🔧 Please fix the issues above before deploying');
    process.exit(1);
  }
}

// Handle missing adm-zip dependency gracefully
try {
  await main();
} catch (error) {
  if (error.code === 'ERR_MODULE_NOT_FOUND' && error.message.includes('adm-zip')) {
    console.log('📦 Installing required dependency: adm-zip');
    const { execSync } = await import('child_process');
    execSync('npm install --save-dev adm-zip', { stdio: 'inherit' });
    console.log('✅ Dependency installed. Re-running validation...\n');
    await main();
  } else {
    throw error;
  }
}
