/**
 * Script de diagnóstico para verificar o storage da extensão
 */

// Simula o ambiente da extensão
const api = typeof browser !== 'undefined' ? browser : chrome;

async function debugStorage() {
  console.log('🔍 Verificando storage da extensão...');

  try {
    // Verificar storage sync
    const syncData = await api.storage.sync.get(null);
    console.log('📋 Storage Sync completo:', syncData);

    // Verificar especificamente a baseUrl
    const baseUrlData = await api.storage.sync.get('baseUrl');
    console.log('🌐 Base URL específica:', baseUrlData);

    // Verificar storage local
    const localData = await api.storage.local.get(null);
    console.log('💾 Storage Local completo:', localData);

    // Testar a função getBaseUrl
    console.log('🧪 Testando função getBaseUrl...');

    if (baseUrlData && baseUrlData.baseUrl) {
      console.log('✅ URL base encontrada:', baseUrlData.baseUrl);

      // Testar conectividade básica
      try {
        const testUrl = `${baseUrlData.baseUrl}/sigss/common/dataHora`;
        console.log('🌐 Testando endpoint:', testUrl);

        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            Accept: 'application/json, text/javascript, */*; q=0.01',
            'X-Requested-With': 'XMLHttpRequest',
          },
        });

        console.log('📡 Resposta:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        });

        if (response.ok) {
          const data = await response.json();
          console.log('📊 Dados recebidos:', data);
        }
      } catch (fetchError) {
        console.error('❌ Erro na requisição:', fetchError);
      }
    } else {
      console.error('❌ URL base não configurada!');
    }
  } catch (error) {
    console.error('❌ Erro ao verificar storage:', error);
  }
}

// Executar se estiver no contexto do navegador
if (typeof chrome !== 'undefined' || typeof browser !== 'undefined') {
  debugStorage();
} else {
  console.log('⚠️ Execute este script no console da extensão (F12 ��� Console)');
}
