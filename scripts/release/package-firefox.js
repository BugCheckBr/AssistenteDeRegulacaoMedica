import archiver from 'archiver';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function packageFirefox() {
  console.log('🦊 Starting Firefox packaging...');

  const srcDir = path.resolve(__dirname, '../../');
  const outputDir = path.resolve(__dirname, '../../dist-zips');

  // Files and patterns to ignore - comprehensive list for clean extension package
  const FILES_TO_IGNORE = [
    // Build and development directories
    'dist-zips',
    'src',
    'node_modules',
    'config',
    'coverage',
    'dist',
    'scripts',
    'test',
    'security',
    'docs',
    '.backup',
    '.refactor-tests',
    'test-backup-20250803-115056',

    // Configuration files
    '.env',
    '.gitignore',
    '.git',
    '.vscode',
    'package-lock.json',
    'package.json',
    'tailwind.config.js',
    'eslint.config.js',
    'postcss.config.cjs',
    '.babelrc.cjs',
    'babel.config.cjs',

    // Documentation and markdown files
    'README.md',
    'CHANGELOG.md',
    'agents.md',
    'PIPELINE_SUMMARY.md',
    'AUDITORIA_FUNCIONAL_PROMPT.md',
    'AUTO_MODE_CLARIFICATION.md',
    'AUTOLOAD_FIX_SUMMARY.md',
    'EXTENSION_AUDIT_REPORT_EXEMPLO.md',
    'FINAL_AUTO_MODE_ANALYSIS.md',
    'MANIFEST_CORRECTION_SUMMARY.md',
    'MANIFEST_REMOVAL_SUMMARY.md',
    'PROMPT_AUDITORIA_EXECUTAVEL.md',
    'RESUMO_ENTREGA_PROMPT.md',
    'TASK_COMPLETION_SUMMARY.md',

    // Test and debug files
    'debug-autoload.js',
    'debug-connection.js',
    'debug-storage.js',
    'test-autoload-fix-validation.js',
    'test-autoload-fix.js',
    'test-autoload.js',
    'test-independent-autoload-validation.js',
    'store-test-methods.js',
    'ErrorHandler-Demo.js',
    'newtestoutput.txt',
    'testunitouput.txt',

    // Backup and temporary files
    'manifest-edge.json.backup',
    'manifest-firefox.json.backup',
    'manifest.json.backup',

    // IDE and tool configuration
    '.docs',
    '.copilot-instructions',
    '.github',
    '.htmlhintignore',
    '.htmlhintrc',
    '.husky',
    '.misc',
    '.prettierignore',
    '.prettierrc',
    '.qodo',
    '.stylelintrc.json',
    'AssistenteDeRegulacao.code-workspace',
  ];

  const manifest = await fs.readJson(path.join(srcDir, 'manifest-firefox.json'));
  const version = manifest.version;

  console.log(`📋 Version: ${version}`);

  await fs.ensureDir(outputDir);

  const zipPath = path.join(outputDir, `AssistenteDeRegulacao-firefox-v${version}.zip`);

  // Remove existing file if exists
  if (await fs.pathExists(zipPath)) {
    await fs.remove(zipPath);
  }

  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      console.log(`✅ Firefox package created: ${zipPath}`);
      console.log(`   Size: ${(archive.pointer() / 1024).toFixed(2)} KB`);
      resolve();
    });

    archive.on('error', reject);
    archive.pipe(output);

    (async () => {
      try {
        console.log('📁 Adding files to archive...');
        const files = await fs.readdir(srcDir);

        for (const file of files) {
          if (FILES_TO_IGNORE.includes(file)) continue;

          // Skip manifest files - will be added specifically
          const lowerCaseFile = file.toLowerCase();
          if (
            lowerCaseFile === 'manifest.json' ||
            lowerCaseFile === 'manifest-edge.json' ||
            lowerCaseFile === 'manifest-firefox.json'
          )
            continue;

          const filePath = path.join(srcDir, file);
          const stats = await fs.stat(filePath);

          if (stats.isDirectory()) {
            archive.directory(filePath, file);
          } else {
            archive.file(filePath, { name: file });
          }
        }

        // Add Firefox-specific manifest as manifest.json
        archive.file(path.join(srcDir, 'manifest-firefox.json'), { name: 'manifest.json' });

        // Add compiled CSS if exists
        const cssPath = path.join(srcDir, 'dist', 'output.css');
        if (await fs.pathExists(cssPath)) {
          archive.file(cssPath, { name: 'dist/output.css' });
          console.log('📎 Added compiled CSS');
        }

        archive.finalize();
      } catch (error) {
        reject(error);
      }
    })();
  });
}

console.log('🚀 Firefox packaging script starting...');
packageFirefox().catch((error) => {
  console.error('❌ Firefox packaging failed:', error);
  process.exit(1);
});
