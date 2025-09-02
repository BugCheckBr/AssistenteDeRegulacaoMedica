/**
 * Script de diagnóstico para problemas de conectividade
 * Execute no console do navegador (F12 → Console)
 */

async function diagnoseConnection() {
  console.log('🔍 Iniciando diagnóstico de conectividade...');

  try {
    // 1. Verificar storage da extensão
    const storage = await chrome.storage.sync.get(['baseUrl']);
    console.log('📋 URL Base configurada:', storage.baseUrl || 'NÃO CONFIGURADA');

    if (!storage.baseUrl) {
      console.error('❌ URL Base não está configurada! Vá para as opções da extensão.');
      return;
    }

    // 2. Testar conectividade básica
    const testUrl = `${storage.baseUrl}/sigss/`;
    console.log('🌐 Testando conectividade para:', testUrl);

    const response = await fetch(testUrl, {
      method: 'GET',
      mode: 'no-cors', // Para evitar CORS
    });

    console.log('📡 Resposta do servidor:', {
      status: response.status,
      statusText: response.statusText,
      type: response.type,
    });

    // 3. Verificar se está logado no SIGSS
    console.log('🔐 Verificando autenticação...');

    // 4. Testar endpoint específico
    console.log('✅ Diagnóstico completo! Verifique os logs acima.');
  } catch (error) {
    console.error('❌ Erro durante diagnóstico:', error.message);
    console.log('💡 Possíveis soluções:');
    console.log('  1. Verificar URL base nas opções');
    console.log('  2. Fazer login no SIGSS');
    console.log('  3. Verificar conectividade de rede');
    console.log('  4. Limpar cache/cookies');
  }
}

// Execute a função
diagnoseConnection();
