/**
 * 🧪 EXEMPLO PRÁTICO - ErrorHandler em Uso
 *
 * Este arquivo demonstra como o ErrorHandler sanitiza automaticamente
 * dados médicos sensíveis enquanto preserva informações técnicas necessárias.
 */

import {
  ERROR_CATEGORIES,
  getErrorHandler,
  logError,
  logInfo,
  sanitizeForLog,
} from './ErrorHandler.js';

// 🏥 DEMONSTRAÇÃO: Cenário Real de Regulação Médica
async function exemploRegulacaoMedica() {
  console.log('🧪 DEMONSTRAÇÃO: ErrorHandler para Regulação Médica\n');

  // Simular dados que viriam do SIGSS (contém dados sensíveis)
  const dadosPacienteOriginal = {
    // ✅ IDs técnicos (preservados para debug)
    reguId: 'REG_2024_001',
    reguIdp: 'REGP_001',
    reguIds: 'REGS_001',
    isenPK: 'ISEN_ABC123',
    sessionId: 'SESS_DEF456',

    // 🔒 Dados sensíveis (serão sanitizados)
    cpf: '123.456.789-01',
    cns: '12345678901234',
    nome_completo: 'João da Silva Santos',
    nome_mae: 'Maria Santos',
    data_nascimento: '1985-03-15',
    endereco: 'Rua das Flores, 123, Apt 45',
    telefone: '(11) 98765-4321',
    email: 'joao.silva@email.com',

    // 🏥 Dados médicos sensíveis
    diagnostico: 'Diabetes Mellitus Tipo 2',
    cid: 'E11.9',
    medicamento: 'Metformina 500mg',
    procedimento: 'Consulta endocrinológica',

    // 📊 Dados de sistema (mixed)
    status: 'AGUARDANDO_REGULACAO',
    prioridade: 'ALTA',
    timestamp: new Date().toISOString(),
  };

  console.log('📝 DADOS ORIGINAIS (como viriam do SIGSS):');
  console.log(JSON.stringify(dadosPacienteOriginal, null, 2));
  console.log('\n' + '='.repeat(60) + '\n');

  // ✅ LOGGING CORRETO: Usando ErrorHandler (sanitização automática)
  console.log('✅ LOGGING SANITIZADO (ErrorHandler):');

  logInfo(
    'Dados de regulação processados com sucesso',
    dadosPacienteOriginal, // 🔒 Será sanitizado automaticamente
    ERROR_CATEGORIES.MEDICAL_DATA
  );

  // 🔍 DEMONSTRAÇÃO: Sanitização manual
  console.log('\n📋 DADOS SANITIZADOS (como aparecem nos logs):');
  const dadosSanitizados = sanitizeForLog(dadosPacienteOriginal);
  console.log(JSON.stringify(dadosSanitizados, null, 2));

  // 📊 DEMONSTRAÇÃO: Performance tracking
  console.log('\n⚡ PERFORMANCE TRACKING:');
  const handler = getErrorHandler();

  handler.startPerformanceMark('processarRegulacao');

  // Simular processamento
  await new Promise((resolve) => setTimeout(resolve, 100));

  handler.endPerformanceMark('processarRegulacao', ERROR_CATEGORIES.MEDICAL_DATA);

  // 🚨 DEMONSTRAÇÃO: Error handling
  console.log('\n🚨 ERROR HANDLING:');

  try {
    // Simular erro na API
    throw new Error('Falha na comunicação com SIGSS');
  } catch (error) {
    logError(
      'Erro ao acessar dados do paciente',
      {
        errorMessage: error.message,
        // Dados do contexto (serão sanitizados)
        reguId: dadosPacienteOriginal.reguId, // ✅ Preservado
        cpf: dadosPacienteOriginal.cpf, // 🔒 Sanitizado
        nome: dadosPacienteOriginal.nome_completo, // 🔒 Sanitizado
      },
      ERROR_CATEGORIES.SIGSS_API
    );
  }

  console.log('\n✅ DEMONSTRAÇÃO CONCLUÍDA');
  console.log('🔒 Observe que dados sensíveis foram automaticamente sanitizados');
  console.log('✅ IDs técnicos foram preservados para debugging');
}

// 📋 COMPARAÇÃO: Logging tradicional vs ErrorHandler
function demonstrarComparacao() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 COMPARAÇÃO: Logging Tradicional vs ErrorHandler');
  console.log('='.repeat(60));

  const dadosSensiveis = {
    reguId: 'REG_123',
    cpf: '123.456.789-01',
    nome: 'João Silva',
  };

  console.log('\n❌ LOGGING TRADICIONAL (INSEGURO):');
  console.log('console.log("Paciente:", dadosSensiveis);');
  console.log('// RESULTADO: Expõe CPF e nome nos logs!');

  console.log('\n✅ LOGGING COM ERRORHANDLER (SEGURO):');
  console.log('logInfo("Paciente processado", dadosSensiveis);');
  logInfo('Paciente processado', dadosSensiveis, ERROR_CATEGORIES.MEDICAL_DATA);
  console.log('// RESULTADO: Dados sensíveis sanitizados automaticamente ☝️');
}

// 🏥 Executar demonstração se este arquivo for executado diretamente
if (typeof window === 'undefined') {
  // Contexto Node.js - demonstração textual apenas
  console.log('🏥 ASSISTENTE DE REGULAÇÃO MÉDICA - ErrorHandler Demo');
  console.log('Este exemplo mostra como o ErrorHandler protege dados médicos.\n');

  console.log('📋 FUNCIONALIDADES:');
  console.log('✅ Sanitização automática de CPF, CNS, nomes');
  console.log('✅ Preservação de IDs técnicos (reguId, isenPK)');
  console.log('✅ Categorização médica específica');
  console.log('✅ Performance tracking');
  console.log('✅ Error storage para auditoria');
  console.log('✅ Global error handling');
  console.log('✅ Cross-browser compatibility\n');

  console.log('🔒 COMPLIANCE:');
  console.log('✅ LGPD - Lei Geral de Proteção de Dados');
  console.log('✅ HIPAA - Health Insurance Portability Act');
  console.log('✅ CFM - Conselho Federal de Medicina');
  console.log('✅ Padrões médicos de privacidade\n');
} else {
  // Contexto browser - executar demonstração completa
  exemploRegulacaoMedica()
    .then(() => demonstrarComparacao())
    .catch(console.error);
}

export { demonstrarComparacao, exemploRegulacaoMedica };
