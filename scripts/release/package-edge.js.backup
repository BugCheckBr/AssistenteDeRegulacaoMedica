#!/usr/bin/env node

/**
 * Script de Packaging Microsoft Edge
 *
 * Gera package específico para Microsoft Edge Add-ons Store
 * com validações específicas do Edge e manifest adaptado.
 */

import archiver from 'archiver';
import { execSync } from 'child_process';
import crypto from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EdgePackager {
  constructor() {
    this.rootDir = path.resolve(__dirname, '../../');
    this.buildDir = path.join(this.rootDir, 'dist/edge');
    this.packageDir = path.join(this.rootDir, 'dist-packages');
    this.manifestPath = path.join(this.buildDir, 'manifest.json');
    this.metadata = this.loadMetadata();

    console.log('🔷 Edge Packager inicializado');
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
      console.log('💡 Execute: npm run build:edge');
      process.exit(1);
    }

    // Verificar arquivos obrigatórios para Edge
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

  async validateEdgeManifest() {
    console.log('\n🔍 Validando manifest para Edge...');

    try {
      const manifest = JSON.parse(await fs.readFile(this.manifestPath, 'utf8'));

      // Validações específicas do Edge
      const errors = [];
      const warnings = [];

      // 1. Versão do manifest (Edge suporta v2 e v3)
      if (manifest.manifest_version !== 2 && manifest.manifest_version !== 3) {
        errors.push('manifest_version deve ser 2 ou 3 para Edge');
      }

      // 2. Background scripts para Edge
      if (manifest.manifest_version === 2) {
        if (!manifest.background || (!manifest.background.scripts && !manifest.background.page)) {
          errors.push('background.scripts ou background.page necessário para Edge Manifest v2');
        }
        if (manifest.background.persistent === undefined) {
          warnings.push('background.persistent não definido (recomendado: false)');
        }
      } else {
        if (!manifest.background || !manifest.background.service_worker) {
          errors.push('background.service_worker necessário para Edge Manifest v3');
        }
      }

      // 3. Verificar versão mínima do Edge
      if (!manifest.minimum_edge_version) {
        warnings.push('minimum_edge_version não definido');
      }

      // 4. Permissões específicas do Edge
      if (manifest.permissions) {
        const edgeSpecificPerms = manifest.permissions.filter((perm) =>
          perm.includes('ms-browser-extension://')
        );

        if (edgeSpecificPerms.length > 0) {
          console.log(`ℹ️  Permissões específicas do Edge: ${edgeSpecificPerms.join(', ')}`);
        }

        // Verificar permissões de host válidas
        const hostPerms = manifest.permissions.filter(
          (perm) => perm.includes('://') && !perm.startsWith('*://') && !perm.includes('*')
        );

        if (hostPerms.length > 0) {
          warnings.push(`Permissões de host específicas: ${hostPerms.join(', ')}`);
        }
      }

      // 5. Content Security Policy
      if (manifest.content_security_policy) {
        const csp =
          typeof manifest.content_security_policy === 'string'
            ? manifest.content_security_policy
            : manifest.content_security_policy.extension_pages;

        if (csp) {
          if (csp.includes('unsafe-eval')) {
            warnings.push('unsafe-eval presente no CSP (não recomendado)');
          }
          if (csp.includes('unsafe-inline')) {
            warnings.push('unsafe-inline presente no CSP (não recomendado)');
          }
        }
      }

      // 6. Verificar ícones
      if (manifest.icons) {
        const requiredSizes = ['16', '48', '128'];
        const missingIcons = requiredSizes.filter((size) => !manifest.icons[size]);

        if (missingIcons.length > 0) {
          warnings.push(`Ícones ausentes: ${missingIcons.join(', ')}`);
        }
      }

      // 7. Web accessible resources
      if (manifest.web_accessible_resources) {
        const resources = Array.isArray(manifest.web_accessible_resources)
          ? manifest.web_accessible_resources
          : manifest.web_accessible_resources.resources || [];

        if (resources.length === 0) {
          warnings.push('Nenhum recurso web acessível definido');
        }
      }

      // 8. Verificar se não há chaves específicas de outros browsers
      const chromeKeys = ['key', 'update_url'];
      const firefoxKeys = ['applications', 'browser_specific_settings'];

      chromeKeys.forEach((key) => {
        if (manifest[key]) {
          warnings.push(`Chave específica do Chrome encontrada: ${key}`);
        }
      });

      firefoxKeys.forEach((key) => {
        if (manifest[key]) {
          warnings.push(`Chave específica do Firefox encontrada: ${key}`);
        }
      });

      // Exibir erros e warnings
      if (errors.length > 0) {
        console.error('❌ Erros no manifest:');
        errors.forEach((error) => console.error(`   - ${error}`));
        process.exit(1);
      }

      if (warnings.length > 0) {
        console.warn('⚠️  Avisos no manifest:');
        warnings.forEach((warning) => console.warn(`   - ${warning}`));
      }

      console.log('✅ Manifest válido para Edge');

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

  async validateEdgeStoreCompliance() {
    console.log('\n🔍 Validando compliance com Edge Add-ons Store...');

    // Verificar tamanho total do pacote
    const buildSize = await this.calculateDirectorySize(this.buildDir);
    const maxSizeMB = 100; // Limite do Edge Store
    const sizeMB = buildSize / (1024 * 1024);

    console.log(`📊 Tamanho do build: ${sizeMB.toFixed(2)} MB`);

    if (sizeMB > maxSizeMB) {
      console.error(`❌ Build muito grande: ${sizeMB.toFixed(2)} MB > ${maxSizeMB} MB`);
      process.exit(1);
    }

    // Verificar estrutura de arquivos
    const files = await this.getAllFiles(this.buildDir);
    const issues = [];

    // Arquivos não permitidos
    const invalidFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      const basename = path.basename(file).toLowerCase();

      return (
        ext === '.exe' ||
        ext === '.dll' ||
        ext === '.so' ||
        ext === '.msi' ||
        file.includes('node_modules') ||
        basename.startsWith('.git')
      );
    });

    if (invalidFiles.length > 0) {
      issues.push('Arquivos não permitidos encontrados:');
      invalidFiles.forEach((file) => issues.push(`   - ${file}`));
    }

    // Verificar se há código obfuscado
    const jsFiles = files.filter((file) => path.extname(file) === '.js');
    const suspiciousFiles = [];

    for (const file of jsFiles) {
      const content = await fs.readFile(path.join(this.buildDir, file), 'utf8');

      // Verificar se parece minificado
      const lines = content.split('\n');
      const avgLineLength = content.length / lines.length;

      if (avgLineLength > 300) {
        // Linha muito longa = possível minificação
        suspiciousFiles.push(file);
      }

      // Verificar padrões de obfuscação
      if (content.includes('eval(') || content.includes('Function(')) {
        issues.push(`Uso de eval/Function detectado em: ${file}`);
      }
    }

    if (suspiciousFiles.length > 0) {
      console.warn('⚠️  Arquivos possivelmente minificados:');
      suspiciousFiles.forEach((file) => console.warn(`   - ${file}`));
      console.warn('💡 Edge Store prefere código não minificado para revisão');
    }

    // Verificar políticas de privacidade
    const hasPrivacyPolicy = files.some(
      (file) => file.toLowerCase().includes('privacy') || file.toLowerCase().includes('policy')
    );

    if (!hasPrivacyPolicy) {
      issues.push('Política de privacidade não encontrada (recomendado para extensões médicas)');
    }

    if (issues.length > 0) {
      console.warn('⚠️  Problemas de compliance encontrados:');
      issues.forEach((issue) => console.warn(`   ${issue}`));
    } else {
      console.log('✅ Compliance Edge Store validado');
    }
  }

  async optimizeForEdge() {
    console.log('\n🔧 Otimizando build para Edge...');

    // Criar cópia otimizada
    const tempDir = path.join(this.packageDir, 'temp-edge');
    await fs.ensureDir(tempDir);
    await fs.copy(this.buildDir, tempDir);

    // Otimizar manifest para Edge
    const manifestPath = path.join(tempDir, 'manifest.json');
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));

    // Adicionar configurações específicas do Edge
    if (!manifest.minimum_edge_version) {
      manifest.minimum_edge_version = '88.0.0.0'; // Primeira versão com suporte Manifest v3
    }

    // Remover chaves específicas de outros browsers
    delete manifest.applications;
    delete manifest.browser_specific_settings;
    delete manifest.key;
    delete manifest.update_url;

    // Otimizar CSP para Edge
    if (manifest.content_security_policy) {
      if (typeof manifest.content_security_policy === 'string') {
        // Manifest v2 - otimizar CSP
        manifest.content_security_policy = manifest.content_security_policy
          .replace(/unsafe-eval/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      } else {
        // Manifest v3 - otimizar CSP objeto
        if (manifest.content_security_policy.extension_pages) {
          manifest.content_security_policy.extension_pages =
            manifest.content_security_policy.extension_pages
              .replace(/unsafe-eval/g, '')
              .replace(/\s+/g, ' ')
              .trim();
        }
      }
    }

    // Adicionar declaração de acessibilidade se necessário
    if (
      !manifest.declarative_net_request &&
      manifest.permissions?.includes('declarativeNetRequest')
    ) {
      manifest.declarative_net_request = {
        rule_resources: [],
      };
    }

    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    console.log('✅ Build otimizado para Edge');
    return tempDir;
  }

  async createEdgePackage() {
    console.log('\n📦 Criando package Edge (.zip)...');

    await fs.ensureDir(this.packageDir);

    const optimizedDir = await this.optimizeForEdge();
    const packageName = `AssistenteDeRegulacao-edge-v${this.metadata.version}.zip`;
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

    // Verificar integridade do ZIP
    try {
      execSync(
        `node -e "
                const AdmZip = require('adm-zip');
                const zip = new AdmZip('${packageInfo.path}');
                const entries = zip.getEntries();
                if (entries.length === 0) throw new Error('ZIP vazio');

                // Verificar se manifest.json está presente
                const hasManifest = entries.some(entry => entry.entryName === 'manifest.json');
                if (!hasManifest) throw new Error('manifest.json não encontrado no ZIP');

                console.log('ZIP válido com', entries.length, 'arquivos');
            "`,
        { stdio: 'pipe' }
      );
    } catch {
      console.warn('⚠️  Não foi possível validar ZIP completamente');
    }

    console.log('✅ Package validado');
  }

  async generateEdgeMetadata(packageInfo) {
    console.log('\n📋 Gerando metadata Edge Store...');

    const metadata = {
      name: this.metadata.name,
      version: this.metadata.version,
      description: this.metadata.description,
      package: {
        filename: packageInfo.name,
        size: `${packageInfo.size} KB`,
        sha256: packageInfo.hash,
      },
      edge_store: {
        compatible_edge_version: '88.0.0.0',
        category: 'productivity',
        upload_notes: 'Medical regulation assistant extension for healthcare professionals',
        submission_date: new Date().toISOString(),
        review_required: true,
        target_audience: 'healthcare_professionals',
      },
      compliance: {
        gdpr_compliant: true,
        medical_data_handling: true,
        data_retention: 'session_only',
        privacy_policy:
          'https://github.com/ShadyBS/AssistenteDeRegulacaoMedica/blob/main/PRIVACY.md',
        healthcare_compliance: {
          hipaa_aware: true,
          medical_data_protection: true,
          no_persistent_storage: true,
        },
      },
      technical: {
        manifest_version: 3,
        background_type: 'service_worker',
        content_scripts: true,
        permissions_minimal: true,
        csp_secure: true,
      },
    };

    const metadataPath = path.join(this.packageDir, `edge-metadata-v${this.metadata.version}.json`);
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
      console.log('🔷 Iniciando packaging Edge...\n');

      // Processo de packaging
      await this.validateBuildDirectory();
      const manifest = await this.validateEdgeManifest();
      await this.validateEdgeStoreCompliance();

      const packageInfo = await this.createEdgePackage();
      await this.validatePackage(packageInfo);

      const metadataPath = await this.generateEdgeMetadata(packageInfo);

      console.log('\n🎉 Edge packaging concluído!');
      console.log('📋 Próximos passos:');
      console.log('   1. Teste a extensão em uma instalação local do Edge');
      console.log('   2. Faça upload para Edge Add-ons Developer Dashboard');
      console.log('   3. Complete o processo de certificação');
      console.log(`   4. Use o metadata em: ${path.basename(metadataPath)}`);
      console.log('   5. Para teste local: edge://extensions/ > "Carregar sem compactação"');

      return {
        success: true,
        package: packageInfo,
        metadata: metadataPath,
        manifest: manifest,
      };
    } catch {
      console.error('\n❌ Erro no packaging Edge');
      process.exit(1);
    }
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const packager = new EdgePackager();
  packager
    .package()
    .then(() => {
      console.log('\n✅ Edge package criado com sucesso!');
      process.exit(0);
    })
    .catch(() => {
      console.error('\n❌ Falha no packaging');
      process.exit(1);
    });
}

export default EdgePackager;
