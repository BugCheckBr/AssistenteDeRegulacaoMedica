#!/usr/bin/env node

/**
 * Performance validation for Assistente de Regulação Médica
 * Checks bundle sizes and performance metrics
 */

import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_BUNDLE_SIZE = 500 * 1024; // 500KB
const MAX_CSS_SIZE = 100 * 1024; // 100KB

function checkFileSize(filePath, maxSize, label) {
  if (!fs.existsSync(filePath)) {
    console.log(chalk.yellow(`⚠️  ${label}: File not found - ${filePath}`));
    return true; // Not critical
  }

  const stats = fs.statSync(filePath);
  const sizeKB = Math.round(stats.size / 1024);
  const maxKB = Math.round(maxSize / 1024);

  if (stats.size > maxSize) {
    console.log(chalk.red(`❌ ${label}: ${sizeKB}KB exceeds ${maxKB}KB limit`));
    return false;
  } else {
    console.log(chalk.green(`✅ ${label}: ${sizeKB}KB (within ${maxKB}KB limit)`));
    return true;
  }
}

function validateBundleSizes() {
  console.log(chalk.blue('\n📊 Checking bundle sizes...\n'));

  const browsers = ['chrome', 'firefox', 'edge'];
  let allValid = true;

  for (const browser of browsers) {
    console.log(chalk.cyan(`\n${browser.toUpperCase()} Distribution:`));

    const distDir = path.join(__dirname, '..', '..', 'dist', browser);

    if (!fs.existsSync(distDir)) {
      console.log(chalk.yellow(`⚠️  ${browser}: Distribution not found`));
      continue;
    }

    // Check main bundles
    const mainBundles = ['common.js', 'sidebar.js', 'background.js', 'options.js'];

    for (const bundle of mainBundles) {
      const bundlePath = path.join(distDir, bundle);
      const isValid = checkFileSize(bundlePath, MAX_BUNDLE_SIZE, `${bundle}`);
      if (!isValid) allValid = false;
    }

    // Check CSS
    fs.readdirSync(distDir)
      .filter((file) => file.endsWith('.css'))
      .forEach((cssFile) => {
        const cssPath = path.join(distDir, cssFile);
        const isValid = checkFileSize(cssPath, MAX_CSS_SIZE, `${cssFile}`);
        if (!isValid) allValid = false;
      });
  }

  return allValid;
}

function validateMemoryUsage() {
  console.log(chalk.blue('\n🧠 Memory usage validation...\n'));

  // Check for potential memory leaks in source code
  const sourceFiles = ['sidebar.js', 'background.js', 'content-script.js'];

  let hasIssues = false;

  for (const file of sourceFiles) {
    const filePath = path.join(__dirname, '..', '..', file);

    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, 'utf8');

    // Check for common memory leak patterns
    const patterns = [
      {
        pattern: /setInterval\(/g,
        message: 'Potential memory leak: setInterval without clearInterval',
      },
      {
        pattern: /addEventListener\(/g,
        message: 'Potential memory leak: addEventListener without removeEventListener',
      },
      {
        pattern: /new MutationObserver\(/g,
        message: 'Potential memory leak: MutationObserver without disconnect',
      },
    ];

    for (const { pattern, message } of patterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 2) {
        // Allow a few instances
        console.log(chalk.yellow(`⚠️  ${file}: ${message} (${matches.length} instances)`));
        hasIssues = true;
      }
    }
  }

  if (!hasIssues) {
    console.log(chalk.green('✅ No obvious memory leak patterns detected'));
  }

  return !hasIssues;
}

function main() {
  console.log(chalk.blue('🚀 Performance Validation'));
  console.log(chalk.gray('Checking bundle sizes and performance metrics\n'));

  const bundleValidation = validateBundleSizes();
  const memoryValidation = validateMemoryUsage();

  console.log(chalk.blue('\n📋 Performance Summary:'));

  if (bundleValidation && memoryValidation) {
    console.log(chalk.green('✅ All performance checks passed!'));
    process.exit(0);
  } else {
    console.log(chalk.red('❌ Performance validation failed'));
    console.log(chalk.yellow('\n💡 Recommendations:'));
    console.log('  • Use code splitting for large bundles');
    console.log('  • Implement lazy loading for UI components');
    console.log('  • Review event listeners and intervals cleanup');
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { validateBundleSizes, validateMemoryUsage };
