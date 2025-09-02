import archiver from 'archiver';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function packageEdge() {
  console.log('🔷 Starting Edge packaging...');

  const distDir = path.resolve(__dirname, '../../dist/edge');
  const outputDir = path.resolve(__dirname, '../../dist-zips');

  // Verify edge build exists
  if (!(await fs.pathExists(distDir))) {
    throw new Error('Edge build not found. Run "npm run build:edge" first.');
  }

  const manifest = await fs.readJson(path.join(distDir, 'manifest.json'));
  const version = manifest.version;

  console.log(`📋 Version: ${version}`);

  await fs.ensureDir(outputDir);

  const zipPath = path.join(outputDir, `AssistenteDeRegulacao-edge-v${version}.zip`);

  // Remove existing file if exists
  if (await fs.pathExists(zipPath)) {
    await fs.remove(zipPath);
  }

  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      console.log(`✅ Edge package created: ${zipPath}`);
      console.log(`   Size: ${(archive.pointer() / 1024).toFixed(2)} KB`);
      resolve();
    });

    archive.on('error', reject);
    archive.pipe(output);

    console.log('📁 Adding files to archive...');
    // Add all files from edge dist
    archive.directory(distDir, false);
    archive.finalize();
  });
}

console.log('🚀 Edge packaging script starting...');
packageEdge().catch((error) => {
  console.error('❌ Edge packaging failed:', error);
  process.exit(1);
});
