#!/usr/bin/env node

/**
 * Script de Upload para Web Stores
 *
 * Automatiza o upload de extensões para Chrome Web Store,
 * Firefox Add-ons e Microsoft Edge Add-ons.
 */

import { execSync } from 'child_process';
import crypto from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class StoreUploader {
  constructor() {
    this.rootDir = path.resolve(__dirname, '../../');
    this.packageDir = path.join(this.rootDir, 'dist-packages');
    this.configDir = path.join(this.rootDir, 'config/stores');

    console.log('🌐 Store Uploader inicializado');
    console.log(`📦 Package dir: ${this.packageDir}`);
    console.log(`⚙️  Config dir: ${this.configDir}`);
  }

  async loadStoreConfigs() {
    console.log('\n🔧 Carregando configurações das stores...');

    const configs = {};

    try {
      // Chrome Web Store
      const chromeConfigPath = path.join(this.configDir, 'chrome-web-store.json');
      if (await fs.pathExists(chromeConfigPath)) {
        configs.chrome = JSON.parse(await fs.readFile(chromeConfigPath, 'utf8'));
        console.log('✅ Config Chrome Web Store carregada');
      } else {
        console.warn('⚠️  Config Chrome Web Store não encontrada');
      }

      // Firefox Add-ons (AMO)
      const firefoxConfigPath = path.join(this.configDir, 'firefox-amo.json');
      if (await fs.pathExists(firefoxConfigPath)) {
        configs.firefox = JSON.parse(await fs.readFile(firefoxConfigPath, 'utf8'));
        console.log('✅ Config Firefox AMO carregada');
      } else {
        console.warn('⚠️  Config Firefox AMO não encontrada');
      }

      // Microsoft Edge Add-ons
      const edgeConfigPath = path.join(this.configDir, 'edge-addons.json');
      if (await fs.pathExists(edgeConfigPath)) {
        configs.edge = JSON.parse(await fs.readFile(edgeConfigPath, 'utf8'));
        console.log('✅ Config Edge Add-ons carregada');
      } else {
        console.warn('⚠️  Config Edge Add-ons não encontrada');
      }

      return configs;
    } catch (error) {
      console.error('❌ Erro ao carregar configurações:', error.message);
      throw error;
    }
  }

  async validatePackages() {
    console.log('\n🔍 Validando packages para upload...');

    const packages = {};

    // Buscar packages mais recentes de cada tipo
    const files = await fs.readdir(this.packageDir);

    // Chrome package
    const chromeFiles = files.filter((f) => f.includes('chrome') && f.endsWith('.zip'));
    if (chromeFiles.length > 0) {
      const latestChrome = chromeFiles.sort().pop();
      packages.chrome = {
        file: latestChrome,
        path: path.join(this.packageDir, latestChrome),
        type: 'chrome',
      };
      console.log(`📦 Chrome package: ${latestChrome}`);
    }

    // Firefox package
    const firefoxFiles = files.filter((f) => f.includes('firefox') && f.endsWith('.xpi'));
    if (firefoxFiles.length > 0) {
      const latestFirefox = firefoxFiles.sort().pop();
      packages.firefox = {
        file: latestFirefox,
        path: path.join(this.packageDir, latestFirefox),
        type: 'firefox',
      };
      console.log(`📦 Firefox package: ${latestFirefox}`);
    }

    // Edge package
    const edgeFiles = files.filter((f) => f.includes('edge') && f.endsWith('.zip'));
    if (edgeFiles.length > 0) {
      const latestEdge = edgeFiles.sort().pop();
      packages.edge = {
        file: latestEdge,
        path: path.join(this.packageDir, latestEdge),
        type: 'edge',
      };
      console.log(`📦 Edge package: ${latestEdge}`);
    }

    if (Object.keys(packages).length === 0) {
      throw new Error('Nenhum package encontrado para upload');
    }

    // Validar integridade dos packages
    for (const [store, pkg] of Object.entries(packages)) {
      const stats = await fs.stat(pkg.path);
      if (stats.size === 0) {
        throw new Error(`Package ${store} está vazio`);
      }

      const hash = await this.generateFileHash(pkg.path);
      pkg.hash = hash;
      pkg.size = Math.round(stats.size / 1024); // KB

      console.log(`🔐 ${store.toUpperCase()} SHA256: ${hash.substring(0, 16)}...`);
    }

    return packages;
  }

  async uploadToChromeWebStore(packageInfo, config) {
    console.log('\n🌐 Iniciando upload para Chrome Web Store...');

    if (!config || !config.client_id || !config.refresh_token) {
      console.warn('⚠️  Configuração Chrome Web Store incompleta');
      console.log('💡 Configure as credenciais em config/stores/chrome-web-store.json');
      return { success: false, reason: 'config_missing' };
    }

    try {
      // Verificar se chrome-webstore-upload-cli está disponível
      try {
        execSync('npx chrome-webstore-upload-cli --version', { stdio: 'pipe' });
      } catch {
        console.log('📦 Instalando chrome-webstore-upload-cli...');
        execSync('npm install -g chrome-webstore-upload-cli', {
          stdio: 'inherit',
        });
      }

      // Preparar comando de upload
      const uploadCmd = [
        'npx chrome-webstore-upload-cli',
        `--source "${packageInfo.path}"`,
        `--extension-id "${config.extension_id}"`,
        `--client-id "${config.client_id}"`,
        `--client-secret "${config.client_secret}"`,
        `--refresh-token "${config.refresh_token}"`,
      ];

      // Adicionar opções condicionais
      if (config.auto_publish) {
        uploadCmd.push('--auto-publish');
      }

      if (config.trusted_testers_only) {
        uploadCmd.push('--trusted-testers');
      }

      console.log('🚀 Fazendo upload...');

      const result = execSync(uploadCmd.join(' '), {
        encoding: 'utf8',
        stdio: 'pipe',
      });

      console.log('✅ Upload Chrome Web Store concluído');
      console.log('📋 Resultado:', result.trim());

      return {
        success: true,
        store: 'chrome',
        package: packageInfo.file,
        response: result.trim(),
        url: `https://chrome.google.com/webstore/detail/${config.extension_id}`,
      };
    } catch (error) {
      console.error('❌ Erro no upload Chrome Web Store:', error.message);
      return {
        success: false,
        store: 'chrome',
        error: error.message,
      };
    }
  }

  async uploadToFirefoxAMO(packageInfo, config) {
    console.log('\n🦊 Iniciando upload para Firefox Add-ons...');

    if (!config || !config.api_key || !config.api_secret) {
      console.warn('⚠️  Configuração Firefox AMO incompleta');
      console.log('💡 Configure as credenciais em config/stores/firefox-amo.json');
      return { success: false, reason: 'config_missing' };
    }

    try {
      // Verificar se web-ext está disponível
      try {
        execSync('npx web-ext --version', { stdio: 'pipe' });
      } catch {
        console.log('📦 Instalando web-ext...');
        execSync('npm install -g web-ext', { stdio: 'inherit' });
      }

      // Preparar comando de upload
      const uploadCmd = [
        'npx web-ext sign',
        `--source-dir "${path.dirname(packageInfo.path)}"`,
        `--artifacts-dir "${this.packageDir}"`,
        `--api-key "${config.api_key}"`,
        `--api-secret "${config.api_secret}"`,
      ];

      // Adicionar configurações opcionais
      if (config.channel) {
        uploadCmd.push(`--channel ${config.channel}`);
      }

      if (config.addon_id) {
        uploadCmd.push(`--id ${config.addon_id}`);
      }

      console.log('🚀 Fazendo upload e assinatura...');

      const result = execSync(uploadCmd.join(' '), {
        encoding: 'utf8',
        stdio: 'pipe',
      });

      console.log('✅ Upload Firefox AMO concluído');
      console.log('📋 Resultado:', result.trim());

      return {
        success: true,
        store: 'firefox',
        package: packageInfo.file,
        response: result.trim(),
        url: config.addon_id ? `https://addons.mozilla.org/addon/${config.addon_id}/` : null,
      };
    } catch (error) {
      console.error('❌ Erro no upload Firefox AMO:', error.message);
      return {
        success: false,
        store: 'firefox',
        error: error.message,
      };
    }
  }

  async uploadToEdgeAddons(packageInfo, config) {
    console.log('\n🔷 Iniciando upload para Edge Add-ons...');

    if (!config || !config.product_id || !config.client_id) {
      console.warn('⚠️  Configuração Edge Add-ons incompleta');
      console.log('💡 Configure as credenciais em config/stores/edge-addons.json');
      console.log('💡 Edge Add-ons ainda não tem API oficial - upload manual necessário');

      return {
        success: false,
        reason: 'manual_upload_required',
        instructions: [
          '1. Acesse https://partner.microsoft.com/dashboard/microsoftedge',
          '2. Faça login com sua conta de desenvolvedor',
          '3. Selecione sua extensão ou crie uma nova',
          `4. Faça upload do arquivo: ${packageInfo.file}`,
          '5. Complete as informações necessárias',
          '6. Submeta para revisão',
        ],
      };
    }

    try {
      // Edge Add-ons não tem CLI oficial ainda
      // Implementar API REST quando disponível
      console.log('🔧 Edge Add-ons API não disponível - preparando para upload manual');

      // Criar instruções detalhadas
      const instructions = {
        package: packageInfo.file,
        size: `${packageInfo.size} KB`,
        hash: packageInfo.hash,
        upload_url: 'https://partner.microsoft.com/dashboard/microsoftedge',
        steps: [
          'Acesse o Partner Center da Microsoft',
          'Entre na seção Edge Add-ons',
          'Selecione sua extensão ou crie uma nova',
          `Faça upload do arquivo: ${packageInfo.file}`,
          'Verifique se todas as informações estão corretas',
          'Complete a descrição e screenshots',
          'Submeta para certificação',
        ],
      };

      const instructionsPath = path.join(this.packageDir, 'edge-upload-instructions.json');
      await fs.writeFile(instructionsPath, JSON.stringify(instructions, null, 2));

      console.log('📋 Instruções de upload salvas em: edge-upload-instructions.json');

      return {
        success: true,
        store: 'edge',
        package: packageInfo.file,
        manual_upload: true,
        instructions_file: 'edge-upload-instructions.json',
        url: 'https://partner.microsoft.com/dashboard/microsoftedge',
      };
    } catch (error) {
      console.error('❌ Erro na preparação Edge Add-ons:', error.message);
      return {
        success: false,
        store: 'edge',
        error: error.message,
      };
    }
  }

  async generateUploadReport(results) {
    console.log('\n📊 Gerando relatório de upload...');

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total_uploads: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      },
      results: results,
      next_steps: [],
    };

    // Adicionar próximos passos baseados nos resultados
    results.forEach((result) => {
      if (result.success) {
        if (result.manual_upload) {
          report.next_steps.push(`${result.store.toUpperCase()}: Complete o upload manual`);
        } else {
          report.next_steps.push(`${result.store.toUpperCase()}: Monitore o status da revisão`);
        }
      } else {
        report.next_steps.push(
          `${result.store.toUpperCase()}: Corrigir erro: ${result.error || result.reason}`
        );
      }
    });

    const reportPath = path.join(this.packageDir, `upload-report-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log(`📋 Relatório salvo: ${path.basename(reportPath)}`);
    return reportPath;
  }

  async generateFileHash(filePath) {
    const content = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  async upload(stores = ['chrome', 'firefox', 'edge']) {
    try {
      console.log('🌐 Iniciando upload para web stores...\n');

      const configs = await this.loadStoreConfigs();
      const packages = await this.validatePackages();

      const results = [];

      // Upload para cada store solicitada
      for (const store of stores) {
        if (!packages[store]) {
          console.warn(`⚠️  Package ${store} não encontrado - pulando`);
          results.push({
            success: false,
            store: store,
            reason: 'package_not_found',
          });
          continue;
        }

        console.log(`\n🔄 Processando ${store.toUpperCase()}...`);

        let result;
        switch (store) {
          case 'chrome':
            result = await this.uploadToChromeWebStore(packages[store], configs[store]);
            break;
          case 'firefox':
            result = await this.uploadToFirefoxAMO(packages[store], configs[store]);
            break;
          case 'edge':
            result = await this.uploadToEdgeAddons(packages[store], configs[store]);
            break;
          default:
            result = { success: false, store: store, reason: 'unknown_store' };
        }

        results.push(result);
      }

      // Gerar relatório final
      const reportPath = await this.generateUploadReport(results);

      console.log('\n🎉 Upload process concluído!');
      console.log('📋 Resumo:');

      const successful = results.filter((r) => r.success);
      const failed = results.filter((r) => !r.success);

      console.log(`   ✅ Sucessos: ${successful.length}`);
      console.log(`   ❌ Falhas: ${failed.length}`);

      if (successful.length > 0) {
        console.log('\n✅ Uploads bem-sucedidos:');
        successful.forEach((result) => {
          console.log(`   - ${result.store.toUpperCase()}: ${result.package || 'Preparado'}`);
          if (result.url) {
            console.log(`     URL: ${result.url}`);
          }
        });
      }

      if (failed.length > 0) {
        console.log('\n❌ Uploads com problemas:');
        failed.forEach((result) => {
          console.log(`   - ${result.store.toUpperCase()}: ${result.reason || result.error}`);
        });
      }

      console.log(`\n📊 Relatório completo: ${path.basename(reportPath)}`);

      return {
        success: failed.length === 0,
        results: results,
        report: reportPath,
      };
    } catch (error) {
      console.error('\n❌ Erro no processo de upload:');
      console.error(error.message);

      if (error.stack) {
        console.error('\n📍 Stack trace:');
        console.error(error.stack);
      }

      process.exit(1);
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const stores = args.length > 0 ? args : ['chrome', 'firefox', 'edge'];

  console.log(`🎯 Stores alvo: ${stores.join(', ')}`);

  const uploader = new StoreUploader();
  uploader
    .upload(stores)
    .then((result) => {
      if (result.success) {
        console.log('\n🎉 Todos os uploads foram processados com sucesso!');
        process.exit(0);
      } else {
        console.log('\n⚠️  Alguns uploads tiveram problemas. Verifique o relatório.');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n❌ Falha no processo de upload:', error.message);
      process.exit(1);
    });
}

export default StoreUploader;
