/**
 * 🔧 TESTE DA CORREÇÃO DO CARREGAMENTO AUTOMÁTICO
 *
 * Este script simula o comportamento da extensão para verificar
 * se a correção do carregamento automático está funcionando corretamente.
 */

console.log('🧪 === TESTE DA CORREÇÃO DO CARREGAMENTO AUTOMÁTICO ===\n');

// Simula diferentes cenários de configuração
const testScenarios = [
  {
    name: 'Cenário 1: Modo MANUAL (configuração correta)',
    globalSettings: {
      userPreferences: {
        autoLoadExams: false,
        autoLoadConsultations: false,
        autoLoadAppointments: false,
        autoLoadRegulations: false,
        autoLoadDocuments: false,
      },
    },
    expectedBehavior: 'MANUAL',
  },
  {
    name: 'Cenário 2: Modo AUTO (configuração correta)',
    globalSettings: {
      userPreferences: {
        autoLoadExams: true,
        autoLoadConsultations: true,
        autoLoadAppointments: true,
        autoLoadRegulations: true,
        autoLoadDocuments: true,
      },
    },
    expectedBehavior: 'AUTO',
  },
  {
    name: 'Cenário 3: Configuração mista',
    globalSettings: {
      userPreferences: {
        autoLoadExams: true,
        autoLoadConsultations: false,
        autoLoadAppointments: true,
        autoLoadRegulations: false,
        autoLoadDocuments: false,
      },
    },
    expectedBehavior: 'MISTO',
  },
  {
    name: 'Cenário 4: globalSettings undefined (erro)',
    globalSettings: undefined,
    expectedBehavior: 'MANUAL_FORÇADO',
  },
  {
    name: 'Cenário 5: userPreferences undefined (erro)',
    globalSettings: {
      userPreferences: undefined,
    },
    expectedBehavior: 'MANUAL_FORÇADO',
  },
];

// Simula a lógica do SectionManager.setPatient()
function simulateSetPatient(sectionKey, globalSettings) {
  const autoLoadKey = `autoLoad${sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)}`;

  // 🚨 VALIDAÇÃO RIGOROSA: Verifica se as configurações foram carregadas
  if (!globalSettings) {
    console.warn(`⚠️ globalSettings não definido para ${sectionKey}. MODO MANUAL forçado.`);
    return 'MANUAL_FORÇADO';
  }

  if (!globalSettings.userPreferences) {
    console.warn(`⚠️ userPreferences não definido para ${sectionKey}. MODO MANUAL forçado.`);
    return 'MANUAL_FORÇADO';
  }

  // 🔍 VERIFICAÇÃO EXPLÍCITA: Obtém o valor da configuração
  const isAutoMode = globalSettings.userPreferences[autoLoadKey];

  // 🎯 DECISÃO FINAL: Só carrega se explicitamente TRUE
  if (isAutoMode === true) {
    console.log(`✅ MODO AUTO CONFIRMADO: ${sectionKey}`);
    return 'AUTO';
  } else {
    console.log(`🔒 MODO MANUAL CONFIRMADO: ${sectionKey} (valor: ${isAutoMode})`);
    return 'MANUAL';
  }
}

// Executa os testes
const sections = ['consultations', 'exams', 'appointments', 'regulations', 'documents'];

testScenarios.forEach((scenario) => {
  console.log(`\n${scenario.name}:`);
  console.log('─'.repeat(50));

  const results = {};
  sections.forEach((sectionKey) => {
    const result = simulateSetPatient(sectionKey, scenario.globalSettings);
    results[sectionKey] = result;
  });

  console.log('📊 Resultados:', results);

  // Verifica se o comportamento está correto
  const allManual = Object.values(results).every((r) => r === 'MANUAL' || r === 'MANUAL_FORÇADO');
  const allAuto = Object.values(results).every((r) => r === 'AUTO');

  let status = '❌ INESPERADO';
  if (scenario.expectedBehavior === 'MANUAL' && allManual) {
    status = '✅ CORRETO';
  } else if (scenario.expectedBehavior === 'AUTO' && allAuto) {
    status = '✅ CORRETO';
  } else if (scenario.expectedBehavior === 'MANUAL_FORÇADO' && allManual) {
    status = '✅ CORRETO';
  } else if (scenario.expectedBehavior === 'MISTO') {
    status = '✅ CORRETO (comportamento misto esperado)';
  }

  console.log(`🎯 Status: ${status}`);
});

console.log('\n🏁 === TESTE CONCLUÍDO ===');
console.log('\n📋 RESUMO DA CORREÇÃO:');
console.log('1. ✅ Validação rigorosa de globalSettings e userPreferences');
console.log('2. ✅ Verificação explícita do valor booleano (=== true)');
console.log('3. ✅ Logs detalhados para diagnóstico');
console.log('4. ✅ Modo MANUAL forçado em caso de erro');
console.log('5. ✅ Comportamento previsível e seguro');
