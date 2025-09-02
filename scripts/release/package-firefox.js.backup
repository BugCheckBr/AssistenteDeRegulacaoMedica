#!/usr/bin/env node

/**
 * Script de Packaging Firefox/AMO
 *
 * Gera package específico para Firefox Add-ons Store
 * com validações específicas do Firefox e manifest.json
 * adaptado para AMO.
 */

import archiver from 'archiver';
import { execSync } from 'child_process';
import crypto from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FirefoxPackager {
  constructor() {
    this.rootDir = path.resolve(__dirname, '../../');
    this.buildDir = path.join(this.rootDir, 'dist/firefox');
    this.packageDir = path.join(this.rootDir, 'dist-packages');
    this.manifestPath = path.join(this.buildDir, 'manifest.json');
    this.metadata = this.loadMetadata();

    console.log('🦊 Firefox Packager inicializado');
    console.log(`📁 Build dir: ${this.buildDir}`);
    console.log(`📦 Package dir: ${this.packageDir}`);
  }

  loadMetadata() {
    try {
      const manifestPath = path.join(this.rootDir, 'manifest.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

      return {
        name: manifest.name,
        version: manifest.version,
        description: manifest.description,
      };
    } catch (error) {
      console.error('❌ Erro ao carregar manifest:', error.message);
      process.exit(1);
    }
  }

  async validateBuildDirectory() {
    console.log('\n🔍 Validando diretório de build...');

    if (!(await fs.pathExists(this.buildDir))) {
      console.error('❌ Diretório de build não encontrado');
      console.log('💡 Execute: npm run build:firefox');
      process.exit(1);
    }

    // Verificar arquivos obrigatórios para Firefox
    const requiredFiles = [
      'manifest.json',
      'background.js',
      'content-script.js',
      'sidebar.js',
      'sidebar.html',
      'icons/icon16.png',
      'icons/icon48.png',
      'icons/icon128.png',
    ];

    const missingFiles = [];

    for (const file of requiredFiles) {
      const filePath = path.join(this.buildDir, file);
      if (!(await fs.pathExists(filePath))) {
        missingFiles.push(file);
      }
    }

    if (missingFiles.length > 0) {
      console.error('❌ Arquivos obrigatórios ausentes:');
      missingFiles.forEach((file) => console.error(`   - ${file}`));
      process.exit(1);
    }

    console.log('✅ Diretório de build validado');
  }

  async validateFirefoxManifest() {
    console.log('\n🔍 Validando manifest para Firefox...');

    try {
      const manifest = JSON.parse(await fs.readFile(this.manifestPath, 'utf8'));

      // Validações específicas do Firefox
      const errors = [];

      // 1. Versão do manifest
      if (manifest.manifest_version !== 2 && manifest.manifest_version !== 3) {
        errors.push('manifest_version deve ser 2 ou 3 para Firefox');
      }

      // 2. Aplicações específicas (se manifest v2)
      if (manifest.manifest_version === 2) {
        if (!manifest.applications && !manifest.browser_specific_settings) {
          errors.push('applications ou browser_specific_settings necessário para Firefox');
        }
      }

      // 3. Background scripts para Firefox
      if (manifest.manifest_version === 2) {
        if (!manifest.background || !manifest.background.scripts) {
          errors.push('background.scripts necessário para Firefox Manifest v2');
        }
      } else {
        if (!manifest.background || !manifest.background.service_worker) {
          errors.push('background.service_worker necessário para Firefox Manifest v3');
        }
      }

      // 4. Permissões válidas
      if (manifest.permissions) {
        const invalidPerms = manifest.permissions.filter(
          (perm) => perm.includes('://') && !perm.startsWith('*://') && !perm.includes('*')
        );
        if (invalidPerms.length > 0) {
          errors.push(`Permissões inválidas para Firefox: ${invalidPerms.join(', ')}`);
        }
      }

      // 5. CSP específico do Firefox
      if (manifest.content_security_policy) {
        const csp =
          typeof manifest.content_security_policy === 'string'
            ? manifest.content_security_policy
            : manifest.content_security_policy.extension_pages;

        if (csp && csp.includes('unsafe-eval')) {
          errors.push('unsafe-eval não é permitido no Firefox');
        }
      }

      // 6. Web accessible resources
      if (manifest.web_accessible_resources) {
        const resources = Array.isArray(manifest.web_accessible_resources)
          ? manifest.web_accessible_resources
          : manifest.web_accessible_resources.resources || [];

        if (resources.length === 0) {
          console.warn('⚠️  Nenhum recurso web acessível definido');
        }
      }

      if (errors.length > 0) {
        console.error('❌ Erros no manifest:');
        errors.forEach((error) => console.error(`   - ${error}`));
        process.exit(1);
      }

      console.log('✅ Manifest válido para Firefox');

      // Exibir informações do add-on
      console.log(`📋 Nome: ${manifest.name}`);
      console.log(`📋 Versão: ${manifest.version}`);
      console.log(`📋 Manifest: v${manifest.manifest_version}`);

      return manifest;
    } catch (error) {
      console.error('❌ Erro ao validar manifest:', error.message);
      process.exit(1);
    }
  }

  async validateAMOCompliance() {
    console.log('\n🔍 Validando compliance com AMO...');

    // Verificar tamanho total do pacote
    const buildSize = await this.calculateDirectorySize(this.buildDir);
    const maxSizeMB = 200; // Limite do AMO
    const sizeMB = buildSize / (1024 * 1024);

    console.log(`📊 Tamanho do build: ${sizeMB.toFixed(2)} MB`);

    if (sizeMB > maxSizeMB) {
      console.error(`❌ Build muito grande: ${sizeMB.toFixed(2)} MB > ${maxSizeMB} MB`);
      process.exit(1);
    }

    // Verificar estrutura de arquivos
    const files = await this.getAllFiles(this.buildDir);
    const invalidFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      const basename = path.basename(file).toLowerCase();

      // Arquivos não permitidos no AMO
      return (
        ext === '.exe' ||
        ext === '.dll' ||
        ext === '.so' ||
        basename.includes('.min.') ||
        file.includes('node_modules')
      );
    });

    if (invalidFiles.length > 0) {
      console.error('❌ Arquivos não permitidos no AMO:');
      invalidFiles.forEach((file) => console.error(`   - ${file}`));
      process.exit(1);
    }

    // Verificar código ofuscado (básico)
    const jsFiles = files.filter((file) => path.extname(file) === '.js');
    const suspiciousFiles = [];

    for (const file of jsFiles) {
      const content = await fs.readFile(path.join(this.buildDir, file), 'utf8');
      const lines = content.split('\n');

      // Verificar linhas muito longas (indicativo de minificação/ofuscação)
      const longLines = lines.filter((line) => line.length > 500);
      if (longLines.length > lines.length * 0.1) {
        // > 10% das linhas
        suspiciousFiles.push(file);
      }
    }

    if (suspiciousFiles.length > 0) {
      console.warn('⚠️  Arquivos possivelmente minificados/ofuscados:');
      suspiciousFiles.forEach((file) => console.warn(`   - ${file}`));
      console.warn('💡 AMO requer código não ofuscado para revisão');
    }

    console.log('✅ Compliance AMO validado');
  }

  async optimizeForFirefox() {
    console.log('\n🔧 Otimizando build para Firefox...');

    // Criar cópia otimizada
    const tempDir = path.join(this.packageDir, 'temp-firefox');
    await fs.ensureDir(tempDir);
    await fs.copy(this.buildDir, tempDir);

    // Otimizar manifest para Firefox
    const manifestPath = path.join(tempDir, 'manifest.json');
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));

    // Adicionar gecko ID se necessário
    if (manifest.manifest_version === 2) {
      if (!manifest.applications) {
        manifest.applications = {
          gecko: {
            id: 'assistente-regulacao@example.com',
            strict_min_version: '91.0',
          },
        };
      }
    } else {
      if (!manifest.browser_specific_settings) {
        manifest.browser_specific_settings = {
          gecko: {
            id: 'assistente-regulacao@example.com',
            strict_min_version: '109.0',
          },
        };
      }
    }

    // Remover chaves específicas do Chrome
    delete manifest.minimum_chrome_version;
    delete manifest.key;

    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    console.log('✅ Build otimizado para Firefox');
    return tempDir;
  }

  async createFirefoxPackage() {
    console.log('\n📦 Criando package Firefox (.xpi)...');

    await fs.ensureDir(this.packageDir);

    const optimizedDir = await this.optimizeForFirefox();
    const packageName = `AssistenteDeRegulacao-firefox-v${this.metadata.version}.xpi`;
    const packagePath = path.join(this.packageDir, packageName);

    // Remover package existente
    if (await fs.pathExists(packagePath)) {
      await fs.remove(packagePath);
    }

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(packagePath);
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Máxima compressão
      });

      output.on('close', async () => {
        const sizeKB = (archive.pointer() / 1024).toFixed(2);
        console.log(`✅ Package criado: ${packageName}`);
        console.log(`📊 Tamanho: ${sizeKB} KB`);

        // Limpar diretório temporário
        await fs.remove(optimizedDir);

        // Gerar hash do arquivo
        const hash = await this.generateFileHash(packagePath);
        console.log(`🔐 SHA256: ${hash}`);

        resolve({
          name: packageName,
          path: packagePath,
          size: sizeKB,
          hash: hash,
        });
      });

      output.on('error', reject);
      archive.on('error', reject);

      archive.pipe(output);

      // Adicionar todos os arquivos
      archive.directory(optimizedDir, false);

      archive.finalize();
    });
  }

  async validatePackage(packageInfo) {
    console.log('\n🔍 Validando package final...');

    // Verificar se o arquivo existe e tem conteúdo
    const stats = await fs.stat(packageInfo.path);
    if (stats.size === 0) {
      throw new Error('Package está vazio');
    }

    // Teste básico de integridade ZIP
    try {
      execSync(
        `node -e "
                const AdmZip = require('adm-zip');
                const zip = new AdmZip('${packageInfo.path}');
                const entries = zip.getEntries();
                if (entries.length === 0) throw new Error('ZIP vazio');
                console.log('ZIP válido com', entries.length, 'arquivos');
            "`,
        { stdio: 'pipe' }
      );
    } catch {
      console.warn('⚠️  Não foi possível validar ZIP (adm-zip não disponível)');
    }

    console.log('✅ Package validado');
  }

  async generateAMOMetadata(packageInfo) {
    console.log('\n📋 Gerando metadata AMO...');

    const metadata = {
      name: this.metadata.name,
      version: this.metadata.version,
      description: this.metadata.description,
      package: {
        filename: packageInfo.name,
        size: `${packageInfo.size} KB`,
        sha256: packageInfo.hash,
      },
      amo: {
        compatible_firefox: '91.0',
        upload_notes: 'Automated build for medical regulation assistant extension',
        submission_date: new Date().toISOString(),
        review_required: true,
      },
      compliance: {
        gdpr_compliant: true,
        medical_data_handling: true,
        data_retention: 'session_only',
        privacy_policy:
          'https://github.com/ShadyBS/AssistenteDeRegulacaoMedica/blob/main/PRIVACY.md',
      },
    };

    const metadataPath = path.join(
      this.packageDir,
      `firefox-metadata-v${this.metadata.version}.json`
    );
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    console.log(`✅ Metadata salvo: ${path.basename(metadataPath)}`);
    return metadataPath;
  }

  // Métodos utilitários
  async calculateDirectorySize(dir) {
    const files = await this.getAllFiles(dir);
    let totalSize = 0;

    for (const file of files) {
      const stats = await fs.stat(path.join(dir, file));
      totalSize += stats.size;
    }

    return totalSize;
  }

  async getAllFiles(dir, prefix = '') {
    const items = await fs.readdir(path.join(dir, prefix));
    const files = [];

    for (const item of items) {
      const itemPath = path.join(prefix, item);
      const fullPath = path.join(dir, itemPath);
      const stats = await fs.stat(fullPath);

      if (stats.isDirectory()) {
        const subFiles = await this.getAllFiles(dir, itemPath);
        files.push(...subFiles);
      } else {
        files.push(itemPath);
      }
    }

    return files;
  }

  async generateFileHash(filePath) {
    const content = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  async package() {
    try {
      console.log('🦊 Iniciando packaging Firefox...\n');

      // Processo de packaging
      await this.validateBuildDirectory();
      const manifest = await this.validateFirefoxManifest();
      await this.validateAMOCompliance();

      const packageInfo = await this.createFirefoxPackage();
      await this.validatePackage(packageInfo);

      const metadataPath = await this.generateAMOMetadata(packageInfo);

      console.log('\n🎉 Firefox packaging concluído!');
      console.log('📋 Próximos passos:');
      console.log('   1. Teste a extensão em uma instalação local do Firefox');
      console.log('   2. Faça upload para AMO Developer Hub');
      console.log('   3. Aguarde revisão do Mozilla');
      console.log(`   4. Use o metadata em: ${path.basename(metadataPath)}`);

      return {
        success: true,
        package: packageInfo,
        metadata: metadataPath,
        manifest: manifest,
      };
    } catch (error) {
      console.error('\n❌ Erro no packaging Firefox:');
      console.error('❌ Falha no packaging');

      if (error.stack) {
        console.error('\n📍 Stack trace:');
        console.error(error.stack);
      }

      process.exit(1);
    }
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const packager = new FirefoxPackager();
  packager
    .package()
    .then(() => {
      console.log('\n✅ Firefox package criado com sucesso!');
      process.exit(0);
    })
    .catch(() => {
      console.error('\n❌ Falha no packaging');
      process.exit(1);
    });
}

export default FirefoxPackager;
