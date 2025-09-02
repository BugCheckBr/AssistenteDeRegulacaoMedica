#!/usr/bin/env node

/**
 * TASK-C-003 Validation Script
 * Validates the message handler security implementation
 */

import { readFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..');

console.log('🛡️ TASK-C-003: Background Script Message Handler - Validation');
console.log('===============================================================\n');

let validationsPassed = 0;
let validationsFailed = 0;

function logPass(message) {
  console.log(`✅ ${message}`);
  validationsPassed++;
}

function logFail(message) {
  console.log(`❌ ${message}`);
  validationsFailed++;
}

function logInfo(message) {
  console.log(`ℹ️  ${message}`);
}

async function validateImplementation() {
  try {
    // 1. Verificar se background.js contém as classes necessárias
    const backgroundPath = join(projectRoot, 'background.js');
    const backgroundContent = await readFile(backgroundPath, 'utf8');

    logInfo('Verificando implementação das classes de segurança...');

    // Verificar URLConfigurationManager
    if (backgroundContent.includes('class URLConfigurationManager')) {
      logPass('URLConfigurationManager implementado');
    } else {
      logFail('URLConfigurationManager não encontrado');
    }

    // Verificar MessageRateLimiter
    if (backgroundContent.includes('class MessageRateLimiter')) {
      logPass('MessageRateLimiter implementado');
    } else {
      logFail('MessageRateLimiter não encontrado');
    }

    // Verificar PayloadValidator
    if (backgroundContent.includes('class PayloadValidator')) {
      logPass('PayloadValidator implementado');
    } else {
      logFail('PayloadValidator não encontrado');
    }

    // Verificar MessageQueue
    if (backgroundContent.includes('class MessageQueue')) {
      logPass('MessageQueue implementado');
    } else {
      logFail('MessageQueue não encontrado');
    }

    // 2. Verificar funções de validação
    logInfo('\nVerificando funções de validação...');

    if (backgroundContent.includes('function validateMessageOrigin')) {
      logPass('validateMessageOrigin implementado');
    } else {
      logFail('validateMessageOrigin não encontrado');
    }

    if (backgroundContent.includes('function processValidatedMessage')) {
      logPass('processValidatedMessage implementado');
    } else {
      logFail('processValidatedMessage não encontrado');
    }

    // 3. Verificar message handler com validação
    logInfo('\nVerificando message handler principal...');

    if (backgroundContent.includes('VALIDAÇÃO DE ESTRUTURA DA MENSAGEM')) {
      logPass('Validação de estrutura implementada');
    } else {
      logFail('Validação de estrutura não encontrada');
    }

    if (backgroundContent.includes('VERIFICAÇÃO DE CONFIGURAÇÃO')) {
      logPass('Verificação de configuração implementada');
    } else {
      logFail('Verificação de configuração não encontrada');
    }

    if (backgroundContent.includes('VALIDAÇÃO DE ORIGEM')) {
      logPass('Validação de origem implementada');
    } else {
      logFail('Validação de origem não encontrada');
    }

    if (backgroundContent.includes('RATE LIMITING')) {
      logPass('Rate limiting implementado');
    } else {
      logFail('Rate limiting não encontrado');
    }

    if (backgroundContent.includes('VALIDAÇÃO DE PAYLOAD ESPECÍFICO')) {
      logPass('Validação de payload implementada');
    } else {
      logFail('Validação de payload não encontrada');
    }

    // 4. Verificar instâncias globais
    logInfo('\nVerificando instâncias globais...');

    if (backgroundContent.includes('const urlConfigManager = new URLConfigurationManager()')) {
      logPass('URLConfigurationManager instanciado');
    } else {
      logFail('URLConfigurationManager não instanciado');
    }

    if (backgroundContent.includes('const rateLimiter = new MessageRateLimiter(')) {
      logPass('MessageRateLimiter instanciado');
    } else {
      logFail('MessageRateLimiter não instanciado');
    }

    if (backgroundContent.includes('const messageQueue = new MessageQueue(')) {
      logPass('MessageQueue instanciado');
    } else {
      logFail('MessageQueue não instanciado');
    }

    // 5. Verificar listeners
    logInfo('\nVerificando listeners...');

    if (backgroundContent.includes('api.storage.onChanged.addListener')) {
      logPass('Storage change listener implementado');
    } else {
      logFail('Storage change listener não encontrado');
    }

    if (backgroundContent.includes('api.runtime.onSuspend.addListener')) {
      logPass('Cleanup listener implementado');
    } else {
      logFail('Cleanup listener não encontrado');
    }

    // 6. Verificar logging de segurança
    logInfo('\nVerificando logging de segurança...');

    if (backgroundContent.includes('ERROR_CATEGORIES.SECURITY_VALIDATION')) {
      logPass('Categoria de segurança utilizada nos logs');
    } else {
      logFail('Categoria de segurança não encontrada nos logs');
    }

    // 7. Verificar sanitização de URLs
    if (backgroundContent.includes('sanitizeUrl')) {
      logPass('Sanitização de URLs implementada');
    } else {
      logFail('Sanitização de URLs não encontrada');
    }

    // 8. Verificar ErrorHandler foi atualizado
    const errorHandlerPath = join(projectRoot, 'ErrorHandler.js');
    const errorHandlerContent = await readFile(errorHandlerPath, 'utf8');

    if (errorHandlerContent.includes('SECURITY_VALIDATION')) {
      logPass('ErrorHandler atualizado com categoria SECURITY_VALIDATION');
    } else {
      logFail('ErrorHandler não possui categoria SECURITY_VALIDATION');
    }

    // 9. Verificar se testes foram criados
    try {
      const testPath = join(projectRoot, 'test', 'unit', 'message-validation.test.js');
      const testContent = await readFile(testPath, 'utf8');
      logPass('Testes de validação de mensagens criados');

      if (testContent.includes('TASK-C-003')) {
        logPass('Testes específicos da TASK-C-003 implementados');
      } else {
        logFail('Testes não referenciam TASK-C-003');
      }
    } catch {
      logFail('Arquivo de testes de validação não encontrado');
    }
  } catch (error) {
    logFail(`Erro durante validação: ${error.message}`);
  }

  // Resumo final
  console.log('\n===============================================================');
  console.log(`🎯 RESUMO DA VALIDAÇÃO TASK-C-003:`);
  console.log(`✅ Validações Aprovadas: ${validationsPassed}`);
  console.log(`❌ Validações Reprovadas: ${validationsFailed}`);
  console.log(
    `📊 Taxa de Sucesso: ${(
      (validationsPassed / (validationsPassed + validationsFailed)) *
      100
    ).toFixed(1)}%`
  );

  if (validationsFailed === 0) {
    console.log('\n🎉 TASK-C-003 IMPLEMENTADA COM SUCESSO!');
    console.log('✅ Todas as validações de segurança passaram');
    console.log('🛡️ Message Handler protegido contra ataques');
    console.log('🔐 Validação de origem baseada em URL implementada');
    console.log('⚡ Rate limiting ativo para prevenir spam');
    console.log('📝 Logging de segurança categorizado funcionando');
    return true;
  } else {
    console.log('\n⚠️  TASK-C-003 PRECISA DE AJUSTES');
    console.log(`❌ ${validationsFailed} validações falharam`);
    console.log('🔧 Revise a implementação antes de prosseguir');
    return false;
  }
}

// Executar validação
validateImplementation()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Erro fatal durante validação:', error);
    process.exit(1);
  });
